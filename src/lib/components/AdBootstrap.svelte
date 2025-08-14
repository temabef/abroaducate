<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import { supabase as supabaseClient } from '$lib/supabaseClient';

  let initialized = false;

  async function isUserPremium(): Promise<boolean> {
    try {
      const p = get(page) as any;
      let session = p?.data?.session || null;
      if (!session) {
        const { data } = await supabaseClient.auth.getSession();
        session = data?.session || null;
      }
      if (!session) return false;
      const { data: subscription } = await supabaseClient
        .from('user_subscriptions')
        .select('plan_type, status')
        .eq('user_id', session.user.id)
        .in('status', ['active', 'trialing'])
        .single();
      return Boolean(subscription && subscription.plan_type !== 'free');
    } catch {
      return false;
    }
  }

  onMount(async () => {
    if (!browser || initialized) return;
    const premium = await isUserPremium();
    if (!premium) {
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9343038264406927';
      document.head.appendChild(script);
    }
    initialized = true;
  });
</script>

<!-- This component only injects the AdSense bootstrap script for non-premium users -->


