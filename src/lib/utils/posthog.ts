import posthog from 'posthog-js'
import { browser } from '$app/environment'

// Initialize PostHog if not already initialized
if (browser && !posthog.isFeatureEnabled('test')) {
  posthog.init(
    'phc_PlTMibICzNy5DTxpnxVRHl3n7JiH8l6KLDBgLqpbruZ',
    {
      api_host: 'https://us.i.posthog.com',
      defaults: '2025-05-24',
      person_profiles: 'identified_only',
    }
  )
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

export default posthog 