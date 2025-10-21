# Production Readiness Checklist - Lumina Backend

## ✅ Current Status: **MOSTLY READY** (with critical fixes needed)

---

## 🔴 CRITICAL Issues (Must Fix Before Production)

### 1. ❌ JWT Secret - Using Same Secret for Dev & Prod
**Risk**: High Security Risk - If dev environment is compromised, production tokens can be decoded.

**Current**:
```properties
JWT_SECRET=ltyfufguvdurfnkmomersrgvuyggugiuivgvghjbnmkmomointftu
```

**Required**: Generate a new, stronger secret for production
```bash
# Generate a new secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Action**: Update `.env.production` with a new JWT_SECRET

---

### 2. ⚠️ Database Connection - Same Credentials for Dev & Prod
**Risk**: Medium Risk - Better to use separate database users/permissions

**Recommendation**: Create a separate MongoDB user for production with restricted permissions

---

### 3. ⚠️ Email Password - Exposed in Plain Text
**Current**: Email password is in plain text in `.env` files

**Recommendation**: 
- Use environment variables in your hosting platform
- Never commit `.env.production` to Git
- Rotate Gmail app password after deployment

---

## ✅ What's Already Production-Ready

### Database Configuration
✅ **SSL/TLS**: Properly configured with environment-specific settings
```typescript
tlsAllowInvalidCertificates: isDevelopment  // false in production
tlsAllowInvalidHostnames: isDevelopment     // false in production
```

✅ **Connection Pool**: Optimized for high concurrency
```typescript
maxPoolSize: 100
minPoolSize: 10
```

✅ **Timeouts**: Properly configured
```typescript
serverSelectionTimeoutMS: 10000
socketTimeoutMS: 45000
connectTimeoutMS: 10000
```

✅ **Error Handling**: Comprehensive event listeners

---

### Google Calendar Integration
✅ **Redirect URIs**: Configured for both dev and production
- Dev: `http://localhost:5003/auth/google/callback`
- Prod: `https://api.confiido.in/auth/google/callback`

✅ **Auto-Refresh Tokens**: Implemented
✅ **Production Domain**: Updated to `confiido.in`

---

### Environment Configuration
✅ **NODE_ENV**: Properly set (`development` / `production`)
✅ **CORS**: Frontend URL configured
✅ **Rate Limiting**: Enabled

---

## 🔧 Fixes to Apply Now

### Fix 1: Generate Production JWT Secret
```bash
# Run this command to generate a new secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Then update `.env.production`:
```properties
JWT_SECRET=<paste_new_secret_here>
```

### Fix 2: Add Security Headers (Already in your code?)
Check if you have these in your `index.ts`:
```typescript
import helmet from 'helmet';
app.use(helmet());
```

### Fix 3: Add `.env.production` to `.gitignore`
Ensure it's not committed to Git:
```gitignore
.env
.env.local
.env.production
.env.*.local
```

---

## 📋 Pre-Deployment Checklist

### Google Cloud Console
- [ ] Add production redirect URI: `https://api.confiido.in/auth/google/callback`
- [ ] Publish OAuth consent screen
- [ ] Verify domain ownership
- [ ] Enable Google Calendar API

### MongoDB Atlas
- [ ] Add production server IP to Network Access
- [ ] Create production-specific database user (optional)
- [ ] Enable backup
- [ ] Set up monitoring alerts

### Razorpay
- [ ] Switch from test to live keys
- [ ] Update webhook URLs
- [ ] Test payment flow in sandbox mode

### Hosting Platform
- [ ] Set environment variables (never use `.env.production` file in production)
- [ ] Configure auto-scaling
- [ ] Set up health check endpoint (`/api/health`)
- [ ] Configure SSL certificate

### Security
- [ ] Generate new JWT_SECRET for production
- [ ] Enable HTTPS only
- [ ] Configure CORS with production domain
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure firewall rules

### Testing
- [ ] Test MongoDB connection from production server
- [ ] Test Google Calendar integration
- [ ] Test Razorpay payments
- [ ] Test email sending
- [ ] Load test with expected traffic

---

## 🚀 Deployment Steps

### Step 1: Prepare Production Environment Variables
**DO NOT** copy `.env.production` file to server. Instead, set environment variables directly:

```bash
# On your hosting platform (Heroku, AWS, etc.)
export NODE_ENV=production
export PORT=5003
export MONGODB_URI="mongodb+srv://..."
export JWT_SECRET="<new_production_secret>"
export GOOGLE_REDIRECT_URI="https://api.confiido.in/auth/google/callback"
export FRONTEND_URL="https://confiido.in"
# ... etc
```

### Step 2: Build the Application
```bash
npm run build
```

### Step 3: Test Locally with Production Config
```bash
# Use production env file for testing
NODE_ENV=production node dist/index.js
```

### Step 4: Deploy
```bash
# Deploy to your hosting platform
git push production main
# or
npm run deploy
```

### Step 5: Verify
- [ ] Check `/api/health` endpoint
- [ ] Test Google Calendar event creation
- [ ] Verify MongoDB connection
- [ ] Check logs for errors

---

## 📊 Monitoring (Recommended)

### Set Up Monitoring For:
1. **Database**: MongoDB Atlas built-in monitoring
2. **API Performance**: Response times, error rates
3. **Calendar API**: Quota usage, error rates
4. **Payment Gateway**: Transaction success rate
5. **Server**: CPU, memory, disk usage

### Logging
- Use structured logging (JSON format)
- Log levels: ERROR, WARN, INFO, DEBUG
- Centralized logging (e.g., CloudWatch, LogDNA, Datadog)

---

## 🔐 Security Best Practices

### Applied ✅
- [x] Helmet.js for security headers
- [x] Rate limiting
- [x] CORS configuration
- [x] Environment-based SSL/TLS
- [x] Password hashing (bcrypt)
- [x] JWT authentication

### Recommended 🎯
- [ ] API request validation (express-validator)
- [ ] Input sanitization
- [ ] SQL injection prevention (using Mongoose ORM)
- [ ] XSS protection
- [ ] CSRF protection for web forms
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning

---

## 📈 Performance Optimizations

### Already Implemented ✅
- [x] Connection pooling (100 max connections)
- [x] Response compression
- [x] Efficient database queries
- [x] Caching strategy

### Consider Adding
- [ ] Redis caching for frequently accessed data
- [ ] CDN for static assets
- [ ] Database indexing optimization
- [ ] Query result pagination

---

## 🧪 Final Testing Script

Create this test script to verify production readiness:

```bash
#!/bin/bash
echo "🧪 Testing Production Readiness..."

# Test 1: Health Check
echo "1. Testing health endpoint..."
curl https://api.confiido.in/api/health

# Test 2: MongoDB Connection
echo "2. Testing MongoDB connection..."
npm run test:db-connection

# Test 3: Google Calendar
echo "3. Testing Google Calendar..."
npm run test:google-calendar-integration

# Test 4: Environment Variables
echo "4. Checking environment variables..."
node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"
node -e "console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length)"

echo "✅ Production readiness test complete!"
```

---

## Summary

### Critical Actions Required Before Production:
1. 🔴 **Generate new JWT_SECRET** for production
2. 🟡 **Add production redirect URI** to Google Cloud Console
3. 🟡 **Switch to Razorpay live keys**
4. 🟡 **Set environment variables** on hosting platform (don't use files)
5. 🟡 **Add production IP** to MongoDB Atlas whitelist

### Your Configuration is Good For:
✅ SSL/TLS security (environment-specific)  
✅ High concurrency database connections  
✅ Google Calendar integration  
✅ Error handling and logging  
✅ Rate limiting and CORS  

### Estimated Time to Production: **30-60 minutes**
(After fixing critical issues and deploying)

---

**Status**: Ready for production after fixing JWT_SECRET and configuring hosting environment  
**Risk Level**: Medium (due to shared secrets)  
**Recommendation**: Fix critical issues, then deploy to staging first

