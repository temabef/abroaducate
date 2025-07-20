<script lang="ts">
  import { onMount } from 'svelte';
  import { getBaseUrl, getEmailBaseUrl } from '$lib/config/site';
  import { supabase } from '$lib/supabaseClient';
  
  let debugInfo = {
    currentUrl: '',
    baseUrl: '',
    emailBaseUrl: '',
    supabaseUrl: '',
    environment: ''
  };
  
  onMount(() => {
    debugInfo = {
      currentUrl: window.location.href,
      baseUrl: getBaseUrl(),
      emailBaseUrl: getEmailBaseUrl(),
      supabaseUrl: import.meta.env.VITE_PUBLIC_SUPABASE_URL || 'Not set',
      environment: import.meta.env.MODE
    };
  });
</script>

<svelte:head>
  <title>Auth Debug</title>
</svelte:head>

<div style="padding: 2rem; font-family: monospace;">
  <h1>🔧 Authentication Debug</h1>
  
  <h2>Current Configuration:</h2>
  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
  
  <h2>Environment Variables:</h2>
  <pre>
NODE_ENV: {import.meta.env.NODE_ENV}
MODE: {import.meta.env.MODE}
DEV: {import.meta.env.DEV}
PROD: {import.meta.env.PROD}
VITE_PUBLIC_SUPABASE_URL: {import.meta.env.VITE_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}
VITE_PUBLIC_SUPABASE_ANON_KEY: {import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}
  </pre>
  
  <h2>Test Authentication:</h2>
  <button onclick={() => {
    const redirectUrl = `${getBaseUrl()}/auth/callback?next=/dashboard`;
    console.log('Redirect URL:', redirectUrl);
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    });
  }}>
    Test Google OAuth
  </button>
  
  <h2>Test User Loading:</h2>
  <button onclick={async () => {
    try {
      const response = await fetch('/api/admin/get-users');
      const data = await response.json();
      console.log('Users API response:', data);
      alert(`Found ${Array.isArray(data) ? data.length : 'unknown'} users`);
    } catch (error) {
      console.error('Error testing user loading:', error);
      alert('Error loading users: ' + error.message);
    }
  }}>
    Test User Loading API
  </button>
  
  <h2>Test Supabase Connection:</h2>
  <button onclick={async () => {
    try {
      // Test basic Supabase connection
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        alert('Supabase error: ' + error.message);
      } else {
        alert('Supabase connection working!');
      }
    } catch (error) {
      alert('Supabase connection failed: ' + error.message);
    }
  }}>
    Test Supabase Connection
  </button>
</div> 