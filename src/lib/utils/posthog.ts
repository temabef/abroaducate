import posthog from 'posthog-js'
import { browser } from '$app/environment'

// Initialize PostHog (browser only)
if (browser) {
  try {
    posthog.init('phc_PlTMibICzNy5DTxpnxVRHl3n7JiH8l6KLDBgLqpbruZ', {
      api_host: 'https://us.i.posthog.com',
      // Keep profiles for identified users only
      person_profiles: 'identified_only',
      // Avoid duplicate automatic pageview if we track manually
      capture_pageview: false,
      // Enable session recording with safe defaults
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: 'input, textarea, [data-ph-mask]'
      }
    })

    // Start session recording explicitly (in case project defaults are off)
    try { posthog.startSessionRecording?.() } catch {}

    // Capture unexpected frontend errors for triage
    window.addEventListener('error', (e) => {
      try {
        posthog.capture('frontend_error', {
          message: e.error?.message || e.message,
          source: 'window.error',
          stack: e.error?.stack,
          filename: (e as any).filename,
          lineno: (e as any).lineno,
          colno: (e as any).colno
        })
      } catch {}
    })
    window.addEventListener('unhandledrejection', (e) => {
      try {
        posthog.capture('frontend_error', {
          message: (e.reason && e.reason.message) || String(e.reason),
          source: 'unhandledrejection'
        })
      } catch {}
    })
  } catch (err) {
    console.error('PostHog init failed', err)
  }
}

// Utility functions for common analytics events
export const analytics = {
  // Track page views
  trackPageView: (pageName: string, properties?: Record<string, any>) => {
    if (browser) {
      posthog.capture('page_viewed', {
        page_name: pageName,
        ...properties
      })
    }
  },

  // Track user actions
  trackEvent: (eventName: string, properties?: Record<string, any>) => {
    if (browser) {
      posthog.capture(eventName, properties)
    }
  },

  // Track user identification
  identify: (userId: string, properties?: Record<string, any>) => {
    if (browser) {
      posthog.identify(userId, properties)
    }
  },

  // Track feature usage
  trackFeatureUsage: (featureName: string, properties?: Record<string, any>) => {
    if (browser) {
      posthog.capture('feature_used', {
        feature_name: featureName,
        ...properties
      })
    }
  },

  // Track form submissions
  trackFormSubmission: (formName: string, properties?: Record<string, any>) => {
    if (browser) {
      posthog.capture('form_submitted', {
        form_name: formName,
        ...properties
      })
    }
  },

  // Track button clicks
  trackButtonClick: (buttonName: string, properties?: Record<string, any>) => {
    if (browser) {
      posthog.capture('button_clicked', {
        button_name: buttonName,
        ...properties
      })
    }
  },

  // Track subscription events
  trackSubscription: (plan: string, properties?: Record<string, any>) => {
    if (browser) {
      posthog.capture('subscription_created', {
        plan,
        ...properties
      })
    }
  },

  // Track document generation
  trackDocumentGenerated: (documentType: string, properties?: Record<string, any>) => {
    if (browser) {
      posthog.capture('document_generated', {
        document_type: documentType,
        ...properties
      })
    }
  },

  // Track scholarship applications
  trackScholarshipApplication: (scholarshipId: string, properties?: Record<string, any>) => {
    if (browser) {
      posthog.capture('scholarship_applied', {
        scholarship_id: scholarshipId,
        ...properties
      })
    }
  }
}

// Feature flags wrapper
export const featureFlags = {
  isEnabled: (flag: string, props?: Record<string, any>): boolean => {
    if (!browser) return true;
    try { return posthog.isFeatureEnabled(flag, props); } catch { return true; }
  },
  getVariant: (flag: string): string | boolean | undefined => {
    if (!browser) return undefined;
    try { return (posthog as any).getFeatureFlag?.(flag); } catch { return undefined; }
  }
};

export default posthog 