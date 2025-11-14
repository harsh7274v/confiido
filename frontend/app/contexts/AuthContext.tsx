'use client';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  redirecting: boolean;
  logoutLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Set to true initially to wait for auth state
  const [redirecting, setRedirecting] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Track intentional logout
  const isLoggingOutRef = useRef(false); // Ref to track logout without causing re-renders
  const router = useRouter();

  // Function to check if session is expired (24 hours)
  const isSessionExpired = (): boolean => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      return true; // Server-side, consider expired
    }
    
    const sessionTimestamp = localStorage.getItem('sessionTimestamp');
    if (!sessionTimestamp) return true;
    
    const sessionTime = parseInt(sessionTimestamp);
    const currentTime = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    return (currentTime - sessionTime) > twentyFourHours;
  };

  // Function to set session timestamp
  const setSessionTimestamp = () => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;
    
    const timestamp = Date.now().toString();
    localStorage.setItem('sessionTimestamp', timestamp);
    console.log('✅ Session timestamp set for 24-hour validity:', new Date(parseInt(timestamp)).toLocaleString());
  };

  // Function to refresh session timestamp (extends the 24-hour window)
  const refreshSessionTimestamp = () => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;
    
    const existingTimestamp = localStorage.getItem('sessionTimestamp');
    if (existingTimestamp) {
      const newTimestamp = Date.now().toString();
      localStorage.setItem('sessionTimestamp', newTimestamp);
      console.log('🔄 Session refreshed, new expiry:', new Date(parseInt(newTimestamp) + 24 * 60 * 60 * 1000).toLocaleString());
    }
  };

  // Function to clear session
  const clearSession = () => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('token');
    localStorage.removeItem('sessionTimestamp');
    localStorage.removeItem('userRole');
    console.log('🗑️ Session cleared from localStorage');
  };

  // Handle PWA app visibility changes (when switching apps or closing/opening)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 App became visible, checking authentication state...');
        // Restore session from localStorage if it exists
        const token = localStorage.getItem('token');
        const sessionTimestamp = localStorage.getItem('sessionTimestamp');
        
        if (token && sessionTimestamp && !isSessionExpired()) {
          console.log('✅ Valid session found in localStorage, restoring authentication');
          // Force Firebase to check auth state again
          // The onAuthStateChanged will handle the rest
        } else if (token && sessionTimestamp && isSessionExpired()) {
          console.log('⏰ Session expired while app was in background');
          clearSession();
        }
      }
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      console.log('📱 Page shown (PWA restored), checking authentication...');
      // Restore session from localStorage
      const token = localStorage.getItem('token');
      const sessionTimestamp = localStorage.getItem('sessionTimestamp');
      
      if (token && sessionTimestamp && !isSessionExpired()) {
        console.log('✅ Valid session found, authentication restored');
      } else if (token && sessionTimestamp && isSessionExpired()) {
        console.log('⏰ Session expired');
        clearSession();
      }
    };

    const handleFocus = () => {
      console.log('📱 Window focused (app returned to foreground), checking authentication...');
      // Restore session from localStorage when window regains focus
      // This handles cases where app was in background (e.g., after opening Razorpay)
      const token = localStorage.getItem('token');
      const sessionTimestamp = localStorage.getItem('sessionTimestamp');
      
      if (token && sessionTimestamp && !isSessionExpired()) {
        console.log('✅ Valid session found on focus, authentication maintained');
      } else if (token && sessionTimestamp && isSessionExpired()) {
        console.log('⏰ Session expired while app was in background');
        clearSession();
      }
    };

    // Listen for visibility changes (app switching, minimizing, etc.)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for page show (PWA restoration from cache)
    window.addEventListener('pageshow', handlePageShow);
    
    // Listen for window focus (app returned to foreground)
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Skip all processing if we're in the middle of logging out
        if (isLoggingOutRef.current) {
          console.log('🚫 Logout in progress, skipping auth state processing');
          setUser(null);
          setLoading(false);
          return;
        }

        // CRITICAL CHECK: If there's no token in localStorage but Firebase user exists,
        // it means the user just logged out and we should NOT sync with backend
        if (typeof window !== 'undefined') {
          const existingToken = localStorage.getItem('token');
          if (!existingToken) {
            console.log('🚫 No token found but Firebase user exists - user just logged out, skipping sync');
            setUser(null);
            setLoading(false);
            // Sign out from Firebase as well to clean up
            await signOut(auth);
            return;
          }
        }

        // Check if session is expired only if there's a timestamp
        if (typeof window !== 'undefined') {
          const sessionTimestamp = localStorage.getItem('sessionTimestamp');
          if (sessionTimestamp && isSessionExpired()) {
            console.log('⏰ Session expired (24 hours), logging out user');
            clearSession();
            await signOut(auth);
            setUser(null);
            setLoading(false);
            return;
          }
        }

        try {
          // Send user data to your backend
          const token = await user.getIdToken();
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/auth/verify`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            try {
              const data = await response.json();
              console.log('✅ User synced with backend:', data.data?.user?.email);
              
              // Store the JWT token in localStorage for API calls
              if (data.data?.token && typeof window !== 'undefined') {
                localStorage.setItem('token', data.data.token);
                
                // Store user role for quick access
                if (data.data?.user?.role) {
                  localStorage.setItem('userRole', data.data.user.role);
                }
                
                // Get current session timestamp if it exists
                const sessionTimestamp = localStorage.getItem('sessionTimestamp');
                
                // Set session timestamp for 24-hour tracking (only if not already set)
                if (!sessionTimestamp) {
                  setSessionTimestamp();
                  console.log('🔐 JWT token stored in localStorage with new 24-hour session');
                } else {
                  // Refresh the session timestamp to extend the 24-hour window
                  refreshSessionTimestamp();
                  console.log('🔄 JWT token refreshed, session extended');
                }
              }
            } catch (jsonError) {
              console.error('❌ Failed to parse backend response:', jsonError);
              // Don't clear session on parse error, user is still authenticated
            }
          } else {
            console.error('❌ Failed to verify user with backend:', response.status);
            // Don't clear session if user is still authenticated via Firebase
          }
        } catch (error) {
          console.error('❌ Error syncing user with backend:', error);
          // Don't clear session if user is still authenticated via Firebase
        }
      } else {
        // User is not authenticated via Firebase
        // BUT check if we have a valid JWT token from email/password login
        // UNLESS we're in the middle of an intentional logout
        if (!isLoggingOut && typeof window !== 'undefined') {
          const existingToken = localStorage.getItem('token');
          const sessionTimestamp = localStorage.getItem('sessionTimestamp');
          
          // If we have a valid token and session, don't clear it!
          // This handles email/password logins that don't use Firebase auth
          // AND PWA restoration where Firebase auth might be lost but localStorage persists
          if (existingToken && sessionTimestamp && !isSessionExpired()) {
            console.log('✅ No Firebase user but valid JWT token found, keeping session (PWA restoration)');
            // Keep user as null (no Firebase user) but don't clear session
            // ProtectedRoute will allow access based on token
            setUser(null); // No Firebase user
            setLoading(false);
            return; // Don't clear session!
          } else if (existingToken && !sessionTimestamp) {
            // Token exists but no timestamp - might be from old session
            // Set timestamp now to prevent immediate expiration
            console.log('⚠️ Token found without timestamp, setting timestamp now');
            setSessionTimestamp();
            setUser(null);
            setLoading(false);
            return; // Don't clear session!
          }
        }
        
        // Only clear session if truly no authentication exists
        if (typeof window !== 'undefined') {
          const existingToken = localStorage.getItem('token');
          if (!existingToken) {
            clearSession();
            console.log('👋 User logged out, session cleared');
          } else {
            console.log('⚠️ Firebase user lost but token exists - keeping session for PWA');
          }
        }
      }
      setUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

  // Separate effect for session expiration check
  useEffect(() => {
    // Only set up interval if user is logged in and we're in the browser
    if (!user || typeof window === 'undefined') return;

    // Check session validity every 5 minutes
    const sessionCheckInterval = setInterval(() => {
      if (typeof window === 'undefined') return;
      
      const sessionTimestamp = localStorage.getItem('sessionTimestamp');
      const token = localStorage.getItem('token');
      
      // Only check expiration if there's a timestamp and token
      if (sessionTimestamp && token) {
        if (isSessionExpired()) {
          console.log('⏰ Session expired during use (24 hours elapsed), logging out user');
          clearSession();
          signOut(auth);
          // Optionally redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        } else {
          // Log remaining time
          const remainingTime = (parseInt(sessionTimestamp) + 24 * 60 * 60 * 1000) - Date.now();
          const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
          console.log(`⏳ Session valid for ${remainingHours} more hours`);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      clearInterval(sessionCheckInterval);
    };
  }, [user]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      
      // Navigate to dashboard on successful sign in
      if (result.user) {
        try {
          // Show redirecting spinner
          setRedirecting(true);
          
          // Get user token and verify with backend to get role
          const token = await result.user.getIdToken();
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/auth/verify`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            try {
              const data = await response.json();
              const userRole = data.data?.user?.role;
              
              // Store the JWT token and set session timestamp
              if (data.data?.token && typeof window !== 'undefined') {
                localStorage.setItem('token', data.data.token);
                setSessionTimestamp();
                console.log('🔐 JWT token stored with 24-hour session for Google sign-in');
              }
              
              // Store user role
              if (userRole && typeof window !== 'undefined') {
                localStorage.setItem('userRole', userRole);
              }
              
              // Redirect based on role
              if (userRole === "expert") {
                router.push("/mentor/dashboard");
              } else {
                router.push("/dashboard");
              }
            } catch (jsonError) {
              console.error('Failed to parse role verification response:', jsonError);
              // Fallback to regular dashboard
              router.push('/dashboard');
            }
          } else {
            // Fallback to regular dashboard if verification fails
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error verifying user role:', error);
          // Fallback to regular dashboard
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      setLogoutLoading(true);
      
      // Clear session data FIRST (token, timestamp, and user role)
      // This is the key - once cleared, onAuthStateChanged won't sync with backend
      console.log('🗑️ Clearing session data from localStorage...');
      clearSession();
      
      console.log('🔥 Signing out from Firebase...');
      await signOut(auth);
      console.log('✅ Firebase sign out completed');
      
      // Use window.location for a hard redirect to ensure clean state
      console.log('➡️ Redirecting to login page...');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      console.log('✅ Logout process completed successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      // Ensure session is cleared even if logout fails
      clearSession();
      // Still try to redirect
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, redirecting, logoutLoading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
