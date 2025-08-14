<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { subscriptionState } from '$lib/stores/subscription';
  import { get } from 'svelte/store';

  let initialized = false;
  let unsub: (() => void) | null = null;
  let scriptEl: HTMLScriptElement | null = null;

  function injectScript() {
    if (!browser || scriptEl) return;
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9343038264406927';
    document.head.appendChild(script);
    scriptEl = script;
  }

  function removeScriptAndAutoAds() {
    if (!browser) return;
    // Remove bootstrap script
    try {
      if (scriptEl && scriptEl.parentNode) {
        scriptEl.parentNode.removeChild(scriptEl);
        scriptEl = null;
      }
      // Also remove any duplicate AdSense bootstrap scripts
      document.querySelectorAll('script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]').forEach((el) => {
        el.parentNode?.removeChild(el);
      });
    } catch {}

    // Best-effort removal of auto ads overlays/anchors injected earlier
    try {
      const selectors = [
        'iframe[id^="google_ads_iframe_"]',
        'div[id^="google_ads_iframe_"]',
        'div[id^="google-auto-placed"]',
        'ins.adsbygoogle[data-anchor-status]',
        'ins.adsbygoogle[data-ad-status]'
      ];
      document.querySelectorAll(selectors.join(',')).forEach((el) => {
        el.parentNode?.removeChild(el);
      });
    } catch {}
  }

  onMount(async () => {
    if (!browser || initialized) return;
    const sub = get(subscriptionState);
    if (sub.loaded) {
      if (!sub.isPremium) injectScript();
      else removeScriptAndAutoAds();
    }
    // React to subscription changes (e.g., user logs in and becomes premium)
    unsub = subscriptionState.subscribe((s) => {
      if (!s.loaded) return;
      if (s.isPremium) removeScriptAndAutoAds();
      else injectScript();
    });
    initialized = true;
  });

  onDestroy(() => {
    if (unsub) { try { unsub(); } catch {} unsub = null; }
  });
</script>

<!-- This component only injects the AdSense bootstrap script for non-premium users -->


