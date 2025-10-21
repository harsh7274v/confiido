# Google OAuth Redirect URI Setup Guide

## The Issue
The `GOOGLE_REDIRECT_URI` needs to work for **both localhost (development)** and **production domain**. Google OAuth requires you to configure **all allowed redirect URIs** in Google Cloud Console.

---

## Step 1: Add Multiple Redirect URIs in Google Cloud Console

### 1.1 Go to Google Cloud Console
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID

### 1.2 Add All Required Redirect URIs
Add these URIs to the **Authorized redirect URIs** section:

```
Development/Testing:
http://localhost:5003/auth/google/callback
http://localhost:3000/auth/google/callback
https://developers.google.com/oauthplayground

Production:
https://api.yourdomain.com/auth/google/callback
https://yourdomain.com/auth/google/callback
```

**Important**: Replace `yourdomain.com` with your actual production domain!

### 1.3 Click Save
Wait a few minutes for changes to propagate.

---

## Step 2: Environment-Specific Configuration

### For Development (`.env`)
```properties
NODE_ENV=development
GOOGLE_REDIRECT_URI=http://localhost:5003/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

### For Production (`.env.production`)
```properties
NODE_ENV=production
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/auth/google/callback
FRONTEND_URL=https://yourdomain.com
```

---

## Step 3: Why We Changed the Redirect URI Path

### Old Path
```
http://localhost:5003/callback
```

### New Path (Better Practice)
```
http://localhost:5003/auth/google/callback
```

**Reasons:**
- ✅ More specific and clear purpose
- ✅ Follows REST API conventions
- ✅ Easier to manage multiple OAuth providers (Google, Facebook, etc.)
- ✅ Better for routing and middleware organization

---

## Step 4: How the Redirect URI is Used

### In OAuth Flow
```
User clicks "Sign in with Google"
    ↓
Redirected to Google consent screen
    ↓
User grants permissions
    ↓
Google redirects back to: GOOGLE_REDIRECT_URI
    ↓
Your backend receives authorization code
    ↓
Backend exchanges code for tokens
```

### Important Notes
1. **The redirect URI is ONLY used during OAuth flow** (when getting initial tokens)
2. **For Calendar API operations**, the redirect URI doesn't matter after you have the refresh token
3. **Your current refresh token will continue to work** with the new redirect URI

---

## Step 5: When You Need to Generate New Tokens

### Using OAuth Playground
1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. Settings → Use your own OAuth credentials
3. The playground uses its own redirect URI: `https://developers.google.com/oauthplayground`
4. This is why you need to add it to your authorized redirect URIs

### Using Your Own Application
If you build a custom OAuth flow in your app:
```typescript
// Frontend initiates OAuth
window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?
  client_id=${GOOGLE_CLIENT_ID}&
  redirect_uri=${GOOGLE_REDIRECT_URI}&
  response_type=code&
  scope=https://www.googleapis.com/auth/calendar&
  access_type=offline&
  prompt=consent`;

// Backend handles callback at GOOGLE_REDIRECT_URI
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  // Exchange code for tokens
});
```

---

## Step 6: Production Deployment Checklist

### Before Deploying to Production

- [ ] **Update Google Cloud Console**
  - [ ] Add production redirect URI
  - [ ] Publish OAuth consent screen
  - [ ] Verify domain ownership (if required)

- [ ] **Update Environment Variables**
  - [ ] Set `NODE_ENV=production`
  - [ ] Update `GOOGLE_REDIRECT_URI` to production URL
  - [ ] Update `FRONTEND_URL` to production URL
  - [ ] Use Razorpay live keys (not test keys)

- [ ] **Generate Production Refresh Token** (Optional)
  - If you want separate tokens for dev/prod
  - Use OAuth Playground with production credentials
  - Store in production `.env`

- [ ] **Test in Production**
  - [ ] Verify Calendar API works
  - [ ] Test event creation
  - [ ] Confirm Meet links generate
  - [ ] Check email notifications

---

## Step 7: Multiple Environment Setup

### Directory Structure
```
backend/
├── .env                    # Development (localhost)
├── .env.production         # Production
├── .env.staging           # Staging (optional)
└── .env.example           # Template
```

### Load Correct Environment
```typescript
// In your index.ts or config
import dotenv from 'dotenv';

const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env';

dotenv.config({ path: envFile });
```

---

## Step 8: Common Issues & Solutions

### Issue 1: "redirect_uri_mismatch"
**Error**: The redirect URI in the request doesn't match an authorized redirect URI.

**Solution**: 
1. Check Google Cloud Console → Your OAuth Client → Authorized redirect URIs
2. Ensure the URI matches **exactly** (including http/https, port, path)
3. Wait 5-10 minutes after adding new URIs

### Issue 2: "OAuth consent screen not configured"
**Solution**: Complete OAuth consent screen setup and publish the app

### Issue 3: Refresh token still works after changing redirect URI
**This is normal!** Refresh tokens are **independent** of redirect URIs. They continue to work even if you change the redirect URI.

### Issue 4: Need different tokens for dev/prod
**Solution**: Generate separate refresh tokens for each environment:
1. Use OAuth Playground with different redirect URIs
2. Store different tokens in `.env` and `.env.production`

---

## Step 9: Security Best Practices

### ✅ Do:
- Use HTTPS in production
- Add only necessary redirect URIs
- Keep refresh tokens secret
- Use environment variables
- Implement CORS properly
- Monitor API usage

### ❌ Don't:
- Commit `.env` files to Git
- Use the same credentials for dev/prod (optional, but recommended)
- Share refresh tokens
- Hardcode credentials
- Expose sensitive URLs publicly

---

## Step 10: Testing Your Setup

### Test Development
```bash
# In backend directory
npm run test:google-calendar-integration
```

### Test Production (After Deployment)
```bash
# Use curl or Postman
curl -X POST https://api.yourdomain.com/api/calendar/events \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Production Test",
    "startTime": "2025-10-25T14:00:00+05:30",
    "endTime": "2025-10-25T15:00:00+05:30"
  }'
```

---

## Quick Reference: Your Current Setup

### Development (Local)
```properties
GOOGLE_REDIRECT_URI=http://localhost:5003/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

### Production (When Deployed)
```properties
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/auth/google/callback
FRONTEND_URL=https://yourdomain.com
```

### Google Cloud Console Redirect URIs
```
http://localhost:5003/auth/google/callback
https://api.yourdomain.com/auth/google/callback
https://developers.google.com/oauthplayground
```

---

## Summary

1. ✅ **Multiple redirect URIs supported** - Add all URIs in Google Cloud Console
2. ✅ **Environment-specific configs** - Use different `.env` files
3. ✅ **Refresh token still works** - No need to regenerate tokens
4. ✅ **Better path structure** - `/auth/google/callback` is more organized
5. ✅ **Production ready** - Just update the domain name when deploying

**Your current refresh token will continue to work with the new redirect URI!**

---

**Last Updated**: October 22, 2025  
**Status**: ✅ Ready for both development and production
