/**
 * Global Error Handling Middleware
 * Standardizes error responses across all routes
 * - Never exposes sensitive error details to client
 * - Logs full errors server-side for debugging
 * - Returns consistent error format to frontend
 */

import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

/**
 * Global error handler middleware
 * Should be the LAST middleware in the chain
 * Usage: app.use(errorHandler);
 */
export const errorHandler = (
    error: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Default error properties
    const statusCode = error.statusCode || 500;
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Log full error server-side for debugging (NEVER send to client)
    console.error('❌ ERROR:', {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        statusCode,
        message: error.message,
        stack: error.stack,
        // Don't log request body (may contain passwords)
    });

    // Distinguish between operational errors (expected) vs programming errors
    if (error.isOperational) {
        // Operational error: expected to happen (validation error, auth error, etc)
        return res.status(statusCode).json({
            status: 'error',
            message: error.message,
            ...(isDevelopment && { error: error.message }),
        });
    }

    // Programming error: send generic message in production
    // This prevents leaking internal details about implementation
    const clientMessage =
        statusCode === 500
            ? 'An internal server error occurred. Please try again later.'
            : error.message || 'An error occurred';

    return res.status(statusCode).json({
        status: 'error',
        message: clientMessage,
        ...(isDevelopment && { 
            error: error.message,
            stack: error.stack 
        }),
    });
};

/**
 * Helper to create operational errors
 * Usage: throw new OperationalError('User not found', 404);
 */
export class OperationalError extends Error implements AppError {
    statusCode: number;
    isOperational: boolean = true;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, OperationalError.prototype);
    }
}

/**
 * Async route wrapper to catch errors
 * Prevents needing try-catch in every route
 * Usage: router.get('/', asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
