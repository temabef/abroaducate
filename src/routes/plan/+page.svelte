<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { subscriptionState } from '$lib/stores/subscription';
  import { get } from 'svelte/store';
  import QuickProfileModal from '$lib/components/QuickProfileModal.svelte';
  import { loadQuickProfile, gpaMidpoint, type QuickProfile } from '$lib/services/quickProfile';
  import { analytics } from '$lib/utils/posthog';
  import { formatCurrencyAmount } from '$lib/utils/htmlEntities';

  type Scholarship = {
    id: string;
    title: string;
    provider: string;
    amount: string;
    deadline: string | null;
    location: string;
    field: string;
    level: string;
    website?: string;
    min_gpa?: number;
    created_at?: string;
    // computed/UI
    matchScore?: number | null;
    saved?: boolean;
  };

  type UniMatch = {
    university: { id: string; name: string; country: string; ranking?: number | null; acceptance_rate?: number | null; cost?: number | null };
    match_score: number | null;
    admission_probability: 'High' | 'Moderate' | 'Low' | 'Very Low' | string;
    estimated_cost_fit?: string;
  };

  let { data } = $props();
  let { supabase, session } = $derived(data);

  let isPremium = $state(false);

  // Profile
  let quickProfile = $state<QuickProfile | null>(null);
  let profileSource = $state<'remote' | 'local' | 'none'>('none');
  let showQuickProfile = $state(false);

  // Scholarships
  let scholarshipsLoading = $state(true);
  let scholarshipsError = $state<string | null>(null);
  let rankedScholarships = $state<Scholarship[]>([]);
  let savedScholarshipsCount = $derived(rankedScholarships.filter((s) => s.saved === true).length);

  // Universities
  let universitiesLoading = $state(true);
  let universitiesError = $state<string | null>(null);
  let safetyUni = $state<UniMatch | null>(null);
  let targetUni = $state<UniMatch | null>(null);
  let reachUni = $state<UniMatch | null>(null);

  // Timeline
  type TimelineItem = { title: string; dueText: string; daysLeft: number | null; href?: string };
  let timelineItems = $state<TimelineItem[]>([]);

  // Counts for dashboard-style links
  let universityApplicationsCount = $state<number | null>(null);

  // Bulk win strategy
  let bulkWinStrategyLoading = $state(false);
  let bulkWinStrategyMessage = $state<string | null>(null);

  type ProfileChecklistItem = {
    id: string;
    label: string;
    value: string;
    completed: boolean;
    actionLabel: string;
    onAction: () => void;
  };

  function formatDegreeLevel(v: QuickProfile['degree_level']): string {
    switch (v) {
      case 'undergraduate': return "Undergraduate/Bachelor's";
      case 'masters': return "Master's/Graduate";
      case 'phd': return 'PhD/Doctoral';
      case 'graduate': return 'Graduate (general)';
      default: return String(v);
    }
  }

  function getProfileChecklist(): { done: number; total: number; items: ProfileChecklistItem[] } {
    const items: ProfileChecklistItem[] = [
      {
        id: 'degree_level',
        label: 'Degree level',
        value: quickProfile ? formatDegreeLevel(quickProfile.degree_level) : '',
        completed: !!quickProfile?.degree_level,
        actionLabel: quickProfile ? 'Edit' : 'Add',
        onAction: () => (showQuickProfile = true)
      },
      {
        id: 'countries',
        label: 'Country(s)',
        value: quickProfile?.preferred_countries?.length ? quickProfile.preferred_countries.join(', ') : '',
        completed: (quickProfile?.preferred_countries?.length ?? 0) > 0,
        actionLabel: quickProfile?.preferred_countries?.length ? 'Edit' : 'Add',
        onAction: () => (showQuickProfile = true)
      },
      {
        id: 'field',
        label: 'Field of study',
        value: quickProfile?.field_of_study ? quickProfile.field_of_study : '',
        completed: (quickProfile?.field_of_study?.trim?.() ?? '') !== '',
        actionLabel: quickProfile?.field_of_study ? 'Edit' : 'Add',
        onAction: () => (showQuickProfile = true)
      },
      {
        id: 'gpa',
        label: 'GPA range',
        value: quickProfile?.gpa_range ? quickProfile.gpa_range : '',
        completed: !!quickProfile?.gpa_range,
        actionLabel: quickProfile?.gpa_range ? 'Edit' : 'Add',
        onAction: () => (showQuickProfile = true)
      },
      {
        id: 'priority',
        label: 'Scholarship priority',
        value: quickProfile?.scholarship_priority ? quickProfile.scholarship_priority : '',
        completed: !!quickProfile?.scholarship_priority,
        actionLabel: quickProfile?.scholarship_priority ? 'Edit' : 'Add',
        onAction: () => (showQuickProfile = true)
      }
    ];

    const done = items.filter((i) => i.completed).length;
    return { done, total: items.length, items };
  }

  let profileChecklist = $derived(getProfileChecklist());

  const FREE_PREVIEW = {
    scholarships: 3,
    timeline: 2
  } as const;

  let hasReloadedUniversitiesForPaid = $state(false);

  function parseDeadline(deadline: string | null): Date | null {
    if (!deadline) return null;
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  function daysUntil(d: Date): number {
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function computeScholarshipMatch(s: Scholarship, qp: QuickProfile): number {
    let score = 0;
    // level
    if (!s.level || s.level === qp.degree_level || s.level === 'Graduate') score += 25;
    // field
    if (!s.field || s.field === 'All Fields' || s.field.toLowerCase().includes(qp.field_of_study.toLowerCase())) score += 25;
    // location
    if (!s.location || qp.preferred_countries.some((c) => s.location.toLowerCase().includes(c.toLowerCase()))) score += 20;
    // gpa
    const userGpa = gpaMidpoint(qp.gpa_range);
    if (!s.min_gpa || userGpa >= (s.min_gpa || 0)) score += 15;
    // deadline
    const dd = parseDeadline(s.deadline);
    const deadlineOk = dd ? daysUntil(dd) > 30 : false;
    if (deadlineOk) score += 15;
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  async function loadRankedScholarships(): Promise<void> {
    scholarshipsLoading = true;
    scholarshipsError = null;
    try {
      // Pull a reasonable slice; ranking is done client-side for now
      const { data: rows, error } = await supabase
        .from('public_scholarships_decoded')
        .select('id,title,provider,amount,deadline,location,field,level,website,min_gpa,created_at')
        .order('created_at', { ascending: false })
        .limit(400);

      if (error) throw error;

      const list: Scholarship[] = (rows || []).map((r: any) => ({ ...r, matchScore: null, saved: false }));

      // Saved status
      if (session?.user?.id) {
        const { data: interactions } = await supabase
          .from('user_scholarship_interactions')
          .select('scholarship_id,is_saved')
          .eq('user_id', session.user.id);
        const savedSet = new Set((interactions || []).filter((i: any) => i.is_saved).map((i: any) => i.scholarship_id));
        list.forEach((s) => (s.saved = savedSet.has(s.id)));
      }

      // Ranking
      if (quickProfile) {
        list.forEach((s) => (s.matchScore = computeScholarshipMatch(s, quickProfile!)));
        list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      }

      rankedScholarships = list;
    } catch (e: any) {
      scholarshipsError = 'Failed to load your scholarships. Please refresh.';
    } finally {
      scholarshipsLoading = false;
    }
  }

  async function loadUniversityPreview(): Promise<void> {
    universitiesLoading = true;
    universitiesError = null;
    safetyUni = targetUni = reachUni = null;

    if (!quickProfile) {
      universitiesLoading = false;
      return;
    }

    try {
      const body = {
        // The API expects this shape (similar to UniversityMatcher)
        gpa: String(gpaMidpoint(quickProfile.gpa_range)),
        field: quickProfile.field_of_study,
        degree_level: quickProfile.degree_level,
        preferred_countries: quickProfile.preferred_countries,
        scholarship_priority: quickProfile.scholarship_priority || 'high',
        value_approach: 'maximum_savings',
        qualities: [],
        research_interest: '',
        page: 1,
        pageSize: 10,
        preview: !isPremium // avoid consuming usage for free previews
      };

      const res = await fetch('/api/university-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Failed (${res.status})`);
      }

      const json = await res.json();
      const matches: UniMatch[] = Array.isArray(json.matches) ? json.matches : [];

      const high = matches.find((m) => m.admission_probability === 'High') || null;
      const moderate = matches.find((m) => m.admission_probability === 'Moderate') || null;
      const low = matches.find((m) => m.admission_probability === 'Low' || m.admission_probability === 'Very Low') || null;

      safetyUni = high || matches[0] || null;
      targetUni = moderate || matches[1] || matches[0] || null;
      reachUni = low || matches[2] || matches[0] || null;
    } catch (e: any) {
      universitiesError = 'Could not generate your university plan yet. Try again.';
    } finally {
      universitiesLoading = false;
    }
  }

  function getFullRankedScholarships(): Scholarship[] {
    // If profile exists, return ranked list; otherwise show latest as a harmless preview.
    if (!quickProfile) return rankedScholarships;
    return rankedScholarships.filter((s) => typeof s.matchScore === 'number');
  }

  function getVisibleRankedScholarships(): Scholarship[] {
    const full = getFullRankedScholarships();
    return isPremium ? full.slice(0, 20) : full.slice(0, FREE_PREVIEW.scholarships);
  }

  function getVisibleTimelineItems(): TimelineItem[] {
    return isPremium ? timelineItems.slice(0, 8) : timelineItems.slice(0, FREE_PREVIEW.timeline);
  }

  async function generateWinStrategiesForSaved(): Promise<void> {
    const savedIds = rankedScholarships.filter((s) => s.saved === true).map((s) => s.id).slice(0, 10);
    if (savedIds.length === 0) return;
    bulkWinStrategyLoading = true;
    bulkWinStrategyMessage = null;
    try {
      const res = await fetch('/api/scholarships/win-strategy/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scholarship_ids: savedIds })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403 && data.upgradeRequired) {
          bulkWinStrategyMessage = 'Unlock full plan to generate win strategies in bulk.';
        } else {
          bulkWinStrategyMessage = data.message || data.error || 'Request failed.';
        }
        return;
      }
      const { generated = 0, skipped = 0, failed = 0, limit_reached } = data;
      if (limit_reached) {
        bulkWinStrategyMessage = `Monthly limit reached. Generated: ${generated}, skipped (cached): ${skipped}, failed: ${failed}.`;
      } else {
        bulkWinStrategyMessage = `Done. Generated: ${generated}, skipped (cached): ${skipped}, failed: ${failed}.`;
      }
    } catch (e) {
      bulkWinStrategyMessage = 'Network error. Try again.';
    } finally {
      bulkWinStrategyLoading = false;
    }
  }

  function computeTimeline(): void {
    const items: TimelineItem[] = [];
    const upcoming = rankedScholarships
      .map((s) => {
        const d = parseDeadline(s.deadline);
        if (!d) return null;
        const daysLeft = daysUntil(d);
        if (daysLeft < 0) return null;
        return { s, d, daysLeft };
      })
      .filter(Boolean) as Array<{ s: Scholarship; d: Date; daysLeft: number }>;

    upcoming.sort((a, b) => a.d.getTime() - b.d.getTime());
    for (const u of upcoming.slice(0, 10)) {
      items.push({
        title: `Apply to ${u.s.title}`,
        dueText: u.d.toLocaleDateString(),
        daysLeft: u.daysLeft,
        href: `/scholarships/${u.s.id}`
      });
    }

    // If no deadlines, add generic starter actions
    if (items.length === 0) {
      items.push({ title: 'Complete your profile for better matches', dueText: 'Today', daysLeft: null });
      items.push({ title: 'Save 3 scholarships you like', dueText: 'This week', daysLeft: null });
    }

    timelineItems = items;
  }

  async function toggleScholarshipSaved(scholarshipId: string): Promise<void> {
    if (!session?.user?.id) return;
    const idx = rankedScholarships.findIndex((s) => s.id === scholarshipId);
    if (idx < 0) return;
    const current = rankedScholarships[idx].saved === true;

    try {
      // Check existing
      const { data: existing, error: fetchError } = await supabase
        .from('user_scholarship_interactions')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('scholarship_id', scholarshipId)
        .maybeSingle();

      if (fetchError && (fetchError as any).code !== 'PGRST116') throw fetchError;

      if (existing?.id) {
        const { error } = await supabase
          .from('user_scholarship_interactions')
          .update({ is_saved: !current })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_scholarship_interactions').insert({
          user_id: session.user.id,
          scholarship_id: scholarshipId,
          is_saved: true,
          is_applied: false
        });
        if (error) throw error;
      }

      rankedScholarships[idx].saved = !current;
      rankedScholarships = [...rankedScholarships];

      try {
        analytics.trackEvent('save_item_clicked', {
          item_type: 'scholarship',
          scholarship_id: scholarshipId,
          saved: !current,
          surface: 'strategy_pack',
          user_id: session?.user?.id
        });
      } catch {}
    } catch {
      // Silent fail for now (avoid alerts on the Plan page)
    }
  }

  async function trackScholarship(scholarshipId: string): Promise<void> {
    if (!session?.user?.id) return;
    // Ensure it's saved (so it appears in Saved Scholarships tracker), then navigate there.
    const s = rankedScholarships.find((x) => x.id === scholarshipId);
    if (!s) return;
    if (!s.saved) {
      await toggleScholarshipSaved(scholarshipId);
    }
    try {
      analytics.trackEvent('scholarship_tracked', { surface: 'strategy_pack', scholarship_id: scholarshipId, user_id: session?.user?.id });
    } catch {}
    goto('/scholarships/my-applications');
  }

  function upgrade(): void {
    try {
      analytics.trackEvent('upgrade_clicked', { surface: 'strategy_pack', user_id: session?.user?.id });
    } catch {}
    goto('/pricing');
  }

  async function bootstrap(): Promise<void> {
    // load quick profile
    const qp = await loadQuickProfile(supabase, session);
    quickProfile = qp.profile;
    profileSource = qp.source;

    // If no profile, prompt immediately (Plan-first experience depends on it)
    // Important: do NOT auto-open the modal; show the page first with a clear CTA.
    showQuickProfile = false;

    await loadRankedScholarships();
    computeTimeline();
    await loadUniversityPreview();
    try {
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session?.user?.id);
      universityApplicationsCount = typeof count === 'number' ? count : 0;
    } catch {
      universityApplicationsCount = null;
    }

    try {
      analytics.trackEvent('strategy_pack_viewed', { mode: isPremium ? 'full' : 'preview', user_id: session?.user?.id });
    } catch {}
  }

  onMount(() => {
    const unsub = subscriptionState.subscribe((s) => {
      const next = s?.loaded === true && s.isPremium === true;
      const was = isPremium;
      isPremium = next;

      // If the user is paid but we initially rendered in preview mode, reload university plan once.
      if (!was && next && quickProfile && !hasReloadedUniversitiesForPaid) {
        hasReloadedUniversitiesForPaid = true;
        void loadUniversityPreview();
      }
    });

    void bootstrap();
    return () => unsub();
  });
</script>

<svelte:head>
  <title>Your Plan - Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 pt-20 pb-12 px-4">
  <div class="max-w-6xl mx-auto">
    <!-- Studee-style tabs (within Plan dashboard) -->
    <div class="mb-6">
      <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-2 shadow-sm">
        <button
          type="button"
          class="px-4 py-2 text-sm font-semibold rounded-full bg-indigo-50 text-[#2C3580] border border-indigo-200"
          aria-current="page"
        >
          Your plan
        </button>
        <button
          type="button"
          onclick={() => goto('/scholarships/my-applications')}
          class="px-4 py-2 text-sm font-semibold rounded-full bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        >
          Saved scholarships
        </button>
        <button
          type="button"
          onclick={() => goto('/applications')}
          class="px-4 py-2 text-sm font-semibold rounded-full bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        >
          Applications
        </button>
        <button
          type="button"
          onclick={() => goto('/account')}
          class="px-4 py-2 text-sm font-semibold rounded-full bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        >
          Settings
        </button>
      </div>
    </div>

    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
      <div>
        <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
          <span class="h-2 w-2 rounded-full {isPremium ? 'bg-emerald-500' : 'bg-amber-400'}"></span>
          {isPremium ? 'Strategist unlocked' : 'Preview mode'}
        </div>
        <h1 class="mt-4 text-3xl md:text-4xl font-bold text-slate-900">Your Strategy Pack</h1>
        <p class="mt-2 text-slate-600 max-w-2xl">
          A ranked shortlist, a simple plan, and your next steps—built from your profile.
        </p>
      </div>

      {#if !isPremium}
        <button
          onclick={upgrade}
          class="inline-flex items-center justify-center rounded-xl bg-[#2C3580] px-6 py-3 text-base font-semibold text-white hover:bg-[#3c4d9c] transition"
        >
          Unlock full plan
        </button>
      {/if}
    </div>

    <!-- What you get with Strategist (for free users) -->
    {#if !isPremium}
      <div class="mb-8 rounded-2xl border border-indigo-200 bg-indigo-50/80 p-5 sm:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-slate-900">What you get when you unlock the full plan</h2>
            <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
              <li>Full ranked scholarship list</li>
              <li>Win strategy per scholarship</li>
              <li>Full timeline + reminders</li>
              <li>Application playbooks</li>
              <li>Higher document limits</li>
            </ul>
          </div>
          <a
            href="/pricing"
            class="inline-flex items-center justify-center rounded-xl bg-[#2C3580] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3c4d9c] transition shrink-0"
          >
            Unlock full plan
          </a>
        </div>
      </div>
    {/if}

    <!-- Plan setup checklist (Studee-style, adapted) -->
    <div class="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div class="text-sm font-semibold text-slate-700">Make your choices</div>
          <div class="mt-1 text-xs text-slate-500">{profileChecklist.done}/{profileChecklist.total} confirmed</div>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onclick={() => (showQuickProfile = true)}
            class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            {quickProfile ? 'Edit profile' : 'Complete profile'}
          </button>
          <a
            href="/diagnostic"
            class="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Take free diagnostic
          </a>
        </div>
      </div>

      <div class="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
        {#each profileChecklist.items as item (item.id)}
          <div class="flex items-center justify-between gap-4 px-4 py-4 bg-white">
            <div class="flex items-start gap-3 min-w-0">
              <div class="mt-0.5">
                {#if item.completed}
                  <div class="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center" aria-label="Completed">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                {:else}
                  <div class="h-6 w-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center" aria-label="Not completed">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2" />
                    </svg>
                  </div>
                {/if}
              </div>
              <div class="min-w-0">
                <div class="text-sm font-semibold text-slate-900">{item.label}</div>
                {#if item.completed}
                  <div class="text-sm text-slate-600 truncate">{item.value}</div>
                {:else}
                  <div class="text-sm text-slate-500">Not set yet</div>
                {/if}
              </div>
            </div>
            <button
              type="button"
              onclick={item.onAction}
              class="shrink-0 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {item.actionLabel}
            </button>
          </div>
        {/each}
      </div>

      <div class="mt-4 text-xs text-slate-500">
        Tip: the more complete your profile, the more accurate your ranking and university plan.
      </div>
    </div>

    <!-- Shortlist + Prepare (dashboard-style blocks) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Shortlist your options</h2>
            <p class="text-sm text-slate-600">Save scholarships and keep your plan organized.</p>
          </div>
        </div>

        <div class="mt-5 space-y-3">
          <a href="/scholarships/my-applications" class="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition">
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-slate-900">Saved scholarships</div>
                <div class="text-sm text-slate-600">Track deadlines and mark applied.</div>
              </div>
              <div class="text-sm font-bold text-slate-900">{savedScholarshipsCount}</div>
            </div>
          </a>
          {#if isPremium && savedScholarshipsCount > 0}
            <div class="flex flex-col gap-2">
              <button
                type="button"
                onclick={generateWinStrategiesForSaved}
                disabled={bulkWinStrategyLoading}
                class="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-100 transition disabled:opacity-60"
              >
                {bulkWinStrategyLoading ? 'Generating…' : 'Generate win strategies for saved (up to 10)'}
              </button>
              {#if bulkWinStrategyMessage}
                <p class="text-xs text-slate-600">{bulkWinStrategyMessage}</p>
              {/if}
            </div>
          {/if}

          <a href="/universities" class="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition">
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-slate-900">University matching</div>
                <div class="text-sm text-slate-600">Generate more safety/target/reach picks.</div>
              </div>
              <div class="text-sm font-semibold text-indigo-700">Match →</div>
            </div>
          </a>
        </div>
      </section>

      <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Prepare to apply</h2>
            <p class="text-sm text-slate-600">Documents, checklists, and application tracking.</p>
          </div>
        </div>

        <div class="mt-5 space-y-3">
          <a href="/document-checklists" class="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition">
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-slate-900">Document checklists</div>
                <div class="text-sm text-slate-600">Keep required documents in one place.</div>
              </div>
              <div class="text-sm font-semibold text-indigo-700">Open →</div>
            </div>
          </a>

          <a href="/sop" class="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition">
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-slate-900">Create documents</div>
                <div class="text-sm text-slate-600">SOP, CV, cover letter, and more.</div>
              </div>
              <div class="text-sm font-semibold text-indigo-700">Write →</div>
            </div>
          </a>

          <a href="/applications" class="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition">
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-slate-900">Applications</div>
                <div class="text-sm text-slate-600">Track universities and deadlines.</div>
              </div>
              <div class="text-sm font-bold text-slate-900">{universityApplicationsCount ?? '—'}</div>
            </div>
          </a>
        </div>
      </section>
    </div>

    <!-- If profile missing -->
    {#if quickProfile == null}
      <div class="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div class="font-semibold text-amber-900">Complete your quick profile</div>
            <div class="text-sm text-amber-800">
              We need your destination, degree, field, and GPA range to rank scholarships and generate your plan.
            </div>
          </div>
          <button
            onclick={() => (showQuickProfile = true)}
            class="inline-flex items-center justify-center rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition"
          >
            Complete profile
          </button>
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Scholarships -->
      <section class="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Top Scholarships (ranked)</h2>
            <p class="text-sm text-slate-600">We rank opportunities by fit and urgency.</p>
          </div>
          <a href="/scholarships" class="text-sm font-semibold text-indigo-700 hover:text-indigo-800">Browse all →</a>
        </div>

        {#if scholarshipsLoading}
          <div class="mt-6 text-sm text-slate-600">Loading scholarships…</div>
        {:else if scholarshipsError}
          <div class="mt-6 text-sm text-red-700">{scholarshipsError}</div>
        {:else}
          <div class="mt-6 space-y-4">
            {#each getVisibleRankedScholarships() as s (s.id)}
              <div class="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <a href={`/scholarships/${s.id}`} class="block font-semibold text-slate-900 hover:text-indigo-700 truncate">
                      {s.title}
                    </a>
                    <div class="mt-1 text-sm text-slate-600 truncate">{s.provider}</div>
                    <div class="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                      <span class="rounded-full bg-slate-100 px-2 py-1">{formatCurrencyAmount(s.amount)}</span>
                      {#if s.deadline}
                        <span class="rounded-full bg-slate-100 px-2 py-1">Deadline: {new Date(s.deadline).toLocaleDateString()}</span>
                      {:else}
                        <span class="rounded-full bg-slate-100 px-2 py-1">Deadline: unknown</span>
                      {/if}
                      {#if quickProfile && typeof s.matchScore === 'number'}
                        <span class="rounded-full bg-slate-100 px-2 py-1">{s.matchScore}% match</span>
                      {/if}
                    </div>
                  </div>

                  <div class="flex flex-col items-end gap-2">
                    {#if quickProfile && typeof s.matchScore === 'number'}
                      <div class="text-sm font-bold text-slate-900">{s.matchScore}%</div>
                      <div class="text-[11px] text-slate-500">match</div>
                    {:else}
                      <div class="text-sm font-bold text-slate-900">—</div>
                      <div class="text-[11px] text-slate-500">complete profile to rank</div>
                    {/if}
                    <div class="mt-1 flex items-center gap-2">
                      <button
                        disabled={!session?.user?.id}
                        onclick={() => toggleScholarshipSaved(s.id)}
                        class="inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition {s.saved ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}"
                        title={s.saved ? 'Saved' : 'Save'}
                      >
                        {s.saved ? 'Saved' : 'Save'}
                      </button>
                      <button
                        disabled={!session?.user?.id}
                        onclick={() => trackScholarship(s.id)}
                        class="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        title={s.saved ? 'Open your Saved Scholarships tracker' : 'Save and open your tracker'}
                      >
                        {s.saved ? 'View tracker' : 'Track'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>

          {#if !isPremium}
            <div class="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div class="text-sm text-indigo-900">
                  <span class="font-semibold">Preview:</span>
                  {#if quickProfile}
                    you’re seeing {FREE_PREVIEW.scholarships}. Unlock your full ranked shortlist and “why” explanations.
                  {:else}
                    complete your quick profile to unlock ranking and your full plan.
                  {/if}
                </div>
                <button onclick={upgrade} class="rounded-xl bg-[#2C3580] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3c4d9c] transition">
                  Unlock full plan
                </button>
              </div>
            </div>
          {/if}
        {/if}
      </section>

      <!-- University plan -->
      <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-900">University plan</h2>
            <p class="text-sm text-slate-600">Safety, target, and reach picks.</p>
          </div>
          <a href="/universities" class="text-sm font-semibold text-indigo-700 hover:text-indigo-800">Match →</a>
        </div>

        {#if universitiesLoading}
          <div class="mt-6 text-sm text-slate-600">Generating…</div>
        {:else if universitiesError}
          <div class="mt-6 text-sm text-red-700">{universitiesError}</div>
        {:else if quickProfile == null}
          <div class="mt-6 text-sm text-slate-600">Complete your profile to generate your university plan.</div>
        {:else}
          <div class="mt-6 space-y-4">
            <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div class="text-xs font-semibold text-emerald-800">Safety</div>
              <div class="mt-1 font-semibold text-slate-900">{safetyUni?.university?.name || '—'}</div>
              <div class="text-sm text-slate-600">{safetyUni?.university?.country || ''}</div>
            </div>
            <div class="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <div class="text-xs font-semibold text-sky-800">Target</div>
              <div class="mt-1 font-semibold text-slate-900">{targetUni?.university?.name || '—'}</div>
              <div class="text-sm text-slate-600">{targetUni?.university?.country || ''}</div>
            </div>
            <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div class="text-xs font-semibold text-amber-800">Reach</div>
              <div class="mt-1 font-semibold text-slate-900">{reachUni?.university?.name || '—'}</div>
              <div class="text-sm text-slate-600">{reachUni?.university?.country || ''}</div>
            </div>
          </div>
        {/if}

        {#if !isPremium}
          <div class="mt-6 text-xs text-slate-600">
            Preview shows 1 per category. Unlock full plan for more recommendations + reasoning.
          </div>
        {/if}
      </section>
    </div>

    <!-- Timeline -->
    <section class="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Timeline (next steps)</h2>
          <p class="text-sm text-slate-600">Do these next—keep momentum.</p>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each getVisibleTimelineItems() as t, i}
          <a
            href={t.href || '#'}
            class="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition"
            onclick={(e) => { if (!t.href) e.preventDefault(); }}
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="font-semibold text-slate-900 truncate">{t.title}</div>
                <div class="text-sm text-slate-600">Due: {t.dueText}</div>
              </div>
              {#if typeof t.daysLeft === 'number'}
                <div class="text-xs font-semibold rounded-full bg-slate-100 px-2 py-1 whitespace-nowrap">{t.daysLeft} days</div>
              {/if}
            </div>
          </a>
        {/each}
      </div>

      {#if !isPremium}
        <div class="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div class="text-sm text-indigo-900">
              Unlock the full timeline + reminders so you never miss deadlines.
            </div>
            <button onclick={upgrade} class="rounded-xl bg-[#2C3580] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3c4d9c] transition">
              Unlock full plan
            </button>
          </div>
        </div>
      {/if}
    </section>
  </div>
</div>

<QuickProfileModal
  bind:isOpen={showQuickProfile}
  {supabase}
  {session}
  on:completed={async (e: CustomEvent<{ profile: QuickProfile }>) => {
    quickProfile = e.detail.profile;
    showQuickProfile = false;
    try {
      analytics.trackEvent('quick_profile_completed', { surface: 'strategy_pack', source: profileSource, user_id: session?.user?.id });
    } catch {}
    await loadRankedScholarships();
    computeTimeline();
    await loadUniversityPreview();
  }}
  on:cancel={() => { showQuickProfile = false; }}
/>

