/**
 * Firebase Server Configuration (Serverless-Compatible)
 * Works in both development and serverless production environments
 */

import admin from 'firebase-admin';

// Check if Firebase credentials are properly configured
const isFirebaseConfigured = (): boolean => {
  const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
  const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;
  const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
  const hasValidKeyFormat = process.env.FIREBASE_PRIVATE_KEY?.includes('-----BEGIN PRIVATE KEY-----');
  const isNotTestKey = process.env.FIREBASE_PRIVATE_KEY !== 'test-key';
  
  const isConfigured = !!(hasProjectId && hasPrivateKey && hasClientEmail && hasValidKeyFormat && isNotTestKey);
  
  // Debug logging
  if (!isConfigured) {
    console.log('🔍 Firebase Configuration Check:');
    console.log('  FIREBASE_PROJECT_ID:', hasProjectId ? '✅ Set' : '❌ Missing');
    console.log('  FIREBASE_PRIVATE_KEY:', hasPrivateKey ? '✅ Set' : '❌ Missing');
    console.log('  FIREBASE_CLIENT_EMAIL:', hasClientEmail ? '✅ Set' : '❌ Missing');
    if (hasPrivateKey) {
      console.log('  Private Key Format:', hasValidKeyFormat ? '✅ Valid' : '❌ Invalid (missing BEGIN/END markers)');
      console.log('  Is Test Key:', isNotTestKey ? '✅ No' : '❌ Yes');
    }
  }
  
  return isConfigured;
};

let firebaseInitialized = false;
let auth: admin.auth.Auth | null = null;

// Initialize Firebase Admin SDK (serverless-friendly singleton)
const initializeFirebaseAdmin = (): admin.auth.Auth => {
  // Return existing auth if already initialized
  if (firebaseInitialized && auth) {
    return auth;
  }

  // Check if already initialized
  if (admin.apps.length > 0) {
    auth = admin.auth();
    firebaseInitialized = true;
    return auth;
  }

  // Check if credentials are configured
  if (!isFirebaseConfigured()) {
    console.warn('⚠️ Firebase credentials not configured, Firebase Admin SDK will not be available');
    throw new Error('Firebase credentials not configured');
  }

  try {
    console.log('🔄 Initializing Firebase Admin SDK...');
    console.log('  Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('  Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
    console.log('  Private Key Length:', process.env.FIREBASE_PRIVATE_KEY?.length || 0);
    
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

    // Validate service account object
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Missing required service account fields');
    }

    console.log('  Creating Firebase app...');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });

    console.log('  Getting Firebase Auth instance...');
    auth = admin.auth();
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
    return auth;
  } catch (error: any) {
    console.error('❌ Firebase Admin SDK initialization failed:', error.message);
    console.error('  Error details:', error);
    if (error.stack) {
      console.error('  Stack:', error.stack);
    }
    firebaseInitialized = false;
    throw error;
  }
};

// Get Firebase Auth instance (lazy initialization)
export const getFirebaseAuth = (): admin.auth.Auth => {
  if (!firebaseInitialized || !auth) {
    return initializeFirebaseAdmin();
  }
  return auth;
};

// Verify Firebase ID token
export const verifyFirebaseToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
  try {
    const authInstance = getFirebaseAuth();
    const decodedToken = await authInstance.verifyIdToken(idToken);
    return decodedToken;
  } catch (error: any) {
    console.error('❌ Firebase token verification failed:', error.message);
    throw new Error(`Invalid Firebase token: ${error.message}`);
  }
};

// Check if Firebase is available (attempts initialization if not done)
export const isFirebaseAvailable = (): boolean => {
  try {
    // If already initialized, return true
    if (firebaseInitialized && auth) {
      return true;
    }
    
    // If not configured, return false
    if (!isFirebaseConfigured()) {
      console.warn('⚠️ Firebase credentials not configured. Required env vars:');
      console.warn('  - FIREBASE_PROJECT_ID:', !!process.env.FIREBASE_PROJECT_ID);
      console.warn('  - FIREBASE_PRIVATE_KEY:', !!process.env.FIREBASE_PRIVATE_KEY);
      console.warn('  - FIREBASE_CLIENT_EMAIL:', !!process.env.FIREBASE_CLIENT_EMAIL);
      return false;
    }
    
    // Try to initialize if not already done
    try {
      initializeFirebaseAdmin();
      return true;
    } catch (error: any) {
      console.error('❌ Failed to initialize Firebase:', error.message);
      return false;
    }
  } catch {
    return false;
  }
};

// Auto-initialize on module load
// This ensures Firebase is initialized when the server starts
if (typeof process !== 'undefined') {
  try {
    if (isFirebaseConfigured()) {
      console.log('🔄 Attempting to initialize Firebase Admin SDK on module load...');
      initializeFirebaseAdmin();
    } else {
      console.log('⚠️ Firebase credentials not found in environment variables');
      console.log('   This is okay if you\'re not using Firebase authentication');
      console.log('   Firebase will be initialized lazily when needed');
    }
  } catch (error: any) {
    console.warn('⚠️ Firebase initialization on module load failed:', error.message);
    console.warn('   Firebase will be initialized lazily when needed');
  }
}

// Export for backward compatibility
export { auth, admin };
export default admin;

