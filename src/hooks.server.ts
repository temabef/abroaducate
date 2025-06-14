import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  // This restores the original, correct authentication client
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' });
        });
      }
    }
  })

  // This service role client is still needed for the AI features page
  event.locals.supabaseServiceRole = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  /**
   * a little helper that is written for convenience so that instead
   * of calling `const { data: { session } } = await event.locals.supabase.auth.getSession()`
   * you just call this `await getSession()`
   */
  event.locals.getSession = async () => {
    const {
      data: { session }
    } = await event.locals.supabase.auth.getSession()
    return session
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
} 