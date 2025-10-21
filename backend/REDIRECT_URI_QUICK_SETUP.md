# 🔧 Quick Setup: Google OAuth for Dev & Production

## ✅ What I Updated

### 1. Changed Redirect URI Path
```diff
- GOOGLE_REDIRECT_URI=http://localhost:5003/callback
+ GOOGLE_REDIRECT_URI=http://localhost:5003/auth/google/callback
```

### 2. Created Files
- ✅ `.env` - Development configuration (localhost)
- ✅ `.env.production` - Production configuration template
- ✅ `GOOGLE_OAUTH_REDIRECT_URI_SETUP.md` - Complete setup guide

---

## 🚀 What You Need to Do

### Step 1: Update Google Cloud Console (2 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID
4. In **Authorized redirect URIs**, add these 3 URIs:

```
http://localhost:5003/auth/google/callback
https://api.yourdomain.com/auth/google/callback
https://developers.google.com/oauthplayground
```

5. Click **SAVE**
6. ⏰ **Wait 5 minutes** for changes to propagate

### Step 2: Replace Your Domain

When deploying to production, update `.env.production`:

```properties
# Replace yourdomain.com with your actual domain
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/auth/google/callback
FRONTEND_URL=https://yourdomain.com
```

---

## 📋 Environment Configurations

### Development (`.env`) - Current ✅
```properties
NODE_ENV=development
GOOGLE_REDIRECT_URI=http://localhost:5003/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

### Production (`.env.production`) - When Deploying
```properties
NODE_ENV=production
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/auth/google/callback
FRONTEND_URL=https://yourdomain.com
```

---

## ❓ FAQ

### Q: Do I need to regenerate my refresh token?
**A: NO!** Your current refresh token will continue to work. The redirect URI is only used when **obtaining new tokens**, not when **using existing tokens**.

### Q: Why did you change `/callback` to `/auth/google/callback`?
**A:** Better organization and following REST conventions. Makes it easier to add other OAuth providers later (Facebook, Microsoft, etc.).

### Q: Will this work for both localhost and production?
**A: YES!** As long as you:
1. Add both URIs to Google Cloud Console
2. Use the correct `.env` file for each environment

### Q: What if I get "redirect_uri_mismatch" error?
**A:** Make sure:
1. The URI in Google Cloud Console matches **exactly**
2. You waited 5-10 minutes after saving changes
3. The URI includes the correct protocol (http/https) and port

---

## 🎯 Testing

### Test Development Setup
```bash
cd backend
npm run test:google-calendar-integration
```

Should output:
```
✅ All environment variables are set
✅ OAuth2 Client initialized
✅ Successfully connected! Found 2 calendars
✅ Event created successfully!
✅ Meet Link: https://meet.google.com/...
```

---

## 🔐 Security Reminder

### ✅ Do:
- Keep `.env` in `.gitignore`
- Use different credentials for dev/prod (optional)
- Use HTTPS in production

### ❌ Don't:
- Commit `.env` files to Git
- Share refresh tokens publicly
- Use test Razorpay keys in production

---

## 📞 Need Help?

See detailed guide: `GOOGLE_OAUTH_REDIRECT_URI_SETUP.md`

---

## ✨ Summary

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║  ✅ Redirect URIs Updated for Dev & Production  ║
║                                                  ║
║  Development: http://localhost:5003/...          ║
║  Production:  https://api.yourdomain.com/...    ║
║                                                  ║
║  Action Required:                                ║
║  1. Add URIs to Google Cloud Console            ║
║  2. Update domain in .env.production             ║
║                                                  ║
║  Your refresh token still works! ✅              ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

---

**Status**: ✅ Ready for both development and production  
**Your Current Token**: Still valid and working  
**Next Step**: Add redirect URIs to Google Cloud Console
