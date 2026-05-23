<script lang="ts">
  import { goto } from '$app/navigation';
  
  let { 
    session, 
    supabase, 
    children,
    pageName = "this feature",
    returnUrl = "/"
  } = $props();

  async function signInWithGoogle() {
    const redirectUrl = `${location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`;
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    });
  }
</script>

{#if session}
  {@render children()}
{:else}
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Login Required</h1>
        <div class="text-6xl mb-6">🔐</div>
      </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div class="text-center mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">
            Access to {pageName}
          </h2>
          <p class="text-gray-600">
            You need to be logged in to access {pageName.toLowerCase()}. 
            Please sign in with your Google account to continue.
          </p>
        </div>

        <div class="space-y-4">
          <button 
            onclick={signInWithGoogle}
            class="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="Google" class="w-5 h-5 mr-3">
            Sign in with Google
          </button>
        </div>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">Why do I need to login?</span>
            </div>
          </div>
        </div>

        <div class="mt-6">
          <div class="bg-blue-50 rounded-lg p-4">
            <h3 class="text-sm font-medium text-blue-900 mb-2">Benefits of logging in:</h3>
            <ul class="text-sm text-blue-800 space-y-1">
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Save and track your applications
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Access personalized recommendations
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Sync across all your devices
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Never lose your work
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-6 text-center">
          <a href="/" class="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  </div>
{/if} 
