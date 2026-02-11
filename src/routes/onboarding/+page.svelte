<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import type { PageData } from './$types';
  import { loadUnifiedProfile, completeOnboarding, type OnboardingData } from '$lib/services/unifiedProfile';
  import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';

  let { data }: { data: PageData } = $props();
  let { supabase, session } = data;

  let step = $state<1 | 2>(1);
  let isSaving = $state(false);
  let showLogin = $state(false);
  let showAuthModal = $state(false);
  let error = $state<string | null>(null);

  let userEmail = $state('');
  let userName = $state('');

  let importedFromRoadmap = $state(false);
  let roadmapSummary = $state<{ countries: string[]; field: string; degree: string } | null>(null);

  let countrySearch = $state('');
  let fieldSearch = $state('');

  type NextAction = 'dashboard' | 'find_universities' | 'explore_scholarships' | 'generate_sop';
  let nextAction = $state<NextAction>('dashboard');

  const availableCountries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'Netherlands', 'France', 'Italy', 'Spain', 'Switzerland',
    'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Belgium',
    'Japan', 'Singapore', 'South Korea', 'New Zealand', 'Hong Kong',
    'United Arab Emirates', 'South Africa', 'Other'
  ];

  const fieldsOfStudy = [
    'Computer Science', 'Software Engineering', 'Data Science', 'Artificial Intelligence',
    'Engineering (General)', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
    'Business Administration', 'MBA', 'Finance', 'Marketing', 'Economics',
    'Medicine', 'Nursing', 'Public Health', 'Psychology',
    'Law', 'Biology', 'Mathematics', 'Physics', 'Architecture', 'Education', 'Other'
  ];

  const availableIntakes = ['Fall 2025', 'Spring 2026', 'Fall 2026', 'Spring 2027', 'Fall 2027'];
  const budgetRanges = [
    { value: '0-20k', label: '$0 - $20,000 per year' },
    { value: '20k-50k', label: '$20,000 - $50,000 per year' },
    { value: '50k-100k', label: '$50,000 - $100,000 per year' },
    { value: '100k+', label: '$100,000+ per year' },
    { value: 'skip', label: 'Skip for now' }
  ] as const;

  let onboardingData: OnboardingData = $state({
    preferred_countries: [],
    phone_number: '',
    field_of_study: '',
    degree_level: 'masters',
    target_intake: '',
    budget_range: '',
    current_gpa_value: undefined,
    current_gpa_scale: '',
    gpa_range: '3.0-3.5',
    scholarship_priority: 'high'
  });

  function mapDegreeLevel(raw: string | null | undefined): OnboardingData['degree_level'] {
    const v = String(raw || '').toLowerCase();
    if (v.includes('phd') || v.includes('doctor')) return 'phd';
    if (v.includes('master')) return 'masters';
    if (v.includes('under') || v.includes('bachelor')) return 'undergraduate';
    return 'graduate';
  }

  function hydrateFromRoadmap() {
    if (!browser) return;
    try {
      const raw = sessionStorage.getItem('diagnosticData');
      if (!raw) return;
      const d = JSON.parse(raw);
      const countries = Array.isArray(d.targetCountries) ? d.targetCountries : [];
      const field = typeof d.fieldOfStudy === 'string' ? d.fieldOfStudy : '';
      const degree = typeof d.degreeLevel === 'string' ? d.degreeLevel : '';

      if (countries.length) onboardingData.preferred_countries = countries;
      if (field) onboardingData.field_of_study = field;
      if (degree) onboardingData.degree_level = mapDegreeLevel(degree);

      if (countries.length || field || degree) {
        importedFromRoadmap = true;
        roadmapSummary = { countries, field, degree };
      }
    } catch {}
  }

  function selectCountry(country: string) {
    if (!onboardingData.preferred_countries.includes(country)) {
      onboardingData.preferred_countries = [...onboardingData.preferred_countries, country];
    }
    countrySearch = '';
  }

  function removeCountry(country: string) {
    onboardingData.preferred_countries = onboardingData.preferred_countries.filter((c) => c !== country);
  }

  function selectField(field: string) {
    onboardingData.field_of_study = field;
    fieldSearch = '';
  }

  const filteredCountries = $derived(
    availableCountries
      .filter(
        (c) => c.toLowerCase().includes(countrySearch.toLowerCase()) && !onboardingData.preferred_countries.includes(c)
      )
      .slice(0, 8)
  );

  const filteredFields = $derived(fieldsOfStudy.filter((f) => f.toLowerCase().includes(fieldSearch.toLowerCase())).slice(0, 10));

  function canContinue(): boolean {
    if (step === 1) return onboardingData.preferred_countries.length > 0;
    return onboardingData.field_of_study.trim().length > 0 && !!onboardingData.degree_level;
  }

  function goNext() {
    error = null;
    if (!canContinue()) {
      error = step === 1 ? 'Please add at least one destination country.' : 'Please select your field and degree level.';
      return;
    }
    if (step === 1) step = 2;
  }

  async function saveAndContinue() {
    error = null;
    if (!canContinue()) {
      error = 'Please complete the required fields.';
      return;
    }
    if (isSaving) return;
    isSaving = true;

    try {
      const result = await completeOnboarding(supabase, session, onboardingData);
      if (!result.success) {
        error = 'Failed to save your profile. Please try again.';
        return;
      }

      if (nextAction === 'find_universities') goto('/universities?onboarding=true');
      else if (nextAction === 'explore_scholarships') goto('/scholarships?onboarding=true');
      else if (nextAction === 'generate_sop') goto('/sop?onboarding=true');
      else goto('/plan?onboarding=complete');
    } catch (e) {
      console.error(e);
      error = 'An error occurred. Please try again.';
    } finally {
      isSaving = false;
    }
  }

  async function bootstrap() {
    if (session?.user) {
      showLogin = false;
      userEmail = session.user.email || '';
      userName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'there';
      hydrateFromRoadmap();

      // Background: if already completed, redirect
      try {
        const { profile } = await loadUnifiedProfile(supabase, session);
        if (profile?.onboarding_completed) goto('/plan');
      } catch {}
    } else {
      showLogin = true;
    }
  }

  $effect(() => {
    void bootstrap();
  });

  onMount(() => {
    hydrateFromRoadmap();
  });
</script>

<svelte:head>
  <title>Set up your account - Abroaducate</title>
</svelte:head>

{#if showLogin}
  <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white flex items-center justify-center px-6 py-16">
    <div class="w-full max-w-md">
      <div class="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-8 shadow-sm text-center">
        <h1 class="text-2xl font-bold text-slate-900">Sign in to continue</h1>
        <p class="mt-2 text-slate-600">Create a free account to save your roadmap and access your dashboard.</p>
        <button
          onclick={() => (showAuthModal = true)}
          class="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#2C3580] px-6 py-3 text-base font-semibold text-white hover:bg-[#3c4d9c] transition"
        >
          Sign in / Create account
        </button>
      </div>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white py-12 px-6">
    <div class="max-w-3xl mx-auto">
      <div class="mb-8 text-center">
        <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
          <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
          Step {step} of 2
        </div>
        <h1 class="mt-6 text-3xl md:text-4xl font-bold text-slate-900">Set up your account</h1>
        <p class="mt-2 text-slate-600">This takes less than a minute. We’ll use it to personalize your dashboard.</p>
      </div>

      {#if error}
        <div class="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      {/if}

      <div class="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-8 shadow-sm">
        {#if importedFromRoadmap && roadmapSummary}
          <div class="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-slate-900">Imported from your roadmap</div>
                <div class="mt-1 text-sm text-slate-600">
                  <span class="font-medium">Destinations:</span> {roadmapSummary.countries?.length ? roadmapSummary.countries.join(', ') : '—'}
                  {#if roadmapSummary.field}
                    <span class="mx-2 text-slate-300">•</span><span class="font-medium">Field:</span> {roadmapSummary.field}
                  {/if}
                </div>
              </div>
              <a href="/diagnostic" class="text-sm font-semibold text-indigo-700 hover:text-indigo-800">Edit</a>
            </div>
          </div>
        {/if}

        {#if step === 1}
          <div class="grid gap-8">
            <div>
              <h2 class="text-xl font-bold text-slate-900">Where do you want to study?</h2>
              <p class="mt-1 text-sm text-slate-600">Add at least one destination country.</p>

              <div class="mt-4">
                <label class="block text-sm font-semibold text-slate-700 mb-2">Destination countries *</label>
                <div class="relative">
                  <input
                    type="text"
                    bind:value={countrySearch}
                    placeholder="Type a country and press Enter…"
                    onkeydown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredCountries.length) selectCountry(filteredCountries[0]);
                      }
                    }}
                    class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C3580]/30"
                  />
                </div>

                {#if countrySearch.length > 0}
                  <div class="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                    {#each filteredCountries as c}
                      <button type="button" onclick={() => selectCountry(c)} class="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-b-0">
                        {c}
                      </button>
                    {/each}
                    {#if filteredCountries.length === 0}
                      <div class="px-4 py-3 text-sm text-slate-500">No matches. Try “Other”.</div>
                    {/if}
                  </div>
                {/if}

                <div class="mt-3 flex flex-wrap gap-2">
                  {#each ['United States','United Kingdom','Canada','Australia','Germany','Netherlands'] as c}
                    <button
                      type="button"
                      onclick={() => selectCountry(c)}
                      disabled={onboardingData.preferred_countries.includes(c)}
                      class="rounded-full border px-3 py-1 text-sm transition {
                        onboardingData.preferred_countries.includes(c)
                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }"
                    >
                      {c}
                    </button>
                  {/each}
                </div>

                {#if onboardingData.preferred_countries.length > 0}
                  <div class="mt-4">
                    <div class="text-sm font-semibold text-slate-700 mb-2">Selected</div>
                    <div class="flex flex-wrap gap-2">
                      {#each onboardingData.preferred_countries as c}
                        <span class="inline-flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 text-sm">
                          {c}
                          <button type="button" onclick={() => removeCountry(c)} class="rounded-full hover:bg-indigo-100 px-1">
                            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                          </button>
                        </span>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Phone (optional)</label>
              <input
                type="tel"
                bind:value={onboardingData.phone_number}
                placeholder="WhatsApp number for reminders"
                class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C3580]/30"
              />
              <p class="mt-2 text-xs text-slate-500">Optional. You can add this later in your profile.</p>
            </div>
          </div>

          <div class="mt-8 flex items-center justify-end">
            <button
              type="button"
              onclick={goNext}
              class="inline-flex items-center justify-center rounded-xl bg-[#2C3580] px-6 py-3 text-base font-semibold text-white hover:bg-[#3c4d9c] transition disabled:bg-slate-300"
              disabled={!canContinue()}
            >
              Continue
            </button>
          </div>
        {:else}
          <div class="grid gap-8">
            <div>
              <h2 class="text-xl font-bold text-slate-900">What are you planning to study?</h2>
              <p class="mt-1 text-sm text-slate-600">This helps us personalize recommendations and tools.</p>

              <div class="mt-4">
                <label class="block text-sm font-semibold text-slate-700 mb-2">Field of study *</label>
                <input
                  type="text"
                  bind:value={fieldSearch}
                  placeholder="Type a field and press Enter…"
                  onkeydown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filteredFields.length) selectField(filteredFields[0]);
                    }
                  }}
                  class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C3580]/30"
                />

                {#if fieldSearch.length > 0}
                  <div class="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                    {#each filteredFields as f}
                      <button type="button" onclick={() => selectField(f)} class="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-b-0">
                        {f}
                      </button>
                    {/each}
                    {#if filteredFields.length === 0}
                      <div class="px-4 py-3 text-sm text-slate-500">No matches. Try “Other”.</div>
                    {/if}
                  </div>
                {/if}

                {#if onboardingData.field_of_study}
                  <div class="mt-3">
                    <span class="inline-flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 text-sm">
                      {onboardingData.field_of_study}
                      <button type="button" onclick={() => (onboardingData.field_of_study = '')} class="rounded-full hover:bg-indigo-100 px-1">
                        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                      </button>
                    </span>
                  </div>
                {/if}
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Degree level *</label>
              <div class="grid grid-cols-2 gap-3">
                {#each [
                  { value: 'undergraduate', label: 'Undergraduate' },
                  { value: 'masters', label: 'Masters' },
                  { value: 'phd', label: 'PhD' },
                  { value: 'graduate', label: 'Graduate' }
                ] as level}
                  <button
                    type="button"
                    onclick={() => (onboardingData.degree_level = level.value as OnboardingData['degree_level'])}
                    class="rounded-xl border px-4 py-3 text-sm font-semibold transition {
                      onboardingData.degree_level === level.value
                        ? 'border-[#2C3580] bg-indigo-50 text-slate-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }"
                  >
                    {level.label}
                  </button>
                {/each}
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Preferred intake (optional)</label>
                <select bind:value={onboardingData.target_intake} class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C3580]/30">
                  <option value="">Select</option>
                  {#each availableIntakes as intake}
                    <option value={intake}>{intake}</option>
                  {/each}
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Budget (optional)</label>
                <select bind:value={onboardingData.budget_range} class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C3580]/30">
                  <option value="">Select</option>
                  {#each budgetRanges as b}
                    <option value={b.value}>{b.label}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <div class="text-sm font-semibold text-slate-900 mb-3">After setup, take me to</div>
              <div class="grid gap-3">
                {#each [
                  { id: 'dashboard', label: 'Dashboard', description: 'See your saved roadmap and tools in one place' },
                  { id: 'find_universities', label: 'University matcher', description: 'Find universities that match your profile', badge: 'Premium' },
                  { id: 'explore_scholarships', label: 'Scholarships', description: 'Browse scholarships and funding opportunities' },
                  { id: 'generate_sop', label: 'SOP tool', description: 'Create an SOP draft with AI assistance' }
                ] as opt}
                  <button
                    type="button"
                    onclick={() => (nextAction = opt.id as NextAction)}
                    class="w-full rounded-xl border p-4 text-left transition hover:border-slate-300 {
                      nextAction === opt.id ? 'border-[#2C3580] bg-indigo-50' : 'border-slate-200 bg-white'
                    }"
                  >
                    <div class="flex items-start gap-3">
                      <div class="mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center {
                        nextAction === opt.id ? 'border-[#2C3580] bg-[#2C3580]' : 'border-slate-300'
                      }">
                        {#if nextAction === opt.id}
                          <div class="h-2 w-2 rounded-full bg-white"></div>
                        {/if}
                      </div>
                      <div class="flex-1">
                        <div class="flex items-center gap-2">
                          <div class="font-semibold text-slate-900">{opt.label}</div>
                          {#if opt.badge}
                            <span class="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800">{opt.badge}</span>
                          {/if}
                        </div>
                        <div class="text-sm text-slate-600">{opt.description}</div>
                      </div>
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          </div>

          <div class="mt-8 flex items-center justify-between">
            <button type="button" onclick={() => (step = 1)} class="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              Back
            </button>
            <button
              type="button"
              onclick={saveAndContinue}
              disabled={isSaving || !canContinue()}
              class="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-700 transition disabled:bg-slate-300"
            >
              {#if isSaving}
                <span class="inline-flex items-center gap-2">
                  <span class="animate-spin h-4 w-4 rounded-full border-2 border-white border-t-transparent"></span>
                  Saving…
                </span>
              {:else}
                Complete setup
              {/if}
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<AuthenticationFlow
  bind:show={showAuthModal}
  {supabase}
  mode="login"
  returnUrl="/onboarding"
  on:success={() => {
    showAuthModal = false;
  }}
/>
