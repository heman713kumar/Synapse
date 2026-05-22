import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General API rate limiter - 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests. Please try again later.'
    });
  }
});

// Login rate limiter - 5 attempts per 15 minutes
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful logins
  keyGenerator: (req: Request) => {
    // Rate limit by email instead of IP for better security
    return ((req.body as any)?.email || req.ip) as string;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many login attempts. Please try again in 15 minutes or reset your password.'
    });
  }
});

// Registration rate limiter - 5 attempts per hour per IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many accounts created from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many registration attempts from this IP. Please try again later.'
    });
  }
});

// Password reset rate limiter - 3 attempts per hour
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many password reset requests, please try again later.',
  keyGenerator: (req: Request) => {
    return ((req.body as any)?.email || req.ip) as string;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many password reset requests. Please try again in 1 hour.'
    });
  }
});

// Email verification resend limiter - 3 attempts per hour
export const resendEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many resend requests, please try again later.',
  keyGenerator: (req: Request) => {
    return ((req.body as any)?.email || req.ip) as string;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many verification email requests. Please try again in 1 hour.'
    });
  }
});
