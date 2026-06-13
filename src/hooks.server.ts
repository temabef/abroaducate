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

  const { data: { session } } = await event.locals.supabase.auth.getSession();
  event.locals.session = session;
  event.locals.user = session?.user ?? null;

  /**
   * a little helper that is written for convenience so that instead
   * of calling `const { data: { session } } = await event.locals.supabase.auth.getSession()`
   * you just call this `await getSession()`
   */
  event.locals.getSession = async () => {
    const {
      data: { session }
    } = await event.locals.supabase.auth.getSession();
    if (session) {
      event.locals.user = session.user;
      event.locals.session = session;
    }
    return session;
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  }).then((response) => {
    // Add CSP header to allow Cloudflare Turnstile
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://us.i.posthog.com https://us-assets.i.posthog.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://www.google-analytics.com https://accounts.google.com https://*.adtrafficquality.google https://assets.calendly.com https://challenges.cloudflare.com",
        "connect-src 'self' https://*.supabase.co https://us.i.posthog.com https://us-assets.i.posthog.com https://www.google-analytics.com https://api.ipify.org https://api.openai.com https://api.stripe.com https://api.sendgrid.com https://*.google https://*.adtrafficquality.google https://accounts.google.com https://oauth2.googleapis.com https://challenges.cloudflare.com",
        "frame-src 'self' https://challenges.cloudflare.com https://accounts.google.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "media-src 'self' https:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ')
    );
    return response;
  })
} 