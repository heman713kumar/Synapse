import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Structure for decoded user payload
interface UserPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

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
      process.env.JWT_SECRET || 'your-super-secure-jwt-secret-change-this-in-production-12345'
    ) as UserPayload; // assert type after verification
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
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
        process.env.JWT_SECRET || 'your-super-secure-jwt-secret-change-this-in-production-12345'
      ) as UserPayload;
      req.user = decoded;
    } catch (error) {
      if (error instanceof Error) {
        console.log('Optional auth token invalid:', error.message);
      } else {
        console.log('Optional auth token invalid: Unknown error');
      }
      // Do not block request, continue without user info
    }
  }

  next();
};
