<script lang="ts">
  import { goto } from '$app/navigation';
  
  let { data } = $props();
  let { supabase, session } = $derived(data);
</script>

<svelte:head>
  <title>Temp Admin Access - Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-20">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">
        🔧 Temporary Admin Access
      </h1>
      <p class="text-gray-600">
        Testing scholarship admin functionality
      </p>
    </div>

    <div class="bg-white rounded-lg shadow-lg p-8">
      <div class="space-y-4">
        <div class="p-4 bg-blue-50 rounded-lg">
          <h3 class="font-semibold text-blue-900 mb-2">Debug Info:</h3>
          <p class="text-blue-800 text-sm">User Email: {session?.user?.email || 'Not logged in'}</p>
          <p class="text-blue-800 text-sm">User ID: {session?.user?.id || 'None'}</p>
          <p class="text-blue-800 text-sm">Metadata: {JSON.stringify(session?.user?.user_metadata || {})}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a 
            href="/scholarships" 
            class="block p-6 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition duration-200"
          >
            <h3 class="text-lg font-semibold text-yellow-900 mb-2">
              📚 View Scholarships (Public)
            </h3>
            <p class="text-yellow-800">Check if scholarships are displaying correctly</p>
          </a>

          <button
            onclick={() => goto('/admin/scholarships')}
            class="block p-6 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition duration-200 text-left"
          >
            <h3 class="text-lg font-semibold text-green-900 mb-2">
              🔧 Admin Panel (Direct)
            </h3>
            <p class="text-green-800">Try accessing admin directly</p>
          </button>
        </div>

        <div class="p-4 bg-gray-50 rounded-lg">
          <h3 class="font-semibold text-gray-900 mb-2">Next Steps:</h3>
          <ol class="text-gray-700 text-sm space-y-1">
            <li>1. First check if you can see scholarships on the public page</li>
            <li>2. Try the admin panel direct access</li>
            <li>3. If admin panel works, we know the issue is just the check logic</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</div> 