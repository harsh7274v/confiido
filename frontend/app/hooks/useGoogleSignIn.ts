/**
 * Google Sign-In Hook
 * Handles Google authentication using Firebase
 */

'use client';

import { useState } from 'react';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { getFirebaseAuth, getGoogleProvider } from '../config/firebase.client';
import { useRouter } from 'next/navigation';

interface UseGoogleSignInReturn {
  signIn: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useGoogleSignIn = (): UseGoogleSignInReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const signIn = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const auth = getFirebaseAuth();
      const provider = getGoogleProvider();

      // Use popup for better UX (works in most browsers)
      // Fallback to redirect if popup is blocked
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const idToken = await user.getIdToken();

        console.log('✅ Google sign-in successful:', user.email);

        // Send token to backend for verification and JWT generation
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/auth/firebase/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || 'Failed to verify with backend';
          
          // Provide helpful error message for Firebase configuration issues
          if (errorMessage.includes('Firebase authentication is not configured')) {
            throw new Error('Firebase is not configured on the server. Please contact support or check server configuration.');
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Store JWT token and session data
        if (data.data?.token && typeof window !== 'undefined') {
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('sessionTimestamp', Date.now().toString());
          
          if (data.data?.user?.role) {
            localStorage.setItem('userRole', data.data.user.role);
          }

          console.log('✅ Session stored, redirecting to dashboard');

          // Redirect based on role
          const userRole = data.data?.user?.role;
          if (userRole === 'expert') {
            router.push('/mentor/dashboard');
          } else {
            router.push('/dashboard');
          }
        }
      } catch (popupError: any) {
        // If popup is blocked, use redirect
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
          console.log('🔄 Popup blocked, using redirect method...');
          await signInWithRedirect(auth, provider);
          // User will be redirected, getRedirectResult will handle the rest
          return;
        }
        throw popupError;
      }
    } catch (err: any) {
      console.error('❌ Google sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading, error };
};

// Hook to handle redirect result (call this in a useEffect on mount)
export const useGoogleRedirectResult = () => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleRedirectResult = async () => {
    try {
      setLoading(true);
      const auth = getFirebaseAuth();
      const { getRedirectResult } = await import('firebase/auth');
      const result = await getRedirectResult(auth);

      if (result && result.user) {
        console.log('✅ Google redirect successful:', result.user.email);
        const idToken = await result.user.getIdToken();

        // Send token to backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/auth/firebase/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || 'Failed to verify with backend';
          
          // Provide helpful error message for Firebase configuration issues
          if (errorMessage.includes('Firebase authentication is not configured')) {
            throw new Error('Firebase is not configured on the server. Please contact support or check server configuration.');
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Store session data
        if (data.data?.token && typeof window !== 'undefined') {
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('sessionTimestamp', Date.now().toString());
          
          if (data.data?.user?.role) {
            localStorage.setItem('userRole', data.data.user.role);
          }

          // Redirect based on role
          const userRole = data.data?.user?.role;
          if (userRole === 'expert') {
            router.push('/mentor/dashboard');
          } else {
            router.push('/dashboard');
          }
        }
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      console.error('❌ Redirect result error:', err);
      setLoading(false);
    }
  };

  return { handleRedirectResult, loading };
};

