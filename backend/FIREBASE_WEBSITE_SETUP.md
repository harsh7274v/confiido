# Firebase Website Configuration for Production

## 🔥 Essential Firebase Settings for Vercel Deployment

### 1. **Firebase Project Settings**

#### Go to Firebase Console:
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)

#### Project Configuration:
- **Project ID**: Note this down (you'll need it for `FIREBASE_PROJECT_ID`)
- **Project Name**: Should match your application
- **Web App**: Make sure you have a web app registered

### 2. **Service Account Setup**

#### Generate Service Account Key:
1. Go to **Project Settings** → **Service Accounts** tab
2. Click **"Generate new private key"**
3. Download the JSON file
4. **IMPORTANT**: Keep this file secure - never commit it to version control

#### Extract Environment Variables:
From the downloaded JSON file, extract these values:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",           // → FIREBASE_PROJECT_ID
  "private_key_id": "key-id",                // → FIREBASE_PRIVATE_KEY_ID
  "private_key": "-----BEGIN PRIVATE KEY-----\n...", // → FIREBASE_PRIVATE_KEY
  "client_email": "firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com", // → FIREBASE_CLIENT_EMAIL
  "client_id": "client-id",                  // → FIREBASE_CLIENT_ID
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxx%40your-project.iam.gserviceaccount.com" // → FIREBASE_CLIENT_CERT_URL
}
```

### 3. **Authentication Settings**

#### Go to Authentication:
1. In Firebase Console, go to **Authentication**
2. Click **"Get started"** if not already set up

#### Sign-in Methods:
Enable the methods you need:
- ✅ **Email/Password** (if using traditional auth)
- ✅ **Google** (if using Google sign-in)
- ✅ **Phone** (if using phone auth)

#### Authorized Domains:
Add your production domains:
- `confiido.in`
- `www.confiido.in`
- `api.confiido.in` (for your backend)
- `localhost` (for development)

### 4. **Firestore Database Settings**

#### Go to Firestore Database:
1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"** if not already created

#### Security Rules:
Update your security rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Or more specific rules based on your needs
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### Database Location:
- Choose a location close to your users (e.g., `us-central1` for US users)

### 5. **Storage Settings (if using Firebase Storage)**

#### Go to Storage:
1. In Firebase Console, go to **Storage**
2. Click **"Get started"** if not already set up

#### Security Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 6. **Firebase Hosting Settings (if using)**

#### Go to Hosting:
1. In Firebase Console, go to **Hosting**
2. Add your custom domain if needed

### 7. **Environment Variables for Vercel**

#### Set these in Vercel Dashboard:
Go to your Vercel project → Settings → Environment Variables

```bash
# Required Firebase Variables
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

# Optional Firebase Variables
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxx%40your-project.iam.gserviceaccount.com

# Other Required Variables
MONGODB_URI=mongodb+srv://confiidoio:UzCmaVZ2SICeFh2H@cluster.mongodb.net/lumina
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
```

### 8. **Important Security Notes**

#### Private Key Format:
- The private key must include `\n` for newlines
- In Vercel, use double quotes and escape newlines: `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`

#### Service Account Permissions:
- The service account should have **Firebase Admin SDK** permissions
- Don't give it unnecessary permissions

#### Domain Restrictions:
- Add your production domains to authorized domains
- Remove any test/development domains from production

### 9. **Testing Your Setup**

#### Test Firebase Connection:
```bash
# Test locally with your service account
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
console.log('✅ Firebase initialized successfully');
"
```

#### Test in Production:
```bash
curl https://api.confiido.in/api/health/detailed
```

Should return:
```json
{
  "firebase": {
    "initialized": true,
    "error": null
  }
}
```

### 10. **Common Issues and Solutions**

#### Issue: "Firebase not initialized"
- **Solution**: Check that all environment variables are set correctly in Vercel
- **Solution**: Verify the private key format includes `\n` for newlines

#### Issue: "Invalid private key"
- **Solution**: Ensure the private key is properly formatted with newlines
- **Solution**: Check that the service account JSON is valid

#### Issue: "Permission denied"
- **Solution**: Verify the service account has proper permissions
- **Solution**: Check Firestore security rules

#### Issue: "Domain not authorized"
- **Solution**: Add your production domain to authorized domains in Firebase Console

### 11. **Monitoring and Maintenance**

#### Firebase Console Monitoring:
- Monitor authentication usage
- Check Firestore usage and costs
- Review security rules regularly

#### Vercel Environment Variables:
- Regularly rotate service account keys
- Monitor environment variable usage
- Keep backup of service account JSON (securely)

## 🎯 Summary

Essential steps for Firebase production setup:

1. ✅ **Generate service account key** from Firebase Console
2. ✅ **Extract environment variables** from the JSON file
3. ✅ **Set environment variables** in Vercel Dashboard
4. ✅ **Configure authorized domains** in Firebase Console
5. ✅ **Update security rules** for Firestore/Storage
6. ✅ **Test the connection** in production

Your Firebase setup should now work perfectly with your Vercel deployment! 🚀
