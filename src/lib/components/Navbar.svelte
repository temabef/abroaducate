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

  async function signOut() {
    await supabase.auth.signOut();
  }
</script>

<header class="bg-[#0A192F] backdrop-blur-md fixed top-0 left-0 right-0 z-50 shadow-md">
  <nav class="flex items-center justify-between p-4 mx-auto max-w-7xl">
    <a href="/" class="text-2xl font-bold text-white">AbroaducateSOPGPT</a>
    <div class="flex items-center space-x-4">
      {#if session}
        <a href="/dashboard" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out">
          Application Dashboard
        </a>
        <div class="relative group">
          <button class="px-4 py-2 text-sm font-medium text-white bg-transparent border border-white rounded-md hover:bg-white hover:text-[#0A192F] transition duration-300 ease-in-out">
            Account
          </button>
          <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 ease-in-out transform scale-95 group-hover:scale-100">
            <button onclick={signOut} class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign Out</button>
          </div>
        </div>
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