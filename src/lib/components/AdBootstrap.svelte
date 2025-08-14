<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { subscriptionState } from '$lib/stores/subscription';
  import { get } from 'svelte/store';

  let initialized = false;

  onMount(async () => {
    if (!browser || initialized) return;
    const sub = get(subscriptionState);
    if (sub.loaded && !sub.isPremium) {
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


