<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let { data } = $props();
  let { supabase } = $derived(data);
  
  let verifying = $state(true);
  let success = $state(false);
  let error = $state('');
  let message = $state('');

  onMount(async () => {
    const token = $page.url.searchParams.get('token');
    
    if (!token) {
      error = 'Invalid verification link. Please check your email and try again.';
      verifying = false;
      return;
    }

    try {
      // Verify the email token
      const { data: verificationData, error: verifyError } = await supabase
        .from('email_verification_tokens')
        .select('user_id, email, expires_at, used_at')
        .eq('token', token)
        .single();

      if (verifyError || !verificationData) {
        error = 'Invalid or expired verification link.';
        verifying = false;
        return;
      }

      // Check if already used
      if (verificationData.used_at) {
        error = 'This verification link has already been used.';
        verifying = false;
        return;
      }

      // Check if expired
      if (new Date(verificationData.expires_at) < new Date()) {
        error = 'This verification link has expired. Please request a new one.';
        verifying = false;
        return;
      }

      // Mark token as used
      const { error: updateError } = await supabase
        .from('email_verification_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token);

      if (updateError) {
        error = 'Failed to verify email. Please try again.';
        verifying = false;
        return;
      }

      // Update user's email_verified status
      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: { email_verified: true }
      });

      if (userUpdateError) {
        console.warn('Failed to update user metadata:', userUpdateError);
      }

      success = true;
      message = 'Email verified successfully! You can now sign in to your account.';
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        goto('/?login=true');
      }, 3000);

    } catch (err: any) {
      error = err.message || 'An unexpected error occurred during verification.';
    } finally {
      verifying = false;
    }
  });
</script>

<svelte:head>
  <title>Email Verification - Abroaducate</title>
  <meta name="description" content="Verify your email address to complete your Abroaducate account setup" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
  <div class="max-w-md w-full">
    <div class="bg-white rounded-xl shadow-lg p-8 text-center">
      {#if verifying}
        <!-- Verifying State -->
        <div class="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"></div>
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Verifying Your Email</h1>
        <p class="text-gray-600">Please wait while we verify your email address...</p>
      
      {:else if success}
        <!-- Success State -->
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Email Verified!</h1>
        <p class="text-gray-600 mb-6">{message}</p>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p class="text-green-800 text-sm">
            ✅ Your account is now fully activated<br/>
            🚀 Redirecting you to sign in...
          </p>
        </div>
        <a 
          href="/?login=true" 
          class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Sign In Now
        </a>
      
      {:else if error}
        <!-- Error State -->
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h1>
        <p class="text-gray-600 mb-6">{error}</p>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p class="text-yellow-800 text-sm">
            <strong>Need help?</strong><br/>
            Contact support at support@abroaducate.com or try signing up again.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a 
            href="/" 
            class="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Go Home
          </a>
          <a 
            href="/?signup=true" 
            class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </a>
        </div>
      {/if}
    </div>

    <!-- Additional Info -->
    <div class="mt-8 text-center">
      <p class="text-gray-500 text-sm">
        Having trouble? 
        <a href="mailto:support@abroaducate.com" class="text-blue-600 hover:underline">
          Contact Support
        </a>
      </p>
    </div>
  </div>
</div> 