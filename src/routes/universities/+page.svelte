<script lang="ts">
  import UniversityMatcher from '$lib/components/UniversityMatcher.svelte';
  let { data } = $props();
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
        Discover universities across 4 major countries that match your academic profile. Get personalized recommendations with scholarship opportunities and financial analysis.
      </p>
      
      <!-- Global Coverage Banner -->
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200 max-w-5xl mx-auto mb-8">
        <div class="flex items-center justify-center space-x-4 mb-4">
          <span class="text-3xl">🌍</span>
          <div class="text-center">
            <h3 class="text-lg font-bold text-gray-900">NEW: Global University Database</h3>
            <p class="text-sm text-gray-700">Access 82+ universities across USA, UK, Canada & Australia!</p>
          </div>
          <span class="text-3xl">🎓</span>
        </div>
        
        <!-- Country Coverage Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white p-4 rounded-lg shadow-sm">
            <div class="text-2xl mb-2">🇺🇸</div>
            <div class="font-bold text-blue-600">47</div>
            <div class="text-sm text-gray-600">US Universities</div>
            <div class="text-xs text-gray-500 mt-1">Elite + API data</div>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm">
            <div class="text-2xl mb-2">🇬🇧</div>
            <div class="font-bold text-red-600">20</div>
            <div class="text-sm text-gray-600">UK Universities</div>
            <div class="text-xs text-gray-500 mt-1">Russell Group & more</div>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm">
            <div class="text-2xl mb-2">🍁</div>
            <div class="font-bold text-green-600">20</div>
            <div class="text-sm text-gray-600">Canadian Universities</div>
            <div class="text-xs text-gray-500 mt-1">Maclean's top ranked</div>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm">
            <div class="text-2xl mb-2">🇦🇺</div>
            <div class="font-bold text-orange-600">15</div>
            <div class="text-sm text-gray-600">Australian Universities</div>
            <div class="text-xs text-gray-500 mt-1">Group of Eight</div>
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

    <!-- Enhanced University Matcher with Global Coverage -->
    <UniversityMatcher />

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
          <div class="text-3xl font-bold text-blue-600">82+</div>
          <div class="text-sm text-gray-600">Universities Available</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-green-600">4</div>
          <div class="text-sm text-gray-600">Countries Covered</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-purple-600">1000+</div>
          <div class="text-sm text-gray-600">Scholarships Integrated</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-yellow-600">24/7</div>
          <div class="text-sm text-gray-600">AI-Powered Matching</div>
        </div>
      </div>
    </div>
  </div>
</div> 