# API Reference - New Endpoints & Services

## Quick Reference

### 2FA Endpoints
```
POST   /api/auth/2fa/setup              - Setup 2FA
POST   /api/auth/2fa/verify             - Enable 2FA with code
POST   /api/auth/2fa/send-otp           - Send OTP to email
POST   /api/auth/2fa/verify-otp         - Verify OTP at login
POST   /api/auth/2fa/disable            - Disable 2FA
```

### Gamification Endpoints
```
GET    /api/gamification/badges/:userId - Get user badges
GET    /api/gamification/leaderboards/creators      - Top creators
GET    /api/gamification/leaderboards/collaborators - Top collaborators
GET    /api/gamification/leaderboards/reputation    - Top by reputation
GET    /api/gamification/stats/:userId  - User statistics
```

### Audit & RBAC Endpoints (Admin)
```
GET    /api/admin/audit-logs            - Get all audit logs
GET    /api/admin/audit-logs/user/:id   - Get user's action history
POST   /api/admin/users/:id/role        - Assign user role
```

---

## Detailed API Documentation

### TWO-FACTOR AUTHENTICATION (2FA)

#### 1. Setup 2FA
```
POST /api/auth/2fa/setup

Authentication: JWT Token (Bearer)

Response (200):
{
  "success": true,
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "backupCodes": [
    "BACKUP-CODE-1",
    "BACKUP-CODE-2",
    ...
  ]
}

Errors:
- 401: Not authenticated
- 400: 2FA already enabled
```

**Usage**: Call when user wants to set up 2FA. Display QR code and backup codes.

#### 2. Enable 2FA
```
POST /api/auth/2fa/verify

Authentication: JWT Token (Bearer)

Body:
{
  "code": "123456",
  "backupCodes": ["BACKUP-CODE-1", "BACKUP-CODE-2", ...]
}

Response (200):
{
  "success": true,
  "message": "2FA enabled successfully"
}

Errors:
- 400: Invalid code
- 401: Not authenticated
- 409: 2FA already enabled
```

**Usage**: After user has scanned QR code and entered code from authenticator app.

#### 3. Send OTP Email
```
POST /api/auth/2fa/send-otp

Body:
{
  "email": "user@example.com"
}

Response (200):
{
  "success": true,
  "message": "OTP sent to email"
}

Errors:
- 400: User not found
- 429: Too many requests (rate limited)
```

**Usage**: During login, after password verification, send OTP to email.

#### 4. Verify OTP
```
POST /api/auth/2fa/verify-otp

Body:
{
  "email": "user@example.com",
  "otp": "123456"
}

Response (200):
{
  "success": true,
  "userId": "user-123",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}

Errors:
- 400: Invalid OTP or email
- 410: OTP expired
- 429: Too many attempts
```

**Usage**: Verify OTP that user received in email to complete login.

#### 5. Disable 2FA
```
POST /api/auth/2fa/disable

Authentication: JWT Token (Bearer)

Body:
{
  "password": "user-password"
}

Response (200):
{
  "success": true,
  "message": "2FA disabled"
}

Errors:
- 401: Not authenticated
- 403: Incorrect password
- 400: 2FA not enabled
```

**Usage**: Allow user to turn off 2FA after verification.

---

### GAMIFICATION

#### 1. Get User Badges
```
GET /api/gamification/badges/:userId

Response (200):
[
  {
    "badge_id": "idea-starter",
    "badge_name": "Idea Starter",
    "badge_icon": "💡",
    "description": "Create your first idea",
    "unlocked_at": "2024-03-15T10:30:00Z"
  },
  {
    "badge_id": "collaboration-champion",
    "badge_name": "Collaboration Champion",
    "badge_icon": "🤝",
    "description": "Join 5 collaborative projects",
    "unlocked_at": "2024-03-20T14:22:00Z"
  }
]

Errors:
- 404: User not found
```

**Usage**: Display badges on user profile.

#### 2. Get Top Creators
```
GET /api/gamification/leaderboards/creators?limit=10

Query Parameters:
- limit: Number of results (default: 10, max: 100)
- offset: Pagination offset (default: 0)

Response (200):
[
  {
    "user_id": "user-1",
    "user_name": "John Doe",
    "ideas_created": 15,
    "total_likes": 124,
    "badges_count": 5,
    "rank": 1
  },
  {
    "user_id": "user-2",
    "user_name": "Jane Smith",
    "ideas_created": 12,
    "total_likes": 98,
    "badges_count": 4,
    "rank": 2
  }
]
```

**Usage**: Display leaderboard page sorted by ideas created.

#### 3. Get Top Collaborators
```
GET /api/gamification/leaderboards/collaborators?limit=10

Response (200):
[
  {
    "user_id": "user-5",
    "user_name": "Alice Johnson",
    "collaborations": 23,
    "projects_completed": 8,
    "badges_count": 7,
    "rank": 1
  }
]
```

**Usage**: Show collaboration-focused leaderboard.

#### 4. Get Top by Reputation
```
GET /api/gamification/leaderboards/reputation?limit=10

Response (200):
[
  {
    "user_id": "user-3",
    "user_name": "Bob Wilson",
    "reputation_score": 1250,
    "ideas_created": 18,
    "collaborations": 12,
    "badges_count": 6,
    "rank": 1
  }
]
```

**Usage**: Overall reputation/excellence leaderboard.

#### 5. Get User Statistics
```
GET /api/gamification/stats/:userId

Response (200):
{
  "user_id": "user-123",
  "user_name": "John Doe",
  "ideas_created": 5,
  "collaborations_completed": 3,
  "collaborations_pending": 1,
  "connections_made": 12,
  "feedback_given": 24,
  "feedback_received": 18,
  "positive_feedback_percentage": 85,
  "badges_earned": 3,
  "total_likes": 145,
  "reputation_score": 520,
  "member_since": "2023-01-15T00:00:00Z",
  "last_active": "2024-03-25T14:30:00Z"
}

Errors:
- 404: User not found
```

**Usage**: Display comprehensive stats on user dashboard.

---

### AUDIT LOGGING & RBAC (Admin Endpoints)

#### 1. Get Audit Logs
```
GET /api/admin/audit-logs?action=DELETE_IDEA&limit=50

Authentication: JWT Token with admin role

Query Parameters:
- action: Filter by action type (optional)
- resource_type: Filter by resource type (optional)
- resource_id: Filter by resource (optional)
- start_date: ISO date string (optional)
- end_date: ISO date string (optional)
- limit: Results per page (default: 50, max: 500)
- offset: Pagination offset (default: 0)

Response (200):
[
  {
    "id": "log-1",
    "user_id": "user-123",
    "action": "DELETE_IDEA",
    "resource_type": "IDEA",
    "resource_id": "idea-456",
    "details": {
      "ideaTitle": "My Great Idea",
      "reason": "Duplicate"
    },
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "created_at": "2024-03-25T10:30:00Z"
  }
]

Errors:
- 401: Not authenticated
- 403: Insufficient permissions
```

**Usage**: Monitor all sensitive actions in the system.

#### 2. Get User Action History
```
GET /api/admin/audit-logs/user/:userId?limit=50

Authentication: JWT Token with admin role

Response (200):
[
  {
    "id": "log-2",
    "action": "CREATE_IDEA",
    "resource_type": "IDEA",
    "resource_id": "idea-789",
    "created_at": "2024-03-24T09:15:00Z"
  },
  {
    "id": "log-3",
    "action": "UPDATE_IDEA",
    "resource_type": "IDEA",
    "resource_id": "idea-789",
    "created_at": "2024-03-24T10:22:00Z"
  }
]

Errors:
- 401: Not authenticated
- 403: Insufficient permissions
- 404: User not found
```

**Usage**: Review specific user's actions for compliance/investigation.

#### 3. Assign User Role
```
POST /api/admin/users/:userId/role

Authentication: JWT Token with admin role

Body:
{
  "role": "creator"
}

Valid Roles:
- "admin"      (Hierarchy: 4, Full system access)
- "moderator"  (Hierarchy: 3, Moderate content)
- "creator"    (Hierarchy: 2, Create ideas)
- "contributor"(Hierarchy: 1, Comment/collaborate)
- "user"       (Hierarchy: 0, Basic access)

Response (200):
{
  "success": true,
  "user_id": "user-123",
  "role": "creator",
  "message": "User role updated"
}

Errors:
- 401: Not authenticated
- 403: Insufficient permissions
- 404: User not found
- 400: Invalid role
```

**Usage**: Promote/demote users or assign roles for new accounts.

---

### EMAIL NOTIFICATIONS (Backend Only)

These are called from your backend code, not as HTTP endpoints:

```typescript
import { 
  sendEmail,
  sendWelcomeEmail,
  sendCollaborationInvite,
  sendAchievementEmail,
  sendNotificationDigest,
  sendPasswordResetEmail
} from '../services/emailService';

// Send welcome email
await sendWelcomeEmail('user@example.com', 'John Doe');

// Send collaboration invite
await sendCollaborationInvite(
  'collaborator@example.com',
  'Jane Smith',
  'John Doe',
  'Healthcare Platform',
  'idea-123'
);

// Send achievement
await sendAchievementEmail(
  'user@example.com',
  'John Doe',
  'Prolific Creator',
  '🚀'
);

// Send digest
await sendNotificationDigest(
  'user@example.com',
  'John Doe',
  [
    { title: 'Idea Liked', message: 'Someone liked your idea' },
    { title: 'New Collaboration', message: 'You were added to a project' }
  ]
);

// Send password reset
await sendPasswordResetEmail(
  'user@example.com',
  'https://yourapp.com/reset?token=xxx'
);

// Send custom email
await sendEmail(
  'recipient@example.com',
  'Subject',
  '<html>Body</html>'
);
```

---

### RICH TEXT EDITOR (Frontend Component)

```tsx
import RichTextEditor from './components/RichTextEditor';

<RichTextEditor
  value={content}                    // Current content (markdown)
  onChange={(text) => setContent(text)}  // On change callback
  placeholder="Write here..."        // Placeholder text
  minHeight="200px"                  // Min height
  maxHeight="600px"                  // Max height
  readOnly={false}                   // Read-only mode
/>
```

**Supported Markdown Syntax**:
- `**text**` → Bold
- `*text*` → Italic
- `` `code` `` → Inline code
- `` ```language `` → Code block
- `# Heading 1` → H1
- `## Heading 2` → H2
- `- Item` → Bullet list
- `[text](url)` → Links

---

## Rate Limiting

### 2FA Endpoints
- `/2fa/send-otp`: 3 requests per minute per email
- `/2fa/verify-otp`: 5 attempts per 15 minutes (max 5 wrong attempts)

### Email Service
- Max 10 emails per user per hour
- Batch digest emails (1 per day per user)

---

## Authentication

All endpoints requiring authentication use JWT Bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Extract from response of 2FA verify or regular login endpoint.

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Common Error Codes**:
- `INVALID_REQUEST`: Malformed request
- `UNAUTHORIZED`: Missing/invalid token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

---

## Webhook Integration (Optional)

When badges are awarded:
```
POST your-webhook-url
Body: {
  "event": "badge_awarded",
  "user_id": "user-123",
  "badge_id": "prolific-creator",
  "timestamp": "2024-03-25T10:30:00Z"
}
```

Implement webhook listener to:
- Send celebration notification
- Update UI in real-time
- Trigger special events

---

## Testing with cURL

```bash
# Setup 2FA
curl -X POST http://localhost:3000/api/auth/2fa/setup \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send OTP
curl -X POST http://localhost:3000/api/auth/2fa/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Get leaderboard
curl http://localhost:3000/api/gamification/leaderboards/creators?limit=10

# Get user badges
curl http://localhost:3000/api/gamification/badges/user-123

# Get audit logs (admin)
curl http://localhost:3000/api/admin/audit-logs \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## TypeScript Types

```typescript
// 2FA
interface TwoFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface OTPResponse {
  success: boolean;
  userId: string;
  token: string;
}

// Gamification
interface Badge {
  badge_id: string;
  badge_name: string;
  badge_icon: string;
  description: string;
  unlocked_at: Date;
}

interface UserStats {
  user_id: string;
  user_name: string;
  ideas_created: number;
  collaborations_completed: number;
  badges_earned: number;
  reputation_score: number;
}

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  [key: string]: any;
  rank: number;
}

// Audit
interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: Date;
}
```

---

## Version & Changelog

**v1.0.0** (March 31, 2026)
- Initial release
- 2FA with TOTP & OTP
- Email notifications (6 templates)
- RBAC with 5 roles
- Audit logging
- Gamification (8 badges, 3 leaderboards)
- Rich text editor

---

**Last Updated**: March 31, 2026
