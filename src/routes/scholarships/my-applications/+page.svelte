<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>My Scholarship Applications - Abroaducate</title>
  <meta name="description" content="Track your scholarship applications and deadlines in one place." />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        My Scholarship Applications
      </h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        Track all your scholarship applications, deadlines, and progress in one convenient place.
      </p>
    </div>

    <div class="bg-white rounded-lg shadow-lg p-8 text-center">
      <div class="text-6xl mb-4">📊</div>
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Scholarship Tracking Coming Soon</h2>
      <p class="text-gray-600 mb-6">
        This feature will integrate with your main application dashboard to provide 
        comprehensive tracking of all your academic opportunities.
      </p>
      
      <div class="bg-green-50 rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold text-green-900 mb-2">Features Coming:</h3>
        <ul class="text-left text-green-800 space-y-2">
          <li class="flex items-center">
            <svg class="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Application status tracking (interested, applying, submitted, decided)
          </li>
          <li class="flex items-center">
            <svg class="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Deadline reminders and calendar integration
          </li>
          <li class="flex items-center">
            <svg class="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Document requirements and submission tracking
          </li>
          <li class="flex items-center">
            <svg class="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Success analytics and application insights
          </li>
        </ul>
      </div>
      
      <div class="flex justify-center space-x-4">
        <a href="/dashboard" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition duration-300">
          Go to Dashboard
        </a>
        <a href="/scholarships" class="inline-block bg-gray-600 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-700 transition duration-300">
          Browse Scholarships
        </a>
      </div>
    </div>
  </div>
</div> 