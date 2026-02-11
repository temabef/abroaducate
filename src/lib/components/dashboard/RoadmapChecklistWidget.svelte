<script lang="ts">
  import type { SupabaseClient } from '@supabase/supabase-js';
  import { onMount } from 'svelte';
  import { loadUnifiedProfile } from '$lib/services/unifiedProfile';
  import { ArrowRight, BookOpen, Calendar, Check, FileText, Globe2, GraduationCap, School, Sparkles, Wallet } from 'lucide-svelte';

  let {
    supabase,
    session,
    documentsSummary,
    applicationsCount
  }: {
    supabase: SupabaseClient;
    session: any;
    documentsSummary?: {
      total_documents?: number;
      sop_count?: number;
      cover_letter_count?: number;
      personal_statement_count?: number;
    };
    applicationsCount?: number;
  } = $props();

  let loading = $state(true);
  let profile = $state<any>(null);

  onMount(() => {
    void refresh();

    // Refresh when dashboard auto-saves profile
    const handler = () => void refresh();
    window.addEventListener('abroaducate:profile-updated', handler);
    return () => window.removeEventListener('abroaducate:profile-updated', handler);
  });

  async function refresh() {
    try {
      loading = true;
      const res = await loadUnifiedProfile(supabase, session);
      profile = res.profile;
    } catch (e) {
      console.warn('Roadmap widget failed to load profile:', e);
    } finally {
      loading = false;
    }
  }

  function hasValue(v: any) {
    if (Array.isArray(v)) return v.length > 0;
    return !!v;
  }

  const steps = $derived.by(() => {
    if (!profile) {
      return {
        total: 5,
        completed: 0,
        groups: []
      };
    }

    const makeChoices = [
      {
        id: 'degree',
        title: 'Degree level',
        subtitle: profile.degree_level ? String(profile.degree_level).toUpperCase() : 'Choose your degree level',
        done: hasValue(profile.degree_level),
        cta: hasValue(profile.degree_level) ? 'Edit degree level' : 'Add degree level',
        href: '/diagnostic'
      },
      {
        id: 'intake',
        title: 'Start date',
        subtitle: profile.target_intake || 'When do you plan to start?',
        done: hasValue(profile.target_intake),
        cta: hasValue(profile.target_intake) ? 'Edit start date' : 'Add start date',
        href: '/onboarding'
      },
      {
        id: 'budget',
        title: 'Budget (optional)',
        subtitle: profile.budget_range ? String(profile.budget_range).toUpperCase() : 'Add a budget to filter better matches',
        done: hasValue(profile.budget_range),
        cta: hasValue(profile.budget_range) ? 'Edit budget' : 'Add budget',
        href: '/onboarding'
      },
      {
        id: 'field',
        title: 'Subject(s)',
        subtitle: profile.field_of_study || 'What subjects do you want to study?',
        done: hasValue(profile.field_of_study),
        cta: hasValue(profile.field_of_study) ? 'Edit subjects' : 'Add subjects',
        href: '/diagnostic'
      },
      {
        id: 'countries',
        title: 'Country(s)',
        subtitle: Array.isArray(profile.preferred_countries) && profile.preferred_countries.length
          ? profile.preferred_countries.join(', ')
          : 'What countries are you interested in?',
        done: Array.isArray(profile.preferred_countries) && profile.preferred_countries.length > 0,
        cta: Array.isArray(profile.preferred_countries) && profile.preferred_countries.length > 0 ? 'Edit countries' : 'Add countries',
        href: '/diagnostic'
      }
    ];

    const makeChoicesCompleted = makeChoices.filter((s) => s.done).length;

    const sopDone = (documentsSummary?.sop_count || 0) > 0;
    const coverDone = (documentsSummary?.cover_letter_count || 0) > 0;
    const psDone = (documentsSummary?.personal_statement_count || 0) > 0;
    const anyDocsDone = (documentsSummary?.total_documents || 0) > 0 || sopDone || coverDone || psDone;
    const appsDone = (applicationsCount || 0) > 0;

    const shortlist = [
      {
        id: 'universities',
        title: 'Universities',
        subtitle: 'What universities are you considering?',
        done: false,
        cta: 'Add universities',
        href: '/universities'
      },
      {
        id: 'programs',
        title: 'Program(s)',
        subtitle: 'Have you found the right program?',
        done: false,
        cta: 'Confirm programs',
        href: '/universities'
      }
    ];

    const prepareToApply = [
      {
        id: 'proof_of_funding',
        title: 'Proof of funding',
        subtitle: hasValue(profile.budget_range) ? 'Budget saved' : "Do you have proof of funds for your first year?",
        done: hasValue(profile.budget_range),
        cta: hasValue(profile.budget_range) ? 'Edit budget' : 'Confirm funding',
        href: '/onboarding'
      },
      {
        id: 'documents',
        title: 'Documents',
        subtitle: anyDocsDone ? 'Documents created' : 'Do you have all your documents?',
        done: anyDocsDone,
        cta: anyDocsDone ? 'Open documents' : 'Confirm documents',
        href: '/tools'
      },
      {
        id: 'applications',
        title: 'Apply date',
        subtitle: appsDone ? 'Tracking started' : 'When will you submit your application?',
        done: appsDone,
        cta: appsDone ? 'Open applications' : 'Add apply date',
        href: '/applications'
      }
    ];

    return {
      total: makeChoices.length,
      completed: makeChoicesCompleted,
      groups: [
        {
          title: 'Make your choices',
          description: 'Confirm your preferences to get better matches.',
          steps: makeChoices,
          variant: 'standard'
        },
        {
          title: 'Find programs that match your study preferences',
          description: 'Explore programs that fit your choices',
          steps: [
            {
              id: 'matches',
              title: 'See your latest matches',
              subtitle: 'Explore programs that fit your choices',
              done: false,
              cta: 'See your latest matches',
              href: '/universities'
            }
          ],
          variant: 'callout'
        },
        {
          title: 'Shortlist your options',
          description: '',
          steps: shortlist,
          variant: 'standard'
        },
        {
          title: 'Prepare to apply',
          description: '',
          steps: prepareToApply,
          variant: 'standard'
        }
      ]
    };
  });

  const groupProgress = $derived.by(() => {
    const groups = steps?.groups || [];
    return groups.map((g) => {
      const total = g.steps.length;
      const completed = g.steps.filter((s: any) => s.done).length;
      return { total, completed };
    });
  });
</script>

<section id="roadmap" class="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-6 md:p-8 shadow-sm">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h2 class="text-2xl font-bold text-slate-900">Your study abroad roadmap</h2>
      <p class="mt-1 text-slate-600 text-sm">A checklist that updates as you complete steps.</p>
    </div>

    {#if !loading}
      <div class="text-sm font-semibold text-slate-600">{steps.completed}/{steps.total} confirmed</div>
    {/if}
  </div>

  {#if loading}
    <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
      <div class="flex items-center gap-3 text-slate-600">
        <div class="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-[#2C3580]"></div>
        Loading your roadmap…
      </div>
    </div>
  {:else if !profile}
    <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
      <h3 class="font-semibold text-slate-900">Start with your roadmap</h3>
      <p class="mt-1 text-sm text-slate-600">Answer 5 questions and we’ll generate your funding + next steps.</p>
      <a
        href="/diagnostic"
        class="mt-4 inline-flex items-center justify-center rounded-xl bg-[#2C3580] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3c4d9c] transition"
      >
        Get your free roadmap
      </a>
    </div>
  {:else}
    <div class="mt-6 grid gap-6">
      {#each steps.groups as group, idx}
        {#if group.variant === 'callout'}
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-start gap-3">
              <div class="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <Sparkles class="h-5 w-5" />
              </div>
              <div>
                <h3 class="font-semibold text-slate-900">{group.title}</h3>
                <p class="mt-1 text-sm text-slate-600">{group.description}</p>
              </div>
            </div>
            <a
              href={group.steps[0].href}
              class="inline-flex items-center justify-center rounded-xl border border-[#2C3580] bg-white px-5 py-3 text-sm font-semibold text-[#2C3580] hover:bg-slate-50 transition"
            >
              {group.steps[0].cta}
              <ArrowRight class="ml-2 h-4 w-4" />
            </a>
          </div>
        {:else}
          <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <div class="flex items-center justify-between gap-4">
              <h3 class="font-semibold text-slate-900">{group.title}</h3>
              <div class="text-sm font-semibold text-slate-600">
                {groupProgress[idx]?.completed}/{groupProgress[idx]?.total} confirmed
              </div>
            </div>

            <div class="mt-4 grid gap-3">
              {#each group.steps as s}
                <div class="rounded-2xl border border-slate-200 bg-white px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div class="flex items-start gap-4">
                    <div class="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl {s.done ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}">
                      {#if s.done}
                        <Check class="h-5 w-5" />
                      {:else if s.id === 'degree'}
                        <GraduationCap class="h-5 w-5" />
                      {:else if s.id === 'intake'}
                        <Calendar class="h-5 w-5" />
                      {:else if s.id === 'budget' || s.id === 'proof_of_funding'}
                        <Wallet class="h-5 w-5" />
                      {:else if s.id === 'field'}
                        <BookOpen class="h-5 w-5" />
                      {:else if s.id === 'countries'}
                        <Globe2 class="h-5 w-5" />
                      {:else if s.id === 'universities'}
                        <School class="h-5 w-5" />
                      {:else if s.id === 'programs'}
                        <FileText class="h-5 w-5" />
                      {:else}
                        <Sparkles class="h-5 w-5" />
                      {/if}
                    </div>
                    <div>
                      <div class="font-semibold text-slate-900">{s.title}</div>
                      <div class="text-sm text-slate-600">{s.subtitle}</div>
                    </div>
                  </div>

                  <a
                    href={s.href}
                    class="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition {s.done ? 'border border-[#2C3580] text-[#2C3580] bg-white hover:bg-indigo-50' : 'bg-orange-500 text-white hover:bg-orange-600'}"
                  >
                    {s.cta}
                  </a>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</section>

