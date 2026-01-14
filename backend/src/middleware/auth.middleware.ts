import jwt, { Secret, JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// --- CRITICAL FIX: Fail fast if secret is missing ---
const JWT_SECRET: Secret = process.env.JWT_SECRET || '';
if (!JWT_SECRET || JWT_SECRET === 'your-super-secure-jwt-secret-change-this-in-production-12345') {
    // Check against the placeholder to ensure it's not accidentally used
    console.error("FATAL ERROR: JWT_SECRET environment variable is missing or set to placeholder.");
    process.exit(1);
}
// --- END CRITICAL FIX ---

// Structure for decoded user payload
interface UserPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Helper for secure error logging
const logSecurityError = (context: string, error: unknown) => {
    console.error(`[SECURITY ERROR] ${context}`);
    if (process.env.NODE_ENV === 'development') {
        console.error('Debug Details:', error);
    }
};

// Use Request type directly - 'user' is now known from your global augmentation
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(
      token,
      JWT_SECRET // Use the validated secret constant
    ) as UserPayload; // assert type after verification
    req.user = decoded;
    next();
  } catch (error) {
    // --- FIX 2 & 4: Securely handle specific JWT errors ---
    if (error instanceof TokenExpiredError) {
      logSecurityError('Authentication failed: Token expired', error);
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error instanceof JsonWebTokenError) {
      logSecurityError('Authentication failed: Invalid token signature', error);
      return res.status(403).json({ error: 'Invalid token' });
    }
    logSecurityError('Authentication failed: Generic error', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        JWT_SECRET // Use the validated secret constant
      ) as UserPayload;
      req.user = decoded;
    } catch (error) {
      // FIX 2: Securely log the optional auth error, but do not block the request.
      if (error instanceof Error) {
        logSecurityError('Optional auth token invalid', error.message);
      } else {
        logSecurityError('Optional auth token invalid: Unknown error', error);
      }
      // Continue without user info
    }
  }

  next();
};