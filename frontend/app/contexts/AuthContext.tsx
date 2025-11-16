'use client';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase.client';
import { useGoogleRedirectResult } from '../hooks/useGoogleSignIn';
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
  const isProcessingRedirectRef = useRef(false); // Ref to track Google redirect processing
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
    const timeElapsed = currentTime - sessionTime;
    
    console.log('⏰ Session check:', {
      sessionStarted: new Date(sessionTime).toLocaleString(),
      currentTime: new Date(currentTime).toLocaleString(),
      hoursElapsed: (timeElapsed / (60 * 60 * 1000)).toFixed(2),
      isExpired: timeElapsed > twentyFourHours
    });
    
    return timeElapsed > twentyFourHours;
  };

  // Function to set session timestamp
  const setSessionTimestamp = () => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;
    
    const timestamp = Date.now().toString();
    localStorage.setItem('sessionTimestamp', timestamp);
    localStorage.setItem('lastActivity', timestamp);
    console.log('✅ Session timestamp set for 24-hour validity:', new Date(parseInt(timestamp)).toLocaleString());
  };

  // Function to refresh session timestamp (extends the 24-hour window)
  const refreshSessionTimestamp = () => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;
    
    const existingTimestamp = localStorage.getItem('sessionTimestamp');
    if (existingTimestamp && !isSessionExpired()) {
      const newTimestamp = Date.now().toString();
      localStorage.setItem('sessionTimestamp', newTimestamp);
      localStorage.setItem('lastActivity', newTimestamp);
      console.log('🔄 Session refreshed, new expiry:', new Date(parseInt(newTimestamp) + 24 * 60 * 60 * 1000).toLocaleString());
    }
  };

  // Update last activity on user interaction
  const updateLastActivity = () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (token) {
      localStorage.setItem('lastActivity', Date.now().toString());
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

  // Track user activity and auto-refresh session
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let activityTimer: NodeJS.Timeout;
    const ACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

    // Update activity on user interactions
    const handleUserActivity = () => {
      updateLastActivity();
      
      // Clear existing timer
      if (activityTimer) {
        clearTimeout(activityTimer);
      }
      
      // Set new timer to auto-refresh session if user is active
      activityTimer = setTimeout(() => {
        const lastActivity = localStorage.getItem('lastActivity');
        if (lastActivity) {
          const timeSinceActivity = Date.now() - parseInt(lastActivity);
          // If user was active in last 30 minutes, refresh session
          if (timeSinceActivity < 30 * 60 * 1000) {
            refreshSessionTimestamp();
          }
        }
      }, ACTIVITY_CHECK_INTERVAL);
    };

    // Listen for various user activities
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      if (activityTimer) {
        clearTimeout(activityTimer);
      }
    };
  }, []);

  // Listen for service worker updates
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleSWUpdate = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('🔄 New version available:', event.data.version);
        // Optionally show a notification to user
        // You can add a toast/notification here
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSWUpdate);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSWUpdate);
    };
  }, []);

  // Handle Google Sign-In redirect result using the new hook
  const { handleRedirectResult, loading: redirectLoading } = useGoogleRedirectResult();
  
  useEffect(() => {
    handleRedirectResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (redirectLoading) {
      setRedirecting(true);
    } else {
      setRedirecting(false);
    }
  }, [redirectLoading]);

  useEffect(() => {
    setLoading(true);
    
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Skip all processing if we're in the middle of logging out
        if (isLoggingOutRef.current) {
          console.log('🚫 Logout in progress, skipping auth state processing');
          setUser(null);
          setLoading(false);
          return;
        }

        // CRITICAL: If we're processing a Google redirect, skip the token check
        // The redirect handler will set the token, so we need to wait for it
        if (isProcessingRedirectRef.current) {
          console.log('🔄 Google redirect in progress, waiting for token to be set...');
          // Don't set user yet, wait for redirect handler to complete
          setLoading(false);
          return;
        }

        // CRITICAL CHECK: If there's no token in localStorage but Firebase user exists,
        // it means the user just logged out and we should NOT sync with backend
        // BUT only if we're not processing a redirect
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
          // Check if we just signed up - if so, wait a bit for token to be available
          const justSignedUp = sessionStorage.getItem('justSignedUp');
          if (justSignedUp === 'true') {
            console.log('🆕 Just signed up, checking for token...');
            
            // Check for token immediately first
            let token = localStorage.getItem('token');
            let timestamp = localStorage.getItem('sessionTimestamp');
            
            // If token not found immediately, retry a few times
            if (!token || !timestamp) {
              let retryCount = 0;
              const maxRetries = 10; // More retries for slower systems
              
              const checkForToken = () => {
                token = localStorage.getItem('token');
                timestamp = localStorage.getItem('sessionTimestamp');
                
                if (token && timestamp) {
                  console.log('✅ Token found after signup retry, proceeding');
                  sessionStorage.removeItem('justSignedUp');
                  // Token found, will continue with normal check below
                  return;
                } else if (retryCount < maxRetries) {
                  retryCount++;
                  console.log(`⏳ Token not found yet, retry ${retryCount}/${maxRetries}...`);
                  setTimeout(checkForToken, 200);
                  return;
                } else {
                  console.log('⚠️ Token not found after signup retries, but keeping flag for now');
                  // Don't clear flag yet, might be a timing issue
                  setLoading(false);
                  return;
                }
              };
              
              // Start retry process
              setTimeout(checkForToken, 100);
              // Return early, will check again when token is found
              setLoading(false);
              return;
            } else {
              // Token found immediately, clear flag and continue
              console.log('✅ Token found immediately after signup');
              sessionStorage.removeItem('justSignedUp');
              // Continue with normal token check below
            }
          }
          
          const existingToken = localStorage.getItem('token');
          const sessionTimestamp = localStorage.getItem('sessionTimestamp');
          
          console.log('🔍 Checking for JWT token (no Firebase user):', {
            hasToken: !!existingToken,
            hasTimestamp: !!sessionTimestamp,
            tokenPreview: existingToken ? existingToken.substring(0, 20) + '...' : 'none',
            justSignedUp: justSignedUp === 'true'
          });
          
          // If we have a valid token and session, don't clear it!
          // This handles email/password logins that don't use Firebase auth
          // AND PWA restoration where Firebase auth might be lost but localStorage persists
          if (existingToken && sessionTimestamp) {
            const isExpired = isSessionExpired();
            console.log('📊 Session check:', {
              hasToken: true,
              hasTimestamp: true,
              isExpired,
              timestamp: sessionTimestamp
            });
            
            if (!isExpired) {
              console.log('✅ No Firebase user but valid JWT token found, keeping session (email/password login)');
              // Keep user as null (no Firebase user) but don't clear session
              // ProtectedRoute will allow access based on token
              setUser(null); // No Firebase user
              setLoading(false);
              return; // Don't clear session!
            } else {
              console.log('⏰ Session expired, but keeping token for now (user might be on signup/login page)');
              // Don't clear session here - let the individual pages handle expired sessions
            }
          } else if (existingToken && !sessionTimestamp) {
            // Token exists but no timestamp - might be from old session or just created
            // Set timestamp now to prevent immediate expiration
            console.log('⚠️ Token found without timestamp, setting timestamp now');
            setSessionTimestamp();
            setUser(null);
            setLoading(false);
            return; // Don't clear session!
          } else if (!existingToken && sessionTimestamp) {
            // Timestamp exists but no token - clean up
            console.log('🧹 Cleaning up orphaned timestamp');
            localStorage.removeItem('sessionTimestamp');
          }
        }
        
        // Only clear session if truly no authentication exists
        if (typeof window !== 'undefined') {
          const existingToken = localStorage.getItem('token');
          if (!existingToken) {
            // Only clear if we're not in the middle of a signup/login flow
            // Check if we're on signup or login page
            const currentPath = window.location.pathname;
            const isAuthPage = currentPath === '/signup' || currentPath === '/login';
            
            if (!isAuthPage) {
              clearSession();
              console.log('👋 User logged out, session cleared');
            } else {
              console.log('📍 On auth page, not clearing session yet');
            }
          } else {
            console.log('⚠️ Firebase user lost but token exists - keeping session');
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

    const auth = getFirebaseAuth();

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
    // This is now handled by the GoogleSignInButton component using useGoogleSignIn hook
    // Keeping this for backward compatibility but it won't be used
    console.log('⚠️ signInWithGoogle called - use GoogleSignInButton component instead');
  };

  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      setLogoutLoading(true);
      
      // Clear session data FIRST (token, timestamp, and user role)
      // This is the key - once cleared, onAuthStateChanged won't sync with backend
      console.log('🗑️ Clearing session data from localStorage...');
      clearSession();
      
      // Clear service worker caches
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        console.log('🗑️ Clearing service worker caches...');
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      }
      
      console.log('🔥 Signing out from Firebase...');
      const auth = getFirebaseAuth();
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
