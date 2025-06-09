<script lang="ts">
  import { onMount } from 'svelte';
  
  let { data } = $props();
  let { supabase, session } = $derived(data);

  let scholarships = $state([]);
  let interactions = $state([]);
  let isLoading = $state(true);
  let error = $state('');

  onMount(async () => {
    if (!session?.user?.id) {
      error = 'Not logged in';
      isLoading = false;
      return;
    }
    
    await loadData();
  });

  async function loadData() {
    try {
      // First, load all scholarships
      const { data: scholarshipData, error: scholarshipError } = await supabase
        .from('scholarships')
        .select('*')
        .eq('is_active', true)
        .limit(5);

      if (scholarshipError) {
        console.error('Scholarship error:', scholarshipError);
        error = `Scholarship error: ${scholarshipError.message}`;
        return;
      }

      scholarships = scholarshipData || [];

      // Then, load user interactions
      const { data: interactionData, error: interactionError } = await supabase
        .from('user_scholarship_interactions')
        .select('*')
        .eq('user_id', session.user.id);

      if (interactionError) {
        console.error('Interaction error:', interactionError);
        error = `Interaction error: ${interactionError.message}`;
        return;
      }

      interactions = interactionData || [];
      
    } catch (err) {
      console.error('General error:', err);
      error = `General error: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function saveScholarship(scholarshipId) {
    try {
      const { error } = await supabase
        .from('user_scholarship_interactions')
        .upsert({
          user_id: session.user.id,
          scholarship_id: scholarshipId,
          is_saved: true
        });

      if (error) {
        console.error('Save error:', error);
        alert(`Save error: ${error.message}`);
      } else {
        await loadData();
        alert('Scholarship saved!');
      }
    } catch (err) {
      console.error('Save general error:', err);
      alert(`Save error: ${err.message}`);
    }
  }
</script>

<svelte:head>
  <title>Scholarship Test - Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-20">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Scholarship Database Test</h1>

    {#if isLoading}
      <div class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading...</p>
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-red-900 mb-2">Error</h3>
        <p class="text-red-700">{error}</p>
        <button onclick={loadData} class="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
          Try Again
        </button>
      </div>
    {:else}
      <!-- User Info -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">User Info</h2>
        <p><strong>User ID:</strong> {session?.user?.id}</p>
        <p><strong>Email:</strong> {session?.user?.email}</p>
      </div>

      <!-- Scholarships -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Available Scholarships ({scholarships.length})</h2>
        {#if scholarships.length === 0}
          <p class="text-gray-600">No scholarships found</p>
        {:else}
          <div class="space-y-4">
            {#each scholarships as scholarship}
              <div class="border border-gray-200 rounded-lg p-4">
                <h3 class="font-semibold text-gray-900">{scholarship.title}</h3>
                <p class="text-gray-600">{scholarship.provider} • {scholarship.amount}</p>
                <p class="text-sm text-gray-500">Deadline: {scholarship.deadline}</p>
                <button 
                  onclick={() => saveScholarship(scholarship.id)}
                  class="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Save This Scholarship
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- User Interactions -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Your Interactions ({interactions.length})</h2>
        {#if interactions.length === 0}
          <p class="text-gray-600">No interactions yet. Save some scholarships above!</p>
        {:else}
          <div class="space-y-4">
            {#each interactions as interaction}
              <div class="border border-gray-200 rounded-lg p-4">
                <p><strong>Scholarship ID:</strong> {interaction.scholarship_id}</p>
                <p><strong>Saved:</strong> {interaction.is_saved ? 'Yes' : 'No'}</p>
                <p><strong>Applied:</strong> {interaction.is_applied ? 'Yes' : 'No'}</p>
                {#if interaction.applied_at}
                  <p><strong>Applied At:</strong> {interaction.applied_at}</p>
                {/if}
                <p class="text-xs text-gray-500">Created: {interaction.created_at}</p>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Navigation -->
      <div class="mt-8 text-center">
        <a href="/scholarships" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition mr-4">
          Browse Scholarships
        </a>
        <a href="/scholarships/my-applications" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
          Back to My Applications
        </a>
      </div>
    {/if}
  </div>
</div> 