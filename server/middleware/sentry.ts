/**
 * ============================================================================
 * Sentry Error Logging Integration
 * ============================================================================
 * 
 * This middleware integrates Sentry for comprehensive error tracking and
 * monitoring in production. Sentry captures:
 * 
 * - Unhandled exceptions
 * - HTTP errors (4xx, 5xx)
 * - Performance metrics
 * - Custom events and breadcrumbs
 * 
 * Usage:
 * ------
 * import { initSentry, sentryErrorHandler, sentryRequestHandler } from './middleware/sentry';
 * 
 * // Initialize before any routes
 * initSentry(app);
 * 
 * // Add request handler after routes
 * app.use(sentryRequestHandler());
 * 
 * // Add error handler at the very end
 * app.use(sentryErrorHandler());
 * 
 * Environment Variables:
 * ----------------------
 * SENTRY_DSN - Your Sentry DSN (required)
 * SENTRY_ENVIRONMENT - Environment name (default: NODE_ENV)
 * SENTRY_TRACES_SAMPLE_RATE - Performance sampling rate (default: 0.1 = 10%)
 * SENTRY_PROFILES_SAMPLE_RATE - Profiling sampling rate (default: 0.1 = 10%)
 * 
 * ============================================================================
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Express, Request, Response, NextFunction } from 'express';

// ============================================================================
// Configuration
// ============================================================================

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
const SENTRY_TRACES_SAMPLE_RATE = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1');
const SENTRY_PROFILES_SAMPLE_RATE = parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1');

// Check if Sentry is enabled
export const isSentryEnabled = (): boolean => {
  return Boolean(SENTRY_DSN) && SENTRY_ENVIRONMENT !== 'test';
};

// ============================================================================
// Initialize Sentry
// ============================================================================

export const initSentry = (app: Express): void => {
  if (!isSentryEnabled()) {
    console.log('ℹ️  Sentry is disabled (SENTRY_DSN not set or in test environment)');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      
      // Performance Monitoring
      tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
      
      // Profiling
      profilesSampleRate: SENTRY_PROFILES_SAMPLE_RATE,
      integrations: [
        // Enable profiling
        nodeProfilingIntegration(),
        
        // Express integration
        Sentry.expressIntegration({ app }),
        
        // HTTP integration
        Sentry.httpIntegration(),
        
        // Node fetch integration
        Sentry.nativeNodeFetchIntegration(),
      ],
      
      // Filter out sensitive data
      beforeSend(event, hint) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
          delete event.request.headers['x-api-key'];
        }
        
        // Remove sensitive query params
        if (event.request?.query_string) {
          const sanitizedQuery = event.request.query_string
            .replace(/([?&])(api_key|token|password|secret)=[^&]*/gi, '$1$2=[REDACTED]');
          event.request.query_string = sanitizedQuery;
        }
        
        // Remove sensitive data from extra
        if (event.extra) {
          ['password', 'token', 'api_key', 'secret', 'credit_card'].forEach(key => {
            if (event.extra && event.extra[key]) {
              event.extra[key] = '[REDACTED]';
            }
          });
        }
        
        return event;
      },
      
      // Ignore certain errors
      ignoreErrors: [
        // Browser errors
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        
        // Network errors
        'NetworkError',
        'Network request failed',
        'Failed to fetch',
        
        // Client errors (400-499)
        'Bad Request',
        'Unauthorized',
        'Forbidden',
        'Not Found',
        
        // Rate limiting
        'Too many requests',
        'Rate limit exceeded',
      ],
    });

    console.log('✅ Sentry initialized successfully');
    console.log(`   Environment: ${SENTRY_ENVIRONMENT}`);
    console.log(`   Traces Sample Rate: ${SENTRY_TRACES_SAMPLE_RATE * 100}%`);
    console.log(`   Profiles Sample Rate: ${SENTRY_PROFILES_SAMPLE_RATE * 100}%`);
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
  }
};

// ============================================================================
// Request Handler Middleware
// ============================================================================

export const sentryRequestHandler = () => {
  if (!isSentryEnabled()) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
  
  return Sentry.expressIntegration().setupRequestHandler;
};

// ============================================================================
// Tracing Middleware
// ============================================================================

export const sentryTracingHandler = () => {
  if (!isSentryEnabled()) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
  
  return Sentry.expressIntegration().setupTracingHandler;
};

// ============================================================================
// Error Handler Middleware
// ============================================================================

export const sentryErrorHandler = () => {
  if (!isSentryEnabled()) {
    return (_err: Error, _req: Request, _res: Response, next: NextFunction) => next();
  }
  
  return Sentry.expressIntegration().setupErrorHandler;
};

// ============================================================================
// Custom Error Reporting Functions
// ============================================================================

/**
 * Manually capture an exception
 */
export const captureException = (error: Error, context?: Record<string, any>): string | undefined => {
  if (!isSentryEnabled()) {
    console.error('Error (Sentry disabled):', error);
    return undefined;
  }
  
  return Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Manually capture a message
 */
export const captureMessage = (
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, any>
): string | undefined => {
  if (!isSentryEnabled()) {
    console.log(`Message (Sentry disabled) [${level}]:`, message);
    return undefined;
  }
  
  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
};

/**
 * Add breadcrumb (for context in error reports)
 */
export const addBreadcrumb = (breadcrumb: {
  message?: string;
  category?: string;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, any>;
}): void => {
  if (!isSentryEnabled()) return;
  
  Sentry.addBreadcrumb(breadcrumb);
};

/**
 * Set user context for error tracking
 */
export const setUser = (user: {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
  [key: string]: any;
} | null): void => {
  if (!isSentryEnabled()) return;
  
  Sentry.setUser(user);
};

/**
 * Set tags for filtering errors in Sentry
 */
export const setTag = (key: string, value: string): void => {
  if (!isSentryEnabled()) return;
  
  Sentry.setTag(key, value);
};

/**
 * Set context for additional error information
 */
export const setContext = (name: string, context: Record<string, any>): void => {
  if (!isSentryEnabled()) return;
  
  Sentry.setContext(name, context);
};

/**
 * Wrap async function with error handling
 */
export const wrapAsync = <T extends (...args: any[]) => Promise<any>>(
  fn: T
): T => {
  if (!isSentryEnabled()) return fn;
  
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error as Error);
      throw error;
    }
  }) as T;
};

// ============================================================================
// Express Middleware for User Context
// ============================================================================

/**
 * Automatically set user context from request
 */
export const sentryUserMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!isSentryEnabled()) {
    return next();
  }
  
  // Extract user from request (adjust based on your auth implementation)
  const user = (req as any).user;
  
  if (user) {
    setUser({
      id: user.id,
      email: user.email,
      username: user.username || `${user.firstName} ${user.lastName}`.trim(),
      role: user.role,
      plan: user.plan,
    });
  }
  
  // Set request context
  setContext('request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });
  
  next();
};

// ============================================================================
// Health Check Integration
// ============================================================================

/**
 * Send health check event to Sentry
 */
export const reportHealthCheckFailure = (
  service: string,
  error: Error | string,
  details?: Record<string, any>
): void => {
  if (!isSentryEnabled()) return;
  
  captureMessage(
    `Health check failed: ${service}`,
    'error',
    {
      service,
      error: typeof error === 'string' ? error : error.message,
      ...details,
    }
  );
};

// ============================================================================
// Security Event Logging
// ============================================================================

/**
 * Log security events to Sentry
 */
export const reportSecurityEvent = (
  event: string,
  severity: 'high' | 'medium' | 'low',
  details?: Record<string, any>
): void => {
  if (!isSentryEnabled()) return;
  
  const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'info';
  
  captureMessage(
    `Security Event: ${event}`,
    level,
    {
      event_type: 'security',
      severity,
      ...details,
    }
  );
};

// Export Sentry instance for advanced usage
export { Sentry };

