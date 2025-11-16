/**
 * Firebase Client Configuration
 * Works in both development and serverless production environments
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Validate configuration
const isConfigValid = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
};

// Initialize Firebase app (singleton pattern)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

export const initializeFirebase = (): { app: FirebaseApp; auth: Auth; googleProvider: GoogleAuthProvider } => {
  // Return existing instances if already initialized
  if (app && auth && googleProvider) {
    return { app, auth, googleProvider };
  }

  // Check if Firebase is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    if (!isConfigValid()) {
      throw new Error('Firebase configuration is missing. Please check your environment variables.');
    }
    app = initializeApp(firebaseConfig);
  }

  // Initialize auth
  auth = getAuth(app);

  // Set persistence to LOCAL (works in both dev and production)
  if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('Failed to set Firebase persistence:', error);
    });
  }

  // Initialize Google provider
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  googleProvider.addScope('email');
  googleProvider.addScope('profile');

  return { app, auth, googleProvider };
};

// Get Firebase instances (lazy initialization)
export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    const { auth: initializedAuth } = initializeFirebase();
    return initializedAuth;
  }
  return auth;
};

export const getGoogleProvider = (): GoogleAuthProvider => {
  if (!googleProvider) {
    const { googleProvider: initializedProvider } = initializeFirebase();
    return initializedProvider;
  }
  return googleProvider;
};

// Initialize on module load (client-side only)
if (typeof window !== 'undefined') {
  try {
    initializeFirebase();
    console.log('✅ Firebase client initialized');
  } catch (error) {
    console.error('❌ Firebase client initialization failed:', error);
  }
}

// Export for backward compatibility
export { auth, googleProvider };
export default app;



