<script lang="ts">
  import { onMount } from 'svelte';
  import PersonalStatementGenerator from '$lib/components/PersonalStatementGenerator.svelte';
  import { PenLine, ArrowLeft, ShieldAlert, ScrollText, Mail, ClipboardList, ChevronRight, Zap, BookOpen, Target } from 'lucide-svelte';

  let { data } = $props();
  let { session } = $derived(data);

  let existingUserData: any = $state(null);
  let existingSOPData: any = $state(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      const [profileRes, sopRes] = await Promise.all([
        fetch('/api/get-user-profile').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/get-latest-sop').then(r => r.ok ? r.json() : null).catch(() => null)
      ]);
      if (profileRes?.profile) existingUserData = profileRes.profile;
      if (sopRes?.sop) existingSOPData = sopRes.sop;
    } catch {}
    loading = false;
  });
</script>

<svelte:head>
  <title>Personal Statement Generator — Abroaducate</title>
  <meta name="description" content="Create a compelling personal statement for scholarships, college applications, and more." />
</svelte:head>

<div class="min-h-screen bg-slate-50 pt-20 pb-16">
  <!-- Page header -->
  <div class="bg-white border-b border-slate-200">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <a href="/dashboard" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6">
        <ArrowLeft size={15} /> Back to Dashboard
      </a>
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
          <PenLine size={24} strokeWidth={2} />
        </div>
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Personal Statement</h1>
          <p class="text-slate-500 mt-1">Story-driven narrative for scholarships, college, and professional programs.</p>
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    {#if loading}
      <div class="flex justify-center py-20">
        <div class="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    {:else}
      <!-- Disclaimer -->
      <div class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-8">
        <ShieldAlert size={18} class="text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm text-amber-800 leading-relaxed">
          The generated statement is a <strong>starting draft</strong>. Review, personalise, and adapt it to reflect your own voice before submitting.
        </p>
      </div>

      <!-- Difference callout -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div class="bg-white border border-blue-100 rounded-xl p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center"><PenLine size={14} /></div>
            <span class="text-sm font-bold text-slate-900">Personal Statement</span>
            <span class="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-700 rounded">This tool</span>
          </div>
          <ul class="text-xs text-slate-600 space-y-1">
            <li>• Character and personal journey focused</li>
            <li>• Story-driven, emotional narrative</li>
            <li>• Scholarships, undergrad, law, medical</li>
          </ul>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-7 h-7 rounded-md bg-orange-50 text-orange-600 flex items-center justify-center"><ScrollText size={14} /></div>
            <span class="text-sm font-bold text-slate-900">Statement of Purpose</span>
            <a href="/sop" class="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded hover:bg-orange-100 hover:text-orange-700 transition-colors">Switch</a>
          </div>
          <ul class="text-xs text-slate-600 space-y-1">
            <li>• Academic and research focused</li>
            <li>• Professional, structured format</li>
            <li>• Graduate school applications</li>
          </ul>
        </div>
      </div>

      <!-- Generator -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10">
        <PersonalStatementGenerator {existingUserData} {existingSOPData} />
      </div>

      <!-- Feature row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {#each [
          { icon: BookOpen, label: 'Story-driven', desc: 'Captures your personal journey, values, and growth.' },
          { icon: Zap, label: 'AI-powered', desc: 'Generates a structured narrative from your answers.' },
          { icon: Target, label: 'Application-specific', desc: 'Tailored for scholarships, undergrad, law, medical, and more.' }
        ] as f}
          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mb-2">
              <f.icon size={16} />
            </div>
            <h3 class="font-bold text-slate-900 text-sm mb-1">{f.label}</h3>
            <p class="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
          </div>
        {/each}
      </div>

      <!-- Other tools -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Other document tools</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          {#each [
            { href: '/sop', icon: ScrollText, label: 'Statement of Purpose', desc: 'SOP / Motivation Letter' },
            { href: '/cover-letters', icon: Mail, label: 'Cover Letter', desc: 'For programs & professors' },
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
