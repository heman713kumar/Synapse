# Integration Checklist - New Features

## Phase 1: Database & Dependencies (Do This First!)

### Database Migration
- [ ] Backup your current database
- [ ] Run migration:
  ```bash
  psql your_database < backend/migrations/001_add_2fa_rbac_audit.sql
  ```
- [ ] Verify tables created:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('audit_logs', 'user_badges', 'email_logs', 'notification_settings', 'notification_queue');
  ```
- [ ] Verify columns added to users table:
  ```sql
  SELECT * FROM users LIMIT 1;
  ```

### Install NPM Dependencies
```bash
cd backend
npm install speakeasy qrcode nodemailer
npm install --save-dev jest ts-jest @types/jest @types/speakeasy supertest
```

### Verify Installation
```bash
npm test  # Should run Jest
```

---

## Phase 2: Environment Configuration

### Configure SMTP (Email Service)

**Option 1: Gmail (Easiest)**
1. Go to myaccount.google.com/apppasswords
2. Select "Mail" and "Windows/Linux"
3. Generate app password (16 characters)
4. Update `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=Synapse <your-email@gmail.com>
```

**Option 2: Other Providers**
- SendGrid: SMTP_HOST=smtp.sendgrid.net, SMTP_PORT=587, SMTP_USER=apikey
- AWS SES: Use AWS SMTP credentials
- See `.env.new-features` for more examples

### Test Email Configuration
```bash
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
transporter.verify((err, valid) => {
  console.log(valid ? 'SMTP configured correctly' : 'SMTP error: ' + err);
});
"
```

---

## Phase 3: Backend Integration

### Register 2FA Routes

In `backend/src/index.ts` or your main router file:

```typescript
import twoFARoutes from './routes/twofa.routes';

// Add after other auth routes
app.use('/api/auth', twoFARoutes);
```

### Add RBAC Middleware

For admin-only routes:
```typescript
import { requireMinRole } from './middleware/rbac';

// Add to routes that need admin
router.get('/admin/audit-logs', 
  authenticateToken, 
  requireMinRole('admin'),
  getAuditLogsHandler
);
```

### Add Audit Logging

On sensitive actions:
```typescript
import { logAuditEvent } from './middleware/rbac';

// After deleting an idea
await logAuditEvent({
  userId: req.user.id,
  action: 'DELETE_IDEA',
  resourceType: 'IDEA',
  resourceId: ideaId,
  details: { ideaTitle: idea.title },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});
```

### Add Gamification Checks

After user activities:
```typescript
import { checkAndAwardBadges } from './services/gamificationService';

// After user creates an idea
await checkAndAwardBadges(userId);

// After user completes collaboration
await checkAndAwardBadges(userId);
```

---

## Phase 4: Frontend Integration

### Import Rich Text Editor

In your idea creation component `src/components/NewIdeaForm.tsx`:

```tsx
import RichTextEditor from './RichTextEditor';

function NewIdeaForm() {
  const [description, setDescription] = useState('');

  return (
    <>
      <RichTextEditor
        value={description}
        onChange={setDescription}
        placeholder="Describe your innovative idea..."
      />
    </>
  );
}
```

### Create 2FA Settings Page

New file: `src/components/TwoFactorSettings.tsx`

```tsx
import { useState } from 'react';
import { api } from '../services/backendApiService';

export default function TwoFactorSettings() {
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);

  const handleSetup = async () => {
    const response = await api.post('/auth/2fa/setup');
    setQrCode(response.data.qrCode);
    setBackupCodes(response.data.backupCodes);
  };

  return (
    <div>
      <h2>Two-Factor Authentication</h2>
      {qrCode && (
        <>
          <img src={qrCode} alt="2FA QR Code" />
          <p>Scan with your authenticator app (Google Authenticator, Authy, etc.)</p>
        </>
      )}
      {backupCodes.length > 0 && (
        <>
          <p>Save these backup codes in a safe place:</p>
          <ul>
            {backupCodes.map(code => <li key={code}>{code}</li>)}
          </ul>
        </>
      )}
      {!qrCode && <button onClick={handleSetup}>Enable 2FA</button>}
    </div>
  );
}
```

### Create Leaderboard Page

New file: `src/components/Leaderboard.tsx`

```tsx
import { useEffect, useState } from 'react';
import { api } from '../services/backendApiService';

export default function Leaderboard() {
  const [topCreators, setTopCreators] = useState([]);
  const [topCollaborators, setTopCollaborators] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const created = await api.get('/gamification/leaderboards/creators');
      const collab = await api.get('/gamification/leaderboards/collaborators');
      setTopCreators(created.data);
      setTopCollaborators(collab.data);
    };
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h2>Top Creators</h2>
        <ul>
          {topCreators.map(user => (
            <li key={user.user_id}>{user.user_name} - {user.ideas_created} ideas</li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Top Collaborators</h2>
        <ul>
          {topCollaborators.map(user => (
            <li key={user.user_id}>{user.user_name} - {user.collaborations} collaborations</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

### Display User Badges

In `src/components/Profile.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { api } from '../services/backendApiService';

function ProfileBadges({ userId }) {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    const fetchBadges = async () => {
      const response = await api.get(`/gamification/badges/${userId}`);
      setBadges(response.data);
    };
    fetchBadges();
  }, [userId]);

  return (
    <div className="flex gap-2">
      {badges.map(badge => (
        <div key={badge.badge_id} title={badge.badge_name}>
          {badge.badge_icon}
        </div>
      ))}
    </div>
  );
}
```

---

## Phase 5: GitHub Actions Setup (Optional but Recommended)

### Add GitHub Workflow
File is already created: `.github/workflows/ci-cd.yml`

### Add Repository Secrets
Go to GitHub > Settings > Secrets and Variables > Actions

Add these secrets:
```
DEPLOY_KEY=<your-ssh-private-key>
STAGING_SERVER=<server.com>
```

### Test CI/CD
Push any commit to trigger the workflow:
```bash
git add .
git commit -m "Add new features"
git push
```

Check GitHub > Actions to see workflow running

---

## Phase 6: Testing

### Run Backend Tests
```bash
cd backend
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Add Your Own Tests

Create file: `backend/src/__tests__/myfeature.test.ts`

```typescript
describe('My Feature', () => {
  test('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

---

## Phase 7: Verification

### Verify 2FA Works
1. Call POST `/api/auth/2fa/setup`
2. Should receive QR code and backup codes
3. Send OTP with POST `/api/auth/2fa/send-otp`
4. Verify OTP with POST `/api/auth/2fa/verify-otp`

### Verify Email Service
1. Send test email through service
2. Check email inbox
3. Check `email_logs` table for delivery status

### Verify RBAC
1. Create user with 'creator' role
2. Try restricted endpoint - should work
3. Try admin endpoint - should fail
4. Check `audit_logs` table for recorded action

### Verify Badges
1. Create ideas until badge threshold
2. Check `user_badges` table
3. Verify badge appears on user profile

### Verify Rich Text Editor
1. Create new idea with rich text content
2. Verify markdown is preserved in database
3. Verify HTML preview displays correctly

---

## Quick Integration Script

Run this to verify everything is set up:

```bash
#!/bin/bash
echo "🔍 Checking New Features Setup..."
echo ""

# Check database
echo "📊 Database:"
psql $DATABASE_URL -c "SELECT COUNT(*) as audit_logs FROM audit_logs;" && echo "✅ audit_logs table found"

# Check npm packages
echo ""
echo "📦 Dependencies:"
npm list speakeasy >= /dev/null 2>&1 && echo "✅ speakeasy installed" || echo "❌ speakeasy missing"
npm list nodemailer >= /dev/null 2>&1 && echo "✅ nodemailer installed" || echo "❌ nodemailer missing"
npm list jest >= /dev/null 2>&1 && echo "✅ jest installed" || echo "❌ jest missing"

# Check environment variables
echo ""
echo "⚙️  Environment:"
[[ -n "$SMTP_HOST" ]] && echo "✅ SMTP_HOST set" || echo "❌ SMTP_HOST missing"
[[ -n "$SMTP_USER" ]] && echo "✅ SMTP_USER set" || echo "❌ SMTP_USER missing"
[[ -n "$SMTP_PASSWORD" ]] && echo "✅ SMTP_PASSWORD set" || echo "❌ SMTP_PASSWORD missing"

# Run tests
echo ""
echo "🧪 Tests:"
npm test -- --passWithNoTests && echo "✅ Tests pass" || echo "❌ Tests failing"

echo ""
echo "✨ Setup verification complete!"
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `npm ERR! 404 speakeasy not found` | Run `npm install speakeasy` |
| `SMTP connection failed` | Check credentials, enable "Less secure app" for Gmail |
| `Jest tests timeout` | Increase timeout in setup.ts or specific test |
| `Migration error` | Ensure PostgreSQL is running, database exists |
| `2FA QR code not showing` | Install `qrcode` npm package |
| `Emails not sending` | Check SMTP_PASSWORD is 16-char app password, not main password |
| `Role-based access denied` | Verify user role in database: `SELECT role FROM users WHERE id='user-id'` |
| `Badges not unlocking` | Call `checkAndAwardBadges()` manually, verify thresholds |

---

## Support Resources

- 📖 **Full Guide**: See `NEW_FEATURES_GUIDE.md`
- 🔧 **Configuration**: See `.env.new-features`
- 📝 **Database Schema**: See `backend/migrations/001_add_2fa_rbac_audit.sql`
- ✅ **Tests Example**: See `backend/src/__tests__/validation.test.ts`
- 🚀 **CI/CD**: See `.github/workflows/ci-cd.yml`

---

## Timeline Estimate

- **Phase 1**: 10-15 minutes (database & npm)
- **Phase 2**: 5 minutes (SMTP setup)
- **Phase 3**: 15-20 minutes (backend integration)
- **Phase 4**: 20-30 minutes (frontend components)
- **Phase 5**: 5 minutes (GitHub Actions)
- **Phase 6**: 10 minutes (testing)
- **Phase 7**: 15-20 minutes (verification)

**Total**: ~1.5-2 hours for complete integration

---

## Next: Post-Integration Monitoring

After everything is integrated:
1. Monitor email delivery success rate
2. Track 2FA adoption
3. Review audit logs for suspicious activity
4. Monitor badge unlock patterns
5. Check test coverage remains above 50%

---

**Version**: 1.0.0
**Last Updated**: March 31, 2026
