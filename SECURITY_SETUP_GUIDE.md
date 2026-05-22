# Synapse App - Security & Setup Guide

## 🚨 CRITICAL SECURITY SETUP (DO FIRST)

### 1. Environment Variables Configuration

**NEVER commit .env files to git!** Always use `.env.example` as a template.

#### Backend Setup (`backend/.env`)
```bash
# Database Configuration (REQUIRED)
DATABASE_URL=postgresql://username:password@localhost:5432/synapse?sslmode=require

# JWT Configuration (REQUIRED)
JWT_SECRET=your-super-secure-jwt-secret-with-32-chars-minimum
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173

# Google AI Configuration
GOOGLE_GENAI_API_KEY=your-key-here

# Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf
```

#### Frontend Setup (`frontend/.env`)
```bash
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Synapse
```

### 2. Generate Secure JWT Secret

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String([System.Random]::new().GetBytes(32))
```

### 3. Database Setup

1. Create PostgreSQL database
2. Add SSL certificate path (for production)
3. Update DATABASE_URL with your credentials
4. Run migrations:
   ```bash
   cd backend
   npm run build
   npm run db:migrate
   ```

---

## 🔐 Key Security Changes Made

### ✅ Fixed Issues

| Issue | Solution | File |
|-------|----------|------|
| Hardcoded DB password | Moved to .env file | `backend/src/db/database.ts` |
| Weak password policy | Increased to 12 chars + character mix | `backend/src/routes/auth.routes.ts` |
| No input validation | Added email/username/password validators | `backend/src/middleware/validators.ts` |
| Wrong HTTP status codes | Fixed 501 → 500 errors | `backend/src/routes/auth.routes.ts` |
| SQL parameter injection | Fixed parameter numbering | `backend/src/routes/ideas.routes.ts` |
| Generic error messages | Safe error handling middleware | `backend/src/middleware/errorHandler.ts` |
| No SSL on database | Force SSL in production | `backend/src/db/database.ts` |
| Memory leaks from useEffect | Added cleanup functions | `src/components/Chat.tsx`, `Profile.tsx` |

---

## 🛠️ Installation & Running

### Backend
```bash
cd backend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env
# Edit .env with your actual values

# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm run start
```

### Frontend
```bash
cd ..

# Install dependencies
npm install

# Development mode (Vite server on port 5173)
npm run dev

# Production build
npm run build
npm run preview
```

---

## 📋 New Middleware & Utilities

### Error Handling
- **File:** `backend/src/middleware/errorHandler.ts`
- **Usage:** Standardizes error responses, never exposes internal details
- **Features:**
  - Operational vs programming error handling
  - Server-side logging of full errors
  - Safe client-side error messages

### Input Validation
- **File:** `backend/src/middleware/validators.ts`
- **Provides:**
  - Email validation regex
  - Username validation regex
  - Password strength checking
  - Payload size limiting
  - Null byte prevention
  - JSON validation

### Database
- **File:** `backend/src/db/database.ts`
- **Features:**
  - Environment-based configuration
  - SSL support (forced in production)
  - Connection pooling
  - Query logging

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Enable database SSL (`sslmode=require`)
- [ ] Set strong `CORS_ORIGIN` to your domain only
- [ ] Enable HTTPS on frontend and backend
- [ ] Set up database backups
- [ ] Configure email alerts for errors
- [ ] Set up monitoring (errors, performance)
- [ ] Run security audit: `npm audit fix`
- [ ] Enable rate limiting on API
- [ ] Set up WAF (Web Application Firewall)

---

## 📚 Password Policy

Passwords must now meet these requirements:

✅ **At least 12 characters**  
✅ **Mix of character types:**
  - Uppercase letters (A-Z)
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Special characters (!@#$%^&*)

❌ Common passwords are NOT stored (no dictionary checking yet)

---

## 🧪 Testing Security

### Test Password Validation
```bash
# Good password
12345678abcD!

# Bad passwords (too short, no numbers, etc)
password123      # No uppercase/special
Abcdef!          # No numbers
abc              # Too short
```

---

## 🔄 Next Steps

### Immediate (This Week)
- [ ] Update all environment variables
- [ ] Test password validation
- [ ] Verify database connection
- [ ] Review error responses

### Short-term (Next 2 Weeks)
- [ ] Add 2FA authentication
- [ ] Implement Redis rate limiting
- [ ] Add comprehensive testing
- [ ] Set up CI/CD pipeline

### Long-term (Month 1-3)
- [ ] Add API documentation
- [ ] Implement caching layer
- [ ] Optimize database queries
- [ ] Add monitoring/alerting
- [ ] Performance testing & optimization

---

## 💡 Best Practices Going Forward

1. **Never commit secrets** - Use .env files and .gitignore
2. **Always validate input** - Use validation middleware
3. **Sanitize errors** - Don't expose internal details
4. **Use strong passwords** - Enforce minimum requirements
5. **Enable SSL** - Use HTTPS everywhere
6. **Log errors properly** - Server-side only
7. **Keep dependencies updated** - Run `npm audit` regularly
8. **Use environment variables** - Never hardcode configs

---

## 📞 Troubleshooting

### Database Connection Error
```
Error: ENOENT: no such file or directory, open '.env'
```
**Solution:** Copy `.env.example` to `.env` and fill in values

### JWT Authentication Failed
```
Error: "Token verification failed"
```
**Solution:** Check JWT_SECRET is set and matches across restarts

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Update CORS_ORIGIN in .env to include your frontend URL

### SSL Certificate Error
```
Error: self signed certificate
```
**Solution:** Set `sslmode=disable` for development only, use proper certs for production

---

**Last Updated:** March 31, 2026  
**Version:** Synapse v1.0 (Security Hardening Release)
