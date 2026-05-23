<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import CoverLetterGenerator from '$lib/components/CoverLetterGenerator.svelte';
  import { analytics } from '$lib/utils/posthog';
  import { Mail, ArrowLeft, ChevronRight, ScrollText, ClipboardList, PenLine, Download, Edit3, GraduationCap, Briefcase, Building2, FlaskConical } from 'lucide-svelte';

  let { data } = $props();
  let { supabase, session } = $derived(data);

  let userData: any = $state(null);
  let existingSOPs: any[] = $state([]);
  let loading = $state(false);
  let selectedSOP: any = $state(null);
  let showGenerator = $state(false);
  let savedCoverLetters = $state<any[]>([]);

  async function loadData() {
    if (!session?.user) return;
    loading = true;
    try {
      const [profileRes, sopsRes, clRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', session.user.id).maybeSingle(),
        supabase.from('sops').select('id, university_name, program_name, content').eq('user_id', session.user.id).order('updated_at', { ascending: false }),
        supabase.from('cover_letters').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
      ]);
      userData = { name: session.user.user_metadata?.full_name || '', email: session.user.email || '' };
      existingSOPs = sopsRes.data || [];
      savedCoverLetters = clRes.data || [];
    } catch {}
    loading = false;
  }

  onMount(async () => {
    analytics.trackPageView('Cover Letter Generator', { user_id: session?.user?.id });
    await loadData();
  });

  function startGenerator(sopData: any = null) {
    selectedSOP = sopData;
    showGenerator = true;
  }

  function handleGenerated() {
    showGenerator = false;
    loadData();
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async function exportCL(id: string, jobTitle: string, company: string) {
    const { data: cl } = await supabase.from('cover_letters').select('generated_content').eq('id', id).single();
    if (!cl?.generated_content) return;
    const res = await fetch('/api/export-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: cl.generated_content, title: `${jobTitle} — ${company}`, type: 'cover-letter' })
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${jobTitle.replace(/[^a-z0-9]/gi, '_')}_Cover_Letter.docx`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  const POSITION_ICONS: Record<string, any> = {
    academic: GraduationCap,
    industry: Briefcase,
    government: Building2,
    hybrid: FlaskConical
  };
</script>

<svelte:head>
  <title>Cover Letter Generator — Abroaducate</title>
  <meta name="description" content="Generate professional cover letters for academic and industry positions." />
</svelte:head>

<div class="min-h-screen bg-slate-50 pt-20 pb-16">
  <!-- Page header -->
  <div class="bg-white border-b border-slate-200">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <a href="/dashboard" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6">
        <ArrowLeft size={15} /> Back to Dashboard
      </a>
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
          <Mail size={24} strokeWidth={2} />
        </div>
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Cover Letter Generator</h1>
          <p class="text-slate-500 mt-1">For academic positions, industry roles, and everything in between.</p>
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    {#if loading}
      <div class="flex justify-center py-20">
        <div class="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    {:else if showGenerator}
      <button onclick={() => (showGenerator = false)} class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6">
        <ArrowLeft size={15} /> Back
      </button>
      <CoverLetterGenerator existingUserData={userData} existingSOPData={selectedSOP} on:coverLetterGenerated={handleGenerated} />
    {:else}
      <!-- Position type cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {#each [
          { icon: GraduationCap, label: 'Academic', desc: 'PhD, PostDoc, Research' },
          { icon: Briefcase, label: 'Industry', desc: 'Corporate, Startup, Tech' },
          { icon: Building2, label: 'Government', desc: 'Public sector, NGO' },
          { icon: FlaskConical, label: 'Hybrid', desc: 'Industry R&D, Corporate research' }
        ] as t}
          <div class="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <div class="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-2">
              <t.icon size={18} />
            </div>
            <div class="text-sm font-bold text-slate-900">{t.label}</div>
            <div class="text-xs text-slate-500 mt-0.5">{t.desc}</div>
          </div>
        {/each}
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-3 mb-10">
        <button onclick={() => startGenerator()} class="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
          Create new cover letter
        </button>
        {#if existingSOPs.length > 0}
          <select
            onchange={(e) => {
              const id = (e.target as HTMLSelectElement)?.value;
              if (id) startGenerator(existingSOPs.find(s => s.id === id));
              (e.target as HTMLSelectElement).value = '';
            }}
            class="px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Use existing SOP as base…</option>
            {#each existingSOPs as sop}
              <option value={sop.id}>{sop.university_name} — {sop.program_name}</option>
            {/each}
          </select>
        {/if}
      </div>

      <!-- Saved cover letters -->
      {#if savedCoverLetters.length > 0}
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 class="font-bold text-slate-900">Your cover letters</h2>
            <span class="text-xs text-slate-500">{savedCoverLetters.length} saved</span>
          </div>
          <div class="divide-y divide-slate-100">
            {#each savedCoverLetters as cl}
              {@const Icon = POSITION_ICONS[cl.position_type] ?? Mail}
              <div class="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div class="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-slate-900 text-sm truncate">{cl.job_title}</div>
                  <div class="text-xs text-slate-500">{cl.company_name} · {cl.word_count || 0} words · {formatDate(cl.created_at)}</div>
                </div>
                <div class="flex gap-2 flex-shrink-0">
                  <button onclick={() => goto(`/cover-letters/${cl.id}`)} class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                    <Edit3 size={12} /> Edit
                  </button>
                  <button onclick={() => exportCL(cl.id, cl.job_title, cl.company_name)} class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                    <Download size={12} /> Export
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center mb-8">
          <div class="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Mail size={22} />
          </div>
          <p class="font-semibold text-slate-700 mb-1">No cover letters yet</p>
          <p class="text-sm text-slate-500">Create your first one above.</p>
        </div>
      {/if}

      <!-- Other tools -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Other document tools</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          {#each [
            { href: '/sop', icon: ScrollText, label: 'Statement of Purpose', desc: 'SOP / Motivation Letter' },
            { href: '/personal-statements', icon: PenLine, label: 'Personal Statement', desc: 'Scholarship & admission' },
            { href: '/academic-cv', icon: ClipboardList, label: 'CV Templates', desc: 'Free European CV templates' }
          ] as t}
            <a href={t.href} class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all group">
              <div class="w-8 h-8 rounded-md bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600 flex items-center justify-center transition-colors flex-shrink-0">
                <t.icon size={15} />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-bold text-slate-900">{t.label}</div>
                <div class="text-xs text-slate-500">{t.desc}</div>
              </div>
              <ChevronRight size={13} class="text-slate-400 group-hover:text-orange-500 transition-colors" />
            </a>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
