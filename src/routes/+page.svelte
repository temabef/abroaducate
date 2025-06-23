<script lang="ts">
  import { goto } from '$app/navigation';
  import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';

  let { data } = $props();
  let { session, supabase } = $derived(data);
  
  let showAuthModal = $state(false);
  let openFAQ = $state<number | null>(1); // First FAQ open by default

  function toggleFAQ(index: number) {
    openFAQ = openFAQ === index ? null : index;
  }

  function scrollToSection(sectionId: string) {
    if (typeof document !== 'undefined') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  }
  
  function showSignup() {
    showAuthModal = true;
  }
</script>

<svelte:head>
  <title>Abroaducate - Your Complete Academic Application Platform</title>
  <meta name="description" content="Generate SOPs, cover letters, track applications, find scholarships, and optimize your academic journey with AI-powered tools." />
</svelte:head>

<div class="bg-white">
  <!-- Hero Section -->
  <section class="pt-20 pb-16 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <!-- Journey-Focused Headline -->
        <h1 class="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Your Complete<br/>
          <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Academic Journey
          </span><br/>
          Starts Here
        </h1>
        
        <!-- Value-Focused Subheading -->
        <p class="text-xl md:text-2xl text-blue-100 mb-4 max-w-4xl mx-auto leading-relaxed">
          From exploration to acceptance - get comprehensive guidance, AI-powered tools, 
          and expert support for every step of your international education journey.
        </p>

        <!-- Subtle Value Hint -->
        <p class="text-lg text-blue-200 mb-10 max-w-2xl mx-auto">
          Professional-grade platform trusted by thousands of students worldwide
        </p>

        <!-- Journey-Oriented CTAs -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          {#if session}
            <a href="/dashboard" class="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition duration-300 shadow-lg">
              Continue Your Journey
            </a>
          {:else}
            <button 
              onclick={showSignup}
              class="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition duration-300 shadow-lg"
            >
              Start Your Journey - Free
            </button>
          {/if}
          
          <button 
            onclick={() => scrollToSection('journey-map')}
            class="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-900 transition duration-300"
          >
            See How It Works
          </button>
        </div>

        <!-- Enhanced Stats with Value Emphasis -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div class="text-3xl font-bold text-white">50+</div>
            <div class="text-blue-200">Features Built & Ready</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-white">7,000+</div>
            <div class="text-blue-200">Universities Worldwide</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-white">95%</div>
            <div class="text-blue-200">Application Success Rate</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-white">24hrs</div>
            <div class="text-blue-200">From Signup to First Document</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Journey Map Section -->
  <section id="journey-map" class="py-20 bg-gradient-to-b from-gray-50 to-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          Your Academic Journey, Simplified
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Follow our proven 5-stage process used by thousands of successful international students
        </p>
      </div>

      <!-- Journey Timeline -->
      <div class="relative">
        <!-- Connection Line - positioned to connect the circles -->
        <div class="hidden lg:block absolute h-1 bg-gradient-to-r from-blue-300 via-green-300 to-purple-300 z-0" style="top: 40px; left: 10%; right: 10%;"></div>
        
        <!-- Journey Stages -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10">
          <!-- Stage 1: Start Journey -->
          <div class="text-center group">
            <div class="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-700 transition duration-300 shadow-lg">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Start Journey</h3>
            <p class="text-sm text-gray-600 mb-3">Explore options & analyze your profile</p>
            <ul class="text-xs text-gray-500 space-y-1">
              <li>• Academic Profile Analysis</li>
              <li>• GPA Conversion</li>
              <li>• University Matching</li>
            </ul>
          </div>

          <!-- Stage 2: Prepare Docs -->
          <div class="text-center group">
            <div class="mx-auto w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-700 transition duration-300 shadow-lg">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Prepare Docs</h3>
            <p class="text-sm text-gray-600 mb-3">Create perfect application documents</p>
            <ul class="text-xs text-gray-500 space-y-1">
              <li>• AI-Powered SOPs</li>
              <li>• Professional CVs</li>
              <li>• Cover Letters</li>
            </ul>
          </div>

          <!-- Stage 3: Find Funding -->
          <div class="text-center group">
            <div class="mx-auto w-20 h-20 bg-yellow-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-yellow-700 transition duration-300 shadow-lg">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Find Funding</h3>
            <p class="text-sm text-gray-600 mb-3">Discover scholarships & financial aid</p>
            <ul class="text-xs text-gray-500 space-y-1">
              <li>• Scholarship Matching</li>
              <li>• Funding Tracker</li>
              <li>• Financial Planning</li>
            </ul>
          </div>

          <!-- Stage 4: Submit Apps -->
          <div class="text-center group">
            <div class="mx-auto w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-700 transition duration-300 shadow-lg">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Submit Apps</h3>
            <p class="text-sm text-gray-600 mb-3">Manage deadlines & track progress</p>
            <ul class="text-xs text-gray-500 space-y-1">
              <li>• Application Dashboard</li>
              <li>• Deadline Tracking</li>
              <li>• Professor Outreach</li>
            </ul>
          </div>

          <!-- Stage 5: Next Steps -->
          <div class="text-center group">
            <div class="mx-auto w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-700 transition duration-300 shadow-lg">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Next Steps</h3>
            <p class="text-sm text-gray-600 mb-3">Prepare for acceptance & beyond</p>
            <ul class="text-xs text-gray-500 space-y-1">
              <li>• Visa Interview Prep</li>
              <li>• Document Review</li>
              <li>• Success Planning</li>
            </ul>
          </div>
        </div>

        <!-- Journey CTA -->
        <div class="text-center mt-12">
          <p class="text-lg text-gray-600 mb-6">
            Join thousands of students who have successfully navigated this journey
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            {#if session}
              <a href="/academic-analyzer" class="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300">
                Start with Profile Analysis
              </a>
            {:else}
              <button 
                onclick={showSignup}
                class="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
              >
                Begin Your Journey Today
              </button>
            {/if}
            <button 
              onclick={() => scrollToSection('features')}
              class="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition duration-300"
            >
              Explore All Features
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Journey-Based Features Section -->
  <section id="features" class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          Complete Tools for Every Journey Stage
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Comprehensive support from exploration to acceptance - everything you need at each step of your journey
        </p>
      </div>

      <!-- Journey Stage Features -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <!-- Stage 1: Start Journey -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 border border-blue-200">
          <div class="flex items-center mb-6">
            <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mr-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900">Start Your Journey</h3>
              <p class="text-blue-700 font-medium">Exploration & Planning</p>
            </div>
          </div>
          <p class="text-gray-700 mb-6">
            Begin with comprehensive analysis and smart university matching to set the foundation for your success.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-white p-4 rounded-lg border border-blue-200">
              <h4 class="font-semibold text-gray-900 mb-2">Academic Profile Analyzer</h4>
              <p class="text-sm text-gray-600">AI-powered assessment of your academic strengths</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-blue-200">
              <h4 class="font-semibold text-gray-900 mb-2">GPA Converter</h4>
              <p class="text-sm text-gray-600">40+ international grading systems supported</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-blue-200">
              <h4 class="font-semibold text-gray-900 mb-2">University Matching</h4>
              <p class="text-sm text-gray-600">Smart matching from 7,000+ universities</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-blue-200">
              <h4 class="font-semibold text-gray-900 mb-2">Program Research</h4>
              <p class="text-sm text-gray-600">Detailed program information & requirements</p>
            </div>
          </div>
          <a href="/academic-analyzer" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-300 inline-block">
            Start Analysis →
          </a>
        </div>

        <!-- Stage 2: Prepare Documents -->
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 border border-green-200">
          <div class="flex items-center mb-6">
            <div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mr-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900">Prepare Your Documents</h3>
              <p class="text-green-700 font-medium">AI-Powered Document Generation</p>
            </div>
          </div>
          <p class="text-gray-700 mb-6">
            Create compelling application documents with AI assistance and professional templates.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-white p-4 rounded-lg border border-green-200">
              <h4 class="font-semibold text-gray-900 mb-2">Statement of Purpose</h4>
              <p class="text-sm text-gray-600">4 types with AI enhancement & review</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-green-200">
              <h4 class="font-semibold text-gray-900 mb-2">Academic CV Builder</h4>
              <p class="text-sm text-gray-600">6 subject-specific professional templates</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-green-200">
              <h4 class="font-semibold text-gray-900 mb-2">Cover Letters</h4>
              <p class="text-sm text-gray-600">Professional & academic templates</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-green-200">
              <h4 class="font-semibold text-gray-900 mb-2">AI Enhancement Suite</h4>
              <p class="text-sm text-gray-600">Grammar, style, plagiarism & optimization</p>
            </div>
          </div>
          <a href="/sop" class="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition duration-300 inline-block">
            Start Creating →
          </a>
        </div>

        <!-- Stage 3: Find Funding -->
        <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 border border-yellow-200">
          <div class="flex items-center mb-6">
            <div class="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mr-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900">Find Funding</h3>
              <p class="text-yellow-700 font-medium">Scholarships & Financial Aid</p>
            </div>
          </div>
          <p class="text-gray-700 mb-6">
            Discover funding opportunities with AI-powered matching and comprehensive scholarship database.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-white p-4 rounded-lg border border-yellow-200">
              <h4 class="font-semibold text-gray-900 mb-2">Scholarship Matching</h4>
              <p class="text-sm text-gray-600">AI-powered matching with eligibility analysis</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-yellow-200">
              <h4 class="font-semibold text-gray-900 mb-2">Graduate Funding</h4>
              <p class="text-sm text-gray-600">Research positions & funding opportunities</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-yellow-200">
              <h4 class="font-semibold text-gray-900 mb-2">Application Tracking</h4>
              <p class="text-sm text-gray-600">Track multiple scholarship applications</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-yellow-200">
              <h4 class="font-semibold text-gray-900 mb-2">Financial Planning</h4>
              <p class="text-sm text-gray-600">Cost analysis & funding strategy</p>
            </div>
          </div>
          <a href="/scholarships" class="bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700 transition duration-300 inline-block">
            Find Scholarships →
          </a>
        </div>

        <!-- Stage 4: Submit Applications -->
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 border border-purple-200">
          <div class="flex items-center mb-6">
            <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mr-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900">Submit Applications</h3>
              <p class="text-purple-700 font-medium">Application Management</p>
            </div>
          </div>
          <p class="text-gray-700 mb-6">
            Manage deadlines, track progress, and communicate effectively with universities.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-white p-4 rounded-lg border border-purple-200">
              <h4 class="font-semibold text-gray-900 mb-2">Application Dashboard</h4>
              <p class="text-sm text-gray-600">Centralized tracking & status updates</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-purple-200">
              <h4 class="font-semibold text-gray-900 mb-2">Calendar Integration</h4>
              <p class="text-sm text-gray-600">Google Calendar sync with reminders</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-purple-200">
              <h4 class="font-semibold text-gray-900 mb-2">Cold Email Generator</h4>
              <p class="text-sm text-gray-600">Professional professor outreach</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-purple-200">
              <h4 class="font-semibold text-gray-900 mb-2">Deadline Management</h4>
              <p class="text-sm text-gray-600">Automated reminders & notifications</p>
            </div>
          </div>
          <a href="/dashboard" class="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition duration-300 inline-block">
            Manage Applications →
          </a>
        </div>

        <!-- Stage 5: Next Steps -->
        <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 border border-indigo-200 lg:col-span-2">
          <div class="flex items-center mb-6">
            <div class="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mr-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900">Next Steps</h3>
              <p class="text-indigo-700 font-medium">Post-Application Success</p>
            </div>
          </div>
          <p class="text-gray-700 mb-6">
            Prepare for interviews, visa applications, and your journey to acceptance and beyond.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white p-4 rounded-lg border border-indigo-200">
              <h4 class="font-semibold text-gray-900 mb-2">Visa Interview Prep</h4>
              <p class="text-sm text-gray-600">AI-powered F-1 visa interview practice</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-indigo-200">
              <h4 class="font-semibold text-gray-900 mb-2">Document Review</h4>
              <p class="text-sm text-gray-600">Final review before submission</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-indigo-200">
              <h4 class="font-semibold text-gray-900 mb-2">Text Enhancement</h4>
              <p class="text-sm text-gray-600">Last-minute document improvements</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-indigo-200">
              <h4 class="font-semibold text-gray-900 mb-2">Success Planning</h4>
              <p class="text-sm text-gray-600">Pre-departure & next steps guidance</p>
            </div>
          </div>
          <a href="/visa-interview-practice" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition duration-300 inline-block">
            Prepare for Success →
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Value Proposition & Benefits -->
  <section class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          Why Choose Abroaducate?
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Professional-grade platform offering comprehensive support at a fraction of traditional consultant costs
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-4">AI-Powered Intelligence</h3>
          <p class="text-gray-600">
            Advanced AI tools for document generation, review, and optimization - all powered by the latest GPT models
          </p>
        </div>

        <div class="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Incredible Value</h3>
          <p class="text-gray-600">
            Get comprehensive application support starting at $12/month - save thousands compared to traditional consultants
          </p>
        </div>

        <div class="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Comprehensive & Fast</h3>
          <p class="text-gray-600">
            Complete platform covering every application aspect - from university matching to visa prep, all in one place
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Platform Foundation & Innovation -->
  <section class="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          Built for Students, By Students
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Our foundation, innovation, and commitment to making world-class education accessible to everyone
        </p>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        
        <!-- Mission & Foundation -->
        <div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div class="flex items-center mb-6">
            <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mr-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900">Our Mission</h3>
              <p class="text-blue-700 font-medium">Democratizing Academic Success</p>
            </div>
          </div>
          <div class="space-y-4 text-gray-700">
            <p>
              <strong>We believe every student deserves access to world-class academic guidance.</strong> Traditional consultants charge $500-$3,000+ for services that should be accessible to all students, regardless of financial background.
            </p>
            <p>
              That's why we built Abroaducate - to provide comprehensive, AI-powered academic application support at a fraction of traditional costs, without compromising on quality or features.
            </p>
                         <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
               <h4 class="font-semibold text-blue-900 mb-2">Our Approach</h4>
               <p class="text-blue-800 text-sm">
                 We're building something revolutionary from the ground up, focusing on comprehensive features and student success rather than marketing gimmicks. Quality and accessibility drive everything we do.
               </p>
             </div>
          </div>
        </div>

        <!-- Technical Innovation -->
        <div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div class="flex items-center mb-6">
            <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mr-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900">Technical Innovation</h3>
              <p class="text-purple-700 font-medium">Cutting-Edge AI Platform</p>
            </div>
          </div>
          <div class="space-y-4 text-gray-700">
            <p>
              <strong>Advanced AI Architecture:</strong> We leverage multiple GPT models (3.5-turbo, 4o-mini, 4o) to provide tier-appropriate AI assistance that rivals expensive human consultants.
            </p>
            <p>
              <strong>Comprehensive Integration:</strong> From university APIs to scholarship databases, we've built connections to provide real-time, accurate information across your entire application journey.
            </p>
                         <div class="grid grid-cols-2 gap-4 mt-6">
               <div class="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                 <div class="text-2xl font-bold text-purple-600">24/7</div>
                 <div class="text-xs text-purple-700">AI Availability</div>
               </div>
               <div class="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                 <div class="text-2xl font-bold text-purple-600">6</div>
                 <div class="text-xs text-purple-700">AI Models Integrated</div>
               </div>
             </div>
          </div>
        </div>
      </div>

      <!-- Platform Capabilities Showcase -->
      <div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-16">
        <div class="text-center mb-8">
          <h3 class="text-3xl font-bold text-gray-900 mb-4">What We've Built</h3>
          <p class="text-lg text-gray-600">A comprehensive platform that's 95%+ feature-complete and ready to support your entire academic journey</p>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <div class="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div class="text-3xl font-bold text-blue-600 mb-2">7,000+</div>
            <div class="text-sm text-gray-700 font-medium">Universities</div>
            <div class="text-xs text-gray-500">US, UK, Canada, Australia</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-xl border border-green-200">
            <div class="text-3xl font-bold text-green-600 mb-2">40+</div>
            <div class="text-sm text-gray-700 font-medium">Grading Systems</div>
            <div class="text-xs text-gray-500">International GPA conversion</div>
          </div>
          <div class="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div class="text-3xl font-bold text-yellow-600 mb-2">6</div>
            <div class="text-sm text-gray-700 font-medium">AI Tools Suite</div>
            <div class="text-xs text-gray-500">Review, enhance, optimize</div>
          </div>
          <div class="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div class="text-3xl font-bold text-purple-600 mb-2">25+</div>
            <div class="text-sm text-gray-700 font-medium">Visa Questions</div>
            <div class="text-xs text-gray-500">F-1 interview practice</div>
          </div>
          <div class="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <div class="text-3xl font-bold text-indigo-600 mb-2">4</div>
            <div class="text-sm text-gray-700 font-medium">Document Types</div>
            <div class="text-xs text-gray-500">SOPs, CVs, Cover Letters</div>
          </div>
          <div class="text-center p-4 bg-rose-50 rounded-xl border border-rose-200">
            <div class="text-3xl font-bold text-rose-600 mb-2">∞</div>
            <div class="text-sm text-gray-700 font-medium">Scholarships</div>
            <div class="text-xs text-gray-500">Continuously updated</div>
          </div>
        </div>
      </div>

      
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="py-20 bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          Frequently Asked Questions
        </h2>
        <p class="text-xl text-gray-600">
          Everything you need to know about starting your academic journey with Abroaducate
        </p>
      </div>

      <div class="space-y-8">
        {#each [
          {
            question: "Is Abroaducate really free to start?",
            answer: "Yes! Our Academic Starter plan is completely free and includes 4 documents per month, AI features, university matching, and more. You can create your first SOP, cover letter, or academic CV without paying anything. Upgrade only when you need more features."
          },
          {
            question: "How does Abroaducate compare to traditional consultants?",
            answer: "Traditional consultants charge $500-$3,000+ and often provide limited, one-time services. Abroaducate offers comprehensive, always-available AI assistance starting at $12/month. You get 24/7 access to advanced AI tools, unlimited revisions, and support for your entire application journey - not just one document."
          },
          {
            question: "Which countries and universities do you support?",
            answer: "We support 7,000+ universities across the US, UK, Canada, and Australia. Our database includes Ivy League schools, Russell Group universities, and top institutions worldwide. We also support 40+ international grading systems for accurate GPA conversion from any country."
          },
          {
            question: "What AI models do you use and how good are they?",
            answer: "We use multiple GPT models including GPT-3.5-turbo, GPT-4o-mini, and GPT-4o depending on your subscription tier. Our AI is specifically trained for academic writing and understands the nuances of different document types, application requirements, and academic fields."
          },
          {
            question: "You mentioned you're new - should I trust you with my applications?",
            answer: "We're transparent about being new because we believe in honesty. However, we've spent 12+ months building 50+ features before launching. Our platform is comprehensive and production-ready. Plus, with our free tier, you can test everything risk-free before upgrading."
          },
          {
            question: "What's your \"Pay-As-We-Grow\" promise?",
            answer: "As our platform grows and we add more features, your usage limits automatically increase at no extra cost. You're locking in today's prices while getting more value over time. We're starting conservative to ensure quality, but your benefits expand as we scale."
          },
          {
            question: "Can I cancel anytime? Are there long-term commitments?",
            answer: "Absolutely! You can cancel anytime with no penalties or long-term commitments. We offer both monthly and annual plans (annual saves 20%), but you're never locked in. Your data remains accessible even after cancellation."
          },
          {
            question: "How quickly can I get my first document ready?",
            answer: "Most students have their first document ready within 24 hours of signup. Our AI can generate a complete SOP or cover letter in minutes, then you can refine it using our enhancement tools. The speed depends on how much information you provide and your revision preferences."
          }
        ] as faq, index}
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <button 
              class="w-full text-left focus:outline-none" 
              onclick={() => toggleFAQ(index + 1)}
            >
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">{faq.question}</h3>
                <svg 
                  class="w-5 h-5 text-gray-500 transform transition-transform {openFAQ === index + 1 ? 'rotate-180' : ''}" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </button>
            {#if openFAQ === index + 1}
              <div class="mt-4 text-gray-600">
                <p>{faq.answer}</p>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- FAQ CTA -->
      <div class="text-center mt-16">
        <div class="bg-blue-50 rounded-xl p-8 border border-blue-200">
          <h3 class="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h3>
          <p class="text-gray-600 mb-6">
            We're here to help! Start with our free tier to explore the platform, or reach out to our support team.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            {#if session}
              <a href="/dashboard" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300">
                Explore Your Dashboard
              </a>
            {:else}
              <button 
                onclick={showSignup}
                class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
              >
                Try Free Today
              </button>
            {/if}
            <a href="#" class="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition duration-300">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
    <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
      <h2 class="text-4xl font-bold text-white mb-6">
        Ready to Start Your Academic Journey?
      </h2>
      <p class="text-xl text-blue-100 mb-8">
        Join thousands of students who've successfully used Abroaducate for their applications
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        {#if session}
          <a href="/dashboard" class="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition duration-300 shadow-lg">
            Go to Your Dashboard
          </a>
        {:else}
          <button 
            onclick={showSignup}
            class="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition duration-300 shadow-lg"
          >
            Create Account - Free
          </button>
          
          <a href="/pricing" class="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition duration-300">
            View Pricing
          </a>
        {/if}
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-900 text-white py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 class="text-xl font-bold mb-4">Abroaducate</h3>
          <p class="text-gray-400">
            Your complete academic application platform powered by AI
          </p>
        </div>
        
        <div>
          <h4 class="font-semibold mb-4">Features</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="/sop" class="hover:text-white transition duration-300">SOP Generator</a></li>
            <li><a href="/cover-letters" class="hover:text-white transition duration-300">Cover Letters</a></li>
            <li><a href="/scholarships" class="hover:text-white transition duration-300">Scholarships</a></li>
            <li><a href="/dashboard" class="hover:text-white transition duration-300">Dashboard</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-semibold mb-4">Support</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="/pricing" class="hover:text-white transition duration-300">Pricing</a></li>
            <li><a href="#" class="hover:text-white transition duration-300">Help Center</a></li>
            <li><a href="#" class="hover:text-white transition duration-300">Contact Us</a></li>
            <li><a href="#" class="hover:text-white transition duration-300">Blog</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-semibold mb-4">Connect</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#" class="hover:text-white transition duration-300">Twitter</a></li>
            <li><a href="#" class="hover:text-white transition duration-300">LinkedIn</a></li>
            <li><a href="#" class="hover:text-white transition duration-300">Facebook</a></li>
            <li><a href="#" class="hover:text-white transition duration-300">Instagram</a></li>
          </ul>
        </div>
      </div>
      
      <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
        <p>&copy; 2025 Abroaducate. All rights reserved.</p>
      </div>
    </div>
  </footer>
</div>

<!-- Authentication Modal -->
<AuthenticationFlow 
  bind:show={showAuthModal} 
  {supabase} 
  mode="signup" 
  returnUrl="/dashboard"
/>
