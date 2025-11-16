# Firebase Environment Variables Setup

## Required Environment Variables

To enable Firebase authentication, you need to set these environment variables in your backend:

### 1. Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Service Accounts** tab
4. Click **"Generate new private key"**
5. Download the JSON file

### 2. Extract Values from JSON

From the downloaded JSON file, extract these values:

```json
{
  "project_id": "your-project-id",           // → FIREBASE_PROJECT_ID
  "private_key_id": "key-id",                // → FIREBASE_PRIVATE_KEY_ID
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",  // → FIREBASE_PRIVATE_KEY
  "client_email": "firebase-adminsdk-xxx@project.iam.gserviceaccount.com",  // → FIREBASE_CLIENT_EMAIL
  "client_id": "123456789",                   // → FIREBASE_CLIENT_ID
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."  // → FIREBASE_CLIENT_CERT_URL
}
```

### 3. Set Environment Variables

#### For Local Development (`.env` file in backend folder):

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxx%40your-project.iam.gserviceaccount.com
```

**Important Notes:**
- The `FIREBASE_PRIVATE_KEY` must include the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines
- Use `\n` for newlines in the private key
- Wrap the entire private key in quotes

#### For Production (Vercel):

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY_ID`
   - `FIREBASE_PRIVATE_KEY` (with full private key including BEGIN/END lines)
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_CLIENT_ID`
   - `FIREBASE_CLIENT_CERT_URL`

### 4. Verify Setup

After setting the variables, restart your backend server. You should see:

```
✅ Firebase Admin SDK initialized successfully
```

If you see an error, check:
1. All environment variables are set
2. Private key format is correct (includes BEGIN/END lines)
3. No extra spaces or characters in the values

### 5. Testing

Once configured, test the Google sign-in:
1. Click "Continue with Google" button
2. Select your Google account
3. Should redirect to dashboard after successful authentication

## Troubleshooting

### Error: "Firebase authentication is not configured"

**Check:**
- Are all required environment variables set?
- Is the private key in the correct format?
- Did you restart the server after setting variables?

### Error: "Invalid Firebase token"

**Check:**
- Frontend Firebase config is correct
- Firebase project ID matches in frontend and backend
- Authorized domains are set in Firebase Console

### Error: "Firebase Admin SDK initialization failed"

**Check:**
- Private key is not corrupted
- Service account has proper permissions
- Network connectivity to Firebase services

