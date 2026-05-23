import { createBrowserClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { LayoutLoad } from './$types'
import { browser } from '$app/environment'

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

  // PostHog is initialized via $lib/utils/posthog.ts; avoid double init here

  return {
    supabase,
    session,
    user: data.user ?? session?.user ?? null,
    subscription: data.subscription,
  }
} 
