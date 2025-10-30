/**
 * Sentry Error Tracking Integration
 * Captures and reports application errors
 */

/**
 * Initialize Sentry
 */
export function initSentry() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE || 'development';

  if (!sentryDsn) {
    console.log('🔍 Sentry: Disabled (no DSN configured)');
    return;
  }

  // Dynamic import to avoid increasing bundle size when not configured
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      environment,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of errors
      
      // Ignore common errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'Network request failed',
        'Failed to fetch',
      ],
      
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
      
      // Before sending
      beforeSend(event, hint) {
        // Don't send events in development
        if (environment === 'development') {
          console.log('Sentry Event (dev):', event);
          return null;
        }
        
        // Filter out sensitive data
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        
        return event;
      },
    });

    console.log('✅ Sentry: Initialized');
  }).catch((error) => {
    console.error('Failed to initialize Sentry:', error);
  });
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  import('@sentry/react').then((Sentry) => {
    Sentry.captureException(error, {
      extra: context,
    });
  }).catch(() => {
    console.error('Sentry not available, logging error:', error);
  });
}

/**
 * Capture message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (typeof window === 'undefined') return;

  import('@sentry/react').then((Sentry) => {
    Sentry.captureMessage(message, level);
  }).catch(() => {
    console.log('Sentry message:', message);
  });
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  if (typeof window === 'undefined') return;

  import('@sentry/react').then((Sentry) => {
    Sentry.setUser(user);
  }).catch(() => {
    // Sentry not available
  });
}

/**
 * Clear user context
 */
export function clearUser() {
  if (typeof window === 'undefined') return;

  import('@sentry/react').then((Sentry) => {
    Sentry.setUser(null);
  }).catch(() => {
    // Sentry not available
  });
}

