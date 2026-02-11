<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { QuickProfile } from '$lib/services/quickProfile';
  import { saveQuickProfile } from '$lib/services/quickProfile';
  import { analytics } from '$lib/utils/posthog';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type AnyWindow = Window & { posthog?: any };
  function capture(event: string, props?: Record<string, any>) {
    try { (window as unknown as AnyWindow).posthog && (window as unknown as AnyWindow).posthog!.capture(event, props); } catch {}
  }

  export let isOpen: boolean = false;
  export let supabase: any;
  export let session: any;

  const dispatch = createEventDispatcher();

  let form: QuickProfile = {
    degree_level: 'masters',
    field_of_study: '',
    preferred_countries: [],
    gpa_range: '3.0-3.5',
    scholarship_priority: 'high'
  };

  const countryOptions = ['United States','United Kingdom','Canada','Australia','Germany','France','Italy','Japan','Netherlands'];

  function toggleCountry(country: string) {
    if (form.preferred_countries.includes(country)) {
      form.preferred_countries = form.preferred_countries.filter(c => c !== country);
    } else if (form.preferred_countries.length < 3) {
      form.preferred_countries = [...form.preferred_countries, country];
    }
  }

  async function submit() {
    if (!form.field_of_study) return;
    const where = await saveQuickProfile(supabase, session, form);
    try { analytics.trackEvent('quick_profile_completed', { source: 'modal', storage: where }); } catch {}
    dispatch('completed', { profile: form, source: where });
    isOpen = false;
  }

  function close() {
    isOpen = false;
    try { analytics.trackEvent('quick_profile_closed', { source: 'modal' }); } catch {}
    dispatch('cancel');
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] px-4"
    role="dialog"
    aria-modal="true"
    aria-label="Quick profile"
    tabindex="-1"
    on:keydown={onKeydown}
  >
    <div class="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white/90 shadow-xl">
      <!-- Header -->
      <div class="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
            60-second setup
          </div>
          <h3 class="mt-3 text-xl font-bold text-slate-900">Quick Profile</h3>
          <p class="mt-1 text-sm text-slate-600">
            We’ll use this to personalize your Plan. You can change it anytime.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
          aria-label="Close quick profile"
          on:click={close}
        >
          ✕
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Degree -->
          <div class="md:col-span-2">
            <div class="text-sm font-semibold text-slate-800 mb-2">Degree level</div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              {#each [
                { value: 'undergraduate', label: "Bachelor's" },
                { value: 'masters', label: 'Masters' },
                { value: 'phd', label: 'PhD' },
                { value: 'graduate', label: 'Graduate' }
              ] as opt}
                <button
                  type="button"
                  class="rounded-xl border px-3 py-3 text-sm font-semibold transition text-center
                    {form.degree_level === opt.value
                      ? 'border-[#2C3580] bg-indigo-50 text-[#2C3580]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}"
                  on:click={() => (form.degree_level = opt.value as QuickProfile['degree_level'])}
                >
                  {opt.label}
                </button>
              {/each}
            </div>
          </div>

          <!-- Field -->
          <div class="md:col-span-2">
            <label for="qp-field" class="block text-sm font-semibold text-slate-800 mb-2">Field of study</label>
            <input
              id="qp-field"
              bind:value={form.field_of_study}
              placeholder="e.g., Computer Science, Public Health, Business"
              class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C3580]/30"
            />
            <p class="mt-2 text-xs text-slate-500">This helps us rank scholarships and universities more accurately.</p>
          </div>

          <!-- Countries -->
          <div class="md:col-span-2">
            <div class="flex items-center justify-between gap-3 mb-2">
              <div class="text-sm font-semibold text-slate-800">Preferred countries</div>
              <div class="text-xs text-slate-500">{form.preferred_countries.length}/3 selected</div>
            </div>
            <div class="flex flex-wrap gap-2">
              {#each countryOptions as c}
                <button
                  type="button"
                  class="rounded-full border px-3 py-2 text-sm font-semibold transition
                    {form.preferred_countries.includes(c)
                      ? 'border-[#2C3580] bg-indigo-50 text-[#2C3580]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}"
                  on:click={() => toggleCountry(c)}
                >
                  {c}
                </button>
              {/each}
            </div>
            <p class="mt-2 text-xs text-slate-500">Optional, but recommended for better matching.</p>
          </div>

          <!-- GPA -->
          <div>
            <label for="qp-gpa" class="block text-sm font-semibold text-slate-800 mb-2">GPA range (4.0 scale)</label>
            <select
              id="qp-gpa"
              bind:value={form.gpa_range}
              class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C3580]/30"
            >
              <option value="<2.5">Below 2.5</option>
              <option value="2.5-3.0">2.5–3.0</option>
              <option value="3.0-3.5">3.0–3.5</option>
              <option value="3.5-4.0">3.5–4.0</option>
            </select>
          </div>

          <!-- Priority -->
          <div>
            <label for="qp-priority" class="block text-sm font-semibold text-slate-800 mb-2">Scholarship priority</label>
            <select
              id="qp-priority"
              bind:value={form.scholarship_priority}
              class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C3580]/30"
            >
              <option value="essential">Essential</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-5 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div class="text-xs text-slate-500">
          Tip: You can update this later from your account settings.
        </div>
        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            class="px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold hover:bg-slate-50 transition"
            on:click={close}
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-5 py-3 rounded-xl bg-[#2C3580] text-white font-semibold hover:bg-[#3c4d9c] transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!form.field_of_study}
            on:click={submit}
          >
            Save profile
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
