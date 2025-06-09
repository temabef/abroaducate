<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>University Matching - Abroaducate</title>
  <meta name="description" content="Find universities that match your academic profile, interests, and career goals." />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        University Matching
      </h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        Find the perfect universities that match your academic profile, interests, and career aspirations.
      </p>
    </div>

    <div class="bg-white rounded-lg shadow-lg p-8 text-center">
      <div class="text-6xl mb-4">🏫</div>
      <h2 class="text-2xl font-bold text-gray-900 mb-4">AI-Powered University Matching</h2>
      <p class="text-gray-600 mb-6">
        Our intelligent matching system is currently in development. It will analyze your 
        academic background, preferences, and goals to suggest the best-fit universities.
      </p>
      
      <div class="bg-purple-50 rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold text-purple-900 mb-2">Matching Features:</h3>
        <ul class="text-left text-purple-800 space-y-2">
          <li class="flex items-center">
            <svg class="w-5 h-5 text-purple-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Academic profile matching (GPA, test scores, coursework)
          </li>
          <li class="flex items-center">
            <svg class="w-5 h-5 text-purple-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Program and research area compatibility
          </li>
          <li class="flex items-center">
            <svg class="w-5 h-5 text-purple-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Location preferences and campus culture fit
          </li>
          <li class="flex items-center">
            <svg class="w-5 h-5 text-purple-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Financial considerations and aid opportunities
          </li>
          <li class="flex items-center">
            <svg class="w-5 h-5 text-purple-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Admission probability calculations
          </li>
        </ul>
      </div>
      
      <div class="bg-yellow-50 rounded-lg p-4 mb-6">
        <p class="text-yellow-800">
          <span class="font-semibold">Note:</span> Currently, university matching features are available 
          in your <a href="/dashboard" class="text-yellow-900 underline hover:text-yellow-700">dashboard</a> 
          as part of the application management system.
        </p>
      </div>
      
      <div class="flex justify-center space-x-4">
        <a href="/dashboard" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition duration-300">
          Go to Dashboard
        </a>
        <a href="/sop" class="inline-block bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition duration-300">
          Start SOP Generator
        </a>
      </div>
    </div>
  </div>
</div> 