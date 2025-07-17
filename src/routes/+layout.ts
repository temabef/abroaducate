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

  // Initialize PostHog in browser environment
  if (browser) {
    posthog.init(
      'phc_PlTMibICzNy5DTxpnxVRHl3n7JiH8l6KLDBgLqpbruZ',
      {
        api_host: 'https://us.i.posthog.com',
        defaults: '2025-05-24',
        person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
      }
    )
  }

  return {
    supabase,
    session,
    user: data.user,
  }
} 