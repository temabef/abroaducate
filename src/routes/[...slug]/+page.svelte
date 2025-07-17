<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { analytics } from '$lib/utils/posthog';

  let { data } = $props();
  let { session } = $derived(data);

  onMount(() => {
    const path = $page.url.pathname;
    
    // Track redirect attempts
    analytics.trackEvent('redirect_attempt', {
      old_path: path,
      user_id: session?.user?.id
    });
    
    // Handle old WordPress scholarship URLs
    if (path.startsWith('/scholarship/')) {
      const slug = path.replace('/scholarship/', '');
      analytics.trackEvent('redirect_completed', {
        old_path: path,
        new_path: `/scholarships/${slug}`,
        redirect_type: 'scholarship'
      });
      goto(`/scholarships/${slug}`, { replaceState: true });
      return;
    }
    
    // Handle old blog URLs
    if (path.match(/^\/(\d{4})\/(\d{2})\/(\d{2})\/(.+)$/)) {
      const slug = path.split('/').pop();
      analytics.trackEvent('redirect_completed', {
        old_path: path,
        new_path: `/blog/${slug}`,
        redirect_type: 'blog'
      });
      goto(`/blog/${slug}`, { replaceState: true });
      return;
    }
    
    // Handle old page URLs
    const pageRedirects: Record<string, string> = {
      '/about-us': '/about',
      '/contact-us': '/contact',
      '/privacy-policy': '/privacy',
      '/terms-of-service': '/terms',
      '/statement-of-purpose': '/sop',
      '/cover-letter': '/cover-letters',
      '/personal-statement': '/personal-statements',
      '/academic-cv': '/academic-cv',
      '/ielts-practice': '/practice/ielts',
      '/visa-practice': '/visa-interview-practice',
      '/tools/gpa-converter': '/gpa-converter',
      '/tools/word-optimization': '/word-optimization'
    };
    
    if (pageRedirects[path]) {
      analytics.trackEvent('redirect_completed', {
        old_path: path,
        new_path: pageRedirects[path],
        redirect_type: 'page'
      });
      goto(pageRedirects[path], { replaceState: true });
      return;
    }
    
    // Track 404 redirects
    analytics.trackEvent('redirect_404', {
      old_path: path,
      user_id: session?.user?.id
    });
    
    // If no redirect found, show 404
    goto('/404', { replaceState: true });
  });
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center">
  <div class="text-center">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
    <p class="text-gray-600">Redirecting...</p>
  </div>
</div> 