<script lang="ts">
  import { onMount } from 'svelte';
  import FormSection from '$lib/components/FormSection.svelte';
  import { analytics } from '$lib/utils/posthog';
  import { ScrollText, ShieldAlert, Target, Zap, GraduationCap, Mail, ClipboardList, ChevronRight, ArrowLeft } from 'lucide-svelte';

  let { data } = $props();
  let { session } = $derived(data);

  onMount(() => {
    analytics.trackPageView('SOP Generator', { user_id: session?.user?.id });
  });
</script>

<svelte:head>
  <title>Statement of Purpose Generator — Abroaducate</title>
  <meta name="description" content="Generate a compelling statement of purpose for your university application with AI assistance." />
</svelte:head>

<div class="min-h-screen bg-slate-50 pt-20 pb-16">
  <!-- Page header -->
  <div class="bg-white border-b border-slate-200">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <a href="/dashboard" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6">
        <ArrowLeft size={15} /> Back to Dashboard
      </a>
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 border border-orange-100">
          <ScrollText size={24} strokeWidth={2} />
        </div>
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Statement of Purpose</h1>
          <p class="text-slate-500 mt-1">AI-assisted generation — answer the questions, we write the draft.</p>
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <!-- Disclaimer -->
    <div class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-8">
      <ShieldAlert size={18} class="text-amber-600 flex-shrink-0 mt-0.5" />
      <p class="text-sm text-amber-800 leading-relaxed">
        The generated SOP is a <strong>starting draft</strong>. Review, personalise, and adapt it to reflect your own voice before submitting. Do not submit AI-generated content without modification.
      </p>
    </div>

    <!-- Form -->
    <FormSection />

    <!-- Feature row -->
    <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
      {#each [
        { icon: Target, label: 'Targeted questions', desc: 'Captures your academic journey and goals step by step.' },
        { icon: Zap, label: 'AI-powered draft', desc: 'Generates a structured, personalised SOP from your answers.' },
        { icon: GraduationCap, label: 'University-standard', desc: 'Formatted and worded to meet admissions expectations.' }
      ] as f}
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mb-3">
            <f.icon size={18} />
          </div>
          <h3 class="font-bold text-slate-900 text-sm mb-1">{f.label}</h3>
          <p class="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
        </div>
      {/each}
    </div>

    <!-- Other tools -->
    <div class="mt-10 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Other document tools</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        {#each [
          { href: '/cover-letters', icon: Mail, label: 'Cover Letter', desc: 'For programs & professors' },
          { href: '/personal-statements', icon: ScrollText, label: 'Personal Statement', desc: 'Scholarship & admission' },
          { href: '/academic-cv', icon: ClipboardList, label: 'CV Templates', desc: 'Free European CV templates' }
        ] as t}
          <a href={t.href} class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all group">
            <div class="w-8 h-8 rounded-md bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600 flex items-center justify-center transition-colors flex-shrink-0">
              <t.icon size={16} />
            </div>
            <div>
              <div class="text-sm font-bold text-slate-900">{t.label}</div>
              <div class="text-xs text-slate-500">{t.desc}</div>
            </div>
            <ChevronRight size={14} class="ml-auto text-slate-400 group-hover:text-orange-500 transition-colors" />
          </a>
        {/each}
      </div>
    </div>
  </div>
</div>
