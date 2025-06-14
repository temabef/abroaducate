<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  
  let { data } = $props();
  let { supabase } = data;
  
  let status = $state('Resetting authentication...');
  let step = $state(1);
  
  onMount(async () => {
    if (!browser) return;
    
    try {
      // Step 1: Sign out completely
      status = 'Step 1: Signing out...';
      await supabase.auth.signOut();
      
      // Step 2: Clear all local storage
      step = 2;
      status = 'Step 2: Clearing local storage...';
      localStorage.clear();
      sessionStorage.clear();
      
      // Step 3: Clear cookies
      step = 3;
      status = 'Step 3: Clearing cookies...';
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Step 4: Wait a moment
      step = 4;
      status = 'Step 4: Finalizing reset...';
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 5: Redirect to fresh login
      step = 5;
      status = 'Step 5: Redirecting to login...';
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force a complete page reload to clear all state
      window.location.href = '/auth/login';
      
    } catch (error) {
      console.error('Auth reset error:', error);
      status = 'Error during reset. Redirecting anyway...';
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
    }
  });
  
  async function forceLogin() {
    const redirectUrl = `${location.origin}/auth/callback?next=${encodeURIComponent('/')}`;
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
  }
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Authentication Reset</h1>
      <div class="text-6xl mb-6">🔄</div>
    </div>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <div class="text-center mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-3">
          Fixing Authentication Issues
        </h2>
        <p class="text-gray-600 mb-4">
          {status}
        </p>
        
        <!-- Progress indicator -->
        <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style="width: {(step / 5) * 100}%"
          ></div>
        </div>
        
        <div class="text-sm text-gray-500">
          Step {step} of 5
        </div>
      </div>

      {#if step >= 5}
        <div class="space-y-4">
          <p class="text-center text-gray-600 mb-4">
            If you're not automatically redirected, click below:
          </p>
          
          <button 
            onclick={forceLogin}
            class="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="Google" class="w-5 h-5 mr-3">
            Sign in with Google
          </button>
          
          <a 
            href="/"
            class="block text-center text-sm text-blue-600 hover:text-blue-500"
          >
            Or go to homepage
          </a>
        </div>
      {/if}
    </div>
  </div>
</div> 