<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import { 
    loadUnifiedProfile, 
    completeOnboarding, 
    getPersonalizedRecommendations,
    type OnboardingData 
  } from '$lib/services/unifiedProfile';
  import { GPAConverterService } from '$lib/services/GPAConverterService';
  import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';
  
  let { data }: { data: PageData } = $props();
  let { supabase, session } = data;
  
  // Authentication state
  let showLogin = $state(false);
  let showAuthModal = $state(false);
  
  // Onboarding state
  let currentStep = $state(1);
  let isLoading = $state(true);
  let error = $state('');
  let isSubmitting = $state(false);
  
  // Form data for all steps
  let onboardingData: OnboardingData = $state({
    // Step 1: Target & Timeline
    preferred_countries: [],
    target_intake: '',
    
    // Step 2: Academic Performance  
    current_gpa_value: undefined,
    current_gpa_scale: '',
    gpa_range: '3.0-3.5',
    
    // Step 3: Focus & Budget
    field_of_study: '',
    degree_level: 'masters',
    budget_range: '', // Start empty to make it truly optional
    scholarship_priority: 'high'
  });
  
  // Step 2 GPA conversion results
  let gpaConversionResult = $state<{
    standardized_gpa: number;
    eligibility_percent: number;
    message: string;
  } | null>(null);
  
  // Discovery moment results
  let discoveryResults = $state<{
    scholarships_estimate: number;
    universities_estimate: number;
    eligibility_message: string;
    next_actions: string[];
  } | null>(null);
  
  // Selected features for activation
  let selectedFeatures = $state<string[]>([]);

  // Search functionality
  let countrySearch = $state('');
  let fieldSearch = $state('');

  // Define the lists early so they can be used in reactive statements
  const availableCountries = [
    // Top destinations with extensive university data
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    
    // European destinations
    'Netherlands', 'France', 'Italy', 'Spain', 'Switzerland', 'Austria',
    'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Belgium',
    'Poland', 'Czech Republic', 'Portugal', 'Hungary',
    
    // Asia-Pacific
    'Japan', 'Singapore', 'South Korea', 'New Zealand', 'Hong Kong',
    'Malaysia', 'China', 'India', 'Thailand',
    
    // Others
    'United Arab Emirates', 'Turkey', 'Israel', 'South Africa', 'Other'
  ];

  const fieldsOfStudy = [
    // Technology & Computer Science
    'Computer Science', 'Software Engineering', 'Data Science', 'Artificial Intelligence',
    'Cybersecurity', 'Information Technology', 'Computer Engineering',
    
    // Engineering
    'Engineering (General)', 'Electrical Engineering', 'Mechanical Engineering', 
    'Civil Engineering', 'Bioengineering/Biomedical Engineering', 'Chemical Engineering',
    'Aerospace Engineering', 'Industrial Engineering', 'Environmental Engineering',
    
    // Business & Finance
    'Business Administration', 'MBA', 'Finance', 'Marketing', 'Economics',
    'Entrepreneurship', 'International Business', 'Supply Chain Management',
    'Accounting', 'Management Information Systems',
    
    // Health & Life Sciences
    'Medicine', 'Pre-Medical Studies', 'Nursing', 'Public Health', 'Pharmacy',
    'Dentistry', 'Veterinary Medicine', 'Biology', 'Biochemistry', 'Biotechnology',
    'Neuroscience', 'Psychology', 'Biostatistics',
    
    // Physical Sciences & Mathematics
    'Physics', 'Chemistry', 'Mathematics', 'Statistics', 'Applied Mathematics',
    'Astronomy/Astrophysics', 'Materials Science', 'Environmental Science',
    
    // Social Sciences & Humanities
    'Law', 'Political Science', 'International Relations', 'Sociology',
    'Anthropology', 'Philosophy', 'History', 'English Literature',
    'Communications', 'Journalism', 'Linguistics',
    
    // Arts & Design
    'Architecture', 'Fine Arts', 'Graphic Design', 'Industrial Design',
    'Film Studies', 'Music', 'Theatre Arts', 'Digital Media',
    
    // Education & Social Work
    'Education', 'Educational Leadership', 'Social Work', 'Human Services',
    'Counseling Psychology', 'Special Education',
    
    // Other Popular Fields
    'Agriculture', 'Sports Science', 'Hospitality Management', 'Aviation',
    'Library Science', 'Urban Planning', 'Criminal Justice', 'Other'
  ];

  // Reactive session handling (following platform pattern)
  $effect(() => {
    if (session?.user) {
      showLogin = false;
      handleAuthenticatedUser();
    } else {
      showLogin = true;
      isLoading = false;
    }
  });
  
  async function handleAuthenticatedUser() {
    try {
      // Check if onboarding already completed
      const { profile } = await loadUnifiedProfile(supabase, session);
      if (profile?.onboarding_completed) {
        goto('/dashboard');
        return;
      }
      
      // Handle focus parameter from URL to jump to specific sections
      const focusParam = $page.url.searchParams.get('focus');
      if (focusParam) {
        switch(focusParam) {
          case 'gpa':
            // Jump to Step 2 where GPA conversion happens
            currentStep = 2;
            console.log('Focusing on GPA - jumping to step 2');
            break;
          case 'countries':
            // Jump to Step 1 where countries are selected
            currentStep = 1;
            console.log('Focusing on countries - staying on step 1');
            break;
          case 'field':
            // Jump to Step 1 where field of study is selected  
            currentStep = 1;
            console.log('Focusing on field - staying on step 1');
            break;
          case 'intake':
            // Jump to Step 1 where target intake is selected
            currentStep = 1;
            console.log('Focusing on intake - staying on step 1');
            break;
          default:
            console.log('Unknown focus parameter:', focusParam);
            break;
        }
      }
      
      isLoading = false;
    } catch (err) {
      console.error('Error checking onboarding status:', err);
      isLoading = false;
    }
  }
  
  onMount(async () => {
    // Initial load will be handled by reactive statement
  });

  // =====================================================
  // STEP NAVIGATION
  // =====================================================
  
  function nextStep() {
    if (currentStep < 3) {
      currentStep += 1;
      
      // Auto-convert GPA when entering step 2
      if (currentStep === 2 && onboardingData.current_gpa_value && onboardingData.current_gpa_scale) {
        convertGPA();
      }
    } else {
      showDiscoveryMoment();
    }
  }
  
  function prevStep() {
    if (currentStep > 1) {
      currentStep -= 1;
    }
  }
  
  function canContinue(): boolean {
    switch (currentStep) {
      case 1:
        return onboardingData.preferred_countries.length > 0;
      case 2:
        return onboardingData.gpa_range !== null && onboardingData.gpa_range !== undefined;
      case 3:
        return onboardingData.field_of_study !== '' && onboardingData.degree_level !== null;
      default:
        return false;
    }
  }

  // =====================================================
  // STEP 1: TARGET & TIMELINE
  // =====================================================
  
  const availableIntakes = [
    'Fall 2025', 'Spring 2025', 'Summer 2025',
    'Fall 2026', 'Spring 2026', 'Summer 2026'
  ];
  
  // Country selection functions
  function selectCountry(country: string) {
    if (!onboardingData.preferred_countries.includes(country)) {
      onboardingData.preferred_countries = [...onboardingData.preferred_countries, country];
    }
    countrySearch = ''; // Clear search after selection
  }
  
  function removeCountry(country: string) {
    onboardingData.preferred_countries = onboardingData.preferred_countries.filter(c => c !== country);
  }
  
  // Filter countries based on search
  let filteredCountries = $derived(
    availableCountries.filter(country => 
      country.toLowerCase().includes(countrySearch.toLowerCase()) && 
      !onboardingData.preferred_countries.includes(country)
    ).slice(0, 8) // Limit to 8 results
  );

  // Field search functions
  function selectField(field: string) {
    onboardingData.field_of_study = field;
    fieldSearch = ''; // Clear search after selection
  }
  
  // Get filtered fields based on search  
  let filteredFieldsList = $derived(
    fieldsOfStudy.filter(field => 
      field.toLowerCase().includes(fieldSearch.toLowerCase())
    ).slice(0, 10)
  );
  
  // =====================================================
  // STEP 2: GPA CONVERSION  
  // =====================================================
  
  const gpaScales = [
    { value: '4.0', label: '4.0 Scale (US)' },
    { value: '5.0', label: '5.0 Scale' },
    { value: '7.0', label: '7.0 Scale' },
    { value: '10.0', label: '10.0 Scale' },
    { value: '100', label: 'Percentage (0-100)' }
  ];
  
  async function convertGPA() {
    if (!onboardingData.current_gpa_value || !onboardingData.current_gpa_scale) return;
    
    try {
      // Use simplified conversion for onboarding (can integrate full GPAConverterService later)
      let standardized_gpa = onboardingData.current_gpa_value;
      
      if (onboardingData.current_gpa_scale === '5.0') {
        standardized_gpa = (onboardingData.current_gpa_value / 5.0) * 4.0;
      } else if (onboardingData.current_gpa_scale === '7.0') {
        standardized_gpa = (onboardingData.current_gpa_value / 7.0) * 4.0;
      } else if (onboardingData.current_gpa_scale === '10.0') {
        standardized_gpa = (onboardingData.current_gpa_value / 10.0) * 4.0;
      } else if (onboardingData.current_gpa_scale === '100') {
        // Percentage to 4.0 scale
        if (onboardingData.current_gpa_value >= 90) standardized_gpa = 4.0;
        else if (onboardingData.current_gpa_value >= 80) standardized_gpa = 3.5;
        else if (onboardingData.current_gpa_value >= 70) standardized_gpa = 3.0;
        else if (onboardingData.current_gpa_value >= 60) standardized_gpa = 2.5;
        else standardized_gpa = 2.0;
      }
      
      standardized_gpa = Math.round(standardized_gpa * 100) / 100;
      
      // Calculate eligibility percentage
      const eligibility_percent = Math.round((standardized_gpa / 4.0) * 85 + 15);
      
      // Update GPA range based on converted value
      if (standardized_gpa < 2.5) onboardingData.gpa_range = '<2.5';
      else if (standardized_gpa < 3.0) onboardingData.gpa_range = '2.5-3.0';
      else if (standardized_gpa < 3.5) onboardingData.gpa_range = '3.0-3.5';
      else onboardingData.gpa_range = '3.5-4.0';
      
      const countries_text = onboardingData.preferred_countries.length > 0 
        ? onboardingData.preferred_countries.join(' & ')
        : 'your target countries';
      
      gpaConversionResult = {
        standardized_gpa,
        eligibility_percent,
        message: `Your ${standardized_gpa}/4.0 GPA makes you eligible for ~${eligibility_percent}% of universities in ${countries_text}!`
      };
      
    } catch (err) {
      console.error('GPA conversion error:', err);
      error = 'Failed to convert GPA. Please try again.';
    }
  }
  
  // Auto-convert when GPA values change
  $effect(() => {
    if (onboardingData.current_gpa_value && onboardingData.current_gpa_scale) {
      convertGPA();
    }
  });

  // =====================================================
  // STEP 3: FOCUS & BUDGET
  // =====================================================
  
  const budgetRanges = [
    { value: '0-20k', label: '$0 - $20,000 per year' },
    { value: '20k-50k', label: '$20,000 - $50,000 per year' },
    { value: '50k-100k', label: '$50,000 - $100,000 per year' },
    { value: '100k+', label: '$100,000+ per year' },
    { value: 'skip', label: 'Skip for now (I\'ll decide later)' }
  ];


  // =====================================================
  // DISCOVERY MOMENT
  // =====================================================
  
  function showDiscoveryMoment() {
    // Create temporary profile for recommendations
    const tempProfile = {
      degree_level: onboardingData.degree_level,
      field_of_study: onboardingData.field_of_study,
      preferred_countries: onboardingData.preferred_countries,
      gpa_range: onboardingData.gpa_range,
      scholarship_priority: onboardingData.scholarship_priority,
      target_intake: onboardingData.target_intake,
      budget_range: onboardingData.budget_range,
      current_gpa_value: onboardingData.current_gpa_value,
      current_gpa_scale: onboardingData.current_gpa_scale,
      standardized_gpa_4_scale: gpaConversionResult?.standardized_gpa
    };
    
    discoveryResults = getPersonalizedRecommendations(tempProfile as any);
    currentStep = 4; // Discovery step
  }
  
  const availableFeatures = [
    { id: 'generate_sop', label: 'Generate your first SOP', description: 'Create a compelling Statement of Purpose', badge: null },
    { id: 'find_universities', label: 'Find matching universities', description: 'Discover universities that fit your profile', badge: 'Premium' },
    { id: 'explore_scholarships', label: 'Explore scholarships', description: 'Find funding opportunities', badge: null },
    { id: 'set_reminders', label: 'Set up deadline reminders', description: 'Coming soon - upgrade your plan for early access', badge: 'Coming Soon' }
  ];
  
  function toggleFeature(featureId: string) {
    const index = selectedFeatures.indexOf(featureId);
    if (index > -1) {
      selectedFeatures = selectedFeatures.filter(f => f !== featureId);
    } else {
      selectedFeatures = [...selectedFeatures, featureId];
    }
  }

  // =====================================================
  // COMPLETE ONBOARDING
  // =====================================================
  
  async function completeOnboardingFlow() {
    if (isSubmitting) return;
    
    isSubmitting = true;
    error = '';
    
    try {
      const result = await completeOnboarding(supabase, session, onboardingData);
      
      if (result.success) {
        // Debug: Check what features are selected
        console.log('Selected features:', selectedFeatures);
        
        // Redirect based on selected features (first valid selected feature takes priority)
        const validFeatures = selectedFeatures.filter(id => id !== 'set_reminders'); // Skip disabled feature
        const firstSelected = validFeatures[0]; // Get the first valid feature
        
        console.log('First selected valid feature:', firstSelected);
        
        if (firstSelected === 'generate_sop') {
          console.log('Redirecting to SOP');
          goto('/sop?onboarding=true');
        } else if (firstSelected === 'find_universities') {
          console.log('Redirecting to universities');
          goto('/universities?onboarding=true'); 
        } else if (firstSelected === 'explore_scholarships') {
          console.log('Redirecting to scholarships');
          goto('/scholarships?onboarding=true');
        } else {
          // Default to dashboard if no valid features selected
          console.log('Redirecting to dashboard (no features selected)');
          goto('/dashboard?onboarding=complete');
        }
      } else {
        error = 'Failed to save your profile. Please try again.';
      }
    } catch (err) {
      console.error('Onboarding completion error:', err);
      error = 'An error occurred. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Welcome to Abroaducate - Complete Your Profile</title>
</svelte:head>

{#if showLogin}
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center max-w-md mx-auto p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Complete Your Profile</h1>
      <p class="text-gray-600 mb-6">Please log in to start your personalized onboarding experience.</p>
      <button 
        onclick={() => showAuthModal = true}
        class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Sign In to Continue
      </button>
    </div>
  </div>
{:else if isLoading}
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Loading your profile...</p>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
    <div class="max-w-2xl mx-auto px-4">
      
      <!-- Progress Bar -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-600">
            Step {currentStep} of {currentStep === 4 ? 3 : 3}
          </span>
          <span class="text-sm text-gray-500">
            {currentStep === 4 ? 'Almost done!' : `${Math.round((currentStep / 3) * 100)}% complete`}
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style="width: {currentStep === 4 ? 100 : (currentStep / 3) * 100}%"
          ></div>
        </div>
      </div>

      <!-- Main Card -->
      <div class="bg-white rounded-lg shadow-lg p-8">
        
        {#if error}
          <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-800">{error}</p>
          </div>
        {/if}

        <!-- STEP 1: WHERE DO YOU WANT TO STUDY? -->
        {#if currentStep === 1}
          <div class="text-center mb-8">
            <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Where do you want to study?</h1>
            <p class="text-gray-600">Select your target countries and preferred timeline</p>
          </div>

          <div class="space-y-6">
            <!-- Countries Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">
                Target Countries *
              </label>
              
              <!-- Country Search Input -->
              <div class="relative mb-3">
                <input
                  type="text"
                  placeholder="Search countries... (e.g., United States, Canada)"
                  bind:value={countrySearch}
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <svg class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              
              <!-- Popular Countries (always visible when no search) -->
              {#if countrySearch.length === 0}
                <div class="mb-3">
                  <p class="text-xs text-gray-500 mb-2">Popular destinations:</p>
                  <div class="flex flex-wrap gap-2">
                    {#each ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'Netherlands', 'France', 'Italy', 'Spain', 'Switzerland'] as popularCountry}
                      <button
                        type="button"
                        onclick={() => selectCountry(popularCountry)}
                        disabled={onboardingData.preferred_countries.includes(popularCountry)}
                        class="px-3 py-1 text-sm rounded-full border transition-all {
                          onboardingData.preferred_countries.includes(popularCountry)
                            ? 'bg-blue-100 text-blue-800 border-blue-300 cursor-not-allowed'
                            : 'bg-gray-100 hover:bg-blue-100 text-gray-700 border-gray-300'
                        }"
                      >
                        {popularCountry}
                      </button>
                    {/each}
                  </div>
                  <p class="text-xs text-gray-400 mt-2">💡 Click to add, or search above for more countries</p>
                </div>
              {/if}
              
              <!-- Filtered Countries Dropdown -->
              {#if countrySearch.length > 0}
                <div class="max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-lg">
                  {#each filteredCountries as country}
                    <button
                      type="button"
                      onclick={() => selectCountry(country)}
                      class="w-full p-3 text-left hover:bg-blue-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                    >
                      <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                      </svg>
                      <span class="text-sm">{country}</span>
                    </button>
                  {/each}
                  {#if filteredCountries.length === 0}
                    <div class="p-3 text-center text-gray-500 text-sm">
                      No countries found. Try "Other" if your country isn't listed.
                    </div>
                  {/if}
                </div>
              {/if}
              
              <!-- Selected Countries -->
              {#if onboardingData.preferred_countries.length > 0}
                <div class="mt-3">
                  <p class="text-sm font-medium text-gray-700 mb-2">Selected Countries:</p>
                  <div class="flex flex-wrap gap-2">
                    {#each onboardingData.preferred_countries as country}
                      <span class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {country}
                        <button
                          type="button"
                          onclick={() => removeCountry(country)}
                          class="hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                          </svg>
                        </button>
                      </span>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>

            <!-- Target Intake -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">
                Preferred Intake (Optional)
              </label>
              <select 
                bind:value={onboardingData.target_intake}
                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select intake period</option>
                {#each availableIntakes as intake}
                  <option value={intake}>{intake}</option>
                {/each}
              </select>
            </div>
          </div>

        <!-- STEP 2: SEE YOUR ELIGIBILITY INSTANTLY -->
        {:else if currentStep === 2}
          <div class="text-center mb-8">
            <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">See your eligibility instantly</h1>
            <p class="text-gray-600">Enter your GPA for personalized insights</p>
          </div>

          <div class="space-y-6">
            <!-- GPA Input -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Your Current GPA
                </label>
                <input
                  type="number"
                  step="0.01"
                  bind:value={onboardingData.current_gpa_value}
                  placeholder="e.g., 3.7"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  GPA Scale
                </label>
                <select 
                  bind:value={onboardingData.current_gpa_scale}
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select scale</option>
                  {#each gpaScales as scale}
                    <option value={scale.value}>{scale.label}</option>
                  {/each}
                </select>
              </div>
            </div>

            <!-- GPA Conversion Result -->
            {#if gpaConversionResult}
              <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-green-900 mb-1">Great news!</h3>
                    <p class="text-green-800 mb-2">{gpaConversionResult.message}</p>
                    <div class="text-sm text-green-700">
                      Converted GPA: <strong>{gpaConversionResult.standardized_gpa}/4.0</strong>
                    </div>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Manual GPA Range (fallback) -->
            {#if !onboardingData.current_gpa_value || !onboardingData.current_gpa_scale}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Or select your approximate GPA range
                </label>
                <div class="grid grid-cols-2 gap-3">
                  {#each ['<2.5', '2.5-3.0', '3.0-3.5', '3.5-4.0'] as range}
                    <button
                      type="button"
                      onclick={() => onboardingData.gpa_range = range as '<2.5' | '2.5-3.0' | '3.0-3.5' | '3.5-4.0'}
                      class="p-3 text-center border rounded-lg transition-all {
                        onboardingData.gpa_range === range
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300'
                      }"
                    >
                      {range}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

        <!-- STEP 3: WHAT'S YOUR FOCUS? -->
        {:else if currentStep === 3}
          <div class="text-center mb-8">
            <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">What's your focus?</h1>
            <p class="text-gray-600">Tell us about your academic goals and budget</p>
          </div>

          <div class="space-y-6">
            <!-- Field of Study -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">
                Field of Study *
              </label>
              
              <!-- Field Search Input -->
              <div class="relative mb-3">
                <input
                  type="text"
                  placeholder="Search your field... (e.g., Computer Science, Engineering)"
                  bind:value={fieldSearch}
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <svg class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              
              <!-- Popular Fields (when no search and no field selected) -->
              {#if fieldSearch.length === 0 && !onboardingData.field_of_study}
                <div class="mb-3">
                  <p class="text-xs text-gray-500 mb-2">Popular fields:</p>
                  <div class="flex flex-wrap gap-2">
                    {#each [
                      'Computer Science', 'Software Engineering', 'Data Science', 'Artificial Intelligence',
                      'Engineering (General)', 'Electrical Engineering', 'Mechanical Engineering',
                      'Business Administration', 'MBA', 'Finance', 'Marketing',
                      'Medicine', 'Nursing', 'Public Health', 'Psychology',
                      'Law', 'Economics', 'Biology', 'Mathematics', 'Physics'
                    ] as popularField}
                      <button
                        type="button"
                        onclick={() => selectField(popularField)}
                        class="px-3 py-1 text-sm bg-gray-100 hover:bg-blue-100 text-gray-700 rounded-full border transition-all"
                      >
                        {popularField}
                      </button>
                    {/each}
                  </div>
                  <p class="text-xs text-gray-400 mt-2">💡 Click to select, or search above for more specialized fields</p>
                </div>
              {/if}
              
              <!-- Filtered Fields Dropdown -->
              {#if fieldSearch.length > 0}
                <div class="max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-lg">
                  {#each filteredFieldsList as field}
                    <button
                      type="button"
                      onclick={() => selectField(field)}
                      class="w-full p-3 text-left hover:bg-blue-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                    >
                      <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                      </svg>
                      <span class="text-sm">{field}</span>
                    </button>
                  {/each}
                  {#if filteredFieldsList.length === 0}
                    <div class="p-3 text-center text-gray-500 text-sm">
                      No fields found. Try "Other" if your field isn't listed.
                    </div>
                  {/if}
                </div>
              {/if}
              
              <!-- Selected Field -->
              {#if onboardingData.field_of_study}
                <div class="mt-3">
                  <p class="text-sm font-medium text-gray-700 mb-2">Selected Field:</p>
                  <span class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {onboardingData.field_of_study}
                    <button
                      type="button"
                      onclick={() => onboardingData.field_of_study = ''}
                      class="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                      </svg>
                    </button>
                  </span>
                </div>
              {/if}
            </div>

            <!-- Degree Level -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">
                Degree Level *
              </label>
              <div class="grid grid-cols-2 gap-3">
                {#each [
                  { value: 'undergraduate', label: 'Undergraduate' },
                  { value: 'masters', label: 'Masters' },
                  { value: 'phd', label: 'PhD' },
                  { value: 'graduate', label: 'Graduate' }
                ] as level}
                  <button
                    type="button"
                    onclick={() => onboardingData.degree_level = level.value as 'undergraduate' | 'masters' | 'phd' | 'graduate'}
                    class="p-3 text-center border rounded-lg transition-all {
                      onboardingData.degree_level === level.value
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }"
                  >
                    {level.label}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Budget Range -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">
                Budget Range <span class="text-gray-500 font-normal">(Optional - helps us find better matches)</span>
              </label>
              <div class="space-y-2">
                {#each budgetRanges as budget}
                  <button
                    type="button"
                    onclick={() => onboardingData.budget_range = budget.value as '0-20k' | '20k-50k' | '50k-100k' | '100k+' | 'skip'}
                    class="w-full p-3 text-left border rounded-lg transition-all {
                      onboardingData.budget_range === budget.value
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }"
                  >
                    {budget.label}
                  </button>
                {/each}
              </div>
              {#if onboardingData.budget_range === '' || onboardingData.budget_range === 'skip'}
                <p class="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <svg class="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                  Adding budget information helps us recommend scholarships and universities within your price range
                </p>
              {/if}
            </div>
          </div>

        <!-- STEP 4: DISCOVERY MOMENT -->
        {:else if currentStep === 4 && discoveryResults}
          <div class="text-center mb-8">
            <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Here's what we found!</h1>
            <p class="text-gray-600">Your personalized recommendations are ready</p>
          </div>

          <div class="space-y-6">
            <!-- Results Summary -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-900">{discoveryResults.scholarships_estimate}</div>
                  <div class="text-sm text-blue-700">Matching Scholarships</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-900">{discoveryResults.universities_estimate}</div>
                  <div class="text-sm text-blue-700">Matching Universities</div>
                </div>
              </div>
              <p class="text-blue-800 text-center">{discoveryResults.eligibility_message}</p>
            </div>

            <!-- Feature Selection -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Ready to get started?</h3>
              <p class="text-sm text-gray-600 mb-4">
                Select your first action - we'll take you there after setup. 
                {#if selectedFeatures.length > 1}
                  <span class="text-blue-600 font-medium">Multiple selected: we'll go to the first one.</span>
                {/if}
              </p>
              <div class="space-y-3">
                {#each availableFeatures as feature}
                  <button
                    type="button"
                    onclick={() => toggleFeature(feature.id)}
                    disabled={feature.badge === 'Coming Soon'}
                    class="w-full p-4 text-left border rounded-lg transition-all {
                      feature.badge === 'Coming Soon' ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-75' :
                      selectedFeatures.includes(feature.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }"
                  >
                    <div class="flex items-start gap-3">
                      <div class="w-5 h-5 rounded border-2 mt-0.5 {
                        feature.badge === 'Coming Soon' ? 'border-gray-300 bg-gray-200' :
                        selectedFeatures.includes(feature.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      } flex items-center justify-center">
                        {#if selectedFeatures.includes(feature.id) && feature.badge !== 'Coming Soon'}
                          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                          </svg>
                        {/if}
                      </div>
                      <div class="flex-1">
                        <div class="flex items-center gap-2">
                          <div class="font-medium text-gray-900">{feature.label}</div>
                          {#if feature.badge}
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {
                              feature.badge === 'Premium' ? 'bg-purple-100 text-purple-800' :
                              feature.badge === 'Coming Soon' ? 'bg-gray-100 text-gray-600' :
                              'bg-blue-100 text-blue-800'
                            }">
                              {feature.badge}
                            </span>
                          {/if}
                        </div>
                        <div class="text-sm text-gray-600">{feature.description}</div>
                      </div>
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- Navigation Buttons -->
        <div class="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          {#if currentStep > 1 && currentStep < 4}
            <button
              onclick={prevStep}
              class="px-6 py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
            >
              ← Back
            </button>
          {:else}
            <div></div>
          {/if}

          {#if currentStep < 3}
            <button
              onclick={nextStep}
              disabled={!canContinue()}
              class="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continue →
            </button>
          {:else if currentStep === 3}
            <button
              onclick={nextStep}
              disabled={!canContinue()}
              class="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Show My Results →
            </button>
          {:else if currentStep === 4}
            <button
              onclick={completeOnboardingFlow}
              disabled={isSubmitting}
              class="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {#if isSubmitting}
                <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              {/if}
              {#if selectedFeatures.length > 0}
                {#if selectedFeatures.includes('generate_sop')}
                  Complete Setup & Create SOP
                {:else if selectedFeatures.includes('find_universities')}
                  Complete Setup & Find Universities
                {:else if selectedFeatures.includes('explore_scholarships')}
                  Complete Setup & Explore Scholarships
                {:else}
                  Complete Setup & Go to Dashboard
                {/if}
              {:else}
                Complete Setup & Go to Dashboard
              {/if}
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Authentication Modal -->
<AuthenticationFlow 
  bind:show={showAuthModal} 
  {supabase} 
  mode="login" 
  returnUrl="/onboarding" 
  on:success={() => {
    showAuthModal = false;
    // Session will be updated reactively
  }} 
/>
