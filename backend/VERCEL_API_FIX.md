# Vercel API Fix - Why Existing APIs Weren't Working

## The Problem

Your existing APIs worked perfectly on your local machine but failed on Vercel deployment. However, the mock endpoints in `api/index.js` were working fine.

### Root Cause

**The `api/index.js` file was not importing or registering your actual route handlers!**

## What Was Happening

### Local Development (✅ Working)
- Uses `backend/src/index.ts`
- Imports all routes from `src/routes/` directory
- Registers routes: `app.use('/api/auth', authRoutes)`, etc.
- Connects to MongoDB
- Has all middleware and error handlers

### Vercel Deployment (❌ Not Working)
- Uses `backend/api/index.js` (serverless entry point)
- **Only had mock endpoints** (hardcoded responses)
- **Did NOT import actual routes from `src/routes/`**
- **Did NOT connect to MongoDB**
- **Did NOT have real business logic**

## The Fix

### 1. Updated `api/index.js`
Added imports for all route modules:

```javascript
// Import database connection
const { connectDB } = require('../dist/config/database');

// Import all route modules (compiled TypeScript)
const authRoutes = require('../dist/routes/auth');
const userRoutes = require('../dist/routes/users');
const expertRoutes = require('../dist/routes/experts');
// ... all other routes

// Import middleware
const { errorHandler } = require('../dist/middleware/errorHandler');
const { notFound } = require('../dist/middleware/notFound');
```

### 2. Added Database Connection Middleware

```javascript
// Database connection middleware for API routes (serverless)
app.use('/api', async (req, res, next) => {
  try {
    await connectDB(); // Will reuse existing connection if available
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(503).json({ 
      success: false,
      error: 'Service temporarily unavailable - database connection failed' 
    });
  }
});
```

### 3. Registered All Routes

```javascript
app.use('/api/auth', authRoutes.default || authRoutes);
app.use('/api/users', userRoutes.default || userRoutes);
app.use('/api/experts', expertRoutes.default || expertRoutes);
app.use('/api/bookings', bookingRoutes.default || bookingRoutes);
// ... all other routes
```

### 4. Added Error Handling Middleware

```javascript
// Error handling middleware (must be last)
app.use(notFound.default || notFound);
app.use(errorHandler.default || errorHandler);
```

### 5. Removed Mock Endpoints

Commented out all the mock login, register, and auth endpoints that were just returning hardcoded responses.

### 6. Updated `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["dist/**", "api/**"]
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "VERCEL": "1"
  },
  "installCommand": "npm install && npm run build"
}
```

### 7. Created `.vercelignore`

Added a `.vercelignore` file to exclude unnecessary files from deployment.

## How to Deploy

1. **Build TypeScript locally** (optional, but recommended to check for errors):
   ```bash
   cd backend
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Verify Environment Variables**:
   Make sure all environment variables are set in Vercel dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `FIREBASE_*` variables
   - `RAZORPAY_*` variables
   - All other required env vars from `env.example`

## Key Differences Between Local and Vercel

| Aspect | Local Development | Vercel Serverless |
|--------|------------------|-------------------|
| Entry Point | `src/index.ts` | `api/index.js` |
| TypeScript | Runs with ts-node/nodemon | Needs to be compiled to `dist/` |
| Server | Long-running Express server | Serverless functions (cold starts) |
| Socket.IO | ✅ Supported | ❌ Not supported (use external service) |
| File Uploads | Local `uploads/` folder | Use Cloudinary |
| Database Connection | Single persistent connection | Connection per request (with pooling) |
| Background Jobs | ✅ Can run continuously | ❌ Need external cron/service |

## Notes

- **Socket.IO**: Vercel serverless doesn't support WebSocket connections. You may need to use a separate service like Pusher or deploy Socket.IO separately.
- **File Uploads**: The `uploads/` folder won't persist on Vercel. All uploads should go to Cloudinary.
- **Background Jobs**: The booking timeout service won't work on Vercel. Use Vercel Cron or an external service.

## Testing

After deployment, test your endpoints:

```bash
# Health check
curl https://your-vercel-url.vercel.app/api/health

# Auth endpoints
curl -X POST https://your-vercel-url.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get user profile
curl https://your-vercel-url.vercel.app/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Status

✅ Fixed: API routes now properly imported and registered
✅ Fixed: Database connection middleware added
✅ Fixed: Error handling middleware added
✅ Fixed: Build configuration updated
⚠️ Note: Socket.IO and background services need alternative solutions for serverless

---

**Date Fixed**: October 22, 2025
**Fixed By**: GitHub Copilot
