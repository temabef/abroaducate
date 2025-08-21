<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let { 
    embedded = false,
    onComplete = () => {},
    supabase = null
  } = $props();

  // Form State
  let currentStep = $state(1);
  let totalSteps = 5;
  
  // Step 1: Location Selection
  let selectedCity = $state('');
  let selectedState = $state('');
  let availableCities: any[] = $state([]);
  let loadingCities = $state(false);
  
  // Step 2: University Type
  let universityType = $state(''); // public, private, community
  let customTuition = $state('');
  let useCustomTuition = $state(false);
  
  // Step 3: Housing
  let housingType = $state(''); // dorm, shared, studio
  let customHousing = $state('');
  let useCustomHousing = $state(false);
  
  // Step 4: Lifestyle
  let lifestyleType = $state(''); // budget, average, comfortable
  let customFood = $state('');
  let useCustomFood = $state(false);
  
  // Step 5: Results & Lead Capture
  let email = $state('');
  let phone = $state('');
  let interestedInScholarships = $state(true);
  let interestedInLoans = $state(false);
  let interestedInConsultation = $state(false);
  
  // Calculation Results
  let calculationResult: any = $state(null);
  let isCalculating = $state(false);
  let showResults = $state(false);
  let showMonthly = $state(false);
  
  // Authentication
  let isUserAuthenticated = $state(false);
  let showAuthModal = $state(false);
  
  // Tracking
  let sessionId = $state('');
  let startTime = $state(0);

  onMount(() => {
    if (browser) {
      // Generate session ID for anonymous tracking
      sessionId = 'calc_' + Math.random().toString(36).substr(2, 9);
      startTime = Date.now();
      
      // Load cities data
      loadCitiesData();
      
      // Track page entry
      trackUsage('started');
      
      // Check authentication status
      checkAuthentication();
      
      // Listen for restore calculation event
      window.addEventListener('restore-calculation', handleRestoreCalculation);
    }
  });

  async function checkAuthentication() {
    if (!supabase) return;
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      isUserAuthenticated = !error && !!session?.user;
      
      // Store calculation data in session storage for persistence
      if (browser && calculationResult && !isUserAuthenticated) {
        sessionStorage.setItem('pendingCalculation', JSON.stringify({
          result: calculationResult,
          preferences: {
            universityType,
            housingType,
            lifestyleType,
            selectedCity,
            selectedState
          },
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      isUserAuthenticated = false;
    }
  }

  function restoreCalculationFromData(data: any) {
    try {
      const { result, preferences } = data;
      
      // Restore form preferences
      if (preferences) {
        selectedCity = preferences.selectedCity || '';
        selectedState = preferences.selectedState || '';
        universityType = preferences.universityType || '';
        housingType = preferences.housingType || '';
        lifestyleType = preferences.lifestyleType || '';
      }
      
      // Restore calculation result
      if (result) {
        calculationResult = result;
        showResults = true;
        currentStep = totalSteps; // Go to results step
        
        // Track restoration
        trackUsage('calculation_restored', {
          city: result.city,
          total_cost: result.totalCost
        });
      }
    } catch (error) {
      console.error('Error restoring calculation data:', error);
    }
  }

  function handleRestoreCalculation(event: any) {
    const { result, preferences, timestamp } = event.detail;
    restoreCalculationFromData({ result, preferences });
  }

  async function loadCitiesData() {
    if (!supabase) return;
    
    loadingCities = true;
    try {
      const { data, error } = await supabase
        .from('us_cities_cost_data')
        .select('city, state, state_code, cost_of_living_index, popular_universities')
        .order('cost_of_living_index', { ascending: true });
      
      if (error) throw error;
      availableCities = data || [];
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      loadingCities = false;
    }
  }

  async function trackUsage(action: string, additionalData: any = {}) {
    if (!supabase || !browser) return;
    
    try {
      await supabase
        .from('budget_calculator_usage')
        .insert({
          session_id: sessionId,
          steps_completed: currentStep - 1,
          total_steps: totalSteps,
          time_spent_seconds: Math.floor((Date.now() - startTime) / 1000),
          ...additionalData
        });
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }

  // Navigation functions moved to later in the file

  // Accessibility helpers for option cards acting as radios
  function onOptionKeydown(event: KeyboardEvent, selectFn: () => void) {
    const key = event.key;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      selectFn();
    }
  }

  // City typeahead handler: expects value as "City, State"
  function handleCityInputChange(value: string) {
    const parts = value.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
      const [city, state] = [parts[0], parts[1]];
      const found = availableCities.find((c) =>
        c.city.toLowerCase() === city.toLowerCase() &&
        (c.state?.toLowerCase() === state.toLowerCase() || c.state_code?.toLowerCase() === state.toLowerCase())
      );
      if (found) {
        selectedCity = found.city;
        selectedState = found.state;
      }
    }
  }

  function canProceed(): boolean {
    switch (currentStep) {
      case 1:
        return !!(selectedCity && selectedState);
      case 2:
        return !!(universityType || useCustomTuition);
      case 3:
        return !!(housingType || useCustomHousing);
      case 4:
        return !!(lifestyleType || useCustomFood);
      default:
        return false;
    }
  }

  async function calculateBudget() {
    if (!supabase) return;
    
    isCalculating = true;
    
    try {
      // Get city cost data
      const { data: cityData, error: cityError } = await supabase
        .rpc('get_city_cost_data', {
          p_city: selectedCity,
          p_state: selectedState
        });
      
      if (cityError) throw cityError;
      
      const cityInfo = cityData[0];
      if (!cityInfo) throw new Error('City data not found');
      
      // Calculate costs based on user selections
      const tuitionCost = useCustomTuition 
        ? parseFloat(customTuition) || 0
        : getTuitionCost(universityType, cityInfo.tuition_costs);
      
      const housingCost = useCustomHousing
        ? parseFloat(customHousing) || 0
        : getHousingCost(housingType, cityInfo.housing_costs);
      
      const foodCost = useCustomFood
        ? parseFloat(customFood) || 0
        : getFoodCost(lifestyleType, cityInfo.living_costs);
      
      const personalCost = cityInfo.living_costs.personal || 200;
      const transportationCost = cityInfo.living_costs.transportation || 100;
      const insuranceCost = cityInfo.additional_costs.health_insurance || 2000;
      const booksCost = cityInfo.additional_costs.books_supplies || 1200;
      
      // Calculate totals
      const monthlyLiving = housingCost + foodCost + personalCost + transportationCost;
      const annualLiving = monthlyLiving * 12;
      const totalAnnual = tuitionCost + annualLiving + insuranceCost + booksCost;
      const total4Year = totalAnnual * 4;
      
      calculationResult = {
        city: selectedCity,
        state: selectedState,
        universityType,
        housingType,
        lifestyleType,
        
        // Annual costs
        tuition: tuitionCost,
        housing: housingCost * 12,
        food: foodCost * 12,
        personal: personalCost * 12,
        transportation: transportationCost * 12,
        insurance: insuranceCost,
        books: booksCost,
        
        // Monthly costs
        monthlyHousing: housingCost,
        monthlyFood: foodCost,
        monthlyPersonal: personalCost,
        monthlyTransportation: transportationCost,
        monthlyTotal: Math.ceil(totalAnnual / 12),
        
        // Totals
        totalAnnual: Math.ceil(totalAnnual),
        total4Year: Math.ceil(total4Year),
        
        // Metadata
        cityInfo: cityInfo.metadata,
        savingsTips: generateSavingsTips(totalAnnual),
        scholarshipEstimate: Math.min(totalAnnual * 0.4, 25000) // Up to 40% or $25k
      };
      
      // Save calculation to database
      if (supabase) {
        await supabase
          .from('budget_calculations')
          .insert({
            session_id: sessionId,
            city: selectedCity,
            state: selectedState,
            university_type: universityType,
            housing_type: housingType,
            lifestyle: lifestyleType,
            tuition_annual: tuitionCost,
            housing_monthly: housingCost,
            food_monthly: foodCost,
            personal_monthly: personalCost,
            transportation_monthly: transportationCost,
            insurance_annual: insuranceCost,
            books_annual: booksCost,
            total_annual: calculationResult.totalAnnual,
            total_4_year: calculationResult.total4Year,
            monthly_budget: calculationResult.monthlyTotal
          });
      }
      
      showResults = true;
      trackUsage('calculation_completed', { 
        total_annual: calculationResult.totalAnnual,
        city: selectedCity,
        state: selectedState
      });
      
    } catch (error) {
      console.error('Error calculating budget:', error);
    } finally {
      isCalculating = false;
    }
  }

  function getTuitionCost(type: string, tuitionData: any): number {
    const costs = tuitionData[type];
    if (!costs) return 25000; // Default
    return (costs.min + costs.max) / 2;
  }

  function getHousingCost(type: string, housingData: any): number {
    const costs = housingData[type];
    if (!costs) return 1000; // Default
    return (costs.min + costs.max) / 2;
  }

  function getFoodCost(type: string, livingData: any): number {
    return livingData.food[type] || 500; // Default
  }

  function generateSavingsTips(totalAnnual: number): string[] {
    const tips = [
      `Apply for scholarships to save up to $${Math.floor(totalAnnual * 0.4).toLocaleString()}/year`,
      'Choose shared housing to save $400-800/month',
      'Buy used textbooks to save $500-1,000/year',
      'Use student discounts for transportation and food',
      'Consider in-state tuition if eligible',
      'Look into graduate assistantships for funding'
    ];
    
    return tips.slice(0, 4); // Return top 4 tips
  }

  async function captureEmail() {
    if (!email.trim()) return;
    
    try {
      // Update the calculation record with email
      if (supabase && calculationResult) {
        await supabase
          .from('budget_calculations')
          .update({
            email: email.trim(),
            phone: phone.trim(),
            interested_in_scholarships: interestedInScholarships,
            interested_in_loans: interestedInLoans,
            interested_in_consultation: interestedInConsultation
          })
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1);
      }
      
      trackUsage('email_captured', { 
        email: email.trim(),
        interested_in_scholarships: interestedInScholarships,
        interested_in_loans: interestedInLoans,
        interested_in_consultation: interestedInConsultation
      });
      
      // Trigger parent callback
      onComplete(calculationResult, email.trim());
      
    } catch (error) {
      console.error('Error capturing email:', error);
    }
  }

  async function generatePDFReport() {
    if (!calculationResult) return;
    
    try {
      // Track PDF generation
      trackUsage('pdf_generated', {
        city: calculationResult.city,
        total_cost: calculationResult.totalCost,
        user_authenticated: true
      });
      
      // Call PDF generation API
      const response = await fetch('/api/budget-calculator/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calculation: calculationResult,
          user_preferences: {
            university_type: universityType,
            housing_type: housingType,
            lifestyle_type: lifestyleType
          }
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `US-Budget-Plan-${calculationResult.city}-${calculationResult.state}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Unable to generate PDF at the moment. Please try again later.');
    }
  }

  async function saveCalculation() {
    if (!calculationResult) return;
    
    try {
      // Track calculation save
      trackUsage('calculation_saved', {
        city: calculationResult.city,
        total_cost: calculationResult.totalCost
      });
      
      // Save to user's dashboard
      const response = await fetch('/api/budget-calculator/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calculation: calculationResult,
          user_preferences: {
            university_type: universityType,
            housing_type: housingType,
            lifestyle_type: lifestyleType
          },
          created_at: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        alert('✅ Calculation saved to your dashboard!');
      } else {
        throw new Error('Failed to save calculation');
      }
    } catch (error) {
      console.error('Error saving calculation:', error);
      alert('Unable to save calculation. Please try again later.');
    }
  }

  function showLoginModal() {
    // Store calculation data in session
    if (browser && calculationResult) {
      sessionStorage.setItem('pendingCalculation', JSON.stringify({
        result: calculationResult,
        preferences: {
          universityType,
          housingType,
          lifestyleType,
          selectedCity,
          selectedState
        },
        timestamp: Date.now()
      }));
    }
    
    // Dispatch event to trigger global auth modal
    window.dispatchEvent(new CustomEvent('show-auth-modal', {
      detail: { mode: 'login', returnUrl: '/budget-calculator?showResults=true' }
    }));
  }

  function showSignupModal() {
    // Store calculation data in session
    if (browser && calculationResult) {
      sessionStorage.setItem('pendingCalculation', JSON.stringify({
        result: calculationResult,
        preferences: {
          universityType,
          housingType,
          lifestyleType,
          selectedCity,
          selectedState
        },
        timestamp: Date.now()
      }));
    }
    
    // Dispatch event to trigger global auth modal
    window.dispatchEvent(new CustomEvent('show-auth-modal', {
      detail: { mode: 'signup', returnUrl: '/budget-calculator?showResults=true' }
    }));
  }

  function resetCalculator() {
    currentStep = 1;
    selectedCity = '';
    selectedState = '';
    universityType = '';
    housingType = '';
    lifestyleType = '';
    showResults = false;
    calculationResult = null;
    isCalculating = false;
    
    // Clear session storage
    if (browser) {
      sessionStorage.removeItem('pendingCalculation');
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function getStepTitle(step: number): string {
    const titles = [
      '', // 0 index
      'Choose Your Destination',
      'Select University Type', 
      'Housing Preferences',
      'Lifestyle Choice',
      'Your Budget Results'
    ];
    return titles[step] || '';
  }

  // Get popular cities for quick selection
  let popularCities = $derived(
    availableCities
      .filter(city => city.popular_universities?.length > 0)
      .sort((a, b) => a.cost_of_living_index - b.cost_of_living_index)
      .slice(0, 8)
  );

  // Navigation functions with scroll-to-top
  function nextStep() {
    if (canProceed()) {
      currentStep++;
      trackUsage('step_completed', { step: currentStep - 1 });
      scrollToTop();
      
      // Trigger calculation when reaching the final step
      if (currentStep === totalSteps) {
        calculateBudget();
      }
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
      scrollToTop();
    }
  }

  function scrollToTop() {
    if (browser) {
      try {
        // Scroll to the top of the calculator with smooth animation
        const calculatorElement = document.querySelector('.budget-calculator');
        if (calculatorElement) {
          calculatorElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        } else {
          // Fallback to window scroll
          window.scrollTo({ 
            top: 0, 
            behavior: 'smooth' 
          });
        }
      } catch (error) {
        // Fallback for browsers that don't support smooth scrolling
        console.warn('Smooth scrolling not supported:', error);
        window.scrollTo(0, 0);
      }
    }
  }
</script>

<div class="budget-calculator {embedded ? 'embedded' : 'standalone'}">
  <!-- Progress Bar -->
  <div class="progress-container" aria-label="Progress">
    <div class="progress-bar">
      <div class="progress-fill" style="width: {(currentStep / totalSteps) * 100}%"></div>
    </div>
    <div class="progress-text" aria-live="polite">
      Step {currentStep} of {totalSteps} ({Math.round((currentStep/totalSteps)*100)}%): {getStepTitle(currentStep)}
    </div>
  </div>

  <!-- Step Content -->
  <div class="step-content">
    
    {#if currentStep === 1}
      <!-- Step 1: Location Selection -->
      <div class="step-card">
        <div class="step-header">
          <div class="step-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="step-title">
            <h2>Choose Your Study Destination</h2>
            <p class="step-description">Select the city where you plan to study. This affects housing, food, and transportation costs.</p>
          </div>
        </div>
        
        {#if loadingCities}
          <div class="loading">Loading cities data...</div>
        {:else}
          <!-- Accessible City Typeahead -->
          <div class="typeahead">
            <label class="sr-only" for="cityTypeahead">City, State</label>
            <input id="cityTypeahead" class="search-input" type="text" placeholder="Search (e.g., Columbus, OH)" oninput={(e) => handleCityInputChange((e.target as HTMLInputElement).value)} />
          </div>

          <!-- Popular Cities Quick Select -->
          <div class="popular-cities">
            <div class="section-header">
              <div class="section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </div>
              <h3>Popular Study Destinations</h3>
            </div>
            <div class="city-grid">
              {#each popularCities as city}
                <button 
                  class="city-card {selectedCity === city.city && selectedState === city.state ? 'selected' : ''}"
                  onclick={() => {
                    selectedCity = city.city;
                    selectedState = city.state;
                  }}
                >
                  <div class="city-info">
                    <div class="city-name">{city.city}, {city.state_code}</div>
                    <div class="city-details">
                      <div class="detail-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span>{city.cost_of_living_index}</span>
                      </div>
                      <div class="detail-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                        </svg>
                        <span>{city.popular_universities?.length || 0} Unis</span>
                      </div>
                    </div>
                  </div>
                </button>
              {/each}
            </div>
          </div>
          
          <!-- Custom City Selection -->
          <div class="custom-selection">
            <h3>Or Choose Any US City</h3>
            <div class="input-group">
              <select bind:value={selectedState} onchange={() => selectedCity = ''}>
                <option value="">Select State</option>
                {#each [...new Set(availableCities.map(c => c.state))].sort() as state}
                  <option value={state}>{state}</option>
                {/each}
              </select>
              
              {#if selectedState}
                <select bind:value={selectedCity}>
                  <option value="">Select City</option>
                  {#each availableCities.filter(c => c.state === selectedState) as city}
                    <option value={city.city}>{city.city}</option>
                  {/each}
                </select>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    
    {:else if currentStep === 2}
      <!-- Step 2: University Type -->
      <div class="step-card">
        <div class="step-header">
          <div class="step-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div class="step-title">
            <h2>University Type</h2>
            <p class="step-description">Different university types have different tuition costs. Choose what fits your plans.</p>
          </div>
        </div>
        
        <fieldset class="option-grid" aria-labelledby="university-type-legend" role="radiogroup">
          <legend id="university-type-legend" class="sr-only">University type</legend>
          <button
            role="radio"
            aria-checked={universityType === 'public'}
            tabindex="0"
            onkeydown={(e) => onOptionKeydown(e, () => universityType = 'public')}
            class="option-card {universityType === 'public' ? 'selected' : ''}"
            onclick={() => universityType = 'public'}
          >
            <div class="option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 6h16M4 12h16M4 18h16"/>
                <path d="M2 4h20v16H2z"/>
              </svg>
            </div>
            <div class="option-title">Public University</div>
            <div class="option-cost">$15,000 - $35,000/year</div>
            <div class="option-desc">State-funded universities with lower tuition for residents</div>
          </button>

          <button
            role="radio"
            aria-checked={universityType === 'private'}
            tabindex="0"
            onkeydown={(e) => onOptionKeydown(e, () => universityType = 'private')}
            class="option-card {universityType === 'private' ? 'selected' : ''}"
            onclick={() => universityType = 'private'}
          >
            <div class="option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/>
                <path d="M17.5 6.5h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
              </svg>
            </div>
            <div class="option-title">Private University</div>
            <div class="option-cost">$25,000 - $55,000/year</div>
            <div class="option-desc">Privately funded with typically higher tuition</div>
          </button>

          <button
            role="radio"
            aria-checked={universityType === 'community'}
            tabindex="0"
            onkeydown={(e) => onOptionKeydown(e, () => universityType = 'community')}
            class="option-card {universityType === 'community' ? 'selected' : ''}"
            onclick={() => universityType = 'community'}
          >
            <div class="option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div class="option-title">Community College</div>
            <div class="option-cost">$8,000 - $15,000/year</div>
            <div class="option-desc">2-year programs and transfer preparation</div>
          </button>
        </fieldset>
        
        <!-- Custom Tuition Option -->
        <div class="custom-option">
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={useCustomTuition} />
            I know the exact tuition cost
          </label>
          
          {#if useCustomTuition}
            <input 
              type="number" 
              bind:value={customTuition}
              placeholder="Enter annual tuition in USD"
              class="custom-input"
            />
          {/if}
        </div>
      </div>
    
    {:else if currentStep === 3}
      <!-- Step 3: Housing -->
      <div class="step-card">
        <div class="step-header">
          <div class="step-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
          </div>
          <h2>Housing Preferences</h2>
        </div>
        <p class="step-description">Housing is usually your biggest expense. Choose what fits your budget and lifestyle.</p>
        
        <div class="option-grid">
          <button 
            class="option-card {housingType === 'dorm' ? 'selected' : ''}"
            role="radio"
            aria-checked={housingType === 'dorm'}
            tabindex="0"
            onkeydown={(e) => onOptionKeydown(e, () => housingType = 'dorm')}
            onclick={() => housingType = 'dorm'}
          >
            <div class="option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 10l9-6 9 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <path d="M9 22V12h6v10"/>
              </svg>
            </div>
            <div class="option-title">On-Campus Dorm</div>
            <div class="option-cost">$800 - $1,500/month</div>
            <div class="option-desc">University housing with meal plans included</div>
          </button>
          
          <button 
            class="option-card {housingType === 'shared' ? 'selected' : ''}"
            role="radio"
            aria-checked={housingType === 'shared'}
            tabindex="0"
            onkeydown={(e) => onOptionKeydown(e, () => housingType = 'shared')}
            onclick={() => housingType = 'shared'}
          >
            <div class="option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="7" r="4"/>
                <circle cx="17" cy="11" r="3"/>
                <path d="M2 22v-2a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v2"/>
                <path d="M14 22v-1.5a4.5 4.5 0 0 0-4.5-4.5H9"/>
              </svg>
            </div>
            <div class="option-title">Shared Apartment</div>
            <div class="option-cost">$600 - $1,200/month</div>
            <div class="option-desc">Split rent and utilities with roommates</div>
          </button>
          
          <button 
            class="option-card {housingType === 'studio' ? 'selected' : ''}"
            onclick={() => housingType = 'studio'}
          >
            <div class="option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
            </div>
            <div class="option-title">Studio Apartment</div>
            <div class="option-cost">$1,000 - $2,500/month</div>
            <div class="option-desc">Your own private space</div>
          </button>
        </div>
        
        <!-- Custom Housing Option -->
        <div class="custom-option">
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={useCustomHousing} />
            I know my exact housing cost
          </label>
          
          {#if useCustomHousing}
            <input 
              type="number" 
              bind:value={customHousing}
              placeholder="Enter monthly housing cost in USD"
              class="custom-input"
            />
          {/if}
        </div>
      </div>
    
    {:else if currentStep === 4}
      <!-- Step 4: Lifestyle -->
      <div class="step-card">
        <div class="step-header">
          <div class="step-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21c0-.8-.63-1.45-1.25-2.05C17.75 17.84 16 17 16 17s-1.75.84-2.75 1.95C12.63 19.55 12 20.2 12 21"/>
              <path d="M8 21c0-.8.63-1.45 1.25-2.05C10.25 17.84 12 17 12 17s1.75.84 2.75 1.95C15.37 19.55 16 20.2 16 21"/>
              <path d="M4 21c0-.8.63-1.45 1.25-2.05C6.25 17.84 8 17 8 17s1.75.84 2.75 1.95C11.37 19.55 12 20.2 12 21"/>
              <path d="M12 13v8"/>
              <path d="M12 8c-2.5 0-4 1.5-4 4v1h8v-1c0-2.5-1.5-4-4-4z"/>
            </svg>
          </div>
          <h2>Lifestyle & Food Budget</h2>
        </div>
        <p class="step-description">How much do you plan to spend on food, entertainment, and personal expenses?</p>
        
        <div class="option-grid">
          <button 
            class="option-card {lifestyleType === 'budget' ? 'selected' : ''}"
            onclick={() => lifestyleType = 'budget'}
          >
            <div class="option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
              </svg>
            </div>
            <div class="option-title">Budget Student</div>
            <div class="option-cost">$300 - $500/month</div>
            <div class="option-desc">Cook at home, free entertainment, minimal dining out</div>
          </button>
          
          <button 
            class="option-card {lifestyleType === 'average' ? 'selected' : ''}"
            onclick={() => lifestyleType = 'average'}
          >
            <div class="option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 8h20l-2 12H4L2 8z"/>
                <path d="M16 16a3 3 0 0 1-6 0"/>
                <path d="M7 8V7a5 5 0 0 1 10 0v1"/>
              </svg>
            </div>
            <div class="option-title">Average Student</div>
            <div class="option-cost">$500 - $800/month</div>
            <div class="option-desc">Mix of cooking and dining out, some entertainment</div>
          </button>
          
          <button 
            class="option-card {lifestyleType === 'comfortable' ? 'selected' : ''}"
            onclick={() => lifestyleType = 'comfortable'}
          >
            <div class="option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 2v7c0 6 4 10 9 10s9-4 9-10V2"/>
                <path d="M7 15s4.5-8 9-8"/>
              </svg>
            </div>
            <div class="option-title">Comfortable Student</div>
            <div class="option-cost">$800 - $1,200/month</div>
            <div class="option-desc">Regular dining out, entertainment, shopping</div>
          </button>
        </div>
        
        <!-- Custom Food Option -->
        <div class="custom-option">
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={useCustomFood} />
            I have a specific food budget
          </label>
          
          {#if useCustomFood}
            <input 
              type="number" 
              bind:value={customFood}
              placeholder="Enter monthly food/personal budget in USD"
              class="custom-input"
            />
          {/if}
        </div>
      </div>
    
    {:else if currentStep === 5}
      <!-- Step 5: Results -->
      <div class="results-container">
        {#if isCalculating}
          <div class="calculating">
            <div class="spinner"></div>
            <p>Calculating your personalized budget...</p>
            <div class="calculating-details">
              <small>Analyzing costs for {selectedCity}, {selectedState}</small>
            </div>
          </div>
        {:else if showResults && calculationResult}
          <!-- Check if user is authenticated before showing results -->
          {#if isUserAuthenticated}
            <div class="results-content">
            <!-- Header -->
            <div class="results-header">
              <div class="results-title">
                <div class="results-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 20V10"/>
                    <path d="M12 20V4"/>
                    <path d="M6 20v-6"/>
                  </svg>
                </div>
                <h2>Your US Study Budget</h2>
              </div>
              <div class="location-info">
                <strong>{calculationResult.city}, {calculationResult.state}</strong>
                • {calculationResult.universityType.charAt(0).toUpperCase() + calculationResult.universityType.slice(1)} University
              </div>
            </div>
            
            <!-- Smart Toggle -->
            <div class="toggle-section">
              <div class="smart-toggle">
                <div class="toggle-track">
                  <div class="toggle-slider" class:monthly={showMonthly}></div>
                  <button 
                    class="toggle-option"
                    class:active={!showMonthly}
                    onclick={() => { 
                      showMonthly = false;
                      console.log('Switched to Annual view', showMonthly);
                    }}
                  >
                    Annual
                  </button>
                  <button 
                    class="toggle-option"
                    class:active={showMonthly}
                    onclick={() => { 
                      showMonthly = true;
                      console.log('Switched to Monthly view', showMonthly);
                    }}
                  >
                    Monthly
                  </button>
                </div>
              </div>
            </div>

            <div class="key-numbers">
              <div class="number-card primary">
                <div class="number-label">{showMonthly ? 'Total Monthly Cost' : 'Total Annual Cost'}</div>
                <div class="number-value">{showMonthly ? formatCurrency(calculationResult.monthlyTotal) : formatCurrency(calculationResult.totalAnnual)}</div>
              </div>
              <div class="number-card">
                <div class="number-label">{showMonthly ? 'Housing + Food (mo.)' : '4-Year Total'}</div>
                <div class="number-value">{showMonthly ? formatCurrency(calculationResult.monthlyHousing + calculationResult.monthlyFood + calculationResult.monthlyPersonal + calculationResult.monthlyTransportation) : formatCurrency(calculationResult.total4Year)}</div>
              </div>
              <div class="number-card">
                <div class="number-label">{showMonthly ? 'Tuition (mo. equivalent)' : 'Monthly Budget'}</div>
                <div class="number-value">{showMonthly ? formatCurrency(Math.ceil((calculationResult.tuition + calculationResult.insurance + calculationResult.books) / 12)) : formatCurrency(calculationResult.monthlyTotal)}</div>
              </div>
            </div>
            
            <!-- Cost Breakdown -->
            <div class="cost-breakdown">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; display: inline; margin-right: 8px;">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                </svg>
                Annual Cost Breakdown
              </h3>
              <div class="breakdown-grid">
                <div class="breakdown-item">
                  <span class="breakdown-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; display: inline; margin-right: 8px;">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    Tuition & Fees
                  </span>
                  <span class="breakdown-value">{formatCurrency(calculationResult.tuition)}</span>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; display: inline; margin-right: 8px;">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9,22 9,12 15,12 15,22"/>
                    </svg>
                    Housing
                  </span>
                  <span class="breakdown-value">{formatCurrency(calculationResult.housing)}</span>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; display: inline; margin-right: 8px;">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Food & Living
                  </span>
                  <span class="breakdown-value">{formatCurrency(calculationResult.food + calculationResult.personal)}</span>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; display: inline; margin-right: 8px;">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    Health Insurance
                  </span>
                  <span class="breakdown-value">{formatCurrency(calculationResult.insurance)}</span>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; display: inline; margin-right: 8px;">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    Books & Supplies
                  </span>
                  <span class="breakdown-value">{formatCurrency(calculationResult.books)}</span>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; display: inline; margin-right: 8px;">
                      <path d="M8 16h8M8 12h8M8 8h8M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
                    </svg>
                    Transportation
                  </span>
                  <span class="breakdown-value">{formatCurrency(calculationResult.transportation)}</span>
                </div>
              </div>
            </div>
            
            <!-- Savings Tips -->
            <div class="savings-tips">
              <h3>💡 Smart Money-Saving Tips</h3>
              <ul class="tips-list">
                {#each calculationResult.savingsTips as tip}
                  <li>{tip}</li>
                {/each}
              </ul>
            </div>
            
            <!-- Scholarship Potential -->
            <div class="scholarship-potential">
              <div class="scholarship-card">
                <div class="scholarship-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <div class="scholarship-content">
                  <h4>Scholarship Opportunity</h4>
                  <p>You could potentially save up to <strong>{formatCurrency(calculationResult.scholarshipEstimate)}</strong> per year through scholarships!</p>
                </div>
              </div>
            </div>
            
            <!-- Improved Action Buttons -->
            <div class="action-buttons-section">
              <div class="action-buttons-grid">
                <!-- Try Another City -->
                <button onclick={() => resetCalculator()} class="action-button primary">
                  <div class="action-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="1,4 1,10 7,10"/>
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                    </svg>
                  </div>
                  <div class="action-content">
                    <span class="action-title">Try Another City</span>
                    <span class="action-subtitle">Calculate for different location</span>
                  </div>
                </button>

                <!-- Browse Scholarships -->
                <button onclick={() => window.open('/scholarships', '_blank')} class="action-button secondary">
                  <div class="action-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                  </div>
                  <div class="action-content">
                    <span class="action-title">Browse Scholarships</span>
                    <span class="action-subtitle">Find funding opportunities</span>
                  </div>
                </button>

                <!-- GPA Converter -->
                <button onclick={() => window.open('/gpa-converter', '_blank')} class="action-button secondary">
                  <div class="action-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                      <line x1="9" y1="21" x2="9" y2="9"/>
                      <path d="M14 15l3 3m0-3l-3 3"/>
                    </svg>
                  </div>
                  <div class="action-content">
                    <span class="action-title">GPA Converter</span>
                    <span class="action-subtitle">Convert your grades to US scale</span>
                  </div>
                </button>

                <!-- Visa Interview Practice -->
                <button onclick={() => window.open('/visa-interview-practice', '_blank')} class="action-button secondary">
                  <div class="action-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="6"/>
                      <circle cx="12" cy="12" r="2"/>
                    </svg>
                  </div>
                  <div class="action-content">
                    <span class="action-title">Visa Interview Prep</span>
                    <span class="action-subtitle">Practice F-1 visa questions</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
          {:else}
            <!-- Enhanced Login Gate with Blurred Results Preview -->
            <div class="auth-gate-container">
              <!-- Background Results Preview (Blurred) -->
              <div class="blurred-results-preview">
                <div class="preview-header">
                  <div class="preview-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 20V10"/>
                      <path d="M12 20V4"/>
                      <path d="M6 20v-6"/>
                    </svg>
                  </div>
                  <div class="preview-title">
                    <h2>Your US Study Budget</h2>
                    <p class="preview-location">{calculationResult.city}, {calculationResult.state}</p>
                  </div>
                </div>
                
                <div class="preview-numbers">
                  <div class="number-highlight">
                    <div class="number-value">{formatCurrency(calculationResult.totalAnnual)}</div>
                    <div class="number-label">Total Annual Cost</div>
                  </div>
                  <div class="number-grid">
                    <div class="number-item">
                      <span class="mini-value">{formatCurrency(calculationResult.total4Year)}</span>
                      <span class="mini-label">4-Year Total</span>
                    </div>
                    <div class="number-item">
                      <span class="mini-value">{formatCurrency(calculationResult.monthlyTotal)}</span>
                      <span class="mini-label">Monthly Budget</span>
                    </div>
                  </div>
                </div>

                <div class="preview-breakdown">
                  <div class="breakdown-item">
                    <div class="breakdown-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                      </svg>
                    </div>
                    <div class="breakdown-details">
                      <span class="breakdown-label">Tuition & Fees</span>
                      <span class="breakdown-value">{formatCurrency(calculationResult.tuition)}</span>
                    </div>
                  </div>
                  <div class="breakdown-item">
                    <div class="breakdown-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9,22 9,12 15,12 15,22"/>
                      </svg>
                    </div>
                    <div class="breakdown-details">
                      <span class="breakdown-label">Housing & Living</span>
                      <span class="breakdown-value">{formatCurrency(calculationResult.housing + calculationResult.food)}</span>
                    </div>
                  </div>
                  <div class="breakdown-item">
                    <div class="breakdown-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <div class="breakdown-details">
                      <span class="breakdown-label">Scholarship Potential</span>
                      <span class="breakdown-value scholarship-highlight">-{formatCurrency(calculationResult.scholarshipEstimate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Auth Gate Overlay -->
              <div class="auth-gate-overlay">
                <div class="auth-gate-content">
                  <div class="auth-gate-header">
                    <div class="gate-success-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    <h3>Your Budget is Ready!</h3>
                    <p class="gate-description">
                      We've calculated your complete financial plan for studying in 
                      <strong>{calculationResult.city}, {calculationResult.state}</strong>
                    </p>
                  </div>

                  <div class="auth-benefits">
                    <div class="benefit-item">
                      <div class="benefit-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M9 12l2 2 4-4"/>
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                      </div>
                      <span>Detailed cost breakdown by category</span>
                    </div>
                    <div class="benefit-item">
                      <div class="benefit-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M9 12l2 2 4-4"/>
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                      </div>
                      <span>Personalized scholarship recommendations</span>
                    </div>
                    <div class="benefit-item">
                      <div class="benefit-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M9 12l2 2 4-4"/>
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                      </div>
                      <span>Downloadable PDF report for visa applications</span>
                    </div>
                  </div>

                  <div class="auth-actions">
                    <button onclick={showSignupModal} class="primary-auth-btn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <line x1="19" y1="8" x2="19" y2="14"/>
                        <line x1="22" y1="11" x2="16" y2="11"/>
                      </svg>
                      Create Free Account & View Results
                    </button>
                    
                    <button onclick={showLoginModal} class="secondary-auth-btn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                        <polyline points="10,17 15,12 10,7"/>
                        <line x1="15" y1="12" x2="3" y2="12"/>
                      </svg>
                      Already have an account? Sign In
                    </button>
                  </div>

                  <div class="auth-assurance">
                    <div class="assurance-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <circle cx="12" cy="16" r="1"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      <span>100% Free • No Credit Card Required</span>
                    </div>
                    <div class="assurance-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      <span>Instant Access • Join 10,000+ Students</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    {/if}
  </div>
  
  <!-- Navigation Buttons -->
  <div class="navigation-buttons">
    {#if currentStep > 1 && currentStep < 5}
      <button onclick={prevStep} class="nav-button secondary">
        ← Previous
      </button>
    {/if}
    
    {#if currentStep < 4}
      <button 
        onclick={nextStep} 
        class="nav-button primary"
        disabled={!canProceed()}
      >
        Next →
      </button>
    {:else if currentStep === 4}
      <button 
        onclick={nextStep} 
        class="nav-button primary"
        disabled={!canProceed()}
      >
        Calculate Budget
      </button>
    {/if}
  </div>
</div>

<style>
  /* Main Calculator Container */
  .budget-calculator {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .budget-calculator.standalone {
    margin: 2rem auto;
  }

  .budget-calculator.embedded {
    margin: 0;
    box-shadow: none;
    border-radius: 12px;
  }

  /* Step Container with Animation */
  .step-card {
    padding: 2rem;
    min-height: 500px;
    animation: slideInUp 0.4s ease-out;
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Modern Icon-Based Design */
  .step-header {
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .step-icon {
    flex-shrink: 0;
    width: 3rem;
    height: 3rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .step-icon svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  .step-title h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.2;
  }

  .step-description {
    margin: 0;
    color: #6b7280;
    font-size: 1rem;
    line-height: 1.5;
  }

  /* Section Headers */
  .section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .section-icon {
    width: 1.5rem;
    height: 1.5rem;
    color: #667eea;
  }

  .section-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
  }

  /* City Cards Redesign */
  .city-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
  }

  .city-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.2s ease;
    cursor: pointer;
    text-align: left;
  }

  .city-card:hover {
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    transform: translateY(-2px);
  }

  .city-card.selected {
    border-color: #667eea;
    background: linear-gradient(135deg, #667eea05 0%, #764ba205 100%);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  }

  .city-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .city-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }

  .city-details {
    display: flex;
    gap: 1rem;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .detail-item svg {
    width: 1rem;
    height: 1rem;
    color: #9ca3af;
  }

  /* Option Cards Redesign */
  .option-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .option-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
    transition: all 0.2s ease;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .option-card:hover {
    border-color: #667eea;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
    transform: translateY(-3px);
  }

  .option-card.selected {
    border-color: #667eea;
    background: linear-gradient(135deg, #667eea08 0%, #764ba208 100%);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.25);
  }

  .option-icon {
    width: 3.5rem;
    height: 3.5rem;
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #667eea;
    transition: all 0.2s ease;
  }

  .option-card.selected .option-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .option-icon svg {
    width: 1.75rem;
    height: 1.75rem;
  }

  .option-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .option-cost {
    font-size: 1rem;
    font-weight: 600;
    color: #059669;
    margin: 0;
  }

  .option-desc {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.4;
  }

  .budget-calculator {
    max-width: 900px;
    margin: 0 auto;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .embedded {
    max-width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 2rem;
    background: white;
  }

  /* Progress Bar */
  .progress-container {
    margin-bottom: 2rem;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    transition: width 0.3s ease;
  }

  .progress-text {
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* Step Content */
  .step-content {
    min-height: 500px;
  }

  .step-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .step-card h2 {
    color: #1f2937;
    margin-bottom: 0.5rem;
    font-size: 1.75rem;
    font-weight: 700;
  }

  .step-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .step-header .step-icon {
    flex-shrink: 0;
    width: 3rem;
    height: 3rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .step-header .step-icon svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  .step-header h2 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
  }

  .results-title {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .results-icon {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .results-icon svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .results-title h2 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
  }

  .step-description {
    color: #6b7280;
    margin-bottom: 2rem;
    font-size: 1.1rem;
    line-height: 1.6;
  }

  /* City Selection */
  .popular-cities {
    margin-bottom: 2rem;
  }

  .popular-cities h3 {
    color: #374151;
    margin-bottom: 1rem;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .city-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .city-card {
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .city-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  .city-card.selected {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .city-name {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .city-cost {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .city-universities {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 0.25rem;
  }

  /* Custom Selection */
  .custom-selection {
    border-top: 1px solid #e5e7eb;
    padding-top: 2rem;
  }

  .custom-selection h3 {
    color: #374151;
    margin-bottom: 1rem;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .input-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .input-group select {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    background: white;
  }

  .input-group select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Option Grid */
  .option-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .option-card {
    padding: 1.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
  }

  .option-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
  }

  .option-card.selected {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .option-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .option-title {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
    font-size: 1.125rem;
  }

  .option-cost {
    color: #059669;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .option-desc {
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.4;
  }

  /* Custom Options */
  .custom-option {
    border-top: 1px solid #e5e7eb;
    padding-top: 1.5rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    margin-bottom: 1rem;
  }

  .custom-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
  }

  .custom-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Results */
  .results-container {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .calculating {
    text-align: center;
    padding: 4rem 2rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-left-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .results-content {
    padding: 2rem;
  }

  /* Smart Toggle Section */
  .toggle-section {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 2rem;
    padding: 1rem 0;
  }

  .smart-toggle {
    background: linear-gradient(145deg, #f8fafc, #e2e8f0);
    border-radius: 16px;
    padding: 8px;
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }

  .toggle-track {
    position: relative;
    display: flex;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 4px;
    min-width: 200px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .toggle-slider {
    position: absolute;
    top: 4px;
    left: 4px;
    width: calc(50% - 4px);
    height: calc(100% - 8px);
    background: linear-gradient(135deg, #3b82f6, #1e40af);
    border-radius: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 
      0 4px 12px rgba(59, 130, 246, 0.4),
      0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 1;
  }

  .toggle-slider.monthly {
    transform: translateX(100%);
  }

  .toggle-option {
    flex: 1;
    border: none;
    background: transparent;
    padding: 12px 16px;
    color: #64748b;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.3s ease;
    position: relative;
    z-index: 2;
  }

  .toggle-option.active {
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .toggle-option:not(.active):hover {
    color: #475569;
    background: rgba(59, 130, 246, 0.1);
  }

  .results-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .results-header h2 {
    color: #1f2937;
    margin-bottom: 0.5rem;
    font-size: 2rem;
    font-weight: 700;
  }

  .location-info {
    color: #6b7280;
    font-size: 1.1rem;
  }

  /* Key Numbers */
  .key-numbers {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .number-card {
    text-align: center;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .number-card.primary {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border: none;
  }

  .number-label {
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    opacity: 0.9;
  }

  .number-value {
    font-size: 1.75rem;
    font-weight: 700;
  }

  /* Cost Breakdown */
  .cost-breakdown {
    margin-bottom: 2rem;
  }

  .cost-breakdown h3 {
    color: #1f2937;
    margin-bottom: 1rem;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .breakdown-grid {
    display: grid;
    gap: 0.75rem;
  }

  .breakdown-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 6px;
  }

  .breakdown-label {
    font-weight: 500;
    color: #374151;
  }

  .breakdown-value {
    font-weight: 600;
    color: #1f2937;
  }

  /* Savings Tips */
  .savings-tips {
    margin-bottom: 2rem;
  }

  .savings-tips h3 {
    color: #1f2937;
    margin-bottom: 1rem;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .tips-list {
    list-style: none;
    padding: 0;
  }

  .tips-list li {
    padding: 0.75rem;
    background: #f0fdf4;
    border-left: 4px solid #22c55e;
    margin-bottom: 0.5rem;
    border-radius: 0 6px 6px 0;
  }

  /* Scholarship Potential */
  .scholarship-potential {
    margin-bottom: 2rem;
  }

  .scholarship-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #fef3c7, #fbbf24);
    border-radius: 8px;
  }

  .scholarship-icon {
    font-size: 2rem;
  }

  .scholarship-content h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #92400e;
  }

  .scholarship-content p {
    margin: 0;
    color: #78350f;
  }

  /* Email Capture */
  /* Next Steps Section */
  .next-steps-section {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    padding: 2.5rem;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    margin-top: 2rem;
  }

  .next-steps-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .next-steps-icon {
    width: 4rem;
    height: 4rem;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    margin: 0 auto 1.5rem auto;
  }

  .next-steps-icon svg {
    width: 2rem;
    height: 2rem;
  }

  .next-steps-header h3 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.75rem 0;
  }

  .next-steps-header p {
    font-size: 1.125rem;
    color: #6b7280;
    margin: 0;
  }

  /* Action Cards Grid */
  .action-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .action-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
  }

  .action-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  .action-card.primary-card {
    border: 2px solid #3b82f6;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  }

  /* Removed legacy/unused styles (old cards/login gate/teaser forms) */

  .interests {
    display: grid;
    gap: 0.5rem;
  }

  .interests-title {
    font-weight: 500;
    color: #374151;
    margin: 0;
  }

  .interest-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #374151;
    cursor: pointer;
  }

  .capture-button {
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .capture-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.25);
  }

  .capture-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Navigation */
  .navigation-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
    gap: 1rem;
  }

  .nav-button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .nav-button.primary {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
  }

  .nav-button.primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25);
  }

  .nav-button.secondary {
    background: #f8fafc;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .nav-button.secondary:hover {
    background: #f1f5f9;
  }

  .nav-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .budget-calculator {
      padding: 1rem;
    }

    .step-card {
      padding: 1.5rem;
    }

    .option-grid {
      grid-template-columns: 1fr;
    }

    .city-grid {
      grid-template-columns: 1fr;
    }

    .input-group {
      grid-template-columns: 1fr;
    }

    .key-numbers {
      grid-template-columns: 1fr;
    }

    .navigation-buttons {
      flex-direction: column;
    }

    .results-header h2 {
      font-size: 1.5rem;
    }

    .number-value {
      font-size: 1.5rem;
    }
  }

  /* Loading State */
  .loading {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  .calculating {
    text-align: center;
    padding: 3rem 2rem;
    color: #6b7280;
  }

  .calculating-details {
    margin-top: 1rem;
    opacity: 0.8;
  }

  .calculating-details small {
    font-size: 0.875rem;
    color: #9ca3af;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f4f6;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1.5rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Enhanced Auth Gate */
  .auth-gate-container {
    position: relative;
    border-radius: 20px;
    overflow: visible; /* prevent clipping of top icons */
    background: #f8fafc;
    min-height: 560px;
    isolation: isolate; /* keep overlay stacking scoped */
  }

  /* Blurred Results Preview */
  .blurred-results-preview {
    position: absolute;
    inset: 0;
    padding: 2rem;
    background: none; /* remove extra gradient behind to avoid double-layer look */
    filter: blur(2px);
    opacity: 0.3; /* make preview subtle */
    pointer-events: none; /* ensure no interaction with background */
  }

  .preview-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .preview-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-icon svg {
    width: 24px;
    height: 24px;
    color: white;
  }

  .preview-title h2 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
  }

  .preview-location {
    color: #6b7280;
    font-size: 1rem;
    margin: 0;
  }

  .preview-numbers {
    margin-bottom: 2rem;
  }

  .number-highlight {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
    margin-bottom: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .number-highlight .number-value {
    font-size: 3rem;
    font-weight: 800;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .number-highlight .number-label {
    color: #6b7280;
    font-size: 1.1rem;
    font-weight: 500;
  }

  .number-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .number-item {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
  }

  .mini-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .mini-label {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .preview-breakdown {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .breakdown-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
  }

  .breakdown-icon {
    width: 40px;
    height: 40px;
    background: #f3f4f6;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .breakdown-icon svg {
    width: 20px;
    height: 20px;
    color: #6b7280;
  }

  .breakdown-details {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .breakdown-label {
    color: #4b5563;
    font-weight: 500;
  }

  .breakdown-value {
    font-weight: 700;
    color: #1f2937;
  }

  .scholarship-highlight {
    color: #059669 !important;
  }

  /* Auth Gate Overlay */
  .auth-gate-overlay {
    position: absolute;
    inset: 0;
    background: #ffffff; /* fully opaque to eliminate ghosting */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .auth-gate-content {
    background: white;
    border-radius: 20px;
    padding: 2.5rem;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    text-align: center;
  }

  .auth-gate-header {
    margin-bottom: 2rem;
  }

  .gate-success-icon {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
  }

  .gate-success-icon svg {
    width: 32px;
    height: 32px;
    color: white;
  }

  .auth-gate-content h3 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 1rem;
  }

  .gate-description {
    color: #6b7280;
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 0;
  }

  .auth-benefits {
    margin: 2rem 0;
    text-align: left;
  }

  .benefit-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .benefit-item:last-child {
    margin-bottom: 0;
  }

  .benefit-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .benefit-icon svg {
    width: 20px;
    height: 20px;
    color: #10b981;
  }

  .benefit-item span {
    color: #4b5563;
    font-size: 0.95rem;
  }

  .auth-actions {
    margin: 2rem 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .primary-auth-btn {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border: none;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  }

  .primary-auth-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
  }

  .primary-auth-btn svg {
    width: 20px;
    height: 20px;
  }

  .secondary-auth-btn {
    background: #f8fafc;
    color: #4b5563;
    border: 2px solid #e5e7eb;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .secondary-auth-btn:hover {
    background: #f1f5f9;
    border-color: #d1d5db;
    color: #374151;
  }

  .secondary-auth-btn svg {
    width: 18px;
    height: 18px;
  }

  .auth-assurance {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-top: 1.5rem;
    border-top: 1px solid #f3f4f6;
  }

  .assurance-item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .assurance-item svg {
    width: 16px;
    height: 16px;
    color: #10b981;
  }

  /* Enhanced Auth Gate Responsive Design */
  @media (max-width: 768px) {
    .auth-gate-container {
      min-height: 500px;
    }

    .blurred-results-preview {
      padding: 1.5rem;
    }

    .auth-gate-overlay {
      padding: 1rem;
    }

    .auth-gate-content {
      padding: 2rem 1.5rem;
    }

    .auth-gate-content h3 {
      font-size: 1.5rem;
    }

    .gate-description {
      font-size: 1rem;
    }

    .number-grid {
      grid-template-columns: 1fr;
    }

    .number-highlight .number-value {
      font-size: 2.5rem;
    }

    .auth-actions {
      gap: 0.75rem;
    }

    .primary-auth-btn,
    .secondary-auth-btn {
      padding: 0.875rem 1.25rem;
      font-size: 1rem;
    }

    .auth-assurance {
      flex-direction: column;
      text-align: center;
    }

    .preview-header {
      flex-direction: column;
      text-align: center;
      gap: 0.75rem;
    }

    .breakdown-item {
      padding: 1rem;
    }

    .breakdown-details {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
  }

  @media (max-width: 480px) {
    .auth-gate-content {
      padding: 1.5rem 1rem;
    }

    .number-highlight {
      padding: 1.5rem;
    }

    .number-highlight .number-value {
      font-size: 2rem;
    }

    .mini-value {
      font-size: 1.25rem;
    }
  }

  /* Progress Bar Styles */
  .progress-container {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #f8fafc;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    backdrop-filter: blur(4px);
  }

  .progress-bar {
    width: 100%;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.75rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    transition: width 0.5s ease;
    border-radius: 3px;
  }

  .progress-text {
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
    text-align: center;
  }

  /* Navigation Buttons */
  .navigation-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem;
    background: #f8fafc;
    border-top: 1px solid #e5e7eb;
    gap: 1rem;
  }

  .nav-button {
    padding: 1rem 2rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .nav-button.primary {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  }

  .nav-button.primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
  }

  .nav-button.primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
  }

  .nav-button.secondary {
    background: white;
    color: #6b7280;
    border: 2px solid #e5e7eb;
  }

  .nav-button.secondary:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    color: #374151;
  }

  /* Option Grid Improvements */
  .option-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .option-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    padding: 2rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .option-card:hover {
    border-color: #3b82f6;
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }

  .option-card.selected {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
  }

  .option-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .option-card.selected::before {
    opacity: 1;
  }

  /* Improved Mobile Responsive */
  @media (max-width: 768px) {
    .budget-calculator {
      margin: 1rem;
      border-radius: 12px;
    }

    .step-card {
      padding: 1.5rem;
      min-height: 400px;
    }

    .progress-container {
      padding: 1rem 1.5rem;
    }

    .step-header {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
    }

    .step-icon {
      margin: 0 auto;
    }

    .option-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .option-card {
      padding: 1.5rem;
    }

    .action-buttons-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .action-button {
      padding: 1.25rem;
    }

    .toggle-section {
      padding: 0.5rem 0;
      margin-bottom: 1.5rem;
    }

    .smart-toggle {
      padding: 6px;
    }

    .toggle-track {
      min-width: 180px;
    }

    .toggle-option {
      padding: 10px 12px;
      font-size: 0.8rem;
    }

    .navigation-buttons {
      position: sticky;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 0.75rem 1rem;
      background: rgba(248, 250, 252, 0.95);
      backdrop-filter: blur(6px);
      border-top: 1px solid #e5e7eb;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .nav-button { width: 100%; justify-content: center; padding: 0.875rem; }
  }

  @media (max-width: 480px) {
    .budget-calculator {
      margin: 0.5rem;
    }

    .step-card {
      padding: 1rem;
      min-height: 350px;
    }

    .progress-container {
      padding: 0.75rem 1rem;
    }

    .step-header h2 {
      font-size: 1.5rem;
    }

    .step-description {
      font-size: 0.9rem;
    }

    .option-card {
      padding: 1.25rem;
    }

    .action-button {
      padding: 1rem;
    }

    .action-icon {
      width: 40px;
      height: 40px;
    }

    .navigation-buttons {
      padding: 1rem;
    }

    .nav-button {
      padding: 0.875rem;
      font-size: 0.95rem;
    }
  }

  /* Action Buttons Section */
  .action-buttons-section {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
  }

  .action-buttons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .action-button {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    width: 100%;
  }

  .action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  .action-button.primary {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  }

  .action-button.primary:hover {
    border-color: #1d4ed8;
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
  }

  .action-button.secondary {
    border-color: #e5e7eb;
    background: white;
  }

  .action-button.secondary:hover {
    border-color: #d1d5db;
    background: #f9fafb;
  }

  .action-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
  }

  .action-button.primary .action-icon {
    background: #3b82f6;
    color: white;
  }

  .action-button.secondary .action-icon {
    background: #f3f4f6;
    color: #6b7280;
  }

  .action-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .action-title {
    font-weight: 600;
    color: #1f2937;
    font-size: 1rem;
  }

  .action-subtitle {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .action-button.primary .action-title {
    color: #1e40af;
  }

  .action-button.primary .action-subtitle {
    color: #3b82f6;
  }

  /* Improved Mobile Responsive */
</style>
