<!-- Reusable AdSense Ad Component -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  // Props for different ad types and sizes
  export let adSlot: string;
  export let adFormat: string = 'auto';
  export let adStyle: string = 'display:block';
  export let fullWidthResponsive: boolean = true;
  export let className: string = '';
  
  let adElement: HTMLElement;
  let adLoaded = false;
  let retryCount = 0;
  const maxRetries = 10;

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

  onMount(() => {
    // Small delay to ensure DOM is fully rendered
    setTimeout(loadAd, 100);
  });
</script>

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

<style>
  .adsense-container {
    margin: 20px 0;
    text-align: center;
    clear: both;
    min-height: 90px; /* Prevent layout shift */
  }

  @media (max-width: 768px) {
    .adsense-container {
      margin: 15px 0;
    }
  }
</style>
