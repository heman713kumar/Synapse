# Synapse New Features Implementation Guide

## Overview

This guide documents all new features added to Synapse, including:
1. **Two-Factor Authentication (2FA)**
2. **Email Notifications**
3. **Role-Based Access Control (RBAC)**
4. **Audit Logging**
5. **Gamification (Badges & Leaderboards)**
6. **Rich Text Editor**
7. **Testing Suite (Jest)**
8. **CI/CD Pipeline (GitHub Actions)**

---

## 1. Two-Factor Authentication (2FA)

### Features
- TOTP-based 2FA (authenticator apps)
- Email-based OTP for login
- Backup codes for account recovery
- QR code for authenticator app setup

### Backend Setup

#### Install Dependencies
```bash
cd backend
npm install speakeasy qrcode
```

#### Database Migration
```bash
psql your_database < migrations/001_add_2fa_rbac_audit.sql
```

#### API Endpoints

**Setup 2FA**
```
POST /api/2fa/setup
Authentication: Required
Response: {
  success: true,
  secret: "BASE32_SECRET",
  qrCode: "data:image/png;base64,...",
  backupCodes: ["CODE1", "CODE2", ...]
}
```

**Enable 2FA**
```
POST /api/2fa/verify
Body: {
  code: "123456",        // From authenticator app
  backupCodes: ["CODE1", ...]
}
Response: { success: true, message: "2FA enabled" }
```

**Send OTP to Email**
```
POST /api/2fa/send-otp
Body: { email: "user@example.com" }
Response: { success: true, message: "OTP sent to email" }
```

**Verify OTP at Login**
```
POST /api/2fa/verify-otp
Body: {
  email: "user@example.com",
  otp: "123456"
}
Response: { success: true, userId: "user_id" }
```

**Disable 2FA**
```
POST /api/2fa/disable
Authentication: Required
Body: { password: "user_password" }
Response: { success: true, message: "2FA disabled" }
```

### Frontend Usage (Example)

```tsx
import TwoFactorSetup from './components/TwoFactorSetup';

// In settings page:
<TwoFactorSetup 
  userEmail={currentUser.email}
  onEnable={() => alert('2FA Enabled!')}
/>
```

---

## 2. Email Notifications

### Features
- Welcome emails
- 2FA codes
- Collaboration invitations
- Achievement notifications
- Notification digests
- Password reset emails

### Setup

#### Configure SMTP
Update `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@synapse.app
```

#### Send Emails (Backend)

```typescript
import { 
  sendEmail, 
  sendWelcomeEmail,
  sendCollaborationInvite,
  sendAchievementEmail 
} from '../services/emailService';

// Send welcome email
await sendWelcomeEmail('user@example.com', 'John Doe');

// Send collaboration invite
await sendCollaborationInvite(
  'collaborator@example.com',
  'Jane Smith',
  'John Doe',
  'AI-Powered Healthcare Platform',
  'idea-123'
);

// Send achievement
await sendAchievementEmail(
  'user@example.com',
  'John Doe',
  'Prolific Creator',
  '🚀'
);
```

---

## 3. Role-Based Access Control (RBAC)

### User Roles Hierarchy
```
admin (4)        → Full access, manage all users
moderator (3)    → Manage content, moderate discussions
creator (2)      → Create ideas, manage own projects
contributor (1)  → Comment, collaborate, contribute
user (0)         → Basic access, view ideas
```

### Backend Usage

```typescript
import { 
  requireRole, 
  requireMinRole, 
  assignRole 
} from '../middleware/rbac';

// Require specific role
router.delete('/ideas/:id', 
  authenticateToken, 
  requireRole('admin', 'creator'),
  deleteIdeaHandler
);

// Require minimum role (allows higher roles too)
router.post('/analytics', 
  authenticateToken,
  requireMinRole('creator'),
  getAnalyticsHandler
);

// Assign role to user (admin only)
async function promoteUser(userId: string) {
  await assignRole(userId, 'creator');
}
```

---

## 4. Audit Logging

### Features
- Logs all sensitive actions
- Tracks who did what and when
- IP address and user agent logging
- Query audit history per resource

### Backend Usage

```typescript
import { logAuditEvent, getAuditLogs } from '../middleware/rbac';

// Log an action
await logAuditEvent({
  userId: 'user-123',
  action: 'DELETE_IDEA',
  resourceType: 'IDEA',
  resourceId: 'idea-456',
  details: { ideaTitle: 'My Great Idea' },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});

// Get audit history
const logs = await getAuditLogs('IDEA', 'idea-123');
console.log(logs);

// Get user's action history
const userActions = await getUserActionHistory('user-123', 50);
```

---

## 5. Gamification: Badges & Leaderboards

### Available Badges

| Badge | Icon | Requirement |
|-------|------|-------------|
| Idea Starter | 💡 | Create 1 idea |
| Prolific Creator | 🚀 | Create 10 ideas |
| Collaboration Champion | 🤝 | Join 5 projects |
| Helpful Mentor | 👨‍🏫 | Get 20+ positive feedback |
| Innovation Leader | 🏆 | Have 3 ideas with 50+ collaborations |
| Connector | 🌐 | Make 15 connections |
| Trusted Contributor | ✨ | 100% collaboration success rate |

### Backend API

```typescript
import { 
  awardBadge, 
  checkAndAwardBadges,
  getUserBadges 
} from '../services/gamificationService';

// Manually award badge
await awardBadge('user-123', 'prolific-creator', 'user@example.com', 'John Doe');

// Auto-check and award badges (call after user activity)
const newBadges = await checkAndAwardBadges('user-123');

// Get user's badges
const badges = await getUserBadges('user-123');
```

### Leaderboards API

```typescript
import {
  getTopCreators,
  getTopCollaborators,
  getTopByReputation,
  getUserStats
} from '../services/gamificationService';

// Get top creators
const topCreators = await getTopCreators(10);
// Returns: { userId, name, ideasCreated, totalLikes, ... }

// Get top collaborators
const topCollaborators = await getTopCollaborators(10);
// Returns: { userId, name, collaborations, badges, ... }

// Get reputation leaderboard
const leaderboard = await getTopByReputation(10);
// Returns: { userId, name, reputationScore, ... }

// Get user's stats
const stats = await getUserStats('user-123');
// Returns: { ideas_created, collaborations_completed, badges_earned, ... }
```

---

## 6. Rich Text Editor

### Frontend Usage

```tsx
import RichTextEditor from './components/RichTextEditor';

function IdeaForm() {
  const [content, setContent] = useState('');

  return (
    <>
      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder="Describe your innovative idea..."
        minHeight="200px"
        maxHeight="600px"
      />
      <p>Preview: <MarkdownPreview content={content} /></p>
    </>
  );
}
```

### Features
- Bold, Italic, Code formatting
- Headings (H1, H2, H3)
- Lists and nested lists
- Code blocks with syntax highlighting
- Links and images
- Live markdown preview
- Toolbar with formatting buttons

---

## 7. Testing Suite (Jest)

### Setup

#### Install Dependencies
```bash
cd backend
npm install --save-dev jest ts-jest @types/jest supertest
```

#### Run Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
```

### Example Test File

See `backend/src/__tests__/validation.test.ts` for examples testing:
- Email validation
- Username validation
- Password validation
- Pagination validation

### Writing Tests

```typescript
describe('Feature Name', () => {
  test('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expectedValue);
  });

  test('should handle edge cases', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

---

## 8. CI/CD Pipeline (GitHub Actions)

### Configuration

See `.github/workflows/ci-cd.yml` for complete setup.

### What It Does

1. **On Every Push/PR**
   - Runs all tests
   - Checks code quality (ESLint, TypeScript)
   - Uploads coverage to Codecov
   - Checks for security vulnerabilities

2. **On Merge to Main**
   - Deploys to staging automatically
   - Creates GitHub release
   - Notifies on success/failure

### Enabling Deployments

Add secrets to GitHub repository settings:
```
DEPLOY_KEY=your-ssh-key
STAGING_SERVER=your-server.com
```

---

## Implementation Checklist

### Backend

- [ ] Install dependencies: `npm install speakeasy qrcode nodemailer`
- [ ] Run database migration
- [ ] Configure SMTP in `.env`
- [ ] Add 2FA routes to main router
- [ ] Add RBAC middleware to protected routes
- [ ] Add audit logging to sensitive actions
- [ ] Add gamification checks after user activities
- [ ] Configure Jest and add test files
- [ ] Set up GitHub Actions workflow

### Frontend

- [ ] Add RichTextEditor component to idea/comment forms
- [ ] Create 2FA setup/settings page
- [ ] Add badges display to user profile
- [ ] Create leaderboards page
- [ ] Add notification preferences page
- [ ] Update types.ts for new models

### Database

- [ ] Run migration: `001_add_2fa_rbac_audit.sql`
- [ ] Create database indexes for performance
- [ ] Backup database before migration

---

## Security Considerations

1. **2FA**
   - Store OTP secrets securely (already encrypted in DB)
   - Use HTTPS for all 2FA endpoints
   - Set short OTP expiry (5 minutes)
   - Invalidate OTP after one use

2. **Audit Logging**
   - Never modify logs (append-only)
   - Archive old logs regularly
   - Restrict access to logs (admin only)

3. **RBAC**
   - Validate role at every endpoint
   - Use `requireMinRole` for role hierarchy
   - Regularly audit role assignments

4. **Email**
   - Use SMTP credentials from environment only
   - Rate limit email sending
   - Validate email before sending
   - Handle bounces gracefully

---

## Performance Optimization

1. **Caching Recommendations**
   - Cache leaderboards (update hourly)
   - Cache user badges (update on award)
   - Cache audit logs (pagination)

2. **Database Optimization**
   - Use provided indexes (see migration file)
   - Regular VACUUM and ANALYZE
   - Archive old audit logs to separate table

3. **Email Optimization**
   - Queue emails asynchronously
   - Batch digest emails
   - Use email templates caching

---

## Monitoring & Maintenance

### Metrics to Track
- 2FA adoption rate
- Email delivery success rate
- Audit log growth
- Badge unlock trends
- Leaderboard activity

### Regular Tasks
- [ ] Review audit logs for suspicious activity
- [ ] Monitor email delivery failures
- [ ] Update badge requirements based on usage
- [ ] Clean up old email logs
- [ ] Review and update RBAC roles

---

## Troubleshooting

### Emails Not Sending
1. Check SMTP credentials in `.env`
2. Verify Gmail App Password is generated correctly
3. Check email logs table for errors
4. Ensure rate limiting isn't blocking sends

### 2FA Issues
1. Verify clock sync between server and client
2. Check OTP expiry time
3. Ensure database migration was run
4. Verify JWT_SECRET is set

### Tests Failing
1. Ensure PostgreSQL test database is running
2. Check all migrations are applied
3. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

---

## Next Steps

1. ✅ Implement all features (done!)
2. Run database migrations
3. Configure SMTP for email
4. Create tests for your specific use cases
5. Deploy to staging via GitHub Actions
6. Monitor metrics and adjust badge requirements

---

## Support & Questions

For issues or questions:
- Check existing test files for usage examples
- Review migration SQL for schema
- Check CI/CD logs for deployment issues
- Refer to specific service files for implementation details

---

**Last Updated**: March 31, 2026
**Version**: 1.0.0
