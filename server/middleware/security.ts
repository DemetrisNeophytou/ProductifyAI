/**
 * Security Middleware
 * 
 * Comprehensive security hardening for Express application:
 * - Helmet.js for security headers
 * - Strict CORS with whitelisted origins
 * - Global rate limiting
 * - Request sanitization
 */

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

/**
 * Security Headers Middleware (Helmet.js)
 * 
 * Configures secure HTTP headers:
 * - Content Security Policy
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Referrer-Policy
 * - Permissions-Policy
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Vite/React in development
        "'unsafe-eval'",   // Required for Vite HMR in development
        "https://cdn.jsdelivr.net",
        "https://js.stripe.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components
        "https://fonts.googleapis.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:",
      ],
      connectSrc: [
        "'self'",
        "https://api.stripe.com",
        "https://api.openai.com",
        "https://*.supabase.co",
        process.env.NODE_ENV === 'development' ? "ws://localhost:*" : "",
      ].filter(Boolean),
      frameSrc: [
        "'self'",
        "https://js.stripe.com",
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  
  // Cross-Origin policies
  crossOriginEmbedderPolicy: false, // Required for some third-party services
  crossOriginResourcePolicy: { policy: "cross-origin" },
  
  // X-Frame-Options
  frameguard: {
    action: 'deny', // Prevent clickjacking
  },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  
  // X-XSS-Protection (legacy, but good for older browsers)
  xssFilter: true,
});

/**
 * Strict CORS Configuration
 * 
 * Only allows requests from whitelisted origins
 * Environment variable: CORS_ORIGIN (comma-separated list)
 */
export const strictCors = () => {
  // Get allowed origins from environment variable
  const allowedOriginsEnv = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000';
  const allowedOrigins = allowedOriginsEnv.split(',').map(origin => origin.trim());
  
  // In production, ensure we have explicit origins
  if (process.env.NODE_ENV === 'production' && allowedOriginsEnv.includes('localhost')) {
    Logger.warn('⚠️ SECURITY WARNING: localhost origins detected in production CORS config');
  }
  
  Logger.info(`🔒 CORS configured with allowed origins: ${allowedOrigins.join(', ')}`);
  
  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or same-origin)
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        Logger.warn(`🚫 CORS blocked request from unauthorized origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true, // Allow cookies/auth headers
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-*'],
    maxAge: 86400, // 24 hours - cache preflight requests
  });
};

/**
 * Global API Rate Limiter
 * 
 * Applies to all /api routes
 * Prevents brute-force attacks and API abuse
 */
export const globalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
  
  // Skip rate limiting for health checks
  skip: (req: Request) => {
    return req.path.startsWith('/health') || 
           req.path === '/healthz' || 
           req.path === '/readyz';
  },
  
  // Custom key generator (can be extended to use user ID)
  keyGenerator: (req: Request) => {
    return req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  },
  
  // Handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    Logger.warn(`⚠️ Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * Strict Rate Limiter for Authentication Routes
 * 
 * More aggressive rate limiting for auth endpoints
 * Prevents brute-force login attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    error: 'Too many authentication attempts',
    message: 'Account temporarily locked. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Request Sanitization Middleware
 * 
 * Sanitizes request body, query, and params to prevent XSS
 */
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize strings by removing dangerous characters
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential XSS payloads
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  // Sanitize all request inputs
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
};

/**
 * Security Logger Middleware
 * 
 * Logs security-relevant events
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//,          // Path traversal
    /<script/i,        // XSS attempts
    /union.*select/i,  // SQL injection
    /etc\/passwd/,     // File access attempts
  ];
  
  const fullUrl = `${req.method} ${req.path}`;
  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params,
  });
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl) || pattern.test(requestData)) {
      Logger.warn(`🚨 SECURITY: Suspicious request detected from ${req.ip}`);
      Logger.warn(`   URL: ${fullUrl}`);
      Logger.warn(`   User-Agent: ${req.headers['user-agent']}`);
      break;
    }
  }
  
  next();
};

/**
 * Environment Validation
 * 
 * Ensures critical security environment variables are set
 */
export const validateSecurityConfig = () => {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check production-critical variables
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN.includes('localhost')) {
      errors.push('CORS_ORIGIN must be set to production domains in production');
    }
    
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters in production');
    }
    
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      errors.push('SESSION_SECRET must be at least 32 characters in production');
    }
  }
  
  // Check optional but recommended variables
  if (!process.env.CORS_ORIGIN) {
    warnings.push('CORS_ORIGIN not set, using default localhost origins');
  }
  
  // Log results
  if (errors.length > 0) {
    Logger.error('🔴 SECURITY ERRORS:');
    errors.forEach(err => Logger.error(`   - ${err}`));
    throw new Error('Security configuration errors detected. See logs for details.');
  }
  
  if (warnings.length > 0) {
    Logger.warn('⚠️ SECURITY WARNINGS:');
    warnings.forEach(warn => Logger.warn(`   - ${warn}`));
  }
  
  Logger.info('✅ Security configuration validated');
};

/**
 * Request Size Limiter
 * 
 * Prevents DOS attacks via large payloads
 */
export const requestSizeLimiter = {
  json: { limit: '10mb' },      // JSON payloads
  urlencoded: { limit: '10mb' }, // URL-encoded forms
  text: { limit: '10mb' },       // Text payloads
};

