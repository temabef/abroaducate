<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>Text Enhancement - Abroaducate</title>
  <meta name="description" content="Enhance your academic writing with AI-powered suggestions and improvements." />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        Text Enhancement
      </h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        Improve your academic writing with AI-powered suggestions for clarity, flow, and impact.
      </p>
    </div>

    <div class="bg-white rounded-lg shadow-lg p-8 text-center">
      <div class="text-6xl mb-4">✨</div>
      <h2 class="text-2xl font-bold text-gray-900 mb-4">AI Writing Enhancement</h2>
      <p class="text-gray-600 mb-6">
        Our AI writing enhancement tools are currently integrated into the document generation process.
        Advanced standalone text enhancement features are coming soon.
      </p>
      
      <div class="bg-blue-50 rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold text-blue-900 mb-2">Current Enhancement Features:</h3>
        <ul class="text-left text-blue-800 space-y-2">
          <li class="flex items-center">
            <svg class="w-5 h-5 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Integrated in SOP, Cover Letter, and Personal Statement generators
          </li>
          <li class="flex items-center">
            <svg class="w-5 h-5 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Available in the <a href="/sop-review" class="text-blue-900 underline">document review</a> tool
          </li>
          <li class="flex items-center">
            <svg class="w-5 h-5 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Built into the document generation workflow
          </li>
        </ul>
      </div>

      <div class="bg-yellow-50 rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold text-yellow-900 mb-2">Coming Soon:</h3>
        <ul class="text-left text-yellow-800 space-y-2">
          <li class="flex items-center">
            <svg class="w-5 h-5 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Standalone text enhancement tool
          </li>
          <li class="flex items-center">
            <svg class="w-5 h-5 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Paste-and-enhance functionality
          </li>
          <li class="flex items-center">
            <svg class="w-5 h-5 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Real-time writing suggestions
          </li>
          <li class="flex items-center">
            <svg class="w-5 h-5 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Style and tone optimization
          </li>
        </ul>
      </div>
      
      <div class="flex justify-center space-x-4">
        <a href="/sop-review" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition duration-300">
          Try Document Review
        </a>
        <a href="/sop" class="inline-block bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition duration-300">
          Generate New Document
        </a>
      </div>
    </div>
  </div>
</div> 