# Synapse App - Critical Fixes and Implementation Guide

## Overview
This document provides detailed implementation guidance and code examples for fixing the most critical issues found in the codebase analysis.

---

## ISSUE #1: Hardcoded Database Credentials

### Problem
Database connection string with password is hardcoded in source code:
```typescript
const SUPABASE_DB_URL = 'postgresql://postgres:Mahadev@shiva6563@db.fsgcdhshhsbmodspyggn.supabase.co:5432/postgres?sslmode=disable';
```

### Impact
- Credentials visible in git history
- Exposed in any code reviews or deployments
- CRITICAL security breach

### Solution

**Step 1:** Create `.env.example`
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=3001
CORS_ORIGIN=http://localhost:5173

# AI
GOOGLE_GENAI_API_KEY=your-key-here
```

**Step 2:** Update `.gitignore`
```bash
.env
.env.local
.env.*.local
```

**Step 3:** Update `backend/src/db/database.ts`
```typescript
import pg from 'pg';
import dotenv from 'dotenv';
import { parse } from 'pg-connection-string';

const { Pool } = pg;

dotenv.config();

// Read from env var - fail fast if missing
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('FATAL ERROR: DATABASE_URL environment variable is not set');
    console.error('Please set DATABASE_URL in .env file');
    process.exit(1);
}

console.log('🔧 Database Configuration:');
const safeUrl = dbUrl.replace(/:[^:]*@/, ':****@');
console.log('Database URL:', safeUrl);

let poolConfig: any = {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

try {
    const dbConfig = parse(dbUrl);
    
    poolConfig = {
        ...poolConfig,
        user: dbConfig.user,
        password: dbConfig.password,
        host: dbConfig.host,
        port: dbConfig.port ? parseInt(dbConfig.port, 10) : 5432,
        database: dbConfig.database,
        // Force SSL for production
        ssl: process.env.NODE_ENV === 'production' 
            ? { rejectUnauthorized: true }
            : false,
    };
    
    console.log(`🔗 Final Database Config - Host: ${poolConfig.host}, Port: ${poolConfig.port}`);
    
} catch (parseError) {
    console.error('❌ Failed to parse DATABASE_URL:', parseError);
    process.exit(1);
}

export const pool = new Pool(poolConfig);

export const testConnection = async (): Promise<boolean> => {
  // ... rest of code
};
```

---

## ISSUE #2: Weak Password Policy

### Problem
Minimum password length only 6 characters
```typescript
if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
}
```

### Impact
- Users can set very weak passwords
- Easily cracked through brute force

### Solution

**Step 1:** Create password validator utility `backend/src/utils/passwordValidator.ts`
```typescript
export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
}

export const validatePassword = (password: string): PasswordValidationResult => {
    const errors: string[] = [];
    
    // Minimum length
    if (password.length < 12) {
        errors.push('Password must be at least 12 characters long');
    }
    
    // Maximum length
    if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
    }
    
    // Must contain uppercase
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    // Must contain lowercase
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    // Must contain number
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    // Must contain special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    
    // Cannot contain username or email (if provided)
    if (password.toLowerCase().includes('password')) {
        errors.push('Password cannot contain the word "password"');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// Common weak passwords to block
const COMMON_PASSWORDS = [
    'password', '123456', 'qwerty', 'password123', 'admin', 'letmein',
    '123456789', '12345678', '12345', '1234567', 'login', 'welcome'
];

export const isCommonPassword = (password: string): boolean => {
    return COMMON_PASSWORDS.includes(password.toLowerCase());
};
```

**Step 2:** Update `backend/src/routes/auth.routes.ts`
```typescript
import { validatePassword, isCommonPassword } from '../utils/passwordValidator.js';

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, username, password, displayName, userType } = req.body;

        if (!email || !username || !password || !displayName) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate password strength
        const validation = validatePassword(password);
        if (!validation.isValid) {
            return res.status(400).json({ 
                error: 'Password does not meet requirements',
                details: validation.errors
            });
        }

        // Check against common passwords
        if (isCommonPassword(password)) {
            return res.status(400).json({ 
                error: 'This password is too common. Please choose a stronger password.'
            });
        }

        // ... rest of code
    } catch (error) {
        // ... error handling
    }
});
```

---

## ISSUE #3: Insecure Token Storage (XSS Risk)

### Problem
Auth token stored in localStorage, vulnerable to XSS
```typescript
localStorage.setItem('authToken', response.token);
```

### Impact
- XSS attack can steal token
- No HTTPOnly flag to prevent JavaScript access

### Solution

**Step 1:** Update backend to set httpOnly cookie in `backend/src/routes/auth.routes.ts`
```typescript
router.post('/login', async (req: Request, res: Response) => {
   try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await query(
          `SELECT id, email, username, display_name, user_type, password_hash, 
                  onboarding_completed, created_at, avatar_url, bio, skills, interests 
           FROM users WHERE email = $1`,
          [email]
        );

        if (result.rows.length === 0) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { userId: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: getExpiresInSeconds() }
        );

        // Set httpOnly, Secure cookie instead of returning token
        res.cookie('authToken', token, {
            httpOnly: true,      // Cannot be accessed by JavaScript
            secure: true,        // HTTPS only
            sameSite: 'strict',  // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
        });

        res.json({
          message: 'Login successful',
          user: {
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
          }
          // NOTE: No token in response - it's in httpOnly cookie
        });

    } catch (error) {
        // ... error handling
    }
});
```

**Step 2:** Update backend middleware to read from cookie
```typescript
// backend/src/middleware/auth.middleware.ts
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Try to get token from cookie first (most secure), then header
  const token = req.cookies?.authToken || 
                (req.headers['authorization']?.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    // ... error handling
  }
};
```

**Step 3:** Update frontend API service
```typescript
// src/services/backendApiService.ts
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const base = API_BASE_URL.replace(/\/$/, '');
  const finalEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${finalEndpoint}`;

  const headers: HeadersInit = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    // NOTE: Remove manual Authorization header - cookie is sent automatically
    ...options.headers,
  };

  try {
    console.log(`API Call: ${options.method || 'GET'} ${url}`);
    
    // Include credentials so cookies are sent
    const response = await fetch(url, { 
      ...options, 
      headers,
      credentials: 'include'  // IMPORTANT: Send cookies with requests
    });

    if (response.status === 0) {
      throw new Error('Network error: Cannot connect to server.');
    }

    const contentType = response.headers.get('content-type');

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      console.log(`API Success (${response.status} No Content): ${url}`);
      return {} as T;
    }

    if (!response.ok) {
      let errorMessage = `API error (${response.status}): ${response.statusText || 'Request Failed'}`;

      if (response.status === 401 || response.status === 403) {
        // Token expired or invalid - clear local state only
        localStorage.removeItem('currentUser');
        window.location.reload();
      }

      throw new Error(errorMessage);
    }

    if (contentType?.includes('application/json')) {
      const data = await response.json();
      console.log(`API Success (${response.status}): ${url}`);
      return data;
    }

    return {} as T;

  } catch (error: any) {
    console.error(`API Network/Fetch Exception: ${options.method || 'GET'} ${finalEndpoint}`, error);
    throw error;
  }
}

const api = {
  // Remove setAuthToken method - no longer needed
  
  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    // Cookie is set automatically by server, just call the endpoint
    const response = await apiRequest<LoginResponse>('/api/auth/login', { 
      method: 'POST', 
      body: JSON.stringify(credentials) 
    });
    return response;
  },
  
  // ... rest of implementation
};
```

**Step 4:** Update frontend Login component
```typescript
// src/components/Login.tsx
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        if (mode === 'login') {
            const response = await api.login({ 
              email: formData.email, 
              password: formData.password 
            });
            
            if (response && response.user) {
                // Token is in httpOnly cookie, not in response
                const fullUser = await api.getUserById(response.user.userId);
                
                if (fullUser) {
                    setCurrentUser(fullUser);
                    setPage(fullUser.onboardingCompleted ? 'feed' : 'onboarding');
                } else {
                    throw new Error("Login succeeded, but user data could not be found.");
                }
            } else {
                setError('Login failed. Please check your credentials.');
            }
        } else {
            // ... signup code
        }
    } catch (err: any) {
        console.error(`${mode} error:`, err);
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
};
```

---

## ISSUE #4: Memory Leaks from useEffect

### Problem
Event listeners and intervals not cleaned up
```typescript
useEffect(() => {
    const [convData, messageData] = await Promise.all([
         api.getConversationById(conversationId),
         api.getMessagesByConversationId(conversationId)
    ]);
    // No cleanup function!
}, []);
```

### Impact
- Memory leaks with every page navigation
- Duplicate event handlers
- Stale closures

### Solution

**Step 1:** Fix Chat component `src/components/Chat.tsx`
```typescript
export const Chat: React.FC<ChatProps> = ({ conversationId, currentUser, setPage }) => {
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchChatData = useCallback(async () => {
        setError(null);
        try {
            const [convData, messageData] = await Promise.all([
                 api.getConversationById(conversationId),
                 api.getMessagesByConversationId(conversationId)
            ]);

            setConversation(convData);
            setMessages(messageData || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load chat');
        } finally {
            setIsLoading(false);
        }
    }, [conversationId]);

    // Fetch data on mount and when conversationId changes
    useEffect(() => {
        setIsLoading(true);
        fetchChatData();
    }, [conversationId, fetchChatData]);

    // Set up socket listeners with proper cleanup
    useEffect(() => {
        if (!currentUser?.userId) return;

        // Create socket connection
        const socket = io(API_BASE_URL, {
            auth: {
                token: localStorage.getItem('authToken')
            }
        });

        // Define event handlers
        const handleNewMessage = (data: Message) => {
            setMessages(prev => [...prev, data]);
        };

        const handleUserTyping = (data: { userId: string }) => {
            // Update typing indicator state
        };

        // Add event listeners
        socket.on('new_message', handleNewMessage);
        socket.on('user_typing', handleUserTyping);

        // Cleanup function - called when component unmounts or dependencies change
        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('user_typing', handleUserTyping);
            socket.disconnect();
        };
    }, [currentUser?.userId, conversationId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        // JSX...
        <div ref={messagesEndRef} />
    );
};
```

**Step 2:** Fix IdeaDetail component polling
```typescript
// src/components/IdeaDetail.tsx
useEffect(() => {
    if (!selectedIdeaId || !isMonitoringBlockchain) return;

    let pollCount = 0;
    const MAX_POLL_ATTEMPTS = 60; // Stop after 60 attempts
    let isComponentMounted = true;

    const pollBlockchainStatus = async () => {
        try {
            pollCount++;
            if (pollCount > MAX_POLL_ATTEMPTS) {
                setIsMonitoringBlockchain(false);
                console.log('Stopped polling after max attempts');
                return;
            }

            const records = await api.getBlockchainRecords(selectedIdeaId);
            if (isComponentMounted) {
                setBlockchainRecords(records);
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    };

    const pollInterval = setInterval(pollBlockchainStatus, 5000);

    // Cleanup function
    return () => {
        isComponentMounted = false;
        clearInterval(pollInterval);
    };
}, [selectedIdeaId, isMonitoringBlockchain]);
```

---

## ISSUE #5: Race Conditions with Async Updates

### Problem
Multiple concurrent fetches can cause stale state
```typescript
useEffect(() => {
    const fetchData = async () => {
        const user = await api.getUserById(userId);
        setProfileUser(user);  // Can overwrite newer request's result
    };
    fetchData();
}, [userId]);
```

### Impact
- Displaying wrong user's data
- Confusing UI behavior
- Race condition bugs hard to debug

### Solution

**Step 1:** Use AbortController in Profile component
```typescript
// src/components/Profile.tsx
export const Profile: React.FC<ProfileProps> = ({ userId, currentUser, setPage }) => {
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Create abort controller for this request
        const abortController = new AbortController();

        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch all data concurrently
                const [user, ideas, collaborationIdeas, achievements] = await Promise.all([
                    api.getUserById(userId),
                    api.getIdeasByOwnerId(userId),
                    api.getIdeasByCollaboratorId(userId),
                    api.getUserAchievements(userId)
                ]);

                // Only update state if this request wasn't cancelled
                if (!abortController.signal.aborted) {
                    setProfileUser(user || null);
                    setUserIdeas(ideas || []);
                    setCollaborationIdeas(collaborationIdeas || []);
                    setUserAchievements(achievements || []);
                }
            } catch (err: any) {
                // Ignore abort errors
                if (err.name !== 'AbortError') {
                    setError(err.message || 'Failed to load profile');
                    console.error('Profile fetch error:', err);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        // Cleanup: abort request if userId changes or component unmounts
        return () => {
            abortController.abort();
        };
    }, [userId]);

    // ... rest of component
};
```

**Step 2:** Add AbortController support to API service
```typescript
// src/services/backendApiService.ts
async function apiRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    signal?: AbortSignal  // Accept abort signal
): Promise<T> {
  const base = API_BASE_URL.replace(/\/$/, '');
  const finalEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${finalEndpoint}`;

  const headers: HeadersInit = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { 
      ...options, 
      headers,
      credentials: 'include',
      signal  // Pass abort signal to fetch
    });

    // ... rest of error handling
  } catch (error: any) {
    // Ignore abort errors - they're expected
    if (error.name === 'AbortError') {
      console.debug('Request was cancelled');
      throw error;
    }
    
    console.error(`API Network/Fetch Exception: ${options.method || 'GET'} ${finalEndpoint}`, error);
    throw error;
  }
}
```

---

## ISSUE #6: HTTP Status Code Inconsistency

### Problem
Wrong status code used for internal server error
```typescript
res.status(501).json({ valid: false, error: 'Internal server error during token verification' });
// 501 = Not Implemented (wrong!)
```

### Impact
- Client interprets as "server doesn't support this"
- HTTP semantic violation
- Confuses monitoring/alerting

### Solution

**Update `backend/src/routes/auth.routes.ts`**
```typescript
router.get('/verify', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;

        const result = await query(
            'SELECT id, email, username, display_name, user_type, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ 
              valid: false, 
              error: 'Invalid token - user not found' 
            });
        }

        const user = result.rows[0];

        res.json({
            valid: true,
            user: {
                userId: user.id,
                email: user.email,
                username: user.username,
                displayName: user.display_name,
                userType: user.user_type,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        // Use 500 (Internal Server Error) instead of 501 (Not Implemented)
        res.status(500).json({ 
          valid: false, 
          error: 'Internal server error during token verification' 
        });
    }
});
```

---

## Quick Reference: HTTP Status Codes

```
2xx - Success
  200 OK                    - Request succeeded
  201 Created              - Resource created
  204 No Content           - Success, no response body

3xx - Redirection
  301 Moved Permanently    - Resource moved
  304 Not Modified         - Use cache

4xx - Client Error
  400 Bad Request          - Malformed request
  401 Unauthorized         - Not authenticated
  403 Forbidden            - Authenticated but not authorized
  404 Not Found            - Resource doesn't exist
  409 Conflict             - Request conflicts with existing state
  422 Unprocessable Entity - Validation failed

5xx - Server Error
  500 Internal Server Error    - Generic server error
  501 Not Implemented          - Feature not implemented
  502 Bad Gateway              - Upstream error
  503 Service Unavailable      - Server temporarily down
```

---

## Next Steps

1. **Immediate (Today)**
   - [ ] Apply Issue #1: Move credentials to env vars
   - [ ] Apply Issue #6: Fix HTTP status code
   - [ ] Apply Issue #2: Strengthen passwords

2. **This Week**
   - [ ] Apply Issue #3: Move token to httpOnly cookie
   - [ ] Apply Issue #4: Fix memory leaks
   - [ ] Apply Issue #5: Add AbortController

3. **This Month**
   - [ ] Add input validation middleware
   - [ ] Implement proper error handling middleware
   - [ ] Add rate limiting
   - [ ] Set up error tracking
   - [ ] Add test suite

---

**Last Updated:** March 31, 2026
