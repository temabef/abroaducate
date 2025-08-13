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
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div class="bg-white w-full max-w-lg rounded-xl shadow-lg p-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold">Quick Profile</h3>
        <button class="text-gray-500 hover:text-gray-700" on:click={close}>✕</button>
      </div>
      <p class="text-sm text-gray-600 mb-4">60 seconds to personalize results. You can change these later.</p>

      <div class="space-y-3">
        <div>
          <label for="qp-degree" class="block text-sm font-medium mb-1">Degree level</label>
          <select id="qp-degree" bind:value={form.degree_level} class="w-full border rounded px-3 py-2">
            <option value="undergraduate">Undergraduate/Bachelor's</option>
            <option value="masters">Master's/Graduate</option>
            <option value="phd">PhD/Doctoral</option>
            <option value="graduate">Graduate (general)</option>
          </select>
        </div>

        <div>
          <label for="qp-field" class="block text-sm font-medium mb-1">Field of study</label>
          <input id="qp-field" bind:value={form.field_of_study} placeholder="e.g., Computer Science" class="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <p class="block text-sm font-medium mb-1">Preferred countries (up to 3)</p>
          <div class="grid grid-cols-3 gap-2">
            {#each countryOptions as c}
              <button type="button" class="text-sm px-2 py-1 rounded border {form.preferred_countries.includes(c) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}" on:click={() => toggleCountry(c)}>{c}</button>
            {/each}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="qp-gpa" class="block text-sm font-medium mb-1">GPA range (4.0 scale)</label>
            <select id="qp-gpa" bind:value={form.gpa_range} class="w-full border rounded px-3 py-2">
              <option value="<2.5">Below 2.5</option>
              <option value="2.5-3.0">2.5–3.0</option>
              <option value="3.0-3.5">3.0–3.5</option>
              <option value="3.5-4.0">3.5–4.0</option>
            </select>
          </div>
          <div>
            <label for="qp-priority" class="block text-sm font-medium mb-1">Scholarship priority</label>
            <select id="qp-priority" bind:value={form.scholarship_priority} class="w-full border rounded px-3 py-2">
              <option value="essential">Essential</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <div class="mt-5 flex items-center justify-end gap-3">
        <button class="px-4 py-2 rounded border" on:click={close}>Cancel</button>
        <button class="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={!form.field_of_study} on:click={submit}>Save</button>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.bg-black\/40){ backdrop-filter: blur(1px); }
  .border { border: 1px solid #e5e7eb; }
</style>

