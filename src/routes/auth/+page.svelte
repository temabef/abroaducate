<script lang="ts">
  import { page } from '$app/stores';
  import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';
  import { onMount } from 'svelte';
  
  let { data } = $props();
  let { supabase, session } = $derived(data);
  
  // Check URL parameters
  let isSignup = $derived($page.url.searchParams.get('signup') === 'true');
  let source = $derived($page.url.searchParams.get('source') || 'diagnostic');
  let action = $derived($page.url.searchParams.get('action') || '');
  let next = $derived($page.url.searchParams.get('next') || '');
  
  let returnUrl = $derived(
    next ||
      (action === 'improve_profile' || source === 'diagnostic'
        ? '/plan?from=roadmap'
        : '/plan')
  );
  
  let showAuth = $state(true);
  
  // Redirect to appropriate page if already logged in
  onMount(() => {
    if (session) {
      window.location.href = returnUrl;
    }
  });
</script>

<svelte:head>
  <title>{isSignup ? 'Sign Up' : 'Login'} - Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4">
  <div class="max-w-md w-full">
    <!-- Header -->
    <div class="text-center mb-8">
      <a href="/" class="inline-block mb-6">
        <h1 class="text-3xl font-bold text-indigo-600">Abroaducate</h1>
      </a>
      
      {#if action === 'improve_profile'}
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Get Your Personalized Action Plan</h2>
        <p class="text-gray-600">Create a free account to access your improvement roadmap</p>
      {:else if source === 'diagnostic'}
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Save Your Results</h2>
        <p class="text-gray-600">Create a free account to save your assessment and track your progress</p>
      {:else}
        <h2 class="text-2xl font-bold text-gray-900 mb-2">{isSignup ? 'Create Your Account' : 'Welcome Back'}</h2>
        <p class="text-gray-600">{isSignup ? 'Start your study abroad journey today' : 'Log in to continue your journey'}</p>
      {/if}
    </div>
    
    <!-- Authentication Component -->
    {#if !session}
      <AuthenticationFlow 
        {supabase}
        bind:show={showAuth}
        mode={isSignup ? 'signup' : 'login'}
        returnUrl={returnUrl}
      />
    {/if}
  </div>
</div>
