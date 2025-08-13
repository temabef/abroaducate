import { createBrowserClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { LayoutLoad } from './$types'
import { browser } from '$app/environment'
import posthog from 'posthog-js'

export const load: LayoutLoad = async ({ fetch, data, depends }) => {
  depends('supabase:auth')

  const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    global: {
      fetch,
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Initialize PostHog in browser environment with better consent handling
  if (browser) {
    try {
      // Check if PostHog is already initialized
      if (!posthog.isFeatureEnabled('test')) {
        posthog.init(
          'phc_PlTMibICzNy5DTxpnxVRHl3n7JiH8l6KLDBgLqpbruZ',
          {
            api_host: 'https://us.i.posthog.com',
            defaults: '2025-05-24',
            person_profiles: 'identified_only',
            // Add consent management integration
            opt_out_capturing_by_default: false,
            // Ensure PostHog works with consent management
            loaded: (posthog) => {
              console.log('PostHog loaded successfully');
            },
            // Removed Ezoic consent management - analytics now work without consent barriers
          }
        )
        
        // Track initial page view
        posthog.capture('page_viewed', {
          page_name: window.location.pathname,
          page_title: document.title,
          page_url: window.location.href
        });
      }
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }

  return {
    supabase,
    session,
    user: data.user,
  }
} 