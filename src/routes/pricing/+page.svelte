<script lang="ts">
  import { page } from '$app/stores';
  
  let { data } = $props();
  let { session, supabase } = $derived(data);

  async function handleUpgrade(plan: string) {
    if (!session) {
      // Redirect to login or show login modal
      const formSection = document.getElementById('form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    
    // Handle upgrade logic here
    console.log(`Upgrading to ${plan} plan`);
  }
</script>

<svelte:head>
  <title>Pricing - Abroaducate</title>
  <meta name="description" content="Choose the perfect plan for your academic application journey. From free to professional tiers." />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="text-center mb-16">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        Choose Your Perfect Plan
      </h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        From high school to PhD, we've got the right tools for your academic journey. 
        Start free and upgrade as your needs grow.
      </p>
    </div>

    <!-- Pricing Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      
      <!-- Free Tier -->
      <div class="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-8 relative">
        <div class="text-center mb-6">
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Academic Starter</h3>
          <div class="text-4xl font-bold text-blue-600 mb-2">$0</div>
          <p class="text-gray-500">Forever free</p>
        </div>

        <ul class="space-y-4 mb-8">
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">2 documents per type (8 total)</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">5 AI document reviews per month</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">10 AI text enhancements per month</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Unlimited application tracking</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Basic templates & PDF export</span>
          </li>
        </ul>

        <button 
          onclick={() => handleUpgrade('free')}
          class="w-full py-3 px-4 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition duration-300"
        >
          Get Started Free
        </button>
      </div>

      <!-- Basic Tier -->
      <div class="bg-white rounded-lg shadow-lg border-2 border-blue-500 p-8 relative transform scale-105">
        <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span class="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
        
        <div class="text-center mb-6">
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Academic Professional</h3>
          <div class="text-4xl font-bold text-blue-600 mb-2">$7.99</div>
          <p class="text-gray-500">per month</p>
        </div>

        <ul class="space-y-4 mb-8">
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">10 documents per month (any type)</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Unlimited AI document reviews</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">25 AI text enhancements per month</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Premium templates & DOCX export</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Priority email support (24h)</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Document versioning & analytics</span>
          </li>
        </ul>

        <button 
          onclick={() => handleUpgrade('basic')}
          class="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition duration-300"
        >
          Upgrade to Basic
        </button>
      </div>

      <!-- Pro Tier -->
      <div class="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-8 relative">
        <div class="text-center mb-6">
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Academic Elite</h3>
          <div class="text-4xl font-bold text-blue-600 mb-2">$19.99</div>
          <p class="text-gray-500">per month</p>
        </div>

        <ul class="space-y-4 mb-8">
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Unlimited document generation</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Unlimited AI reviews & enhancements</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Custom template creation</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Document sharing & collaboration</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Advanced export (LaTeX, custom)</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Priority live support & early access</span>
          </li>
        </ul>

        <button 
          onclick={() => handleUpgrade('pro')}
          class="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition duration-300"
        >
          Upgrade to Pro
        </button>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="mt-20 max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
      
      <div class="space-y-8">
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-medium text-gray-900 mb-3">Can I change my plan anytime?</h3>
          <p class="text-gray-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments.</p>
        </div>

        <div class="bg-white rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-medium text-gray-900 mb-3">What happens if I exceed my document limit?</h3>
          <p class="text-gray-600">You'll receive a notification when approaching your limit. You can either wait for the next billing cycle or upgrade to a higher plan for immediate access.</p>
        </div>

        <div class="bg-white rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-medium text-gray-900 mb-3">Do you offer student discounts?</h3>
          <p class="text-gray-600">Our pricing is already student-friendly! We designed our plans specifically for students' budgets while providing professional-quality tools.</p>
        </div>

        <div class="bg-white rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-medium text-gray-900 mb-3">Is my data secure?</h3>
          <p class="text-gray-600">Absolutely. We use industry-standard encryption and never share your personal information or documents. Your privacy is our top priority.</p>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="mt-20 text-center">
      <h2 class="text-3xl font-bold text-gray-900 mb-4">Ready to Start Your Academic Journey?</h2>
      <p class="text-xl text-gray-600 mb-8">Join thousands of students who've successfully used Abroaducate for their applications.</p>
      <a href="/" class="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-blue-700 transition duration-300">
        Get Started Now
      </a>
    </div>
  </div>
</div> 