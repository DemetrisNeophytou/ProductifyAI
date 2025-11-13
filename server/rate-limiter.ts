import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

interface AuthRequest extends Request {
  user?: {
    claims?: {
      sub: string;
    };
  };
}

export const communityPostLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: 'Too many posts created. Please wait a minute before posting again.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const authReq = req as AuthRequest;
    return !authReq.user?.claims?.sub;
  },
});

export const communityCommentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: 'Too many comments. Please wait a minute before commenting again.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const authReq = req as AuthRequest;
    return !authReq.user?.claims?.sub;
  },
});

export const communityLikeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Too many like actions. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const authReq = req as AuthRequest;
    return !authReq.user?.claims?.sub;
  },
});

export const aiChatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: 'Too many AI requests. Please wait a minute to avoid quota limits.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const authReq = req as AuthRequest;
    return !authReq.user?.claims?.sub;
  },
});

export const aiGenerationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: 'Too many generation requests. Please wait a minute.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const authReq = req as AuthRequest;
    return !authReq.user?.claims?.sub;
  },
});

export const checkoutLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: 'Too many checkout attempts. Please wait 5 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiBuilderChatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Too many AI chat requests. Please wait a minute.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const authReq = req as AuthRequest;
    return !authReq.user?.claims?.sub;
  },
});

export const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});


