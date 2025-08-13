<script lang="ts">
  import AdSenseAd from '$lib/components/AdSenseAd.svelte';
  import UniversityMatcher from '$lib/components/UniversityMatcher.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  let { data } = $props();
  let { supabase, session } = $derived(data);
  
  // Check if we're coming from a UK university redirect
  const isUkUniversityView = $derived($page.url.searchParams.get('source') === 'uk');
</script>

<svelte:head>
  <title>Global University Matching - Abroaducate</title>
  <meta name="description" content="Find universities across USA, UK, Canada & Australia that match your profile. Get scholarship recommendations & financial analysis." />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        Global University Matching
      </h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
        Discover universities across 9 major countries that match your academic profile. Get personalized recommendations with scholarship opportunities and financial analysis.
      </p>
      
      <!-- Global Coverage Banner -->
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200 max-w-5xl mx-auto mb-8">
        <div class="flex items-center justify-center space-x-4 mb-4">
          <span class="text-3xl">🌍</span>
          <div class="text-center">
            <h3 class="text-lg font-bold text-gray-900">NEW: Global University Database</h3>
            <p class="text-sm text-gray-700">Access 7,500+ universities across USA, UK, Canada, Australia, Germany & more!</p>
          </div>
          <span class="text-3xl">🎓</span>
        </div>
        
        <!-- Country Coverage Grid - First Row -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3">
          <div class="bg-white p-3 rounded-lg shadow-sm text-center">
            <div class="font-bold text-blue-600">🇺🇸 United States</div>
            <div class="text-sm text-gray-600">7,000+ Universities</div>
          </div>
          <div class="bg-white p-3 rounded-lg shadow-sm text-center">
            <div class="font-bold text-blue-600">🇬🇧 United Kingdom</div>
            <div class="text-sm text-gray-600">109 Universities</div>
          </div>
          <div class="bg-white p-3 rounded-lg shadow-sm text-center">
            <div class="font-bold text-blue-600">🇨🇦 Canada</div>
            <div class="text-sm text-gray-600">89 Universities</div>
          </div>
          <div class="bg-white p-3 rounded-lg shadow-sm text-center">
            <div class="font-bold text-blue-600">🇩🇪 Germany</div>
            <div class="text-sm text-gray-600">89 Universities</div>
          </div>
          <div class="bg-white p-3 rounded-lg shadow-sm text-center">
            <div class="font-bold text-blue-600">🇫🇷 France</div>
            <div class="text-sm text-gray-600">49 Universities</div>
          </div>
        </div>
        
        <!-- Country Coverage Grid - Second Row (Centered) -->
        <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6 mx-auto max-w-3xl">
          <div class="bg-white p-3 rounded-lg shadow-sm text-center">
            <div class="font-bold text-blue-600">🇮🇹 Italy</div>
            <div class="text-sm text-gray-600">47 Universities</div>
          </div>
          <div class="bg-white p-3 rounded-lg shadow-sm text-center">
            <div class="font-bold text-blue-600">🇯🇵 Japan</div>
            <div class="text-sm text-gray-600">59 Universities</div>
          </div>
          <div class="bg-white p-3 rounded-lg shadow-sm text-center">
            <div class="font-bold text-blue-600">🇦🇺 Australia</div>
            <div class="text-sm text-gray-600">48 Universities</div>
          </div>
          <div class="bg-white p-3 rounded-lg shadow-sm text-center">
            <div class="font-bold text-blue-600">🇳🇱 Netherlands</div>
            <div class="text-sm text-gray-600">29 Universities</div>
          </div>
        </div>

        <!-- Enhanced Features Grid -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div class="bg-white p-3 rounded text-center">
            <div class="text-lg font-bold text-blue-600">💰</div>
            <div class="font-medium">Scholarship Intelligence</div>
            <div class="text-gray-600">Real funding opportunities</div>
          </div>
          <div class="bg-white p-3 rounded text-center">
            <div class="text-lg font-bold text-green-600">📊</div>
            <div class="font-medium">Cost Analysis</div>
            <div class="text-gray-600">True cost after aid</div>
          </div>
          <div class="bg-white p-3 rounded text-center">
            <div class="text-lg font-bold text-purple-600">🎯</div>
            <div class="font-medium">Smart Matching</div>
            <div class="text-gray-600">AI-powered recommendations</div>
          </div>
          <div class="bg-white p-3 rounded text-center">
            <div class="text-lg font-bold text-yellow-600">🔄</div>
            <div class="font-medium">Live Data</div>
            <div class="text-gray-600">Real-time updates</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ad after country coverage -->
    <AdSenseAd adSlot="6442575607" className="my-8" />

    {#if isUkUniversityView}
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 class="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
          <span class="text-3xl">🇬🇧</span> UK Universities
        </h2>
        
        <p class="mb-4">
          We have a comprehensive database of UK universities. Some specialized institutions or newer campuses 
          might not be fully integrated yet, but we're constantly expanding our coverage.
        </p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <a href="/universities/oxford" class="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 class="font-bold">University of Oxford</h3>
            <p class="text-sm text-gray-600">Oxford, South East England</p>
          </a>
          <a href="/universities/cambridge" class="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 class="font-bold">University of Cambridge</h3>
            <p class="text-sm text-gray-600">Cambridge, East of England</p>
          </a>
          <a href="/universities/st-andrews" class="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 class="font-bold">University of St Andrews</h3>
            <p class="text-sm text-gray-600">St Andrews, Scotland</p>
          </a>
          <a href="/universities/lse" class="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 class="font-bold">London School of Economics</h3>
            <p class="text-sm text-gray-600">London, England</p>
          </a>
          <a href="/universities/imperial" class="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 class="font-bold">Imperial College London</h3>
            <p class="text-sm text-gray-600">London, England</p>
          </a>
          <a href="/universities/durham" class="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 class="font-bold">Durham University</h3>
            <p class="text-sm text-gray-600">Durham, North East England</p>
          </a>
        </div>
        
        <div class="mt-6 text-center">
          <a href="/universities/database?selectedSource=uk" class="btn btn-primary">
            View All UK Universities
          </a>
        </div>
      </div>
    {/if}

    <!-- Enhanced University Matcher with Global Coverage -->
    <UniversityMatcher {supabase} {session} />

    <!-- Additional Features Section -->
    <div class="mt-16 max-w-6xl mx-auto">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Global Matching?</h2>
        <p class="text-lg text-gray-600">Advanced features that go beyond simple university lists</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Feature 1: Global Coverage -->
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <div class="text-3xl mb-4">🌐</div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">Comprehensive Global Coverage</h3>
          <p class="text-gray-600 mb-4">Access universities from the top 4 English-speaking destinations for international students.</p>
          <ul class="text-sm text-gray-600 space-y-2">
            <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>Elite US institutions + API data</li>
            <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>UK Russell Group universities</li>
            <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>Canadian research powerhouses</li>
            <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>Australian Group of Eight</li>
          </ul>
        </div>

        <!-- Feature 2: Intelligent Matching -->
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <div class="text-3xl mb-4">🧠</div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">AI-Powered Intelligence</h3>
          <p class="text-gray-600 mb-4">Our advanced algorithms consider multiple factors for personalized recommendations.</p>
          <ul class="text-sm text-gray-600 space-y-2">
            <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>Academic profile matching</li>
            <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>Financial feasibility analysis</li>
            <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>Program strength assessment</li>
            <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>Geographic preference optimization</li>
          </ul>
        </div>

        <!-- Feature 3: Integrated Scholarship System -->
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <div class="text-3xl mb-4">💎</div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">Integrated Scholarship System</h3>
          <p class="text-gray-600 mb-4">Get scholarship recommendations tailored to each university match.</p>
          <ul class="text-sm text-gray-600 space-y-2">
            <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>University-specific scholarships</li>
            <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>Government funding programs</li>
            <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>Field-based opportunities</li>
            <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>Real cost calculations</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Call to Action Section -->
    <div class="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center text-white">
      <h3 class="text-2xl font-bold mb-4">Ready to Build Your University Application Portfolio?</h3>
      <p class="text-blue-100 mb-6">
        Use our comprehensive suite of AI-powered tools to create compelling application documents and secure funding.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/sop" class="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition duration-200">
          📝 Generate Statement of Purpose
        </a>
        <a href="/scholarships" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition duration-200">
          💰 Find Scholarships
        </a>
        <a href="/cover-letters" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition duration-200">
          ✉️ Create Cover Letter
        </a>
        <a href="/dashboard" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition duration-200">
          📊 View Dashboard
        </a>
      </div>
    </div>

    <!-- Success Stories/Stats Section -->
    <div class="mt-16 bg-gray-100 rounded-lg p-8">
      <div class="text-center mb-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-4">Join Thousands of Successful Applicants</h3>
        <p class="text-gray-600">Students worldwide are using our platform to find their perfect university match</p>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div>
          <div class="text-3xl font-bold text-blue-600">7,520+</div>
          <div class="text-sm text-gray-600">Universities Available</div>
          <div class="text-xs text-gray-500 mt-1">Smart search shows best matches</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-green-600">9</div>
          <div class="text-sm text-gray-600">Countries Covered</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-purple-600">95%</div>
          <div class="text-sm text-gray-600">Student Satisfaction</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-red-600">24/7</div>
          <div class="text-sm text-gray-600">Support Available</div>
        </div>
      </div>
    </div>

    <!-- Call to Action -->
    <div class="text-center">
      <a href="/universities/database" class="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
        Explore All Universities
        <svg class="ml-2 -mr-1 w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    </div>
  </div>
</div> 