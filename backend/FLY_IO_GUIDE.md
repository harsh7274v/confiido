# Fly.io Deployment Guide - Quick Reference

## ✅ Files Ready for Fly.io Deployment:
- `fly.toml` - Fly.io configuration
- `Dockerfile` - Docker build configuration
- `.dockerignore` - Optimized Docker builds

## 🚀 When You're Ready to Deploy:

### Step 1: Install Fly CLI (if not installed)
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### Step 2: Login to Fly.io
```bash
fly auth login
```
(Requires credit card for verification, but FREE tier is generous)

### Step 3: Launch Your App
```bash
cd e:\lumina\confiido\backend
fly launch --copy-config
```

Answer prompts:
- Use existing fly.toml? **YES**
- Setup a database? **NO** (you have MongoDB Atlas)
- Deploy now? **YES**

### Step 4: Add Your Environment Variables
```bash
fly secrets set MONGODB_URI="your_mongodb_connection_string"
fly secrets set JWT_SECRET="your_jwt_secret"
fly secrets set FRONTEND_URL="https://your-frontend-url.com"
fly secrets set NODE_ENV="production"

# Firebase
fly secrets set FIREBASE_PROJECT_ID="your_project_id"
fly secrets set FIREBASE_PRIVATE_KEY="your_private_key"
fly secrets set FIREBASE_CLIENT_EMAIL="your_client_email"

# Cloudinary
fly secrets set CLOUDINARY_CLOUD_NAME="your_cloud_name"
fly secrets set CLOUDINARY_API_KEY="your_api_key"
fly secrets set CLOUDINARY_API_SECRET="your_api_secret"

# Razorpay
fly secrets set RAZORPAY_KEY_ID="your_key_id"
fly secrets set RAZORPAY_KEY_SECRET="your_key_secret"

# Google OAuth
fly secrets set GOOGLE_CLIENT_ID="your_client_id"
fly secrets set GOOGLE_CLIENT_SECRET="your_client_secret"
fly secrets set GOOGLE_REDIRECT_URI="https://your-app.fly.dev/api/auth/google/callback"

# Email
fly secrets set SMTP_HOST="your_smtp_host"
fly secrets set SMTP_PORT="587"
fly secrets set SMTP_USER="your_smtp_user"
fly secrets set SMTP_PASS="your_smtp_password"
```

### Step 5: Your Backend is LIVE! 🎉
URL: `https://your-app-name.fly.dev`

Test: `https://your-app-name.fly.dev/api/health`

## 📊 Useful Commands:

```bash
# View logs
fly logs

# Check status
fly status

# Open dashboard
fly dashboard

# Deploy updates
fly deploy

# Scale your app
fly scale count 2

# SSH into your app
fly ssh console

# Check secrets
fly secrets list
```

## 💰 Free Tier Limits:
- ✅ 3 shared-cpu VMs (256MB RAM each)
- ✅ 3GB persistent volume storage
- ✅ 160GB outbound data transfer/month
- ✅ NO cold starts
- ✅ Socket.IO works perfectly

## 📝 Notes:
- Credit card required for verification (won't be charged if within free limits)
- Your app stays warm 24/7 (no cold starts)
- Global edge network for fast performance
- Perfect for production use

---

**When you're ready, just run:**
```bash
fly auth login
cd e:\lumina\confiido\backend
fly launch --copy-config
```

**That's it!** 🚀
