<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { analytics } from '$lib/utils/posthog';
  import BudgetCalculator from '$lib/components/BudgetCalculator.svelte';
  import SEO from '$lib/components/SEO.svelte';
  import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';

  let { data } = $props();
  let { supabase, session } = $derived(data);

  let showSuccessModal = $state(false);
  let calculationResult: any = $state(null);
  let userEmail = $state('');
  let showAuthModal = $state(false);
  let authMode = $state<'login' | 'signup'>('login');
  let authReturnUrl = $state('/budget-calculator');
  
  // Add state for restoration
  let pendingCalculationData: any = $state(null);
  let shouldRestoreCalculation = $state(false);

  onMount(() => {
    // Track page view
    analytics.trackPageView('Budget Calculator', {
      user_type: session ? 'authenticated' : 'anonymous',
      source: 'direct'
    });

    // Check for pending calculation data after login
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showResults') === 'true' && session) {
      restorePendingCalculation();
    }

    // Listen for auth modal events from calculator
    window.addEventListener('show-auth-modal', handleAuthModalEvent);
  });

  function restorePendingCalculation() {
    try {
      const pendingData = sessionStorage.getItem('pendingCalculation');
      if (pendingData) {
        const { result, preferences, timestamp } = JSON.parse(pendingData);
        
        // Check if data is not too old (within 1 hour)
        if (Date.now() - timestamp < 3600000) {
          calculationResult = result;
          pendingCalculationData = { result, preferences, timestamp };
          shouldRestoreCalculation = true;
          
          // Dispatch custom event to restore calculation in calculator component
          window.dispatchEvent(new CustomEvent('restore-calculation', {
            detail: { result, preferences, timestamp }
          }));
          
          analytics.trackEvent('calculation_restored_after_login', {
            city: result.city,
            total_cost: result.totalCost
          });
        }
        
        // Clean up original pending data
        sessionStorage.removeItem('pendingCalculation');
      }
    } catch (error) {
      console.error('Error restoring pending calculation:', error);
    }
  }

  function handleCalculationComplete(result: any, email: string) {
    calculationResult = result;
    userEmail = email;
    showSuccessModal = true;
    
    // Track conversion
    analytics.trackEvent('budget_calculator_completed', {
      total_annual: result.totalAnnual,
      city: result.city,
      state: result.state,
      university_type: result.universityType,
      email_captured: !!email,
      user_type: session ? 'authenticated' : 'anonymous'
    });

    // Redirect to consultation booking if interested
    if (result.interestedInConsultation) {
      setTimeout(() => {
        goto('/contact?source=budget-calculator&consultation=true');
      }, 3000);
    }
  }

  function closeModal() {
    showSuccessModal = false;
  }

  function downloadPDF() {
    // TODO: Implement PDF generation
    console.log('Generating PDF for:', calculationResult);
    
    analytics.trackEvent('budget_pdf_downloaded', {
      total_annual: calculationResult?.totalAnnual,
      email: userEmail
    });
  }

  function viewScholarships() {
    goto('/scholarships?source=budget-calculator');
  }

  function bookConsultation() {
    goto('/contact?source=budget-calculator&consultation=true&email=' + encodeURIComponent(userEmail));
  }

  function handleAuthModalEvent(event: any) {
    const { mode, returnUrl } = event.detail;
    authMode = mode;
    authReturnUrl = returnUrl || '/budget-calculator';
    showAuthModal = true;
  }

  function handleAuthSuccess() {
    showAuthModal = false;
    // Reload the page to refresh session data
    window.location.reload();
  }
</script>

<SEO 
  title="US Student Budget Calculator - Plan Your Study Abroad Costs | Abroaducate"
  description="Calculate the exact cost of studying in America. Get personalized budget breakdowns for tuition, housing, food, and living expenses across 50+ US cities. Free tool for international students."
  keywords="US student budget calculator, study abroad costs, American university expenses, international student budget, college cost calculator"
  canonical="https://abroaducate.com/budget-calculator"
  image="https://abroaducate.com/images/budget-calculator-og.jpg"
  schemaType="WebPage"
/>

<div class="budget-calculator-page">
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="hero-content">
      <div class="hero-title-container">
        <h1 class="hero-title">
          US Student Budget Calculator
        </h1>
        <p class="hero-subtitle">
          Plan your study abroad finances with precision. Get personalized cost breakdowns for 50+ American cities.
        </p>
      </div>
      <div class="hero-features">
        <div class="feature-item">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="feature-text">
            <strong>50+ US Cities</strong>
            <span>Compare costs nationwide</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="feature-text">
            <strong>Real-time Data</strong>
            <span>Updated housing and living costs</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div class="feature-text">
            <strong>Scholarship Estimates</strong>
            <span>See potential savings</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div class="feature-text">
            <strong>Detailed PDF Report</strong>
            <span>Download your budget plan</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Manual AdSense blocks removed (auto ads only) -->

  <!-- Main Calculator -->
  <section class="calculator-section">
    <BudgetCalculator
      supabase={supabase}
      embedded={false}
      onComplete={handleCalculationComplete}
    />
  </section>

  <!-- Manual AdSense blocks removed (auto ads only) -->

  <!-- Why Use This Calculator Section -->
  <section class="why-section">
    <div class="why-content">
      <h2>Why Use Our Budget Calculator?</h2>
      <div class="benefits-grid">
        <div class="benefit-card">
          <div class="benefit-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <h3>Accurate Planning</h3>
          <p>Make informed decisions with real cost data from 50+ US cities. No surprises when you arrive.</p>
        </div>
        <div class="benefit-card">
          <div class="benefit-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <h3>Save Money</h3>
          <p>Discover cost-saving opportunities and scholarship potential worth thousands of dollars.</p>
        </div>
        <div class="benefit-card">
          <div class="benefit-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="3" y1="15" x2="21" y2="15"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <line x1="15" y1="3" x2="15" y2="21"/>
            </svg>
          </div>
          <h3>Detailed Breakdown</h3>
          <p>Get comprehensive analysis of tuition, housing, food, insurance, and all living expenses.</p>
        </div>
        <div class="benefit-card">
          <div class="benefit-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <h3>Scholarship Ready</h3>
          <p>Use your budget plan to apply for financial aid and demonstrate funding needs.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Key Features Section -->
  <section class="features-highlight">
    <div class="features-content">
      <h2>Everything You Need to Plan Your US Studies</h2>
      <div class="features-grid">
        <div class="feature-highlight">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
            </svg>
          </div>
          <h3>Comprehensive Cost Analysis</h3>
          <p>Get detailed breakdowns of tuition, housing, food, insurance, transportation, and personal expenses for 50+ US cities.</p>
        </div>
        <div class="feature-highlight">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h3>Scholarship Opportunities</h3>
          <p>Discover potential funding sources and get estimates for merit-based scholarships based on your academic profile.</p>
        </div>
        <div class="feature-highlight">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <h3>Detailed PDF Report</h3>
          <p>Download a comprehensive budget report to share with family, use for visa applications, or reference during planning.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="faq-section">
    <div class="faq-content">
      <h2>Frequently Asked Questions</h2>
      <div class="faq-grid">
        <div class="faq-item">
          <h3>How accurate are these cost estimates?</h3>
          <p>Our data is updated regularly from official university sources, housing platforms, and cost-of-living databases. Estimates are typically within 5-10% of actual costs.</p>
        </div>
        <div class="faq-item">
          <h3>Can I use this for graduate programs?</h3>
          <p>Yes! The calculator works for undergraduate, graduate, and professional programs. Just select the appropriate university type and adjust for program-specific costs.</p>
        </div>
        <div class="faq-item">
          <h3>What about scholarships and financial aid?</h3>
          <p>The calculator shows potential scholarship amounts based on your profile. We also provide personalized scholarship recommendations in your detailed report.</p>
        </div>
        <div class="faq-item">
          <h3>Is my information kept private?</h3>
          <p>Absolutely. We only use your email to send your budget report and scholarship opportunities. We never share your data with third parties.</p>
        </div>
        <div class="faq-item">
          <h3>Can I calculate costs for multiple cities?</h3>
          <p>Yes! You can run the calculator multiple times to compare different cities and make the best choice for your budget.</p>
        </div>
        <div class="faq-item">
          <h3>What if I need help with my budget planning?</h3>
          <p>We offer free 30-minute consultation calls to help you understand your results and create a funding strategy. Just check the consultation option in the calculator.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Manual AdSense blocks removed (auto ads only) -->

  <!-- Related Tools Section -->
  <section class="related-tools">
    <div class="tools-content">
      <h2>Related Tools</h2>
      <div class="tools-grid">
        <a href="/gpa-converter" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
              <path d="M14 15l3 3m0-3l-3 3"/>
            </svg>
          </div>
          <h3>GPA Converter</h3>
          <p>Convert your grades to US GPA scale</p>
        </a>
        <a href="/scholarships" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h3>Scholarship Database</h3>
          <p>Find funding opportunities</p>
        </a>
        <a href="/universities" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <h3>University Search</h3>
          <p>Explore 7,000+ universities</p>
        </a>
        <a href="/visa-interview-practice" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <h3>Visa Interview Prep</h3>
          <p>Practice F-1 visa questions</p>
        </a>
      </div>
    </div>
  </section>
</div>

<!-- Success Modal -->
{#if showSuccessModal}
  <div 
    class="modal-overlay" 
    role="dialog" 
    aria-modal="true" 
    tabindex="-1"
    onclick={(e) => e.currentTarget === e.target && closeModal()}
    onkeydown={(e) => e.key === 'Escape' && closeModal()}
  >
    <div 
      class="modal-content" 
      role="document"
    >
      <div class="modal-header">
        <div class="modal-title">
          <div class="modal-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h3>Budget Calculation Complete!</h3>
        </div>
        <button onclick={closeModal} class="modal-close">×</button>
      </div>
      
      <div class="modal-body">
        <p>Your personalized budget report has been calculated!</p>
        
        {#if calculationResult}
          <div class="modal-summary">
            <div class="summary-item">
              <strong>Annual Cost:</strong> ${calculationResult.totalAnnual?.toLocaleString()}
            </div>
            <div class="summary-item">
              <strong>Location:</strong> {calculationResult.city}, {calculationResult.state}
            </div>
            <div class="summary-item">
              <strong>4-Year Total:</strong> ${calculationResult.total4Year?.toLocaleString()}
            </div>
          </div>
        {/if}
        
        <div class="modal-actions">
          <button onclick={downloadPDF} class="modal-button primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <polyline points="9 15 12 18 15 15"/>
            </svg>
            <span>Download PDF Report</span>
          </button>
          <button onclick={viewScholarships} class="modal-button secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>View Scholarships</span>
          </button>
          <button onclick={bookConsultation} class="modal-button secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>Book Free Consultation</span>
          </button>
        </div>
        
        <p class="modal-note">
          Your detailed report will be emailed to you within 5 minutes.
        </p>
      </div>
    </div>
  </div>
{/if}

<!-- Global Authentication Modal -->
{#if showAuthModal}
  <AuthenticationFlow 
    bind:show={showAuthModal}
    {supabase}
    mode={authMode}
    returnUrl={authReturnUrl}
    on:success={handleAuthSuccess}
    on:close={() => showAuthModal = false}
  />
{/if}

<style>
  .budget-calculator-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  }

  /* Hero Section */
  .hero-section {
    background: linear-gradient(135deg, #2C3580 0%, #3c4d9c 100%);
    color: white;
    padding: 7rem 2rem 5rem;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .hero-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
    opacity: 0.5;
  }

  .hero-content {
    max-width: 1000px;
    margin: 0 auto;
    position: relative;
    z-index: 10;
  }

  .hero-title-container {
    margin-bottom: 3.5rem;
  }

  .hero-title {
    font-size: 3.5rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    line-height: 1.1;
    background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .hero-subtitle {
    font-size: 1.25rem;
    margin: 0 auto;
    max-width: 700px;
    opacity: 0.9;
    line-height: 1.6;
  }

  .hero-features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .feature-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    text-align: left;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
  }

  .feature-item:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }

  .feature-icon {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
  }

  .feature-icon svg {
    width: 1.5rem;
    height: 1.5rem;
    stroke: white;
  }

  .feature-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .feature-text strong {
    font-size: 1.1rem;
    font-weight: 600;
  }

  .feature-text span {
    font-size: 0.9rem;
    opacity: 0.8;
  }

  /* Calculator Section */
  .calculator-section {
    padding: 4rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Why Section */
  .why-section {
    background: white;
    padding: 4rem 2rem;
  }

  .why-content {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
  }

  .why-content h2 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 3rem;
  }

  .benefits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
  }

  .benefit-card {
    padding: 2.5rem;
    border-radius: 16px;
    background: white;
    box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    text-align: center;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .benefit-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.1);
  }

  .benefit-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    z-index: 1;
  }

  .benefit-card:nth-child(1)::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  .benefit-card:nth-child(2)::before { background: linear-gradient(90deg, #10b981, #34d399); }
  .benefit-card:nth-child(3)::before { background: linear-gradient(90deg, #2C3580, #60a5fa); }
  .benefit-card:nth-child(4)::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }

  .benefit-icon {
    width: 4rem;
    height: 4rem;
    margin: 0 auto 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    position: relative;
  }

  .benefit-icon::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    padding: 4px;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.01));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }

  .benefit-card:nth-child(1) .benefit-icon { color: #f59e0b; }
  .benefit-card:nth-child(2) .benefit-icon { color: #10b981; }
  .benefit-card:nth-child(3) .benefit-icon { color: #2C3580; }
  .benefit-card:nth-child(4) .benefit-icon { color: #8b5cf6; }

  .benefit-icon svg {
    width: 2.5rem;
    height: 2.5rem;
    stroke-width: 1.5;
  }

  .benefit-card h3 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: #111827;
  }

  .benefit-card p {
    color: #4b5563;
    line-height: 1.7;
    font-size: 1rem;
  }

  /* Features Highlight */
  .features-highlight {
    background: linear-gradient(135deg, #2C3580 0%, #3c4d9c 100%);
    padding: 4rem 2rem;
    color: white;
  }

  .features-content {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
  }

  .features-content h2 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 3rem;
    color: white;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 2.5rem;
  }

  .feature-highlight {
    background: rgba(255, 255, 255, 0.1);
    padding: 2.5rem 2rem;
    border-radius: 16px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    text-align: center;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .feature-highlight:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }

  .feature-highlight .feature-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1.5rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .feature-highlight .feature-icon svg {
    width: 32px;
    height: 32px;
    color: white;
  }

  .feature-highlight h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: white;
  }

  .feature-highlight p {
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
  }

  /* FAQ Section */
  .faq-section {
    background: white;
    padding: 4rem 2rem;
  }

  .faq-content {
    max-width: 1000px;
    margin: 0 auto;
  }

  .faq-content h2 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 3rem;
    text-align: center;
  }

  .faq-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
  }

  .faq-item {
    padding: 1.5rem;
    border-left: 4px solid #2C3580;
    background: #f8fafc;
  }

  .faq-item h3 {
    color: #1f2937;
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .faq-item p {
    color: #4b5563;
    line-height: 1.6;
    margin: 0;
  }

  /* Related Tools */
  .related-tools {
    background: #f8fafc;
    padding: 4rem 2rem;
  }

  .tools-content {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
  }

  .tools-content h2 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 3rem;
  }

  .tools-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
  }

  .tool-card {
    background: white;
    padding: 2.5rem;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    text-decoration: none;
    transition: all 0.3s ease;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    border: 1px solid rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  .tool-card::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, #2C3580, #60a5fa);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  .tool-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 30px rgba(0, 0, 0, 0.08);
  }

  .tool-card:hover::after {
    transform: scaleX(1);
  }

  .tool-icon {
    width: 4rem;
    height: 4rem;
    margin-bottom: 1.5rem;
    background: #f3f4f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #2C3580;
    transition: all 0.3s ease;
  }

  .tool-card:hover .tool-icon {
    background: #2C3580;
    color: white;
    transform: scale(1.1);
  }

  .tool-icon svg {
    width: 2rem;
    height: 2rem;
    stroke-width: 1.5;
  }

  .tool-card h3 {
    color: #111827;
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    transition: color 0.3s ease;
  }

  .tool-card:hover h3 {
    color: #2C3580;
  }

  .tool-card p {
    color: #6b7280;
    margin: 0;
    font-size: 0.95rem;
  }

  /* Ad Container */
  /* Success Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 2rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-title {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .modal-success-icon {
    width: 2.5rem;
    height: 2.5rem;
    background: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .modal-success-icon svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  .modal-header h3 {
    color: #111827;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    line-height: 1.3;
  }

  .modal-close {
    background: #f3f4f6;
    border: none;
    font-size: 1.5rem;
    color: #6b7280;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .modal-close:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .modal-body {
    padding: 2rem;
  }

  .modal-summary {
    background: #f8fafc;
    padding: 1.5rem;
    border-radius: 8px;
    margin: 1.5rem 0;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    color: #1f2937;
  }

  .summary-item:last-child {
    margin-bottom: 0;
  }

  .modal-actions {
    display: grid;
    gap: 1rem;
    margin: 2rem 0;
  }

  .modal-button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .modal-button svg {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }

  .modal-button.primary {
    background: linear-gradient(135deg, #2C3580, #1d4ed8);
    color: white;
  }

  .modal-button.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25);
  }

  .modal-button.primary:active {
    transform: translateY(0);
  }

  .modal-button.secondary {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .modal-button.secondary:hover {
    background: #f9fafb;
    border-color: #9ca3af;
    color: #111827;
  }

  .modal-button.secondary svg {
    color: #6b7280;
  }

  .modal-button.secondary:hover svg {
    color: #4b5563;
  }

  .modal-note {
    color: #6b7280;
    font-size: 0.875rem;
    text-align: center;
    margin: 0;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .hero-title {
      font-size: 2rem;
    }

    .hero-subtitle {
      font-size: 1.1rem;
    }

    .hero-features {
      grid-template-columns: 1fr;
    }

    .benefits-grid,
    .tools-grid {
      grid-template-columns: 1fr;
    }

    .faq-grid {
      grid-template-columns: 1fr;
    }

    .why-content h2,
    .faq-content h2,
    .tools-content h2 {
      font-size: 2rem;
    }

    .calculator-section,
    .why-section,
    .faq-section,
    .related-tools {
      padding: 2rem 1rem;
    }
  }
</style>
