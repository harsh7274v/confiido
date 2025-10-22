# Firebase Setup for MongoDB Backend

## 🔥 Firebase Settings You Actually Need

Since you're using **MongoDB for user data storage** (not Firestore), here's what you actually need to configure:

### 1. **Service Account Setup** (Essential)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → **Project Settings** (gear icon)
3. Go to **Service Accounts** tab
4. Click **"Generate new private key"**
5. Download the JSON file
6. Extract these values for your Vercel environment variables:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
```

### 2. **Authentication Settings** (Essential)
1. Go to **Authentication** in Firebase Console
2. **Sign-in Methods**: Enable the methods you need:
   - ✅ **Email/Password** (for traditional auth)
   - ✅ **Google** (for Google sign-in)
   - ✅ **Phone** (if using phone auth)
3. **Authorized Domains**: Add your production domains:
   - `confiido.in`
   - `www.confiido.in`
   - `api.confiido.in`

### 3. **Environment Variables in Vercel** (Essential)
Go to your Vercel project → Settings → Environment Variables:

```bash
# Required Firebase Variables (for Authentication only)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

# Required MongoDB Variables
MONGODB_URI=mongodb+srv://confiidoio:UzCmaVZ2SICeFh2H@cluster.mongodb.net/lumina
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
```

## ❌ **What You DON'T Need:**

### Firestore Database Settings
- **Skip this entirely** - You're using MongoDB, not Firestore
- No need to configure Firestore security rules
- No need to set up Firestore collections

### Firebase Storage Settings
- **Skip this** - Unless you're using Firebase Storage for file uploads
- Your file uploads are likely handled by Cloudinary or similar

### Firebase Hosting Settings
- **Skip this** - You're using Vercel for hosting, not Firebase Hosting

## 🎯 **Why You Only Need Authentication:**

Your Firebase setup is only used for:
1. **User Authentication** - Verifying Firebase ID tokens
2. **Token Validation** - Checking if users are authenticated
3. **User Creation** - Creating users in MongoDB when they sign up via Firebase

Your actual user data is stored in MongoDB collections:
- `users` collection - User profiles, preferences, etc.
- `bookings` collection - Booking data
- `transactions` collection - Payment data
- `rewards` collection - Rewards/points data
- etc.

## 🔍 **How Firebase Works in Your App:**

```javascript
// 1. User signs in with Firebase (frontend)
const user = await signInWithEmailAndPassword(auth, email, password);
const token = await user.getIdToken();

// 2. Frontend sends token to your backend
fetch('/api/users/profile', {
  headers: { Authorization: `Bearer ${token}` }
});

// 3. Backend verifies Firebase token
const decodedToken = await firebase.auth().verifyIdToken(token);

// 4. Backend finds/creates user in MongoDB
let user = await User.findOne({ firebaseUid: decodedToken.uid });
if (!user) {
  user = new User({
    firebaseUid: decodedToken.uid,
    email: decodedToken.email,
    // ... other fields
  });
  await user.save();
}
```

## ✅ **Simplified Setup Checklist:**

1. ✅ **Generate service account key** from Firebase Console
2. ✅ **Set environment variables** in Vercel Dashboard
3. ✅ **Configure authorized domains** in Firebase Console
4. ✅ **Test the connection** in production

## 🧪 **Test Your Setup:**

```bash
curl https://api.confiido.in/api/health/detailed
```

Should return:
```json
{
  "firebase": {
    "initialized": true,
    "error": null
  },
  "database": {
    "connected": true,
    "state": 1
  }
}
```

## 💡 **Summary:**

You only need Firebase for **authentication**, not for data storage. Your MongoDB database handles all the user data, bookings, transactions, etc. Firebase just provides the authentication layer to verify who the user is.

So skip the Firestore configuration entirely - you don't need it! 🚀
