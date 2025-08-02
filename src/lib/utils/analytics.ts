import { browser } from '$app/environment';
import { analytics as posthogAnalytics } from './posthog';

// Google Analytics Tracking ID - Replace with your actual ID
const GA_TRACKING_ID = 'G-L0SKBY98GT'; // Replace with your actual GA4 tracking ID

// Analytics utility class
class AnalyticsManager {
  private isInitialized = false;
  private consentGiven = false;

  // Initialize analytics with consent management
  init() {
    if (!browser || this.isInitialized) return;

    try {
      // Check for Ezoic consent management
      if (window.ezstandalone && window.ezstandalone.cmp) {
        // Wait for consent to be available
        window.ezstandalone.cmd.push(() => {
          this.checkConsentAndInit();
        });
      } else {
        // If no consent management, initialize immediately
        this.initializeAnalytics();
      }
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  // Check consent and initialize analytics
  private checkConsentAndInit() {
    try {
      if (window.ezstandalone && window.ezstandalone.cmp) {
        const consent = window.ezstandalone.cmp.getConsent();
        this.consentGiven = consent.analytics || consent.all;
        
        if (this.consentGiven) {
          this.initializeAnalytics();
        } else {
          // Listen for consent changes
          window.ezstandalone.cmp.on('consentChanged', (consent: any) => {
            if (consent.analytics || consent.all) {
              this.consentGiven = true;
              this.initializeAnalytics();
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking consent:', error);
    }
  }

  // Initialize both Google Analytics and PostHog
  private initializeAnalytics() {
    if (this.isInitialized) return;

    try {
      // Initialize Google Analytics
      this.initGoogleAnalytics();
      
      // PostHog is already initialized in layout.ts, just ensure it's working
      this.isInitialized = true;
      console.log('Analytics initialized successfully');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  // Initialize Google Analytics
  private initGoogleAnalytics() {
    if (typeof window !== 'undefined' && window.gtag) {
      // Google Analytics is already loaded via app.html
      console.log('Google Analytics already loaded');
    } else {
      console.warn('Google Analytics not loaded - check app.html configuration');
    }
  }

  // Track page view
  trackPageView(pageName: string, properties?: Record<string, any>) {
    if (!this.consentGiven) return;

    try {
      // Track with Google Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', GA_TRACKING_ID, {
          page_path: window.location.pathname,
          page_title: document.title,
          page_location: window.location.href,
          ...properties
        });
      }

      // Track with PostHog
      posthogAnalytics.trackPageView(pageName, properties);
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  // Track custom event
  trackEvent(eventName: string, properties?: Record<string, any>) {
    if (!this.consentGiven) return;

    try {
      // Track with Google Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, {
          event_category: properties?.category || 'general',
          event_label: properties?.label,
          value: properties?.value,
          ...properties
        });
      }

      // Track with PostHog
      posthogAnalytics.trackEvent(eventName, properties);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Track user identification
  identify(userId: string, properties?: Record<string, any>) {
    if (!this.consentGiven) return;

    try {
      // Track with Google Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', GA_TRACKING_ID, {
          user_id: userId,
          ...properties
        });
      }

      // Track with PostHog
      posthogAnalytics.identify(userId, properties);
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  // Check if analytics is working
  isWorking(): boolean {
    return this.isInitialized && this.consentGiven;
  }

  // Get consent status
  getConsentStatus(): boolean {
    return this.consentGiven;
  }
}

// Create singleton instance
export const analyticsManager = new AnalyticsManager();

// Export convenience functions
export const analytics = {
  init: () => analyticsManager.init(),
  trackPageView: (pageName: string, properties?: Record<string, any>) => 
    analyticsManager.trackPageView(pageName, properties),
  trackEvent: (eventName: string, properties?: Record<string, any>) => 
    analyticsManager.trackEvent(eventName, properties),
  identify: (userId: string, properties?: Record<string, any>) => 
    analyticsManager.identify(userId, properties),
  isWorking: () => analyticsManager.isWorking(),
  getConsentStatus: () => analyticsManager.getConsentStatus()
};

// Type declarations for global objects
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    ezstandalone: {
      cmd: any[];
      cmp: {
        getConsent: () => { analytics: boolean; all: boolean };
        on: (event: string, callback: (consent: any) => void) => void;
      };
    };
  }
} 