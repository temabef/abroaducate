<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<section class="mb-8">
  <h2 class="text-xl font-bold text-gray-900 mb-4">🚀 Quick Actions</h2>
  
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
    <button onclick={() => goto('/sop')} class="flex flex-col items-center p-3 md:p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50">
      <span class="text-2xl md:text-3xl mb-2 md:mb-3">📄</span>
      <div class="text-center">
        <span class="text-sm font-semibold text-gray-800 block mb-1">Generate SOP</span>
        <span class="text-xs text-gray-500">Statement of Purpose</span>
      </div>
    </button>
    
    <button onclick={() => goto('/cover-letters')} class="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer hover:border-gray-300 hover:border-blue-300 hover:bg-blue-50">
      <span class="text-3xl mb-3">📧</span>
      <div class="text-center">
        <span class="text-sm font-semibold text-gray-800 block mb-1">Cover Letter</span>
        <span class="text-xs text-gray-500">Professional applications</span>
      </div>
    </button>
    
    <button onclick={() => goto('/personal-statements')} class="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer hover:border-gray-300 hover:border-purple-300 hover:bg-purple-50">
      <span class="text-3xl mb-3">💭</span>
      <div class="text-center">
        <span class="text-sm font-semibold text-gray-800 block mb-1">Personal Statement</span>
        <span class="text-xs text-gray-500">Tell your story</span>
      </div>
    </button>
    
    <button onclick={() => goto('/scholarships')} class="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer hover:border-gray-300 hover:border-green-300 hover:bg-green-50">
      <span class="text-3xl mb-3">🎓</span>
      <div class="text-center">
        <span class="text-sm font-semibold text-gray-800 block mb-1">Find Scholarships</span>
        <span class="text-xs text-gray-500">Browse opportunities</span>
      </div>
    </button>
    
        <button onclick={() => goto('/ai-features-demo')} class="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer hover:border-gray-300 hover:border-orange-300 hover:bg-orange-50">
      <span class="text-3xl mb-3">🤖</span>
      <div class="text-center">
        <span class="text-sm font-semibold text-gray-800 block mb-1">AI Tools</span>
        <span class="text-xs text-gray-500">Enhance your text</span>
      </div>
    </button>
    
    <button onclick={() => goto('/academic-cv')} class="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer hover:border-gray-300 hover:border-gray-400 hover:bg-gray-50">
      <span class="text-3xl mb-3">📋</span>
      <div class="text-center">
        <span class="text-sm font-semibold text-gray-800 block mb-1">Generate CV</span>
        <span class="text-xs text-gray-500">Academic format</span>
      </div>
    </button>
  </div>
</section>

 