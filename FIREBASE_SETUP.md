# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for the Lumina platform.

## 🔥 Firebase Console Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `lumina-auth` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication
1. In your Firebase project, go to **Authentication** > **Sign-in method**
2. Click on **Google** provider
3. Toggle **Enable**
4. Set a support email
5. Click **Save**

### 3. Get Firebase Configuration
1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click "Web app" icon (`</>`)
4. Register your app with name: `lumina-frontend`
5. Copy the config object (you'll need this for frontend `.env`)

### 4. Generate Service Account Key
1. Go to **Project Settings** > **Service accounts**
2. Click **"Generate new private key"**
3. Download the JSON file
4. Extract values for backend `.env` file:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key_id` → `FIREBASE_PRIVATE_KEY_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `client_id` → `FIREBASE_CLIENT_ID`

## 💻 Environment Configuration

### Frontend (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (.env)
```env
# Existing variables...
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com
```

## 🚀 Testing the Integration

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Test Authentication
1. Go to `http://localhost:3000`
2. Click "Sign In" in the navigation
3. Click "Continue with Google"
4. Complete Google OAuth flow
5. Check if user appears in navigation
6. Verify user creation in MongoDB

## 🔧 Features Implemented

### Frontend
- ✅ Firebase SDK integration
- ✅ Google OAuth sign-in
- ✅ Authentication context
- ✅ User profile display
- ✅ Auto-redirect for authenticated users
- ✅ Loading states

### Backend
- ✅ Firebase Admin SDK
- ✅ Token verification middleware
- ✅ User synchronization with MongoDB
- ✅ API endpoint for user verification
- ✅ Updated User model for Firebase users

### Security
- ✅ Secure token verification
- ✅ User data synchronization
- ✅ Proper error handling
- ✅ Environment variable configuration

## 📋 Next Steps

1. **Production Deployment**: Update environment variables for production
2. **User Roles**: Implement role-based access control
3. **Profile Management**: Add user profile editing capabilities
4. **Additional Providers**: Add Facebook, Twitter, GitHub authentication
5. **Email Verification**: Implement email verification flow
6. **Password Reset**: Add password reset functionality for email/password users

## 🐛 Troubleshooting

### Common Issues

1. **"Firebase app not initialized"**
   - Check if all environment variables are set
   - Verify Firebase config object

2. **"Invalid service account"**
   - Check backend environment variables
   - Ensure private key is properly formatted with `\n` newlines

3. **"Token verification failed"**
   - Check if user is authenticated in frontend
   - Verify API_URL is correct

4. **CORS errors**
   - Ensure backend CORS is configured for your frontend domain
   - Check if API requests include proper headers

### Getting Help
- Check Firebase Console for authentication logs
- Monitor browser console for errors
- Check backend logs for token verification issues
