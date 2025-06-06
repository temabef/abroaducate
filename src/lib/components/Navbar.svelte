<script lang="ts">
  let { data } = $props<{ data: { session: any; supabase: any } }>();
  let { session, supabase } = $derived(data);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`
      }
    });
  }
</script>

<header class="bg-[#0A192F] backdrop-blur-md fixed top-0 left-0 right-0 z-50 shadow-md">
  <nav class="flex items-center justify-between p-4 mx-auto max-w-7xl">
    <a href="/" class="text-2xl font-bold text-white">AbroaducateSOPGPT</a>
    <div class="flex items-center space-x-4">
      {#if session}
        <span class="text-sm text-white">Welcome, {session.user.email}</span>
        <form action="/auth/logout" method="POST">
          <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700">
            Sign Out
          </button>
        </form>
      {:else}
        <!-- Get Started Button -->
        <a href="#form-section" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out">
          Get Started
        </a>
        <button onclick={signInWithGoogle} class="px-4 py-2 text-sm font-medium text-white bg-transparent border border-white rounded-md hover:bg-white hover:text-[#0A192F] flex items-center space-x-3 transition duration-300 ease-in-out">
          <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="Google G Logo" class="w-4 h-4">
          Login with Google
        </button>
      {/if}
    </div>
  </nav>
</header> 