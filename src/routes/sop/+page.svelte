<script lang="ts">
  import FormSection from '$lib/components/FormSection.svelte';
  
  let { data } = $props();
  let { session, supabase } = $derived(data);
</script>

<svelte:head>
  <title>Statement of Purpose Generator - Abroaducate</title>
  <meta name="description" content="Generate professional statements of purpose for your university applications with AI assistance." />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-20">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        Statement of Purpose Generator
      </h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
        Create compelling statements of purpose that showcase your academic background, 
        research interests, and career goals with our comprehensive AI-powered form.
      </p>
      
      <!-- Free Trial Info -->
      <div class="bg-blue-100 text-blue-800 px-6 py-3 rounded-lg inline-block mb-8">
        <span class="font-semibold">🎯 Step-by-Step Process:</span> Complete 4 detailed sections • 
        <span class="font-semibold">💎 Free Trial:</span> 1 credit included
      </div>
    </div>

    <!-- Comprehensive SOP Form -->
    <FormSection {supabase} {session} />
    
    <!-- Additional Features Section -->
    <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="bg-white rounded-lg p-6 shadow-sm text-center">
        <div class="text-3xl mb-4">🎯</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Targeted Content</h3>
        <p class="text-gray-600">
          Tailored questions to capture your unique academic journey and aspirations
        </p>
      </div>
      
      <div class="bg-white rounded-lg p-6 shadow-sm text-center">
        <div class="text-3xl mb-4">🤖</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">AI-Powered Generation</h3>
        <p class="text-gray-600">
          Advanced AI analyzes your responses to create compelling, personalized SOPs
        </p>
      </div>
      
      <div class="bg-white rounded-lg p-6 shadow-sm text-center">
        <div class="text-3xl mb-4">✨</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Professional Quality</h3>
        <p class="text-gray-600">
          University-standard formatting and language that impresses admissions committees
        </p>
      </div>
    </div>

    <!-- Related Tools -->
    <div class="mt-16 bg-white rounded-lg shadow-sm p-8">
      <h3 class="text-xl font-semibold text-gray-900 mb-6 text-center">
        Complete Your Application Suite
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a href="/cover-letters" class="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition duration-200">
          <div class="text-2xl mb-2">📝</div>
          <h4 class="font-semibold text-gray-900 mb-1">Cover Letters</h4>
          <p class="text-sm text-gray-600">Generate professional cover letters for your applications</p>
        </a>
        
        <a href="/personal-statements" class="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition duration-200">
          <div class="text-2xl mb-2">💭</div>
          <h4 class="font-semibold text-gray-900 mb-1">Personal Statements</h4>
          <p class="text-sm text-gray-600">Craft compelling personal statements that tell your story</p>
        </a>
        
        <a href="/academic-cv" class="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition duration-200">
          <div class="text-2xl mb-2">📄</div>
          <h4 class="font-semibold text-gray-900 mb-1">Academic CV</h4>
          <p class="text-sm text-gray-600">Create professional academic CVs highlighting your achievements</p>
        </a>
      </div>
    </div>
  </div>
</div>