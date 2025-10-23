// Serverless Firebase Match
// This file ensures the serverless environment uses the exact same Firebase logic as local

const admin = require('firebase-admin');

// Check if Firebase credentials are properly configured (exact match with local)
const isFirebaseConfigured = () => {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY !== 'test-key' && // Not a test value
    process.env.FIREBASE_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----') // Valid format
  );
};

let firebaseInitialized = false;
let auth = null;

// Initialize Firebase only if properly configured (exact match with local)
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
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
      auth = admin.auth();
      console.log('✅ Firebase Admin SDK initialized successfully for serverless');
    } else {
      // Reuse existing app
      firebaseInitialized = true;
      auth = admin.auth();
      console.log('✅ Firebase Admin SDK reused existing app for serverless');
    }
  } catch (error) {
    console.warn('⚠️ Firebase initialization failed for serverless:', error.message);
    firebaseInitialized = false;
  }
} else {
  console.warn('⚠️ Firebase credentials not configured for serverless, skipping initialization');
}

// Export auth with fallback (exact match with local)
const getAuth = () => {
  if (!firebaseInitialized || !auth) {
    throw new Error('Firebase not initialized. Please check your Firebase credentials.');
  }
  return auth;
};

// Export for compatibility with compiled routes (exact match with local)
module.exports = admin;
module.exports.getAuth = getAuth;
module.exports.auth = auth;
module.exports.getAdmin = () => {
  if (!firebaseInitialized) {
    throw new Error('Firebase not initialized. Please check your Firebase credentials.');
  }
  return admin;
};

// Override the require cache to ensure all imports use this configuration
const path = require('path');
const firebaseConfigPath = path.resolve(__dirname, '../dist/config/firebase.js');

// Clear the require cache for the firebase config
if (require.cache[firebaseConfigPath]) {
  delete require.cache[firebaseConfigPath];
}

// Override the firebase config module to match local exactly
require.cache[firebaseConfigPath] = {
  exports: {
    getAuth,
    auth,
    getAdmin: () => {
      if (!firebaseInitialized) {
        throw new Error('Firebase not initialized. Please check your Firebase credentials.');
      }
      return admin;
    },
    default: admin
  }
};

console.log('✅ Firebase configuration matched with local environment');
