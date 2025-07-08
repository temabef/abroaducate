<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let email = '';
  let loading = false;
  let message = '';
  let success = false;
  let unsubscribeType = 'all'; // 'all', 'digest', 'marketing'

  onMount(() => {
    // Check if email is provided in URL params
    const urlEmail = $page.url.searchParams.get('email');
    if (urlEmail) {
      email = urlEmail;
    }
  });

  async function handleUnsubscribe() {
    if (!email.trim()) {
      message = 'Please enter your email address';
      return;
    }

    loading = true;
    message = '';

    try {
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          type: unsubscribeType
        })
      });

      const result = await response.json();

      if (response.ok) {
        success = true;
        message = result.message || 'Successfully unsubscribed from our mailing list.';
      } else {
        message = result.error || 'Failed to unsubscribe. Please try again.';
      }
    } catch (error) {
      message = 'An error occurred. Please try again later.';
      console.error('Unsubscribe error:', error);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Unsubscribe - Abroaducate Newsletter</title>
  <meta name="description" content="Unsubscribe from Abroaducate newsletter and email communications" />
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="unsubscribe-container">
  <div class="unsubscribe-card">
    <!-- Header -->
    <div class="header">
      <h1>📧 Unsubscribe from Newsletter</h1>
      <p>We're sorry to see you go! You can manage your email preferences below.</p>
    </div>

    {#if !success}
      <!-- Unsubscribe Form -->
      <form on:submit|preventDefault={handleUnsubscribe} class="unsubscribe-form">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            type="email"
            id="email"
            bind:value={email}
            placeholder="Enter your email address"
            required
            disabled={loading}
          />
        </div>

        <div class="form-group">
          <label for="unsubscribe-options">What would you like to unsubscribe from?</label>
          <div id="unsubscribe-options" class="radio-group" role="radiogroup" aria-labelledby="unsubscribe-options">
            <label class="radio-option">
              <input
                type="radio"
                bind:group={unsubscribeType}
                value="digest"
                disabled={loading}
              />
              <span>Only scholarship digest emails</span>
            </label>
            
            <label class="radio-option">
              <input
                type="radio"
                bind:group={unsubscribeType}
                value="marketing"
                disabled={loading}
              />
              <span>Only marketing and promotional emails</span>
            </label>
            
            <label class="radio-option">
              <input
                type="radio"
                bind:group={unsubscribeType}
                value="all"
                disabled={loading}
              />
              <span>All emails (complete unsubscribe)</span>
            </label>
          </div>
        </div>

        <button type="submit" class="unsubscribe-btn" disabled={loading}>
          {#if loading}
            <span class="spinner"></span>
            Processing...
          {:else}
            Unsubscribe
          {/if}
        </button>

        {#if message}
          <div class="message {success ? 'success' : 'error'}">
            {message}
          </div>
        {/if}
      </form>

      <!-- Alternative Options -->
      <div class="alternatives">
        <h3>📈 Instead of unsubscribing, you could:</h3>
        <ul>
          <li>
            <strong>🎓 Create a free account</strong> - Get personalized scholarship recommendations
            <a href="/?signup=true" class="cta-link">Sign up here</a>
          </li>
          <li>
            <strong>📅 Change frequency</strong> - Receive emails less often (account required)
          </li>
          <li>
            <strong>🎯 Get targeted content</strong> - Only scholarships matching your profile
          </li>
        </ul>
      </div>
    {:else}
      <!-- Success Message -->
      <div class="success-card">
        <div class="success-icon">✅</div>
        <h2>Successfully Unsubscribed</h2>
        <p>{message}</p>
        
        <div class="success-actions">
          <p>Changed your mind? You can always:</p>
          <a href="/?signup=true" class="resubscribe-btn">Create a Free Account</a>
          <a href="/" class="home-btn">Return to Home</a>
        </div>
      </div>
    {/if}

    <!-- Footer -->
    <div class="footer">
      <p>
        Questions? Contact us at 
        <a href="mailto:support@abroaducate.com">support@abroaducate.com</a>
      </p>
      <p>
        <a href="/privacy">Privacy Policy</a> | 
        <a href="/terms">Terms of Service</a>
      </p>
    </div>
  </div>
</div>

<style>
  .unsubscribe-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .unsubscribe-card {
    background: white;
    border-radius: 16px;
    padding: 40px;
    max-width: 600px;
    width: 100%;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .header {
    text-align: center;
    margin-bottom: 40px;
  }

  .header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 12px 0;
  }

  .header p {
    color: #6b7280;
    font-size: 1.1rem;
    margin: 0;
  }

  .unsubscribe-form {
    margin-bottom: 40px;
  }

  .form-group {
    margin-bottom: 24px;
  }

  .form-group label {
    display: block;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
    font-size: 0.95rem;
  }

  .form-group input[type="email"] {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .form-group input[type="email"]:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .radio-option {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .radio-option:hover {
    border-color: #d1d5db;
    background-color: #f9fafb;
  }

  .radio-option input[type="radio"] {
    margin: 0;
  }

  .radio-option span {
    font-size: 0.95rem;
    color: #374151;
  }

  .unsubscribe-btn {
    width: 100%;
    background: #dc2626;
    color: white;
    border: none;
    padding: 14px 24px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .unsubscribe-btn:hover:not(:disabled) {
    background: #b91c1c;
  }

  .unsubscribe-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .message {
    margin-top: 16px;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 0.95rem;
    text-align: center;
  }

  .message.success {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  .message.error {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .alternatives {
    background: #f8fafc;
    padding: 24px;
    border-radius: 12px;
    margin-bottom: 40px;
  }

  .alternatives h3 {
    margin: 0 0 16px 0;
    color: #1f2937;
    font-size: 1.1rem;
  }

  .alternatives ul {
    margin: 0;
    padding-left: 20px;
  }

  .alternatives li {
    margin-bottom: 12px;
    color: #374151;
    line-height: 1.5;
  }

  .cta-link {
    color: #2563eb;
    text-decoration: none;
    font-weight: 600;
    margin-left: 8px;
  }

  .cta-link:hover {
    text-decoration: underline;
  }

  .success-card {
    text-align: center;
    padding: 40px 0;
  }

  .success-icon {
    font-size: 4rem;
    margin-bottom: 24px;
  }

  .success-card h2 {
    font-size: 1.8rem;
    font-weight: 700;
    color: #059669;
    margin: 0 0 16px 0;
  }

  .success-card p {
    color: #6b7280;
    font-size: 1.1rem;
    margin-bottom: 32px;
  }

  .success-actions {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }

  .success-actions p {
    margin: 0 0 16px 0;
    color: #374151;
  }

  .resubscribe-btn, .home-btn {
    display: inline-block;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .resubscribe-btn {
    background: #2563eb;
    color: white;
  }

  .resubscribe-btn:hover {
    background: #1d4ed8;
  }

  .home-btn {
    background: #f3f4f6;
    color: #374151;
    margin-left: 12px;
  }

  .home-btn:hover {
    background: #e5e7eb;
  }

  .footer {
    text-align: center;
    padding-top: 32px;
    border-top: 1px solid #e5e7eb;
    color: #6b7280;
    font-size: 0.9rem;
  }

  .footer p {
    margin: 8px 0;
  }

  .footer a {
    color: #2563eb;
    text-decoration: none;
  }

  .footer a:hover {
    text-decoration: underline;
  }

  @media (max-width: 640px) {
    .unsubscribe-card {
      padding: 24px;
      margin: 12px;
    }

    .header h1 {
      font-size: 1.6rem;
    }

    .success-actions {
      flex-direction: column;
    }

    .home-btn {
      margin-left: 0;
      margin-top: 8px;
    }
  }
</style> 