# Synapse App - Architecture Refactoring Guide

## Table of Contents
1. [Service Layer Architecture](#service-layer-architecture)
2. [Error Handling Strategy](#error-handling-strategy)
3. [State Management Setup](#state-management-setup)
4. [Testing Structure](#testing-structure)
5. [Implementation Timeline](#implementation-timeline)

---

## Service Layer Architecture

### Problem
Current architecture mixes database queries with route handlers, making code untestable and difficult to reuse.

### Proposed Structure

```
backend/src/
├── routes/
│   ├── auth.routes.ts          (HTTP handlers only)
│   ├── ideas.routes.ts         (HTTP handlers only)
│   └── ...
├── services/
│   ├── auth.service.ts         (Auth business logic)
│   ├── user.service.ts         (User business logic)
│   ├── idea.service.ts         (Idea business logic)
│   ├── chat.service.ts         (Chat business logic)
│   └── ai.service.ts           (AI business logic)
├── repositories/
│   ├── user.repository.ts      (User data access)
│   ├── idea.repository.ts      (Idea data access)
│   ├── chat.repository.ts      (Chat data access)
│   └── base.repository.ts      (Base class)
├── middleware/
│   ├── auth.middleware.ts      (Auth checks)
│   ├── error.middleware.ts     (Error handling)
│   ├── validation.middleware.ts (Input validation)
│   └── ...
├── types/
│   ├── index.ts                (Shared types)
│   └── errors.ts               (Error types)
└── utils/
    ├── validators.ts           (Validation functions)
    ├── logger.ts               (Logging)
    └── ...
```

### Implementation Example

**Step 1: Create Base Repository**
```typescript
// backend/src/repositories/base.repository.ts
export abstract class BaseRepository {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async findById(id: string) {
    return await query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
  }

  async findAll(limit = 100, offset = 0) {
    return await query(
      `SELECT * FROM ${this.tableName} LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
  }

  async delete(id: string) {
    return await query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
  }
}
```

**Step 2: Create User Repository**
```typescript
// backend/src/repositories/user.repository.ts
import { BaseRepository } from './base.repository';
import { query } from '../db/database';

export interface UserRow {
  id: string;
  email: string;
  username: string;
  display_name: string;
  password_hash: string;
  avatar_url?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email: string) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] as UserRow | undefined;
  }

  async findByUsername(username: string) {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] as UserRow | undefined;
  }

  async create(data: {
    email: string;
    username: string;
    display_name: string;
    password_hash: string;
    user_type?: string;
  }) {
    const result = await query(
      `INSERT INTO users (email, username, display_name, password_hash, user_type, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [data.email, data.username, data.display_name, data.password_hash, data.user_type || 'thinker']
    );
    return result.rows[0] as UserRow;
  }

  async update(id: string, data: Partial<UserRow>) {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const allowedFields = ['display_name', 'bio', 'avatar_url', 'skills', 'interests', 'user_type'];
    
    for (const field of allowedFields) {
      if (field in data) {
        const snakeField = field;
        const camelField = snakeField.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        
        if ((data as any)[camelField] !== undefined) {
          setClause.push(`${snakeField} = $${paramCount}`);
          values.push((data as any)[camelField]);
          paramCount++;
        }
      }
    }

    if (setClause.length === 0) return null;

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] as UserRow;
  }
}
```

**Step 3: Create Auth Service**
```typescript
// backend/src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { validatePassword, isCommonPassword } from '../utils/passwordValidator';

export interface AuthResult {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
}

export class AuthService {
  private userRepository: UserRepository;
  private jwtSecret: string;

  constructor(jwtSecret: string) {
    this.userRepository = new UserRepository();
    this.jwtSecret = jwtSecret;
  }

  async register(data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
    userType?: string;
  }): Promise<AuthResult> {
    try {
      // Validate inputs
      if (!data.email || !data.username || !data.password || !data.displayName) {
        return {
          success: false,
          error: 'All fields are required'
        };
      }

      // Validate email format
      if (!this.isValidEmail(data.email)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Validate password strength
      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: 'Password does not meet requirements',
          ...(process.env.NODE_ENV === 'development' && { details: passwordValidation.errors })
        };
      }

      if (isCommonPassword(data.password)) {
        return {
          success: false,
          error: 'This password is too common'
        };
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          error: 'User already exists with this email'
        };
      }

      const existingUsername = await this.userRepository.findByUsername(data.username);
      if (existingUsername) {
        return {
          success: false,
          error: 'Username is already taken'
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Create user
      const user = await this.userRepository.create({
        email: data.email,
        username: data.username,
        display_name: data.displayName,
        password_hash: hashedPassword,
        user_type: data.userType
      });

      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        this.jwtSecret,
        { expiresIn: '7d' }
      );

      return {
        success: true,
        user: this.formatUser(user),
        token
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed'
      };
    }
  }

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        this.jwtSecret,
        { expiresIn: '7d' }
      );

      return {
        success: true,
        user: this.formatUser(user),
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed'
      };
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private formatUser(user: any) {
    return {
      userId: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      userType: user.user_type,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      skills: user.skills || [],
      interests: user.interests || [],
      onboardingCompleted: user.onboarding_completed,
      createdAt: user.created_at
    };
  }
}
```

**Step 4: Refactor Route Handler**
```typescript
// backend/src/routes/auth.routes.ts
import express, { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const authService = new AuthService(process.env.JWT_SECRET || '');

router.post('/register', async (req: Request, res: Response) => {
  try {
    const result = await authService.register({
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      displayName: req.body.displayName,
      userType: req.body.userType
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).cookie('authToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    }).json({
      message: 'User registered successfully',
      user: result.user
    });
  } catch (error) {
    console.error('Register endpoint error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    res.cookie('authToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    }).json({
      message: 'Login successful',
      user: result.user
    });
  } catch (error) {
    console.error('Login endpoint error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
```

---

## Error Handling Strategy

### Current Problem
- Inconsistent error formats
- Inconsistent status codes
- Error details leaked to client

### Solution: Centralized Error Handling

**Step 1: Define Error Types**
```typescript
// backend/src/types/errors.ts
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

export interface ApiError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: any;
}

export class ApiErrorImpl extends Error implements ApiError {
  code: ErrorCode;
  statusCode: number;
  details?: any;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    details?: any
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiErrorImpl.prototype);
  }
}

// Factory functions for common errors
export const notFound = (resource: string) => 
  new ApiErrorImpl(`${resource} not found`, ErrorCode.NOT_FOUND, 404);

export const unauthorized = () => 
  new ApiErrorImpl('Unauthorized', ErrorCode.UNAUTHORIZED, 401);

export const forbidden = () => 
  new ApiErrorImpl('Forbidden', ErrorCode.FORBIDDEN, 403);

export const validationError = (message: string, details?: any) => 
  new ApiErrorImpl(message, ErrorCode.VALIDATION_ERROR, 400, details);

export const conflict = (message: string) => 
  new ApiErrorImpl(message, ErrorCode.CONFLICT, 409);

export const internalError = (message?: string) => 
  new ApiErrorImpl(
    message || 'Internal server error',
    ErrorCode.INTERNAL_ERROR,
    500
  );
```

**Step 2: Create Error Middleware**
```typescript
// backend/src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiErrorImpl, ErrorCode } from '../types/errors';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[Error]', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle known API errors
  if (err instanceof ApiErrorImpl) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(process.env.NODE_ENV === 'development' && err.details && { details: err.details })
    });
  }

  // Handle validation errors from joi/yup
  if (err.isJoi || err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      code: ErrorCode.VALIDATION_ERROR,
      details: process.env.NODE_ENV === 'development' ? err.details : undefined
    });
  }

  // Handle database errors
  if (err.code && err.code.startsWith('23')) {
    // PostgreSQL constraint violations
    return res.status(409).json({
      error: 'Data conflict',
      code: ErrorCode.CONFLICT
    });
  }

  // Generic error response
  res.status(500).json({
    error: 'Internal server error',
    code: ErrorCode.INTERNAL_ERROR,
    ...(process.env.NODE_ENV === 'development' && { message: err.message })
  });
};
```

**Step 3: Register Middleware in App**
```typescript
// backend/src/index.ts
// ... other imports
import { errorHandler } from './middleware/error.middleware';

const app = express();

// ... other middleware
app.use('/api/auth', authRoutes);
// ... other routes

// Error handler must be last
app.use(errorHandler);

export default app;
```

---

## State Management Setup

### Recommended: Zustand (Lightweight Alternative)

**Step 1: Install Zustand**
```bash
npm install zustand
```

**Step 2: Create Global Store**
```typescript
// src/store/authStore.ts
import create from 'zustand';
import { User } from '../types';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => set({ user: null, error: null })
}));
```

```typescript
// src/store/uiStore.ts
import create from 'zustand';
import { Page } from '../types';

interface UIStore {
  currentPage: Page;
  selectedIdeaId: string | null;
  selectedUserId: string | null;
  theme: 'light' | 'dark';
  
  setPage: (page: Page) => void;
  setSelectedIdeaId: (id: string | null) => void;
  setSelectedUserId: (id: string | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  currentPage: 'feed',
  selectedIdeaId: null,
  selectedUserId: null,
  theme: 'dark',
  
  setPage: (currentPage) => set({ currentPage }),
  setSelectedIdeaId: (selectedIdeaId) => set({ selectedIdeaId }),
  setSelectedUserId: (selectedUserId) => set({ selectedUserId }),
  setTheme: (theme) => set({ theme })
}));
```

**Step 3: Update App Component**
```typescript
// src/App.tsx
import React, { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import api from './services/backendApiService';

const App: React.FC = () => {
  const { user, setUser, setLoading } = useAuthStore();
  const { currentPage, setPage, theme, setTheme } = useUIStore();

  // Initial setup on mount
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      try {
        const response = await api.verifyToken();
        if (response.valid && response.user) {
          setUser(response.user as any);
        }
      } catch (error) {
        console.error('Failed to verify token:', error);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, [setUser, setLoading]);

  // Theme effect
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div>
      {currentPage === 'feed' && <Feed />}
      {/* ... other pages */}
    </div>
  );
};
```

---

## Testing Structure

### Backend Testing Example

**Step 1: Install Testing Dependencies**
```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

**Step 2: Jest Configuration**
```json
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ]
};
```

**Step 3: Auth Service Tests**
```typescript
// src/services/__tests__/auth.service.test.ts
import { AuthService } from '../auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService('test-secret');
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await authService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPassword123!',
        displayName: 'Test User'
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('should reject weak passwords', async () => {
      const result = await authService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'weak',
        displayName: 'Test User'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Password');
    });

    it('should reject duplicate emails', async () => {
      await authService.register({
        email: 'test@example.com',
        username: 'testuser1',
        password: 'TestPassword123!',
        displayName: 'Test User'
      });

      const result = await authService.register({
        email: 'test@example.com',
        username: 'testuser2',
        password: 'TestPassword123!',
        displayName: 'Another User'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPassword123!',
        displayName: 'Test User'
      });
    });

    it('should login successfully with correct credentials', async () => {
      const result = await authService.login('test@example.com', 'TestPassword123!');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('should reject incorrect password', async () => {
      const result = await authService.login('test@example.com', 'WrongPassword!');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid credentials');
    });
  });
});
```

---

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
- [x] Move credentials to environment variables
- [x] Enable SSL for database
- [x] Fix HTTP status codes
- [x] Implement error types
- [x] Create error middleware

### Phase 2: Services (Weeks 3-4)
- [ ] Extract BaseRepository
- [ ] Create UserRepository
- [ ] Create IdeaRepository
- [ ] Create ChatRepository
- [ ] Create AuthService
- [ ] Create UserService
- [ ] Refactor route handlers

### Phase 3: Frontend Improvements (Weeks 5-6)
- [ ] Implement Zustand stores
- [ ] Fix memory leaks
- [ ] Add AbortController
- [ ] Refactor components

### Phase 4: Testing (Weeks 7-8)
- [ ] Set up Jest
- [ ] Write service tests
- [ ] Write route tests
- [ ] Write component tests
- [ ] Set up CI/CD

### Phase 5: Polish (Weeks 9-10)
- [ ] Add API documentation
- [ ] Add logging
- [ ] Performance optimization
- [ ] Security audit

---

**Document Version:** 1.0
**Last Updated:** March 31, 2026
