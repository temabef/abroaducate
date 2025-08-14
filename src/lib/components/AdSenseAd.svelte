<!-- Reusable AdSense Ad Component -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import { supabase as supabaseClient } from '$lib/supabaseClient';

  // Props for different ad types and sizes
  export let adSlot: string;
  export let adFormat: string = 'auto';
  export let adStyle: string = 'display:block';
  export let fullWidthResponsive: boolean = true;
  export let className: string = '';
  
  // Props remain optional for override, but are no longer required.
  // Component will auto-resolve session and supabase if not provided.
  export let session: any = null;
  export let supabase: any = null;

  // Internally resolved references
  let effectiveSupabase: any = null;
  let effectiveSession: any = null;
  let unsubscribePage: (() => void) | null = null;
  
  let adElement: HTMLElement;
  let adLoaded = false;
  let retryCount = 0;
  const maxRetries = 10;
  let userHasPaidPlan = false;
  let checkingSubscription = true;

  // Load and render the ad
  function loadAd() {
    if (!browser || !adElement || adLoaded || retryCount >= maxRetries) return;
    
    try {
      // Check if adsbygoogle is available and the element is visible
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        // Ensure the element has dimensions before loading ad
        if (adElement.offsetWidth > 0) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          adLoaded = true;
        } else {
          // Element not yet visible, retry
          retryCount++;
          setTimeout(loadAd, 200);
        }
      } else {
        // Script not loaded yet, retry
        retryCount++;
        setTimeout(loadAd, 200);
      }
    } catch (error) {
      console.warn('AdSense loading error:', error);
      adLoaded = true; // Prevent further retries on error
    }
  }

  // Check user subscription status
  async function checkUserSubscription() {
    // Resolve supabase and session if not provided via props
    effectiveSupabase = supabase || supabaseClient;

    // Try to use provided session, else from $page, else from auth.getSession
    if (!session && browser) {
      try {
        // Pull once synchronously
        const currentPage = get(page);
        effectiveSession = currentPage?.data?.session || null;
        // Subscribe to keep in sync while component is mounted
        unsubscribePage = page.subscribe((p) => {
          if (!session) {
            effectiveSession = p?.data?.session || null;
          }
        });
      } catch {}
    } else {
      effectiveSession = session;
    }

    if (!effectiveSession && effectiveSupabase && browser) {
      try {
        const { data } = await effectiveSupabase.auth.getSession();
        effectiveSession = data?.session || null;
      } catch {}
    }

    if (!effectiveSession || !effectiveSupabase) {
      // No session or supabase = show ads (free user or not logged in)
      userHasPaidPlan = false;
      checkingSubscription = false;
      return;
    }

    try {
      const { data: subscription, error } = await effectiveSupabase
        .from('user_subscriptions')
        .select('plan_type, status')
        .eq('user_id', effectiveSession.user.id)
        .in('status', ['active', 'trialing'])
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Subscription check error:', error);
      }

      // Hide ads for paid users (professional, elite, etc.)
      userHasPaidPlan = subscription && 
                       subscription.plan_type !== 'free' && 
                       ['active', 'trialing'].includes(subscription.status);
      
      console.log('🎯 Ad Display Check:', {
        userId: effectiveSession.user.id,
        planType: subscription?.plan_type || 'free',
        status: subscription?.status || 'none',
        showAds: !userHasPaidPlan
      });
    } catch (err) {
      console.warn('Failed to check subscription:', err);
      userHasPaidPlan = false; // Default to showing ads on error
    } finally {
      checkingSubscription = false;
    }
  }

  onMount(async () => {
    await checkUserSubscription();
    
    // Only load ads if user doesn't have paid plan
    if (!userHasPaidPlan) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(loadAd, 100);
    }
  });

  onDestroy(() => {
    if (unsubscribePage) {
      try { unsubscribePage(); } catch {}
      unsubscribePage = null;
    }
  });
</script>

{#if checkingSubscription}
  <!-- Loading state while checking subscription -->
  <div class="adsense-container {className}">
    <div class="ad-loading">
      <div class="loading-spinner"></div>
    </div>
  </div>
{:else if userHasPaidPlan}
  <!-- Premium user - show upgrade message instead of ads -->
  <div class="adsense-container {className}">
    <div class="premium-message">
      <div class="premium-badge">
        ✨ <strong>Premium Experience</strong>
      </div>
      <p class="premium-text">Enjoying ad-free browsing as a valued subscriber!</p>
    </div>
  </div>
{:else}
  <!-- Free user or not logged in - show ads -->
  <div class="adsense-container {className}">
    <ins 
      bind:this={adElement}
      class="adsbygoogle"
      style={adStyle}
      data-ad-client="ca-pub-9343038264406927"
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
    ></ins>
  </div>
{/if}

<style>
  .adsense-container {
    margin: 20px 0;
    text-align: center;
    clear: both;
    min-height: 90px; /* Prevent layout shift */
  }

  /* Premium user styling */
  .premium-message {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }

  .premium-badge {
    font-size: 16px;
    margin-bottom: 8px;
    font-weight: 600;
  }

  .premium-text {
    font-size: 14px;
    margin: 0;
    opacity: 0.9;
  }

  /* Loading spinner */
  .ad-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 90px;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .adsense-container {
      margin: 15px 0;
    }
    
    .premium-message {
      padding: 15px;
    }
    
    .premium-badge {
      font-size: 14px;
    }
    
    .premium-text {
      font-size: 13px;
    }
  }
</style>
