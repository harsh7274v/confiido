# Google Sign-In Production Fix

## Issue
Production build is still using old popup-based authentication, causing CORS errors:
```
Error (auth/popup-closed-by-user)
Cross-Origin-Opener-Policy policy would block the window.closed call
```

## Root Cause
The production deployment is using an old build that contains `signInWithPopup` instead of the new `signInWithRedirect` implementation.

## Solution

### Step 1: Verify Code Changes ✅
The following files have been updated:
- `frontend/app/contexts/AuthContext.tsx` - Uses `signInWithRedirect` instead of `signInWithPopup`
- `frontend/app/signup/page.tsx` - Fixed React Hooks ordering
- Firebase config is correct

### Step 2: Rebuild Production
You need to rebuild and redeploy the frontend application:

```bash
cd frontend
npm run build
```

### Step 3: Deploy to Production
Depending on your deployment platform:

#### For Vercel:
```bash
vercel --prod
```

#### For Firebase Hosting:
```bash
firebase deploy --only hosting
```

#### For Custom Server:
```bash
# After building, copy the .next folder to your server
# Then restart your Next.js production server
pm2 restart confiido-frontend
# or
npm run start
```

### Step 4: Clear Browser Cache
After deployment, users may need to:
1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache for www.confiido.in
3. Or use incognito mode to test

### Step 5: Verify Firebase Configuration

Ensure Firebase Console is configured correctly:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `lumina-16fd9`
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Add these domains:
   - `confiido.in`
   - `www.confiido.in`
   - `localhost` (for development)

5. In **Google Cloud Console** (linked from Firebase):
   - Go to **APIs & Services** → **Credentials**
   - Find your OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     - `https://confiido.in/__/auth/handler`
     - `https://www.confiido.in/__/auth/handler`
     - `https://lumina-16fd9.firebaseapp.com/__/auth/handler`

## Expected Behavior After Fix

### Before (Current Production):
❌ Popup window opens for Google Sign-In  
❌ CORS errors in console  
❌ "popup-closed-by-user" error  
❌ Session cleared message  

### After (Fixed):
✅ Full page redirect to Google  
✅ No CORS errors  
✅ Seamless authentication  
✅ Automatic redirect to dashboard after sign-in  
✅ No popup blockers  
✅ Better mobile experience  

## Testing Steps

1. Navigate to https://www.confiido.in/signup
2. Click "Sign in with Google"
3. You should be redirected to Google's login page (NOT a popup)
4. After signing in with Google, you'll be redirected back to confiido.in
5. You should automatically be logged in and redirected to the dashboard
6. Check browser console - no CORS or popup errors

## Troubleshooting

### Issue: Still seeing popup errors
**Solution**: Clear browser cache or test in incognito mode

### Issue: Redirect loop
**Solution**: Check that `NEXT_PUBLIC_API_URL` environment variable is set correctly in production

### Issue: "User logged out, session cleared"
**Solution**: This happens if the redirect result isn't being processed. Check:
1. Firebase config is loaded (check env variables)
2. `getRedirectResult` is being called on page load
3. Backend `/api/auth/verify` endpoint is accessible

### Issue: 404 on terms/privacy pages
**Solution**: These pages need to be created:
- `frontend/app/terms/page.tsx`
- `frontend/app/privacy/page.tsx`

## Environment Variables

Verify these are set in production:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCg4JTs1a3DrCkDvOOhd4wey41oMwHjn_U
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lumina-16fd9.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lumina-16fd9
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lumina-16fd9.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=822969208337
NEXT_PUBLIC_FIREBASE_APP_ID=1:822969208337:web:ca33add7fe6033cd2e6bb0
NEXT_PUBLIC_API_URL=https://your-backend-api-url.com
```

## Quick Deploy Commands

### Full Rebuild and Deploy:
```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies (if needed)
cd frontend
npm install

# 3. Build production
npm run build

# 4. Deploy (choose your platform)
vercel --prod
# OR
firebase deploy --only hosting
# OR
pm2 restart confiido-frontend
```

## Additional Notes

- The redirect approach is recommended by Firebase for production apps
- It's more reliable across all browsers and devices
- No popup blocker issues
- Better for PWAs and mobile browsers
- More secure (no COOP violations)

---

**Status**: Code fixed, awaiting production deployment  
**Priority**: HIGH - Production is currently broken  
**Estimated Fix Time**: 5-10 minutes (rebuild + deploy)
