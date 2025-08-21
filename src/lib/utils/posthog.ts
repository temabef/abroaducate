import { browser } from '$app/environment'

// Public PostHog config
const POSTHOG_KEY = 'phc_PlTMibICzNy5DTxpnxVRHl3n7JiH8l6KLDBgLqpbruZ'
const POSTHOG_HOST = 'https://us.i.posthog.com'

// Internal state
let posthog: any = null
let initialized = false
let initAttempted = false

async function initPosthog(): Promise<void> {
  if (!browser || initialized || initAttempted) return
  initAttempted = true
  try {
    const mod = await import('posthog-js')
    posthog = mod.default
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: 'input, textarea, [data-ph-mask]'
      },
      debug: import.meta.env.DEV
    })
    initialized = true
  } catch (err) {
    // Stay in no-op mode
    if (import.meta.env.DEV) console.warn('PostHog dynamic import/init failed:', err)
  }
}

// Kick off init in the background (browser only)
if (browser) {
  // Do not await; keep UI responsive
  void initPosthog()
}

// Analytics API (no-op safe)
export const analytics = {
  trackPageView: (pageName: string, properties?: Record<string, any>) => {
    if (!browser) return
    if (!initialized) { void initPosthog(); return }
    try { posthog.capture('page_viewed', { page_name: pageName, url: window.location.href, ...properties }) } catch {}
  },
  trackEvent: (eventName: string, properties?: Record<string, any>) => {
    if (!browser) return
    if (!initialized) { void initPosthog(); return }
    try { posthog.capture(eventName, { url: window.location.href, ...properties }) } catch {}
  },
  identify: (userId: string, properties?: Record<string, any>) => {
    if (!browser) return
    if (!initialized) { void initPosthog(); return }
    try { posthog.identify(userId, properties) } catch {}
  },
  trackFeatureUsage: (featureName: string, properties?: Record<string, any>) => {
    if (!browser) return
    if (!initialized) { void initPosthog(); return }
    try { posthog.capture('feature_used', { feature_name: featureName, url: window.location.href, ...properties }) } catch {}
  },
  trackFormSubmission: (formName: string, properties?: Record<string, any>) => {
    if (!browser) return
    if (!initialized) { void initPosthog(); return }
    try { posthog.capture('form_submitted', { form_name: formName, url: window.location.href, ...properties }) } catch {}
  },
  trackButtonClick: (buttonName: string, properties?: Record<string, any>) => {
    if (!browser) return
    if (!initialized) { void initPosthog(); return }
    try { posthog.capture('button_clicked', { button_name: buttonName, url: window.location.href, ...properties }) } catch {}
  },
  trackConversion: (conversionType: string, properties?: Record<string, any>) => {
    if (!browser) return
    if (!initialized) { void initPosthog(); return }
    try { posthog.capture('conversion', { conversion_type: conversionType, url: window.location.href, ...properties }) } catch {}
  },
  trackError: (errorType: string, errorMessage: string, properties?: Record<string, any>) => {
    if (!browser) return
    if (!initialized) { void initPosthog(); return }
    try { posthog.capture('error_occurred', { error_type: errorType, error_message: errorMessage, url: window.location.href, ...properties }) } catch {}
  },
  getInstance: () => (browser ? posthog : null),
  isLoaded: () => initialized
}

// Feature flags (no-op safe)
export const featureFlags = {
  isEnabled: (flag: string, props?: Record<string, any>): boolean => {
    if (!browser || !initialized || !posthog?.isFeatureEnabled) return false
    try { return posthog.isFeatureEnabled(flag, props) } catch { return false }
  },
  getVariant: (flag: string): string | boolean | undefined => {
    if (!browser || !initialized) return undefined
    try { return (posthog as any).getFeatureFlag?.(flag) } catch { return undefined }
  }
}

export { posthog } 