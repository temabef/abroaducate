<script lang="ts">
  import { goto } from '$app/navigation';
  import { assessEligibility, type DiagnosticData, type EligibilityResult } from '$lib/utils/eligibilityCalculator';
  import { onMount } from 'svelte';
  import { Globe, BarChart3, FileText, Wallet, Target, Lightbulb } from 'lucide-svelte';
  
  // Form state
  let currentStep = $state(0); // 0 = intro, 1-5 = questions
  let isSubmitting = $state(false);
  let countrySearchQuery = $state('');
  let showIntro = $state(true);
  let showCountryDropdown = $state(false);
  let countryInputRef: HTMLInputElement;
  let otherCountries = $state<string[]>([]);
  let otherCountryInput = $state('');
  let showOtherInput = $state(false);
  
  // Form data
  let formData: DiagnosticData = $state({
    currentCountry: '',
    gpaValue: 0,
    gpaScale: '4.0',
    englishTest: 'none',
    englishScore: undefined,
    budget: '',
    targetCountries: [],
    fieldOfStudy: '',
    degreeLevel: '',
    // Pathway fields
    currentEducationLevel: undefined,
    pathwayPreference: undefined,
    hasMastersTranscript: undefined
  });
  
  // Pathway question visibility
  let showPathwayQuestions = $state(false);
  
  // Step labels for breadcrumb
  const stepLabels = [
    { num: 1, label: 'Profile', description: 'Tell us about you' },
    { num: 2, label: 'Academics', description: 'Your grades' },
    { num: 3, label: 'English', description: 'Language skills' },
    { num: 4, label: 'Finances', description: 'Budget & funding' },
    { num: 5, label: 'Goals', description: 'Where to study' }
  ];
  
  // Available options - ALL countries for current location
  const allCountries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
    'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
    'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia',
    'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
    'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
    'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
    'Haiti', 'Honduras', 'Hungary',
    'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
    'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
    'Oman',
    'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar',
    'Romania', 'Russia', 'Rwanda',
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
    'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
    'Yemen',
    'Zambia', 'Zimbabwe'
  ];
  
  // Filtered countries for search
  let filteredCountries = $derived(
    countrySearchQuery && !formData.currentCountry
      ? allCountries.filter(c => 
          c.toLowerCase().includes(countrySearchQuery.toLowerCase())
        )
      : allCountries
  );
  
  // Popular study destinations for target countries
  const targetCountries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'Netherlands', 'France', 'Italy', 'Spain', 'Sweden', 'Norway', 'Denmark',
    'Switzerland', 'Ireland', 'Austria', 'Belgium', 'Finland', 'Poland',
    'Czech Republic', 'Portugal', 'Singapore', 'Japan', 'South Korea', 'New Zealand',
    'China', 'India', 'United Arab Emirates', 'Malaysia', 'Turkey'
  ];
  
  const gpaScales = [
    { value: '4.0', label: '4.0 Scale (US)' },
    { value: '5.0', label: '5.0 Scale' },
    { value: '7.0', label: '7.0 Scale' },
    { value: '10.0', label: '10.0 Scale' },
    { value: '100', label: 'Percentage (0-100)' }
  ];
  
  const englishTests = [
    { value: 'none', label: 'Not taken yet' },
    { value: 'planning', label: 'Planning to take' },
    { value: 'ielts', label: 'IELTS' },
    { value: 'toefl', label: 'TOEFL' },
    { value: 'duolingo', label: 'Duolingo English Test' },
    { value: 'pte', label: 'PTE Academic' }
  ];
  
  const budgetRanges = [
    { value: 'nothing', label: 'Nothing - I need full funding (Visa, flights, living costs covered)' },
    { value: '$500-1.5k', label: '$500 - $1,500 (Very limited funds - just visa and minimal setup)' },
    { value: '$1.5k-3k', label: '$1,500 - $3,000 (Can cover visa, flights, initial accommodation)' },
    { value: '$3k-5k', label: '$3,000 - $5,000 (Can cover all setup costs comfortably)' },
    { value: '$5k+', label: '$5,000+ (Can contribute to living expenses or partial tuition)' }
  ];
  
  // Navigation functions
  function startAssessment() {
    showIntro = false;
    currentStep = 1;
  }
  
  function nextStep() {
    if (currentStep < 5) {
      currentStep += 1;
    } else {
      calculateResults();
    }
  }
  
  function prevStep() {
    if (currentStep > 1) {
      currentStep -= 1;
    }
  }
  
  // Close dropdown when clicking outside
  onMount(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (countryInputRef && !countryInputRef.contains(target) && 
          !target.closest('[data-country-dropdown]')) {
        showCountryDropdown = false;
      }
    }
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });
  
  // Validation
  function canContinue(): boolean {
    switch (currentStep) {
      case 1:
        return formData.currentCountry !== '';
      case 2:
        return formData.gpaValue > 0;
      case 3:
        return true; // English test is optional
      case 4:
        return formData.budget !== '';
      case 5:
        // Must have at least one country selected
        // If "Other" is selected, must have at least one other country specified
        if (formData.targetCountries.includes('Other')) {
          if (otherCountries.length === 0) return false;
        } else {
          if (formData.targetCountries.length === 0) return false;
        }
        
        // Educational pathway questions are REQUIRED
        if (!formData.currentEducationLevel) return false;
        if (!formData.degreeLevel) return false;
        if (!formData.fieldOfStudy) return false;
        if (formData.degreeLevel === 'phd' && !formData.pathwayPreference) return false;
        
        return true;
      default:
        return false;
    }
  }
  
  // Country selection
  function toggleCountry(country: string) {
    if (country === 'Other') {
      if (formData.targetCountries.includes('Other')) {
        // Remove "Other" and all other countries
        formData.targetCountries = formData.targetCountries.filter(c => c !== 'Other');
        otherCountries = [];
        showOtherInput = false;
      } else {
        // Add "Other" and show input
        formData.targetCountries = [...formData.targetCountries, 'Other'];
        showOtherInput = true;
      }
    } else {
      if (formData.targetCountries.includes(country)) {
        formData.targetCountries = formData.targetCountries.filter(c => c !== country);
      } else {
        formData.targetCountries = [...formData.targetCountries, country];
      }
    }
  }
  
  // Add other country
  function addOtherCountry() {
    const trimmed = otherCountryInput.trim();
    if (trimmed && !otherCountries.includes(trimmed) && !targetCountries.includes(trimmed)) {
      otherCountries = [...otherCountries, trimmed];
      otherCountryInput = '';
    }
  }
  
  // Remove other country
  function removeOtherCountry(country: string) {
    otherCountries = otherCountries.filter(c => c !== country);
    if (otherCountries.length === 0 && !otherCountryInput) {
      // If no other countries left, remove "Other" from selection
      formData.targetCountries = formData.targetCountries.filter(c => c !== 'Other');
      showOtherInput = false;
    }
  }
  
  // Get all selected countries (including other countries)
  let allSelectedCountries = $derived([
    ...formData.targetCountries.filter(c => c !== 'Other'),
    ...otherCountries.map(c => `Other: ${c}`)
  ]);
  
  // Calculate and navigate to results
  async function calculateResults() {
    isSubmitting = true;
    
    try {
      // Combine regular countries with other countries
      const finalTargetCountries = [
        ...formData.targetCountries.filter(c => c !== 'Other'),
        ...otherCountries
      ];
      
      // Create final form data with all countries
      const finalFormData = {
        ...formData,
        targetCountries: finalTargetCountries
      };
      
      // Calculate eligibility
      const results = await assessEligibility(finalFormData);
      
      // Store results in sessionStorage for results page
      sessionStorage.setItem('diagnosticData', JSON.stringify(finalFormData));
      sessionStorage.setItem('diagnosticResults', JSON.stringify(results));
      
      // Save to database (optional - anonymous)
      await saveToDatabase(finalFormData, results);
      
      // Navigate to results
      goto('/diagnostic/results');
    } catch (error) {
      console.error('Error calculating results:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      isSubmitting = false;
    }
  }
  
  // Save to database
  async function saveToDatabase(data: DiagnosticData, results: EligibilityResult) {
    try {
      await fetch('/api/diagnostic/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnostic_data: data,
          results: results,
          session_id: crypto.randomUUID()
        })
      });
    } catch (error) {
      console.error('Error saving to database:', error);
      // Don't block user flow if saving fails
    }
  }
</script>

<svelte:head>
  <title>Study Abroad Eligibility Check - Abroaducate</title>
  <meta name="description" content="Check your eligibility for studying abroad in minutes. Get honest assessment of your chances." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white py-12 pt-24 px-6">
  <div class="pointer-events-none absolute inset-0">
    <div class="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl"></div>
    <div class="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl"></div>
  </div>
  <div class="relative max-w-3xl mx-auto">
    
    <!-- Header -->
    <div class="text-center mb-12">
      <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm mb-4">
        <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
        Free eligibility assessment
      </div>
      <h1 class="text-5xl font-bold text-slate-900 mb-4 leading-tight">
        Are You Ready to<br/>Study Abroad?
      </h1>
      <p class="text-xl text-slate-600 max-w-2xl mx-auto">
        Get honest, realistic feedback about your scholarship potential in 2 minutes. No signup, no BS.
      </p>
    </div>
    
    <!-- Pre-Assessment Intro -->
    {#if showIntro && currentStep === 0}
      <div class="bg-white/80 backdrop-blur rounded-3xl border border-slate-200 shadow-sm p-8 mb-6">
        <div class="max-w-2xl mx-auto text-center space-y-6">
          <div class="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-900/10">
            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          
          <div>
            <h2 class="text-3xl font-bold text-slate-900 mb-4">What is Eligibility Assessment?</h2>
            <p class="text-lg text-slate-600 mb-6">
              This assessment helps us understand your scholarship potential by evaluating key factors that universities and scholarship programs consider.
            </p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div class="p-4 bg-white/70 rounded-2xl border border-slate-200">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 bg-[#2C3580] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-white font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-900 mb-1">Your Profile</h3>
                  <p class="text-sm text-slate-600">Where you're from helps us match you with suitable universities and scholarship programs in your region.</p>
                </div>
              </div>
            </div>
            
            <div class="p-4 bg-white/70 rounded-2xl border border-slate-200">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-white font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-900 mb-1">Academic Performance</h3>
                  <p class="text-sm text-slate-600">Your GPA shows how competitive you are for scholarships. We'll convert it automatically to compare fairly.</p>
                </div>
              </div>
            </div>
            
            <div class="p-4 bg-white/70 rounded-2xl border border-slate-200">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-white font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-900 mb-1">English Proficiency</h3>
                  <p class="text-sm text-slate-600">Most international programs require English test scores. This helps us identify programs you qualify for.</p>
                </div>
              </div>
            </div>
            
            <div class="p-4 bg-white/70 rounded-2xl border border-slate-200">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-white font-bold text-sm">4</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-900 mb-1">Funding Reality</h3>
                  <p class="text-sm text-slate-600">Understanding your budget helps us show you realistic scholarship opportunities and what you'll need to cover.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="pt-6">
            <button
              onclick={startAssessment}
              class="px-8 py-4 bg-[#2C3580] hover:bg-[#3c4d9c] text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-900/10 transition-all duration-300 transform hover:scale-[1.02] flex items-center gap-2 mx-auto"
            >
              Start Assessment
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </button>
            <p class="text-sm text-slate-500 mt-4">Takes 2 minutes • No signup required</p>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Breadcrumb Steps -->
    {#if !showIntro && currentStep > 0}
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4 overflow-x-auto pb-2">
          {#each stepLabels as step}
            <div class="flex items-center flex-shrink-0">
              <div class="flex flex-col items-center min-w-[80px]">
                <div class="w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all {
                  currentStep === step.num
                    ? 'bg-[#2C3580] text-white shadow-lg shadow-indigo-900/10 scale-110'
                    : currentStep > step.num
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-500'
                }">
                  {#if currentStep > step.num}
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                  {:else}
                    <span class="text-lg font-bold">{step.num}</span>
                  {/if}
                </div>
                <span class="text-xs font-medium text-center {
                  currentStep === step.num ? 'text-slate-900' : 'text-slate-500'
                }">{step.label}</span>
              </div>
              {#if step.num < 5}
                <svg class="w-6 h-6 text-slate-300 mx-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              {/if}
            </div>
          {/each}
        </div>
        
        <!-- Progress Bar -->
        <div class="mb-2">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-slate-600 flex items-center gap-2">
              {#if currentStep === 1}<Globe class="w-4 h-4 text-indigo-700" />
              {:else if currentStep === 2}<BarChart3 class="w-4 h-4 text-indigo-700" />
              {:else if currentStep === 3}<FileText class="w-4 h-4 text-indigo-700" />
              {:else if currentStep === 4}<Wallet class="w-4 h-4 text-indigo-700" />
              {:else}<Target class="w-4 h-4 text-indigo-700" />{/if}
              {stepLabels.find(s => s.num === currentStep)?.description || `Question ${currentStep} of 5`}
            </span>
            <span class="text-sm text-slate-500">
              {Math.round((currentStep / 5) * 100)}% complete
            </span>
          </div>
          <div class="w-full bg-slate-200 rounded-full h-3">
            <div 
              class="bg-[#2C3580] h-3 rounded-full transition-all duration-300"
              style="width: {(currentStep / 5) * 100}%"
            ></div>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Question Card -->
    {#if !showIntro && currentStep > 0}
      <div class="bg-white/80 backdrop-blur rounded-3xl border border-slate-200 shadow-sm p-8 mb-6">
        
        <!-- Question 1: Current Country -->
        {#if currentStep === 1}
          <div class="space-y-6">
            <div class="text-center">
              <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2 class="text-3xl font-bold text-slate-900 mb-3">Where are you from?</h2>
              <p class="text-slate-600 text-lg mb-2">Select your home country or where you're currently based</p>
              <p class="text-sm text-slate-500 max-w-xl mx-auto">
                Why we ask: This helps us match you with suitable universities and scholarship programs that consider your region and background.
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-3">Your Country</label>
              
              <!-- Unified Searchable Dropdown -->
              <div class="relative" data-country-dropdown>
                <div class="relative">
                  <input
                    bind:this={countryInputRef}
                    type="text"
                    value={formData.currentCountry || countrySearchQuery}
                    oninput={(e) => {
                      countrySearchQuery = (e.target as HTMLInputElement).value;
                      formData.currentCountry = ''; // Clear selection when typing
                      showCountryDropdown = true;
                    }}
                    onfocus={() => {
                      if (!formData.currentCountry) {
                        countrySearchQuery = '';
                      }
                      showCountryDropdown = true;
                    }}
                    onclick={() => showCountryDropdown = true}
                    onkeydown={(e) => {
                      if (e.key === 'Escape') {
                        showCountryDropdown = false;
                        countryInputRef?.blur();
                      }
                    }}
                    placeholder="Type to search your country..."
                    class="w-full p-4 pl-12 pr-12 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2C3580]/30 focus:border-[#2C3580] transition-all text-lg shadow-sm {
                      formData.currentCountry ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                    }"
                  />
                  <svg class="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  <svg class="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform {
                    showCountryDropdown ? 'rotate-180' : ''
                  }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                
                <!-- Dropdown List -->
                {#if showCountryDropdown}
                  <div 
                    class="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-80 overflow-y-auto"
                    onclick={(e) => e.stopPropagation()}
                  >
                    {#if filteredCountries.length === 0}
                      <div class="p-4 text-center text-gray-500">
                        <p class="text-sm">No countries found matching "{countrySearchQuery}"</p>
                      </div>
                    {:else}
                      <div class="py-2">
                        {#each filteredCountries.slice(0, 50) as country}
                          <button
                            type="button"
                            onclick={() => {
                              formData.currentCountry = country;
                              countrySearchQuery = country;
                              showCountryDropdown = false;
                              countryInputRef?.blur();
                            }}
                            class="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors {
                              formData.currentCountry === country ? 'bg-indigo-50 text-slate-900 font-semibold' : 'text-slate-900'
                            }"
                          >
                            <div class="flex items-center gap-3">
                              {#if formData.currentCountry === country}
                                <svg class="w-5 h-5 text-indigo-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                </svg>
                              {/if}
                              <span class="flex-1">{country}</span>
                            </div>
                          </button>
                        {/each}
                        {#if filteredCountries.length > 50}
                          <div class="px-4 py-2 text-xs text-slate-500 border-t border-slate-200">
                            Showing first 50 results. Type more to narrow down.
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/if}
                
                <!-- Selected Country Confirmation -->
                {#if formData.currentCountry}
                  <div class="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                    <svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-sm font-medium text-emerald-900">Selected: {formData.currentCountry}</span>
                    <button
                      type="button"
                      onclick={() => {
                        formData.currentCountry = '';
                        countrySearchQuery = '';
                        showCountryDropdown = true;
                        countryInputRef?.focus();
                      }}
                      class="ml-auto text-emerald-700 hover:text-emerald-900 text-sm font-medium"
                    >
                      Change
                    </button>
                  </div>
                {/if}
              </div>
              
              <p class="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                <Lightbulb class="w-4 h-4 flex-shrink-0 text-amber-500" />
                Start typing to search, or click to see all countries
              </p>
            </div>
          </div>
      
        <!-- Question 2: GPA -->
        {:else if currentStep === 2}
          <div class="space-y-6">
            <div class="text-center">
              <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2 class="text-3xl font-bold text-gray-900 mb-3">What's your GPA?</h2>
              <p class="text-gray-600 text-lg mb-2">We'll automatically convert it to a 4.0 scale</p>
              <p class="text-sm text-gray-500 max-w-xl mx-auto">
                Why we ask: Your GPA shows how competitive you are for scholarships. Higher GPAs open doors to more fully-funded opportunities.
              </p>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">GPA Scale</label>
                <select
                  bind:value={formData.gpaScale}
                  class="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {#each gpaScales as scale}
                    <option value={scale.value}>{scale.label}</option>
                  {/each}
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Your GPA</label>
                <input
                  type="number"
                  step="0.01"
                  bind:value={formData.gpaValue}
                  placeholder="e.g., 3.5"
                  class="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
                <p class="text-sm text-gray-500 mt-2">
                  Enter your current cumulative GPA. Don't worry if it's not perfect - we'll show you opportunities at all levels.
                </p>
              </div>
            </div>
          </div>
      
        <!-- Question 3: English Test -->
        {:else if currentStep === 3}
          <div class="space-y-6">
            <div class="text-center">
              <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                </svg>
              </div>
              <h2 class="text-3xl font-bold text-gray-900 mb-3">English Proficiency Test?</h2>
              <p class="text-gray-600 text-lg mb-2">Required for most international programs</p>
              <p class="text-sm text-gray-500 max-w-xl mx-auto">
                Why we ask: Most universities require English test scores to ensure you can succeed in an English-taught program. This helps us identify which programs you qualify for.
              </p>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Test Status</label>
                <select
                  bind:value={formData.englishTest}
                  class="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {#each englishTests as test}
                    <option value={test.value}>{test.label}</option>
                  {/each}
                </select>
                <p class="text-xs text-gray-500 mt-2">
                  Don't have a test yet? No problem - we'll show you programs that accept applications without scores initially.
                </p>
              </div>
              
              {#if formData.englishTest !== 'none' && formData.englishTest !== 'planning'}
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Your Score</label>
                  <input
                    type="number"
                    step="0.5"
                    bind:value={formData.englishScore}
                    placeholder={formData.englishTest === 'ielts' ? 'e.g., 7.0' : formData.englishTest === 'toefl' ? 'e.g., 100' : 'Your score'}
                    class="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  />
                </div>
              {/if}
            </div>
          </div>
      
        <!-- Question 4: Budget -->
        {:else if currentStep === 4}
          <div class="space-y-6">
            <div class="text-center">
              <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2 class="text-3xl font-bold text-gray-900 mb-3">What can you afford out-of-pocket after scholarships cover tuition?</h2>
              <p class="text-sm text-gray-500 max-w-xl mx-auto mb-4">
                Why we ask: This helps us match you with realistic scholarships. Different countries have different costs. Most scholarships cover tuition - you'll need to cover visa, flights, and initial setup costs.
              </p>
            </div>
            
            <div class="space-y-3">
              {#each budgetRanges as budget}
                <button
                  type="button"
                  onclick={() => formData.budget = budget.value}
                  class="w-full p-4 text-left border-2 rounded-xl transition-all {
                    formData.budget === budget.value
                      ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-md scale-[1.01]'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 {
                      formData.budget === budget.value
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-400'
                    }">
                      {#if formData.budget === budget.value}
                        <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                        </svg>
                      {/if}
                    </div>
                    <div class="font-medium text-left">{budget.label}</div>
                  </div>
                </button>
              {/each}
            </div>
          </div>
      
        <!-- Question 5: Target Countries -->
        {:else if currentStep === 5}
          <div class="space-y-6">
            <div class="text-center">
              <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                </svg>
              </div>
              <h2 class="text-3xl font-bold text-gray-900 mb-3">Where do you want to study?</h2>
              <p class="text-gray-600 text-lg mb-2">Select all countries you're considering (minimum 1)</p>
              <p class="text-sm text-gray-500 max-w-xl mx-auto">
                Why we ask: Different countries have different scholarship programs and requirements. We'll show you your best funding opportunities in each country.
              </p>
            </div>
          
          <div class="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
            {#each targetCountries as country}
              <button
                type="button"
                onclick={() => toggleCountry(country)}
                class="p-4 text-left border-2 rounded-xl transition-all shadow-sm {
                  formData.targetCountries.includes(country)
                    ? 'border-green-500 bg-green-50 text-green-900 font-semibold shadow-md scale-[1.02]'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:shadow'
                }"
              >
                <span class="flex items-center gap-2">
                  {#if formData.targetCountries.includes(country)}
                    <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                  {/if}
                  {country}
                </span>
              </button>
            {/each}
            <!-- Other option -->
            <button
              type="button"
              onclick={() => toggleCountry('Other')}
              class="p-4 text-left border-2 rounded-xl transition-all shadow-sm border-dashed {
                formData.targetCountries.includes('Other')
                  ? 'border-green-500 bg-green-50 text-green-900 font-semibold'
                  : 'border-gray-400 hover:border-gray-500 hover:bg-gray-50 text-gray-600'
              }"
            >
              <span class="flex items-center gap-2">
                {#if formData.targetCountries.includes('Other')}
                  <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                  </svg>
                {/if}
                Other / Not Listed
                {#if formData.targetCountries.includes('Other')}
                  <svg class="w-4 h-4 ml-auto transition-transform {showOtherInput ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                {/if}
              </span>
            </button>
          </div>
          
          <!-- Expandable Other Countries Input -->
          {#if formData.targetCountries.includes('Other') && showOtherInput}
            <div class="mt-4 p-5 bg-blue-50 border-2 border-blue-200 rounded-xl space-y-4">
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                </svg>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-blue-900 mb-1">Which country is not listed?</p>
                  <p class="text-xs text-blue-700 mb-3">
                    We'll provide general guidance since we don't have specific scholarship data for this country yet.
                  </p>
                  
                  <div class="flex gap-2 mb-3">
                    <input
                      type="text"
                      bind:value={otherCountryInput}
                      onkeydown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addOtherCountry();
                        }
                      }}
                      placeholder="Type country name (e.g., Vietnam, Brazil)"
                      class="flex-1 p-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onclick={addOtherCountry}
                      disabled={!otherCountryInput.trim()}
                      class="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm"
                    >
                      Add
                    </button>
                  </div>
                  
                  {#if otherCountries.length > 0}
                    <div class="space-y-2">
                      <p class="text-xs font-medium text-blue-900">Added countries:</p>
                      <div class="flex flex-wrap gap-2">
                        {#each otherCountries as country}
                          <div class="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm">
                            <span class="text-blue-900">{country}</span>
                            <button
                              type="button"
                              onclick={() => removeOtherCountry(country)}
                              class="text-blue-600 hover:text-blue-800"
                            >
                              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                              </svg>
                            </button>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/if}
          
          {#if allSelectedCountries.length > 0}
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 shadow-sm mb-6">
              <div class="flex items-start gap-3">
                <svg class="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <div>
                  <p class="font-semibold text-green-900 mb-1">
                    {allSelectedCountries.length} {allSelectedCountries.length === 1 ? 'country' : 'countries'} selected
                  </p>
                  <p class="text-sm text-green-700">
                    {allSelectedCountries.join(', ')}
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Pathway Questions (Conditional) -->
            <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 space-y-6">
              <div class="flex items-start gap-3">
                <svg class="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                </svg>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-blue-900 mb-2">Tell us about your educational pathway</h3>
                  <p class="text-sm text-blue-700 mb-4">
                    This helps us give you accurate document requirements. Different pathways need different transcripts.
                  </p>
                  
                  <!-- Current Education Level -->
                  <div class="mb-6">
                    <label class="block text-sm font-semibold text-blue-900 mb-3">What's your current education level?</label>
                    <div class="space-y-2">
                      {#each [
                        { value: 'bachelor_years_1_3', label: 'Currently in Bachelor\'s (Year 1-3)' },
                        { value: 'bachelor_final', label: 'Finishing Bachelor\'s (Final year)' },
                        { value: 'bachelor_completed', label: 'Completed Bachelor\'s' },
                        { value: 'master_completed', label: 'Completed Master\'s' }
                      ] as option}
                        <button
                          type="button"
                          onclick={() => {
                            formData.currentEducationLevel = option.value as any;
                            showPathwayQuestions = true;
                          }}
                          class="w-full p-3 text-left border-2 rounded-lg transition-all {
                            formData.currentEducationLevel === option.value
                              ? 'border-blue-500 bg-blue-100 text-blue-900 font-semibold'
                              : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                          }"
                        >
                          <span class="flex items-center gap-2">
                            {#if formData.currentEducationLevel === option.value}
                              <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                              </svg>
                            {/if}
                            {option.label}
                          </span>
                        </button>
                      {/each}
                    </div>
                  </div>
                  
                  <!-- Target Degree Level -->
                  {#if formData.currentEducationLevel}
                    <div class="mb-6">
                      <label class="block text-sm font-semibold text-blue-900 mb-3">What degree are you targeting?</label>
                      <div class="space-y-2">
                        {#each [
                          { value: 'masters', label: 'Master\'s (2 years)' },
                          { value: 'phd', label: 'PhD (4-6 years)' },
                          { value: 'undergraduate', label: 'Undergraduate' }
                        ] as option}
                          <button
                            type="button"
                            onclick={() => {
                              formData.degreeLevel = option.value;
                              if (option.value !== 'phd') {
                                formData.pathwayPreference = undefined;
                              }
                            }}
                            class="w-full p-3 text-left border-2 rounded-lg transition-all {
                              formData.degreeLevel === option.value
                                ? 'border-blue-500 bg-blue-100 text-blue-900 font-semibold'
                                : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                            }"
                          >
                            <span class="flex items-center gap-2">
                              {#if formData.degreeLevel === option.value}
                                <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                </svg>
                              {/if}
                              {option.label}
                            </span>
                          </button>
                        {/each}
                      </div>
                    </div>
                  {/if}
                  
                  <!-- Field of Study (NEW - Simple Implementation) -->
                  {#if formData.degreeLevel}
                    <div class="mb-6">
                      <label class="block text-sm font-semibold text-blue-900 mb-3">What field will you study?</label>
                      <p class="text-xs text-blue-700 mb-3">This helps us show you field-specific funding opportunities</p>
                      <div class="space-y-2">
                        {#each [
                          { value: 'STEM (Engineering, CS, Sciences, Math)', label: 'STEM', icon: '🔬', desc: 'Engineering, Computer Science, Sciences, Math' },
                          { value: 'Health & Life Sciences (Medicine, Biology)', label: 'Health & Life Sciences', icon: '🏥', desc: 'Medicine, Biology, Nursing, Public Health' },
                          { value: 'Business & Economics', label: 'Business & Economics', icon: '💼', desc: 'MBA, Economics, Finance, Management' },
                          { value: 'Social Sciences (Psychology, Education)', label: 'Social Sciences', icon: '👥', desc: 'Psychology, Education, Sociology, Political Science' },
                          { value: 'Humanities & Arts (Literature, History)', label: 'Humanities & Arts', icon: '📚', desc: 'Literature, History, Languages, Arts, Philosophy' },
                          { value: 'Professional Programs (Law, Medicine)', label: 'Professional Programs', icon: '⚖️', desc: 'Law, Medical School, Dental School' }
                        ] as option}
                          <button
                            type="button"
                            onclick={() => formData.fieldOfStudy = option.value}
                            class="w-full p-3 text-left border-2 rounded-lg transition-all {
                              formData.fieldOfStudy === option.value
                                ? 'border-blue-500 bg-blue-100 text-blue-900 font-semibold'
                                : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                            }"
                          >
                            <div class="flex items-center gap-3">
                              {#if formData.fieldOfStudy === option.value}
                                <svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                </svg>
                              {/if}
                              <div class="flex-1">
                                <p class="font-semibold">{option.label}</p>
                                <p class="text-xs text-gray-600">{option.desc}</p>
                              </div>
                            </div>
                          </button>
                        {/each}
                      </div>
                    </div>
                  {/if}
                  
                  <!-- PhD Pathway Preference -->
                  {#if formData.degreeLevel === 'phd'}
                    <div class="mb-6">
                      <label class="block text-sm font-semibold text-blue-900 mb-3">For your PhD journey, would you consider:</label>
                      <div class="space-y-2">
                        {#each [
                          { value: 'direct_phd', label: 'Direct PhD (Master\'s included in PhD program - most common in USA/Canada)' },
                          { value: 'masters_first', label: 'Master\'s first, then PhD (common in UK/Europe)' },
                          { value: 'flexible', label: 'I\'m flexible / Not sure yet' }
                        ] as option}
                          <button
                            type="button"
                            onclick={() => formData.pathwayPreference = option.value as any}
                            class="w-full p-3 text-left border-2 rounded-lg transition-all text-sm {
                              formData.pathwayPreference === option.value
                                ? 'border-blue-500 bg-blue-100 text-blue-900 font-semibold'
                                : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                            }"
                          >
                            <span class="flex items-center gap-2">
                              {#if formData.pathwayPreference === option.value}
                                <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                </svg>
                              {/if}
                              {option.label}
                            </span>
                          </button>
                        {/each}
                      </div>
                    </div>
                    
                    <!-- Master's Transcript Question -->
                    {#if formData.pathwayPreference === 'masters_first' || (formData.currentEducationLevel === 'master_completed')}
                      <div class="mb-4">
                        <label class="block text-sm font-semibold text-blue-900 mb-3">Do you have a Master's transcript?</label>
                        <div class="flex gap-4">
                          <button
                            type="button"
                            onclick={() => formData.hasMastersTranscript = true}
                            class="flex-1 p-3 border-2 rounded-lg transition-all {
                              formData.hasMastersTranscript === true
                                ? 'border-blue-500 bg-blue-100 text-blue-900 font-semibold'
                                : 'border-blue-200 hover:border-blue-300'
                            }"
                          >
                            Yes, I have it
                          </button>
                          <button
                            type="button"
                            onclick={() => formData.hasMastersTranscript = false}
                            class="flex-1 p-3 border-2 rounded-lg transition-all {
                              formData.hasMastersTranscript === false
                                ? 'border-blue-500 bg-blue-100 text-blue-900 font-semibold'
                                : 'border-blue-200 hover:border-blue-300'
                            }"
                          >
                            No, not yet
                          </button>
                        </div>
                      </div>
                    {/if}
                  {/if}
                </div>
              </div>
            </div>
          {/if}
        </div>
        {/if}
      </div>
    {/if}
    
    <!-- Navigation Buttons -->
    {#if !showIntro && currentStep > 0}
      <div class="flex justify-between items-center">
        {#if currentStep > 1}
          <button
            onclick={prevStep}
            class="px-6 py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back
          </button>
        {:else}
          <div></div>
        {/if}
        
        {#if currentStep < 5}
          <button
            onclick={nextStep}
            disabled={!canContinue()}
            class="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            Continue
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        {:else}
          <button
            onclick={calculateResults}
            disabled={!canContinue() || isSubmitting}
            class="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            {#if isSubmitting}
              <div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Calculating...
            {:else}
              See My Results
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            {/if}
          </button>
        {/if}
      </div>
    {/if}
    
    <!-- Trust Badges -->
    <div class="mt-8 text-center">
      <div class="flex items-center justify-center gap-8 text-sm text-gray-500">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          100% Free
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>
          No Signup Required
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
          </svg>
          Instant Results
        </div>
      </div>
    </div>
    
  </div>
</div>
