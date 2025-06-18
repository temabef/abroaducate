<script lang="ts">
  import { page } from '$app/stores';
  
  let { data } = $props();
  let { session, supabase } = $derived(data);

  let billingCycle = $state<'monthly' | 'annual'>('monthly');

  let monthlyBtnEl: HTMLButtonElement;
  let annualBtnEl: HTMLButtonElement;
  let sliderStyle = $state('');

  $effect(() => {
    if (billingCycle === 'monthly' && monthlyBtnEl) {
      const rect = monthlyBtnEl.getBoundingClientRect();
      const parentRect = monthlyBtnEl.parentElement!.getBoundingClientRect();
      const relativeLeft = monthlyBtnEl.offsetLeft;
      sliderStyle = `width: ${monthlyBtnEl.offsetWidth}px; transform: translateX(${relativeLeft}px);`;
    } else if (billingCycle === 'annual' && annualBtnEl) {
      const rect = annualBtnEl.getBoundingClientRect();
      const parentRect = annualBtnEl.parentElement!.getBoundingClientRect();
      const relativeLeft = annualBtnEl.offsetLeft;
      sliderStyle = `width: ${annualBtnEl.offsetWidth}px; transform: translateX(${relativeLeft}px);`;
    }
  });

  const prices = {
    professional: {
      monthly: 12,
      annual: 10
    },
    elite: {
      monthly: 29,
      annual: 24
    }
  };

  async function handleUpgrade(plan: string) {
    if (!session) {
      // Redirect to login or show login modal
      const formSection = document.getElementById('form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    
    // TODO: Pass the full price ID to your Stripe checkout
    const planId = `${plan}-${billingCycle}`;
    console.log(`Upgrading to ${planId}`);
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
        Start with our free tier and upgrade as your applications grow.
      </p>
    </div>

    <!-- Pay-as-you-grow Banner -->
    <div class="max-w-4xl mx-auto mb-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-blue-900 mb-3">🚀 Pay-As-You-Grow Promise</h2>
        <p class="text-blue-700 text-lg mb-4">
                     We're starting conservative to keep prices student-friendly, but as we grow, 
           <strong>your limits automatically increase at no extra cost!</strong>
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div class="bg-white rounded-lg p-4 border border-blue-100">
            <div class="font-semibold text-blue-900">Current Launch Limits</div>
            <div class="text-blue-700">Conservative & sustainable</div>
          </div>
          <div class="bg-white rounded-lg p-4 border border-blue-100">
            <div class="font-semibold text-blue-900">As We Grow</div>
            <div class="text-blue-700">Limits increase automatically</div>
          </div>
          <div class="bg-white rounded-lg p-4 border border-blue-100">
            <div class="font-semibold text-blue-900">Your Benefits</div>
            <div class="text-blue-700">More value, same price</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Billing Cycle Toggle -->
    <div class="flex justify-center mb-12">
      <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 inline-flex items-center relative overflow-hidden pricing-toggle">
        <!-- Background gradient animation -->
        <div class="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 opacity-50 animated-gradient"></div>
        
        <!-- Animated sliding background -->
        <div
          class="absolute bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg rounded-xl h-[calc(100%-16px)] top-[8px] transition-all duration-500 ease-out transform animated-gradient"
          style={sliderStyle}
        ></div>
        
        <!-- Monthly Button -->
        <button
          bind:this={monthlyBtnEl}
          onclick={() => (billingCycle = 'monthly')}
          class="relative z-10 px-8 py-4 font-semibold text-lg transition-all duration-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 group toggle-button"
          class:text-white={billingCycle === 'monthly'}
          class:text-gray-700={billingCycle !== 'monthly'}
        >
          <div class="flex flex-col items-center">
            <span class="mb-1">💳 Monthly</span>
            <span class="text-xs opacity-75 font-normal">
              Pay as you go
            </span>
          </div>
        </button>

        <!-- Divider -->
        <div class="relative z-10 mx-2 h-12 w-px bg-gray-200"></div>
        
        <!-- Annual Button -->
        <button
          bind:this={annualBtnEl}
          onclick={() => (billingCycle = 'annual')}
          class="relative z-10 px-8 py-4 font-semibold text-lg transition-all duration-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 group toggle-button"
          class:text-white={billingCycle === 'annual'}
          class:text-gray-700={billingCycle !== 'annual'}
        >
          <div class="flex flex-col items-center">
            <div class="flex items-center gap-2 mb-1">
              <span>🎯 Annual</span>
              <span class="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md transform rotate-3 pulse-glow">
                Save 20%!
              </span>
            </div>
            <span class="text-xs opacity-75 font-normal">
              Best value
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- Pricing Comparison Hint -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center gap-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full px-6 py-3">
        <span class="text-green-800 font-medium">
          {#if billingCycle === 'annual'}
            🎉 You're saving $48/year with annual billing!
          {:else}
            💡 Switch to annual and save $48/year
          {/if}
        </span>
        {#if billingCycle === 'monthly'}
          <button 
            onclick={() => (billingCycle = 'annual')}
            class="text-green-700 hover:text-green-800 font-semibold underline underline-offset-2 transition-colors"
          >
            See annual pricing →
          </button>
        {/if}
      </div>
    </div>

    <!-- Pricing Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      
      <!-- Free Tier -->
      <div class="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-8 relative">
        <div class="text-center mb-6">
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Academic Starter</h3>
          <div class="text-4xl font-bold text-blue-600 mb-2">$0</div>
          <p class="text-gray-500">Get started for free</p>
        </div>

        <ul class="space-y-4 mb-8">
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>4 Documents/Month:</strong> 1 SOPs, 1 Cover Letters, 1 Personal Statement, 1 Academic CV</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>AI Features:</strong> 1 Review, 1 Text Enhancement, 1 Word Optimization, 1 Grammar Check, 1 Plagiarism Check, 1 Tone Analysis</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>University Matching:</strong> 50+ universities with basic matching</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Academic Analysis:</strong> Quick profile assessment only</span>
          </li>

          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Application tracking & basic reminders</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Inline Text Editing:</strong> 5 AI-powered edits per month</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Version History:</strong> 3 versions (cover letters only, 30-day retention)</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Visa Interview Simulator:</strong> 5 practice questions per session</span>
          </li>

          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Community support</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>GPT-3.5 AI Engine</strong> - Reliable and efficient AI</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Scholarship Access:</strong> Free access to all scholarship listings</span>
          </li>
        </ul>

        <button 
          onclick={() => handleUpgrade('free')}
          class="w-full py-3 px-4 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition duration-300"
        >
          Get Started Free
        </button>
      </div>

      <!-- Professional Tier -->
      <div class="bg-white rounded-lg shadow-lg border-2 border-blue-500 p-8 relative transform scale-105">
        <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span class="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
        
        <div class="text-center mb-6">
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Academic Professional</h3>
          <div class="text-4xl font-bold text-blue-600 mb-2">
            ${prices.professional[billingCycle]}
          </div>
          <p class="text-gray-500">
            per month{#if billingCycle === 'annual'}, billed annually{/if}
          </p>
        </div>

        <ul class="space-y-4 mb-8">
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>50 Documents/Month:</strong> Flexible allocation across all document types</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Enhanced AI:</strong> 15 Reviews, 25 Text Enhancements, 15 Word Optimizations, 25 Grammar Checks, 10 Plagiarism Checks, 25 Tone Analyses</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>University Matching:</strong> 500+ university recommendations (US + international)</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Academic Analysis:</strong> Comprehensive transcript analysis + Quick assessment</span>
          </li>

          
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Advanced application tracking & analytics</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Email support (48h response)</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Email reminders & notifications</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Inline Text Editing:</strong> 50 AI-powered edits per month</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Version History:</strong> 50 versions (all document types, 90-day retention)</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>GPT-4o-mini AI Engine</strong> - Advanced AI with superior quality</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Cold Email Generator</strong> - Professional outreach templates</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Scholarship Access:</strong> Free access to all scholarship listings with personalized recommendations</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Visa Interview Simulator:</strong> 20 practice questions per session</span>
          </li>

          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><em>New features automatically included as we grow!</em></span>
          </li>
        </ul>

        <button 
          onclick={() => handleUpgrade('professional')}
          class="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition duration-300"
        >
          Upgrade to Professional
        </button>
      </div>

      <!-- Elite Tier -->
      <div class="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-8 relative">
        <div class="text-center mb-6">
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Academic Elite</h3>
          <div class="text-4xl font-bold text-blue-600 mb-2">
            ${prices.elite[billingCycle]}
          </div>
          <p class="text-gray-500">
            per month{#if billingCycle === 'annual'}, billed annually{/if}
          </p>
        </div>

        <ul class="space-y-4 mb-8">
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>UNLIMITED Documents:</strong> Generate as many documents as you need</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Unlimited AI:</strong> Unlimited reviews, enhancements, optimizations, grammar checks, plagiarism checks, and tone analyses</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>University Database:</strong> 1500+ universities worldwide + priority access + new universities first</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Academic Analysis:</strong> Comprehensive transcript analysis + Quick assessment</span>
          </li>

          
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Priority email support (24h response)</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Advanced analytics & insights dashboard</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Inline Text Editing:</strong> UNLIMITED AI-powered edits</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Version History:</strong> 100 versions (all document types, 1-year retention)</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700">Early access to new features</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>GPT-4o AI Engine</strong> - Most advanced AI model available</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Advanced Cold Email Suite</strong> - Smart templates + professional guidance</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Scholarship Access:</strong> Priority access to all scholarship listings with custom alerts and personalized recommendations</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><strong>Visa Interview Simulator:</strong> All 30 practice questions per session</span>
          </li>

          <li class="flex items-start">
            <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-700"><em>New features automatically included as we grow!</em></span>
          </li>
        </ul>

        <button 
          onclick={() => handleUpgrade('elite')}
          class="w-full py-3 px-4 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition duration-300"
        >
          Upgrade to Elite
        </button>
      </div>
    </div>

    <!-- Feature Comparison -->
    <div class="mt-20 max-w-6xl mx-auto">
      <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">Complete Feature Comparison</h2>
      
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">Features</th>
                <th class="px-6 py-4 text-center text-sm font-semibold text-gray-900">Academic Starter</th>
                <th class="px-6 py-4 text-center text-sm font-semibold text-gray-900">Academic Professional</th>
                <th class="px-6 py-4 text-center text-sm font-semibold text-gray-900">Academic Elite</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr>
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">Documents per Month</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600">4 documents</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>50 documents</strong></td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>UNLIMITED</strong></td>
              </tr>
              <tr class="bg-gray-50">
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">AI Features per Month</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600">6 features</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>115 features</strong></td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>UNLIMITED</strong></td>
              </tr>
              <tr>
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">University Recommendations</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600">50+ universities</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>500+ universities</strong></td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>1500+ universities + priority access</strong></td>
              </tr>
              <tr>
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">AI Model</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600">GPT-3.5</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>GPT-4o-mini</strong></td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>GPT-4o</strong></td>
              </tr>
              <tr class="bg-gray-50">
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">Inline Text Editing</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600">5 edits/month</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>50 edits/month</strong></td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>UNLIMITED</strong></td>
              </tr>
              <tr>
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">Version History</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600">3 versions (cover letters only)</td>
                            <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>50 versions (all documents)</strong></td>
            <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>100 versions (all documents)</strong></td>
              </tr>
              <tr class="bg-gray-50">
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">Cold Email Generator</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600">❌</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>✅ Basic Templates</strong></td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>✅ Advanced Templates</strong></td>
              </tr>
              <tr>
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">Academic Profile Analysis</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600">Quick Assessment Only</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>Comprehensive + Quick</strong></td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>Comprehensive + Quick</strong></td>
              </tr>

              <tr class="bg-gray-50">
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">Support Level</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600">Community</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600">Email (48h)</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600">Priority Email (24h)</td>
              </tr>

              <tr>
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">Analytics & Features</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600">Basic tracking</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>Advanced analytics + versioning</strong></td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>Complete insights dashboard</strong></td>
              </tr>
              <tr class="bg-gray-50">
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">Growth Promise</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600">-</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>🚀 New features included</strong></td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>🚀 Auto-expanding limits</strong></td>
              </tr>
              <tr>
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">Scholarship Access</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600">✅ Free Access</td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>✅ Free Access + Personalized</strong></td>
                <td class="px-6 py-4 text-sm text-center text-gray-600"><strong>✅ Priority Access + Custom Alerts</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Free GPA Converter Highlight -->
    <div class="mt-20 max-w-4xl mx-auto mb-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-green-900 mb-3">🌍 GPA Converter - 100% FREE for Everyone!</h2>
        <p class="text-green-700 text-lg mb-4">
          Convert your African university grades to US 4.0 scale completely free. No signup required, unlimited conversions.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div class="bg-white rounded-lg p-4 border border-green-100">
            <div class="font-semibold text-green-900">50+ Countries</div>
            <div class="text-green-700">All African grading systems</div>
          </div>
          <div class="bg-white rounded-lg p-4 border border-green-100">
            <div class="font-semibold text-green-900">Smart Assist</div>
            <div class="text-green-700">OCR transcript processing</div>
          </div>
          <div class="bg-white rounded-lg p-4 border border-green-100">
            <div class="font-semibold text-green-900">Professional PDF</div>
            <div class="text-green-700">Download official transcripts</div>
          </div>
        </div>
        <a href="/gpa-converter" class="inline-block mt-4 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 font-semibold">
          Try GPA Converter Free →
        </a>
      </div>
    </div>

    <!-- Scholarship Highlight -->
    <div class="mt-8 max-w-4xl mx-auto mb-20 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-yellow-900 mb-3">🏆 Scholarship Access - 100% FREE for Everyone!</h2>
        <p class="text-yellow-700 text-lg mb-4">
          Access our growing database of scholarships completely free with any plan. Find and apply for financial aid opportunities worldwide.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div class="bg-white rounded-lg p-4 border border-yellow-100">
            <div class="font-semibold text-yellow-900">All Plans Include</div>
            <div class="text-yellow-700">Unlimited scholarship browsing</div>
          </div>
          <div class="bg-white rounded-lg p-4 border border-yellow-100">
            <div class="font-semibold text-yellow-900">Save & Track</div>
            <div class="text-yellow-700">Mark favorites and track applications</div>
          </div>
          <div class="bg-white rounded-lg p-4 border border-yellow-100">
            <div class="font-semibold text-yellow-900">Apply Directly</div>
            <div class="text-yellow-700">Easy application process</div>
          </div>
        </div>
        <a href="/scholarships" class="inline-block mt-4 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition duration-300 font-semibold">
          Browse Scholarships →
        </a>
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
          <h3 class="text-lg font-medium text-gray-900 mb-3">What document types are included?</h3>
          <p class="text-gray-600">All plans include Statement of Purpose, Cover Letters, Personal Statements, and Academic CV generators. Each plan has different monthly limits for document generation.</p>
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