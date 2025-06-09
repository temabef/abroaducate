<script lang="ts">
  let { data } = $props();
  let { supabase, session } = $derived(data);
</script>

<svelte:head>
  <title>Admin Test - Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-20">
  <div class="max-w-4xl mx-auto px-4">
    <div class="bg-white rounded-lg shadow p-8">
      <h1 class="text-2xl font-bold mb-6">🔧 Admin Access Debug</h1>
      
      <div class="space-y-4">
        <div class="p-4 bg-blue-50 rounded">
          <h3 class="font-semibold mb-2">User Info:</h3>
          <p>Email: {session?.user?.email || 'Not logged in'}</p>
          <p>Has metadata role: {session?.user?.user_metadata?.role || 'None'}</p>
          <p>Has raw_meta role: {session?.user?.user_metadata?.role || 'None'}</p>
        </div>

        <div class="space-y-2">
          <a href="/scholarships" class="block bg-yellow-500 text-white p-3 rounded text-center">
            📚 Test Scholarships Page
          </a>
          <a href="/admin/scholarships" class="block bg-green-500 text-white p-3 rounded text-center">
            🔧 Test Admin Panel
          </a>
        </div>
      </div>
    </div>
  </div>
</div> 