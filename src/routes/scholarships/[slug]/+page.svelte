<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';
  import { formatCurrencyAmount, formatScholarshipText } from '$lib/utils/htmlEntities';
  import AdSenseAd from '$lib/components/AdSenseAd.svelte';
  
  let { data } = $props();
  let { session, scholarship, supabase } = $derived(data);
  // Compute saved status from SSR data when present
  let isSaved = $state<boolean>(Boolean((data as any).savedStatus));
  // Related scholarships provided by SSR when available
  let relatedScholarships = $state<any[]>((data as any).relatedScholarships || []);
  
  let isLoading = $state(false); // Data is loaded on the server
  let error = $state('');
  let isApplied = $state(false);
  
  // Get the scholarship ID from the URL parameter
  // Data is loaded on the server via +page.server.ts; avoid overriding it here to prevent double-fetch/mismatch
  onMount(() => {
    // no-op; leave SSR-loaded scholarship intact
  });
  
  async function loadScholarship(id: string) {
    // Keep for potential refresh actions; prefer decoded view when fetching directly
    try {
      isLoading = true;
      error = '';
      const { data: scholarshipData, error: scholarshipError } = await supabase
        .from('public_scholarships_decoded')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (scholarshipError) {
        error = 'Failed to load scholarship details.';
        isLoading = false;
        return;
      }
      if (!scholarshipData) {
        error = `Scholarship with ID ${id} was not found.`;
        isLoading = false;
        return;
      }
      scholarship = scholarshipData as any;
      if (scholarship.field && scholarship.level) {
        loadRelatedScholarships(scholarship.field, scholarship.level);
      }
      if (session && session.user && session.user.id) {
        const { data: interactionData } = await supabase
          .from('user_scholarship_interactions')
          .select('is_saved')
          .eq('user_id', session.user.id)
          .eq('scholarship_id', id)
          .maybeSingle();
        isSaved = interactionData?.is_saved || false;
      }
      isLoading = false;
    } catch (err) {
      error = 'An unexpected error occurred while loading the scholarship.';
      isLoading = false;
    }
  }
  
  async function loadRelatedScholarships(field: string, level: string) {
    try {
      // Fetch related scholarships (same field and level)
      const { data: relatedData } = await supabase
        .from('scholarships')
        .select('*')
        .eq('is_active', true)
        .or(`field.eq.${field},field.eq.All Fields`)
        .eq('level', level)
        .limit(3);
        
      relatedScholarships = relatedData || [];
    } catch (err) {
      console.error('Error loading related scholarships:', err);
    }
  }
  
  async function toggleSaved() {
    if (!session?.user?.id) {
      // Instead of alert, show login modal and store intended scholarship
      pendingSaveScholarshipId = scholarship.id;
      authMode = 'login';
      showAuthModal = true;
      return;
    }
    
    try {
      console.log(`Toggling saved state for scholarship ${scholarship.id}, current state: ${isSaved}`);
      
      // Check if interaction exists
      const { data: existing, error: fetchError } = await supabase
        .from('user_scholarship_interactions')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('scholarship_id', scholarship.id)
        .single();
      
      // Handle fetch error differently from "not found"
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking interaction:', fetchError);
        throw fetchError;
      }
      
      let result;
      if (existing) {
        // Update existing interaction
        result = await supabase
          .from('user_scholarship_interactions')
          .update({ is_saved: !isSaved })
          .eq('id', existing.id);
      } else {
        // Create new interaction
        result = await supabase
          .from('user_scholarship_interactions')
          .insert({
            user_id: session.user.id,
            scholarship_id: scholarship.id,
            is_saved: true,
            is_applied: false
          });
      }
      
      if (result.error) {
        console.error('Error updating interaction:', result.error);
        throw result.error;
      }
      
      // Update local state
      isSaved = !isSaved;
      console.log('Scholarship saved state updated successfully:', isSaved);
      
    } catch (err) {
      console.error('Error saving scholarship:', err);
      alert('Failed to update. Please try again.');
    }
  }
  
  async function toggleApplied() {
    if (!session?.user?.id) {
      alert('Please log in to track applications');
      return;
    }
    
    try {
      // Check if interaction exists
      const { data: existing } = await supabase
        .from('user_scholarship_interactions')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('scholarship_id', scholarship.id)
        .single();
      
      if (existing) {
        // Update existing interaction
        await supabase
          .from('user_scholarship_interactions')
          .update({ 
            is_applied: !isApplied,
            is_saved: true // Always save when applied
          })
          .eq('id', existing.id);
      } else {
        // Create new interaction
        await supabase
          .from('user_scholarship_interactions')
          .insert({
            user_id: session.user.id,
            scholarship_id: scholarship.id,
            is_saved: true,
            is_applied: true
          });
      }
      
      // Update local state
      isApplied = !isApplied;
      if (isApplied) isSaved = true;
      
      // If applying, open the website in a new tab if available
      if (isApplied && scholarship.website) {
        window.open(scholarship.website, '_blank');
      }
      
    } catch (err) {
      console.error('Error updating application status:', err);
      alert('Failed to update. Please try again.');
    }
  }
  
  function formatDeadline(deadline: string) {
    try {
      const date = new Date(deadline);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return deadline; // Return as-is if parsing fails
    }
  }
  
  function getDeadlineStatus(deadline: string) {
    try {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return { text: 'Expired', class: 'bg-red-100 text-red-800' };
      if (diffDays <= 7) return { text: `${diffDays} day${diffDays === 1 ? '' : 's'} left`, class: 'bg-red-100 text-red-800' };
      if (diffDays <= 30) return { text: `${diffDays} days left`, class: 'bg-yellow-100 text-yellow-800' };
      return { text: `${diffDays} days left`, class: 'bg-green-100 text-green-800' };
    } catch (e) {
      return { text: 'Unknown', class: 'bg-gray-100 text-gray-800' };
    }
  }

  let showAuthModal = $state(false);
  let pendingSaveScholarshipId = $state<string | null>(null);
  let authMode = $state<'login' | 'signup'>('login');
  let pendingApplicationsRedirect = $state(false);

  function handleApplicationTracker() {
    if (session) {
      goto('/applications');
    } else {
      pendingApplicationsRedirect = true;
      authMode = 'login';
      showAuthModal = true;
    }
  }

  function handleAuthSuccess() {
    if (pendingSaveScholarshipId) {
      saveScholarshipAfterLogin(pendingSaveScholarshipId);
      pendingSaveScholarshipId = null;
    } else if (pendingApplicationsRedirect) {
      pendingApplicationsRedirect = false;
      goto('/applications');
    }
  }

  async function saveScholarshipAfterLogin(scholarshipId: string) {
    // Save the scholarship for the now-logged-in user
    try {
      // Check if interaction exists
      if (!session || !session.user || !session.user.id) {
        throw new Error('Not authenticated');
      }
      const { data: existing, error: fetchError } = await supabase
        .from('user_scholarship_interactions')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('scholarship_id', scholarshipId)
        .single();
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      let result;
      if (existing) {
        result = await supabase
          .from('user_scholarship_interactions')
          .update({ is_saved: true })
          .eq('id', existing.id);
      } else {
        result = await supabase
          .from('user_scholarship_interactions')
          .insert({
            user_id: session.user.id,
            scholarship_id: scholarshipId,
            is_saved: true,
            is_applied: false
          });
      }
      if (result.error) {
        throw result.error;
      }
      // Redirect to saved scholarships page
      goto('/scholarships/my-applications');
    } catch (err) {
      alert('Failed to save scholarship after login. Please try again.');
    }
  }
</script>

<svelte:head>
  <title>{scholarship.title} - Scholarship Details</title>
  <meta name="description" content="{scholarship.description}" />
</svelte:head>

<div class="min-h-screen bg-gray-50 pt-16 pb-10">
  {#if error}
    <div class="max-w-3xl mx-auto px-4 pt-16">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h2 class="text-red-800 text-xl font-semibold mb-2">Error Loading Scholarship</h2>
        <p class="text-red-700 mb-4">{error}</p>
        
        <div class="text-left mb-4 bg-red-100 p-4 rounded overflow-auto">
          <p class="text-red-700 font-medium">Debug Information:</p>
          <p class="text-red-600 text-sm mb-1">Scholarship ID: {$page.params.slug}</p>
          <p class="text-red-600 text-sm mb-1">User authenticated: {session ? 'Yes' : 'No'}</p>
          <p class="text-red-600 text-sm mb-1">Current timestamp: {new Date().toISOString()}</p>
        </div>
        
        <div class="flex justify-center gap-3">
          <button
            onclick={() => window.location.reload()}
            class="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700"
          >
            Try Again
          </button>
          
          <button
            onclick={() => goto('/scholarships')}
            class="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700"
          >
            Back to Scholarships
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="max-w-4xl mx-auto px-4 mt-8">
      <!-- Back Link -->
      <div class="mb-6">
        <a href="/scholarships" class="text-yellow-600 hover:text-yellow-800 font-medium inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
          Back to All Scholarships
        </a>
      </div>
      
      <!-- Scholarship Card -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border">
        <!-- Header -->
        <div class="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 text-white">
          <div class="flex justify-between items-start">
            <h1 class="text-2xl font-bold mb-2">{scholarship.title}</h1>
            
            <!-- Badge based on funding category -->
            {#if scholarship.funding_category === 'Graduate Program Funding'}
              <span class="bg-white text-yellow-600 px-3 py-1 rounded-full text-sm font-semibold">🎓 Program Funding</span>
            {:else if scholarship.funding_category === 'Advertised Position'}
              <span class="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-semibold">🔬 Research Position</span>
            {:else}
              <span class="bg-white text-yellow-600 px-3 py-1 rounded-full text-sm font-semibold">🏆 Scholarship</span>
            {/if}
          </div>
          <p class="text-lg opacity-90 mb-3">
            {scholarship.provider}
          </p>
          
          <div class="flex flex-wrap gap-2 mt-4">
            <span class="bg-yellow-700 bg-opacity-50 px-3 py-1 rounded-full text-sm">
              Amount: {formatCurrencyAmount(scholarship.amount)}
            </span>
            
            {#if scholarship.deadline}
              {@const deadlineStatus = getDeadlineStatus(scholarship.deadline)}
              <span class="bg-yellow-700 bg-opacity-50 px-3 py-1 rounded-full text-sm">
                Deadline: {formatDeadline(scholarship.deadline)}
                <span class="ml-2 text-white bg-opacity-60 px-2 py-0.5 rounded-full text-xs">
                  {deadlineStatus.text}
                </span>
              </span>
            {/if}
            
            <span class="bg-yellow-700 bg-opacity-50 px-3 py-1 rounded-full text-sm">
              {scholarship.location}
            </span>
          </div>
        </div>
        
        <!-- Content -->
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Left Column -->
            <div>
              <section class="mb-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-3">About This Scholarship</h2>
                <p class="text-gray-700 mb-4 whitespace-pre-line">{formatScholarshipText(scholarship.description)}</p>
                
                <div class="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span class="text-gray-500 block">Field of Study</span>
                    <span class="font-medium">{scholarship.field}</span>
                  </div>
                  <div>
                    <span class="text-gray-500 block">Degree Level</span>
                    <span class="font-medium">
                      {#if scholarship.levels && scholarship.levels.length > 1}
                        {scholarship.levels.join(', ')}
                      {:else}
                        {scholarship.level}
                      {/if}
                    </span>
                  </div>
                  <div>
                    <span class="text-gray-500 block">Type</span>
                    <span class="font-medium">{scholarship.type}</span>
                  </div>
                  {#if scholarship.funding_category === 'Graduate Program Funding' || scholarship.funding_category === 'Advertised Position'}
                    <div>
                      <span class="text-gray-500 block">Funding Type</span>
                      <span class="font-medium">{scholarship.funding_type || 'Not specified'}</span>
                    </div>
                  {/if}
                </div>
              </section>
              
              {#if scholarship.requirements && scholarship.requirements.length > 0}
                <section class="mb-6">
                  <h2 class="text-lg font-semibold text-gray-900 mb-3">Requirements</h2>
                  <ul class="list-disc list-inside text-gray-700 space-y-1">
                    {#each scholarship.requirements as requirement}
                      <li>{requirement}</li>
                    {/each}
                  </ul>
                </section>
              {/if}
            </div>
            
            <!-- Right Column -->
            <div>
              {#if scholarship.funding_category === 'Graduate Program Funding'}
                <section class="mb-6">
                  <h2 class="text-lg font-semibold text-gray-900 mb-3">Program Details</h2>
                  <div class="space-y-3 text-gray-700">
                    <div>
                      <span class="text-gray-500 block">University</span>
                      <span class="font-medium">{scholarship.university_name}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 block">Program</span>
                      <span class="font-medium">{scholarship.program_name}</span>
                    </div>
                    {#if scholarship.department}
                      <div>
                        <span class="text-gray-500 block">Department</span>
                        <span class="font-medium">{scholarship.department}</span>
                      </div>
                    {/if}
                    <div>
                      <span class="text-gray-500 block">Application Method</span>
                      <span class="font-medium">{scholarship.application_method || 'Direct Application'}</span>
                    </div>
                    {#if scholarship.has_automatic_funding}
                      <div class="bg-green-50 border border-green-100 rounded-lg p-3 mt-3">
                        <span class="font-medium text-green-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                            <path d="M20 6L9 17l-5-5"></path>
                          </svg>
                          Automatic Funding Consideration
                        </span>
                        <p class="text-sm text-green-600 mt-1">All applicants are automatically considered for funding.</p>
                      </div>
                    {/if}
                  </div>
                </section>
              {/if}
              
              {#if scholarship.funding_category === 'Advertised Position'}
                <section class="mb-6">
                  <h2 class="text-lg font-semibold text-gray-900 mb-3">Position Details</h2>
                  <div class="space-y-3 text-gray-700">
                    <div>
                      <span class="text-gray-500 block">University</span>
                      <span class="font-medium">{scholarship.university_name}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 block">Professor</span>
                      <span class="font-medium">{scholarship.professor_name}</span>
                    </div>
                    {#if scholarship.professor_email}
                      <div>
                        <span class="text-gray-500 block">Contact Email</span>
                        <a href="mailto:{scholarship.professor_email}" class="font-medium text-yellow-600 hover:underline">{scholarship.professor_email}</a>
                      </div>
                    {/if}
                    {#if scholarship.position_details}
                      <div class="mt-2">
                        <span class="text-gray-500 block mb-1">Position Description</span>
                        <p class="bg-gray-50 p-3 rounded-lg border border-gray-200">{scholarship.position_details}</p>
                      </div>
                    {/if}
                  </div>
                </section>
              {/if}
              
              {#if scholarship.min_gpa || scholarship.min_ielts || scholarship.min_toefl || scholarship.age_limit || (scholarship.nationality_restrictions && scholarship.nationality_restrictions.length > 0)}
                <section class="mb-6">
                  <h2 class="text-lg font-semibold text-gray-900 mb-3">Eligibility Criteria</h2>
                  <div class="space-y-2 text-gray-700">
                    {#if scholarship.min_gpa}
                      <div>
                        <span class="text-gray-500 block">Minimum GPA</span>
                        <span class="font-medium">{scholarship.min_gpa}</span>
                      </div>
                    {/if}
                    {#if scholarship.min_ielts}
                      <div>
                        <span class="text-gray-500 block">Minimum IELTS</span>
                        <span class="font-medium">{scholarship.min_ielts}</span>
                      </div>
                    {/if}
                    {#if scholarship.min_toefl}
                      <div>
                        <span class="text-gray-500 block">Minimum TOEFL</span>
                        <span class="font-medium">{scholarship.min_toefl}</span>
                      </div>
                    {/if}
                    {#if scholarship.age_limit}
                      <div>
                        <span class="text-gray-500 block">Age Limit</span>
                        <span class="font-medium">{scholarship.age_limit} years</span>
                      </div>
                    {/if}
                    {#if scholarship.nationality_restrictions && scholarship.nationality_restrictions.length > 0}
                      <div>
                        <span class="text-gray-500 block">Nationality Restrictions</span>
                        <span class="font-medium">{scholarship.nationality_restrictions.join(', ')}</span>
                      </div>
                    {/if}
                  </div>
                </section>
              {/if}
              
              {#if scholarship.website}
                <section class="mb-6">
                  <h2 class="text-lg font-semibold text-gray-900 mb-3">Application</h2>
                  <a href={scholarship.website} target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Apply on Official Website
                  </a>
                  <p class="text-sm text-gray-600">
                    Visit the official scholarship website for complete application instructions and to submit your application.
                  </p>
                </section>
              {/if}
              
              <div class="flex flex-col gap-3">
                <div class="flex justify-between items-center">
                  <span class="font-medium text-gray-700">Save this scholarship to your list</span>
                  <button
                    onclick={toggleSaved}
                    class={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition duration-200 ${
                      isSaved 
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {isSaved ? 'Saved to Your List' : 'Save to Your List'}
                  </button>
                </div>
                
                <div class="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p class="text-sm text-gray-700 mb-3 font-medium">💾 <strong>Quick Save:</strong> Click 'Save' to add this scholarship to your <a href="/scholarships/my-applications" class="text-blue-600 hover:text-blue-700 underline">Saved Scholarships</a> list for easy access later.</p>
                  <p class="text-sm text-gray-600 mb-2">📊 <strong>Full Tracking:</strong> Use our <button
  class="text-blue-600 hover:text-blue-700 underline font-medium bg-transparent border-none p-0 cursor-pointer"
  onclick={handleApplicationTracker}
>
  Application Tracker →
</button> to manually track ALL your applications (including from other platforms) with deadlines, documents, and status updates.</p>
                </div>
                
                <div class="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-lg text-center">
                  <p class="text-sm text-gray-600 mb-2">Looking for other opportunities?</p>
                  <a href="/scholarships" class="text-yellow-600 hover:text-yellow-700 font-medium">Explore More Scholarships →</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Ad before Related Scholarships -->
      <AdSenseAd adSlot="6646272505" className="my-8" />

      <!-- Related Scholarships -->
      {#if relatedScholarships && relatedScholarships.length > 0}
        <div class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Related Scholarships</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            {#each relatedScholarships as related}
              <div class="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                <h3 class="font-semibold text-gray-900 mb-1">
                  <a href={`/scholarships/${related.id}`} class="hover:text-yellow-600">{related.title}</a>
                </h3>
                <p class="text-sm text-gray-600 mb-2">{related.provider}</p>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-yellow-600">{related.amount}</span>
                  <span class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{related.level}</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- Call to Action Section -->
      <div class="mt-12 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-8 text-center text-white">
        <h3 class="text-2xl font-bold mb-4">Need Help with Your Applications?</h3>
        <p class="text-yellow-100 mb-6">
          Use our AI-powered tools to create compelling scholarship essays and application documents.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/sop" class="bg-white text-yellow-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition duration-200">
            📝 Generate Statement of Purpose
          </a>
          <a href="/cover-letters" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-yellow-600 transition duration-200">
            ✉️ Create Cover Letter
          </a>
          <a href="/dashboard" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-yellow-600 transition duration-200">
            📊 View Dashboard
          </a>
        </div>
      </div>
    </div>
  {/if}
  <AuthenticationFlow 
    bind:show={showAuthModal} 
    {supabase} 
    mode={authMode} 
    returnUrl={$page.url.pathname}
    on:success={handleAuthSuccess}
  />
</div> 