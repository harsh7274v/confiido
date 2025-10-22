# Deployment Instructions - Quick Reference

## Pre-Deployment Checklist

### 1. Build TypeScript Locally
```bash
cd backend
npm run build
```

✅ Should complete without errors
✅ Creates `dist/` folder with compiled JS files

### 2. Verify Environment Variables in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

**Required Variables:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-secret-key-min-32-characters
JWT_EXPIRE=7d
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret
NODE_ENV=production
```

**Important for Firebase Private Key:**
- Copy the ENTIRE private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` characters (they represent newlines)
- Example: `-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n`

### 3. Deploy to Vercel

```bash
cd backend
vercel --prod
```

### 4. Check Deployment

After deployment completes, test:

```bash
# Get your Vercel URL from the deployment output
# Example: https://your-app.vercel.app

# Test health check
curl https://your-app.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Lumina API is running",
  "timestamp": "2025-10-22T...",
  "environment": "production",
  "distExists": true,
  "routesLoaded": {
    "auth": true,
    "users": true,
    "experts": true,
    "bookings": true,
    "messages": true,
    "reviews": true,
    "payments": true,
    "notifications": true,
    "courses": true,
    "enrollments": true,
    "webinars": true,
    "bundles": true,
    "digitalProducts": true,
    "analytics": true,
    "availability": true,
    "calendar": true,
    "dashboard": true,
    "transactions": true,
    "rewards": true
  }
}
```

### 5. Test API Endpoints

```bash
# Test login
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"megha@gmail.com","password":"megha123"}'

# Test user profile (use token from login response)
curl https://your-app.vercel.app/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Issue: 404 on all routes

**Check 1: Health endpoint**
```bash
curl https://your-app.vercel.app/api/health
```

If `distExists: false`:
- Build failed
- Check Vercel build logs
- Ensure `npm run build` completes locally

If any `routesLoaded` is `false`:
- Module import failed
- Check Vercel function logs
- Likely missing environment variable

**Check 2: Vercel Build Logs**
1. Go to Vercel Dashboard
2. Click your project
3. Click latest deployment
4. Click "Building" tab
5. Look for errors during `npm run build`

**Check 3: Vercel Function Logs**
1. Go to Vercel Dashboard
2. Click your project
3. Click "Functions" tab
4. Click `api/index.js`
5. Check runtime logs for errors

### Issue: "Service temporarily unavailable - database connection failed"

- Check `MONGODB_URI` environment variable
- Verify MongoDB Atlas allows connections from `0.0.0.0/0` (or Vercel IPs)
- Check MongoDB Atlas username/password

### Issue: "Firebase environment variable is missing"

- Verify all Firebase environment variables are set in Vercel
- Check that `FIREBASE_PRIVATE_KEY` includes newlines (`\n`)
- Ensure no extra spaces or quotes around values

### Issue: Routes work but authentication fails

- Check `JWT_SECRET` is set and matches your frontend
- Verify Firebase credentials are correct
- Check user exists in MongoDB

## Quick Fixes

### Force Rebuild
```bash
vercel --prod --force
```

### Check What's Deployed
```bash
vercel ls
```

### View Logs in Real-Time
```bash
vercel logs https://your-app.vercel.app --follow
```

### Rollback to Previous Deployment
1. Go to Vercel Dashboard → Deployments
2. Find working deployment
3. Click "..." → Promote to Production

## Success Criteria

✅ `/api/health` returns 200 with all routes loaded
✅ `/api/auth/login` accepts valid credentials
✅ `/api/users/profile` returns user data with valid token
✅ No 404 errors in Vercel function logs
✅ Database operations work (check logs)

## Frontend Configuration

Update frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=https://your-vercel-backend.vercel.app
```

Or for production frontend `.env.production`:
```
NEXT_PUBLIC_API_URL=https://your-vercel-backend.vercel.app
```

---

## Emergency: Revert to Mock Endpoints

If you need to quickly revert to mock endpoints while debugging:

1. Comment out all route registrations in `api/index.js`
2. Uncomment the mock endpoints at the bottom
3. Redeploy: `vercel --prod`

This will give you basic login/auth while you fix the real routes.

---

**Last Updated**: October 22, 2025
**Status**: Ready for deployment
