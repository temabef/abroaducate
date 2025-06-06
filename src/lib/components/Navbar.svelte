<script lang="ts">
  let { data } = $props();
  let { session } = $derived(data);
</script>

<header class="bg-white/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
  <nav class="flex items-center justify-between p-4 mx-auto max-w-7xl">
    <a href="/" class="text-2xl font-bold text-gray-800">SOP Architect</a>
    <div class="flex items-center space-x-4">
      {#if session}
        <span class="text-sm text-gray-600">Welcome, {session.user.email}</span>
        <form action="/auth/logout" method="POST">
          <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700">
            Sign Out
          </button>
        </form>
      {:else}
        <a href="/login" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
          Sign In
        </a>
      {/if}
    </div>
  </nav>
</header> 