/**
 * Input Validation Middleware
 * Validates and sanitizes incoming requests
 * Protects against common attacks (XSS, injection, etc.)
 */

import { Request, Response, NextFunction } from 'express';

// Email validation regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Username validation: alphanumeric, underscore, hyphen, 3-20 chars
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

// URL-safe slug validation
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Sanitize string input - remove dangerous characters
 */
export const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return '';
    return str
        .trim()
        .slice(0, 1000) // Max 1000 chars
        .replace(/[<>\"']/g, '') // Remove HTML/quotes
        .replace(/\0/g, ''); // Remove null bytes
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    return EMAIL_REGEX.test(email) && email.length <= 255;
};

/**
 * Validate username format
 */
export const validateUsername = (username: string): boolean => {
    if (!username || typeof username !== 'string') return false;
    return USERNAME_REGEX.test(username);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
    valid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];

    if (!password || typeof password !== 'string') {
        errors.push('Password is required');
        return { valid: false, errors };
    }

    if (password.length < 12) {
        errors.push('Password must be at least 12 characters');
    }

    if (password.length > 128) {
        errors.push('Password is too long (max 128 characters)');
    }

    // Check for character variety (require 3 of 4 types)
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const typeCount = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length;
    if (typeCount < 3) {
        errors.push('Password must contain at least 3 of: uppercase, lowercase, numbers, special characters');
    }

    return { valid: errors.length === 0, errors };
};

/**
 * Middleware to limit request payload size
 * Prevents large upload attacks
 */
export const limitPayloadSize = (maxSize: string | number = '1mb') => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.headers['content-length']) {
            const contentLength = parseInt(req.headers['content-length'], 10);
            const maxBytes = typeof maxSize === 'string'
                ? parseInt(maxSize) * 1024 * 1024
                : maxSize;

            if (contentLength > maxBytes) {
                return res.status(413).json({
                    status: 'error',
                    message: `Payload too large (max ${maxSize})`,
                });
            }
        }
        next();
    };
};

/**
 * Middleware to validate JSON structure
 */
export const validateJSON = (req: Request, res: Response, next: NextFunction) => {
    if (req.is('application/json') && Object.keys(req.body).length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid or empty JSON in request body',
        });
    }
    next();
};

/**
 * Middleware to prevent null bytes in strings
 * Guards against injection attacks
 */
export const preventNullBytes = (req: Request, res: Response, next: NextFunction) => {
    const checkForNullBytes = (obj: any): boolean => {
        if (typeof obj === 'string') {
            return obj.includes('\0');
        }
        if (typeof obj === 'object' && obj !== null) {
            return Object.values(obj).some(checkForNullBytes);
        }
        return false;
    };

    if (checkForNullBytes(req.body)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid characters in request',
        });
    }
    next();
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (page: any, limit: any): {
    skip: number;
    take: number;
} => {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    return {
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
    };
};

/**
 * Apply all validation middleware to a router
 */
export const applyValidationMiddleware = (router: any) => {
    router.use(limitPayloadSize('5mb'));
    router.use(validateJSON);
    router.use(preventNullBytes);
};
