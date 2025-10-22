import admin from 'firebase-admin';

// Check if Firebase credentials are properly configured
const isFirebaseConfigured = () => {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY !== 'test-key' // Not a test value
  );
};

let firebaseInitialized = false;
let auth: admin.auth.Auth | null = null;

// Initialize Firebase only if properly configured
if (isFirebaseConfigured()) {
  try {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
      firebaseInitialized = true;
      auth = admin.auth();
      console.log('✅ Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.warn('⚠️ Firebase initialization failed:', error.message);
    firebaseInitialized = false;
  }
} else {
  console.warn('⚠️ Firebase credentials not configured, skipping initialization');
}

// Export auth with fallback
export const getAuth = () => {
  if (!firebaseInitialized || !auth) {
    throw new Error('Firebase not initialized. Please check your Firebase credentials.');
  }
  return auth;
};

// Export auth for backward compatibility
export { auth };

// Export admin with fallback
export const getAdmin = () => {
  if (!firebaseInitialized) {
    throw new Error('Firebase not initialized. Please check your Firebase credentials.');
  }
  return admin;
};

export default admin;
