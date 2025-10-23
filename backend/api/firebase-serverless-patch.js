// Firebase Serverless Patch
// This file ensures Firebase is properly initialized for serverless deployment

const admin = require('firebase-admin');

// Check if Firebase is already initialized
if (!admin.apps.length) {
  try {
    // Only initialize Firebase if credentials are properly configured
    const hasValidFirebaseConfig = !!(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY !== 'test-key' &&
      process.env.FIREBASE_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----')
    );

    if (hasValidFirebaseConfig) {
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

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully for serverless');
    } else {
      console.warn('⚠️ Firebase credentials not properly configured for serverless');
    }
  } catch (error) {
    console.warn('⚠️ Firebase initialization failed for serverless:', error.message);
  }
} else {
  console.log('✅ Firebase Admin SDK already initialized');
}

module.exports = admin;
