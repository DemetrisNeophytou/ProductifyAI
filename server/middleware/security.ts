/**
 * Security Middleware
 * Implements security headers, CORS, CSP, and input sanitization
 */

import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

/**
 * Security Headers Configuration
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Strict-Transport-Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // X-Frame-Options (prevent clickjacking)
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options (prevent MIME sniffing)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy (formerly Feature-Policy)
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  
  // Content-Security-Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://plausible.io", // unsafe-inline/eval needed for Vite dev
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: http:", // Allow external images from Pexels, Pixabay, etc.
    "connect-src 'self' https://*.supabase.co https://api.pexels.com https://pixabay.com https://api.unsplash.com https://plausible.io wss://*.supabase.co",
    "frame-src 'self' https://challenges.cloudflare.com",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', cspDirectives);
  
  next();
}

/**
 * CORS Configuration
 */
export function configureCORS() {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5050',
    'http://localhost:3000',
    process.env.VITE_FRONTEND_URL,
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  // Add production domain if configured
  if (process.env.NODE_ENV === 'production' && process.env.PRODUCTION_URL) {
    allowedOrigins.push(process.env.PRODUCTION_URL);
  }

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is in whitelist
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400, // 24 hours
  });
}

/**
 * Input Sanitization Middleware
 * Prevents XSS and injection attacks
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key] as string);
      }
    });
  }

  // Sanitize body (except for specific fields like passwords)
  if (req.body && typeof req.body === 'object') {
    const skipFields = ['password', 'confirmPassword', 'currentPassword', 'newPassword'];
    
    Object.keys(req.body).forEach((key) => {
      if (!skipFields.includes(key) && typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }

  next();
}

/**
 * Sanitize string input
 */
function sanitizeString(input: string): string {
  if (!input) return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .trim();
}

/**
 * HTTPS Enforcement Middleware
 */
export function enforceHTTPS(req: Request, res: Response, next: NextFunction) {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Check if request is secure
  const isSecure = req.secure || 
                   req.headers['x-forwarded-proto'] === 'https' ||
                   req.headers['x-forwarded-ssl'] === 'on';

  if (!isSecure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }

  next();
}

/**
 * Validate Content-Type for POST/PUT requests
 */
export function validateContentType(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        error: 'Content-Type must be application/json',
      });
    }
  }

  next();
}

/**
 * Remove sensitive headers from responses
 */
export function removeSensitiveHeaders(req: Request, res: Response, next: NextFunction) {
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  next();
}

/**
 * Add request ID for tracking
 */
export function addRequestId(req: Request, res: Response, next: NextFunction) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

/**
 * Comprehensive security middleware stack
 */
export function applySecurityMiddleware(app: any) {
  // Remove sensitive headers first
  app.use(removeSensitiveHeaders);
  
  // Add request ID
  app.use(addRequestId);
  
  // CORS
  app.use(configureCORS());
  
  // Security headers
  app.use(securityHeaders);
  
  // HTTPS enforcement
  app.use(enforceHTTPS);
  
  // Input sanitization
  app.use(sanitizeInput);
  
  // Content-Type validation (only for JSON APIs)
  // app.use('/api', validateContentType);
  
  console.log('✅ Security middleware applied');
}

