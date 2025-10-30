/**
 * Privacy-Friendly Analytics
 * Plausible Analytics integration (cookie-free, GDPR compliant)
 */

interface PlausibleEvent {
  name: string;
  props?: Record<string, string | number | boolean>;
}

/**
 * Track page view
 */
export function trackPageView(url?: string) {
  const plausibleUrl = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  
  if (!plausibleUrl || typeof window === 'undefined') return;

  try {
    if (window.plausible) {
      window.plausible('pageview', {
        u: url || window.location.href,
      });
    }
  } catch (error) {
    console.error('Analytics error:', error);
  }
}

/**
 * Track custom event
 */
export function trackEvent(eventName: string, props?: Record<string, any>) {
  const plausibleUrl = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  
  if (!plausibleUrl || typeof window === 'undefined') return;

  try {
    if (window.plausible) {
      window.plausible(eventName, { props });
    }
  } catch (error) {
    console.error('Analytics error:', error);
  }
}

/**
 * Pre-defined analytics events
 */
export const Analytics = {
  // Authentication
  signupStarted: () => trackEvent('Signup Started'),
  signupCompleted: (method: 'email' | 'google' | 'github') => 
    trackEvent('Signup Completed', { method }),
  loginCompleted: (method: 'email' | 'google' | 'github') => 
    trackEvent('Login Completed', { method }),
  logoutCompleted: () => trackEvent('Logout'),

  // Product Creation
  productCreated: (type: string) => trackEvent('Product Created', { type }),
  productPublished: (type: string) => trackEvent('Product Published', { type }),
  
  // AI Features
  aiGenerationStarted: (feature: string) => trackEvent('AI Generation Started', { feature }),
  aiGenerationCompleted: (feature: string) => trackEvent('AI Generation Completed', { feature }),
  
  // Subscriptions
  subscriptionStarted: (plan: string) => trackEvent('Subscription Started', { plan }),
  subscriptionCancelled: (plan: string) => trackEvent('Subscription Cancelled', { plan }),
  
  // Engagement
  featureUsed: (feature: string) => trackEvent('Feature Used', { feature }),
  pageView: (page: string) => trackEvent('Page View', { page }),
};

/**
 * Initialize analytics
 */
export function initAnalytics() {
  const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  
  if (!plausibleDomain || typeof window === 'undefined') {
    console.log('📊 Analytics: Disabled (no domain configured)');
    return;
  }

  // Plausible script is loaded via index.html
  console.log('📊 Analytics: Plausible initialized');
}

// Types for window.plausible
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: any; u?: string }) => void;
  }
}

