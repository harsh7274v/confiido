'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'user' | 'expert'; // Optional role requirement
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Function to check if session is expired (24 hours)
  const isSessionExpired = (): boolean => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      return true; // Server-side, consider expired
    }
    
    const sessionTimestamp = localStorage.getItem('sessionTimestamp');
    const token = localStorage.getItem('token');
    
    // If there's a token but no timestamp, consider it valid
    // (timestamp will be set by auth context)
    if (token && !sessionTimestamp) {
      console.log('✅ Token found without timestamp, allowing access (will be set by AuthContext)');
      return false;
    }
    
    // If no timestamp at all, consider expired
    if (!sessionTimestamp) {
      console.log('❌ No session timestamp found, session expired');
      return true;
    }
    
    const sessionTime = parseInt(sessionTimestamp);
    const currentTime = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const isExpired = (currentTime - sessionTime) > twentyFourHours;
    
    if (isExpired) {
      console.log('⏰ Session expired: Set at', new Date(sessionTime).toLocaleString());
    } else {
      const remainingHours = Math.floor((twentyFourHours - (currentTime - sessionTime)) / (60 * 60 * 1000));
      console.log(`✅ Session valid for ${remainingHours} more hours`);
    }
    
    return isExpired;
  };

  useEffect(() => {
    const checkAuth = () => {
      // Only run on client side after mount
      if (!isMounted || typeof window === 'undefined') {
        console.log('⚠️ Not mounted yet or server-side, skipping auth check');
        return;
      }
      
      const token = localStorage.getItem('token');
      const sessionTimestamp = localStorage.getItem('sessionTimestamp');
      const userRole = localStorage.getItem('userRole');
      
      console.log('🔍 ProtectedRoute - Checking authentication:', { 
        hasUser: !!user, 
        hasToken: !!token, 
        hasTimestamp: !!sessionTimestamp,
        userRole,
        loading,
        isMounted
      });
      
      // If still loading auth state and we have a token, consider authenticated temporarily
      if (loading && token && !isSessionExpired()) {
        console.log('⏳ Auth still loading but valid token found, allowing access');
        setIsAuthenticated(true);
        setIsAuthorized(requireRole ? userRole === requireRole : true);
        return;
      }
      
      // If user is logged in via Firebase, they're authenticated
      if (user) {
        console.log('✅ Firebase user authenticated:', user.email);
        
        // Only check session expiration if there's a timestamp
        if (sessionTimestamp && isSessionExpired()) {
          console.log('❌ Session expired (24 hours), denying access');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('sessionTimestamp');
            localStorage.removeItem('userRole');
          }
          setIsAuthenticated(false);
          setIsAuthorized(false);
          return;
        }
        
        // Check role-based authorization if required
        if (requireRole) {
          const hasRequiredRole = userRole === requireRole;
          console.log(`🔐 Role check: Required="${requireRole}", User="${userRole}", Authorized=${hasRequiredRole}`);
          setIsAuthorized(hasRequiredRole);
        } else {
          setIsAuthorized(true);
        }
        
        setIsAuthenticated(true);
        return;
      }
      
      // If no user but there's a valid token, allow access
      if (token) {
        console.log('🔑 Token found in localStorage');
        
        // If there's a token but no timestamp, allow access (timestamp will be set by auth context)
        if (!sessionTimestamp) {
          console.log('✅ Token without timestamp, allowing access (AuthContext will set it)');
          
          // Check role if required
          if (requireRole) {
            const hasRequiredRole = userRole === requireRole;
            console.log(`🔐 Role check: Required="${requireRole}", User="${userRole}", Authorized=${hasRequiredRole}`);
            setIsAuthorized(hasRequiredRole);
          } else {
            setIsAuthorized(true);
          }
          
          setIsAuthenticated(true);
          return;
        }
        
        // Check if session is expired
        if (isSessionExpired()) {
          console.log('❌ Session expired (24 hours), denying access');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('sessionTimestamp');
            localStorage.removeItem('userRole');
          }
          setIsAuthenticated(false);
          setIsAuthorized(false);
          return;
        }
        
        // Check role if required
        if (requireRole) {
          const hasRequiredRole = userRole === requireRole;
          console.log(`🔐 Role check: Required="${requireRole}", User="${userRole}", Authorized=${hasRequiredRole}`);
          setIsAuthorized(hasRequiredRole);
        } else {
          setIsAuthorized(true);
        }
        
        console.log('✅ Valid token and session found, allowing access');
        setIsAuthenticated(true);
        return;
      }
      
      // If no user and no token, not authenticated
      console.log('❌ No authentication found, denying access');
      setIsAuthenticated(false);
      setIsAuthorized(false);
    };

    // Check immediately when auth loading is complete and component is mounted
    if (!loading && isMounted) {
      checkAuth();
    } else if (loading && isMounted) {
      // Even while loading, check if we have valid token to show content immediately
      checkAuth();
    }
  }, [user, loading, requireRole, isMounted]);

  // Re-check authentication when app becomes visible (PWA restoration)
  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 ProtectedRoute: App became visible, re-checking authentication...');
        // Re-check authentication when app becomes visible
        const token = localStorage.getItem('token');
        const sessionTimestamp = localStorage.getItem('sessionTimestamp');
        
        if (token && sessionTimestamp) {
          // Force re-check by calling checkAuth logic
          const isExpired = (() => {
            if (!sessionTimestamp) return true;
            const sessionTime = parseInt(sessionTimestamp);
            const currentTime = Date.now();
            const twentyFourHours = 24 * 60 * 60 * 1000;
            return (currentTime - sessionTime) > twentyFourHours;
          })();
          
          if (!isExpired) {
            console.log('✅ ProtectedRoute: Valid session found on visibility change');
            // Authentication is still valid, no action needed
            // The existing useEffect will handle state updates
          } else {
            console.log('⏰ ProtectedRoute: Session expired on visibility change');
            setIsAuthenticated(false);
            setIsAuthorized(false);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMounted]);

  // Show nothing while checking authentication (but allow access if token exists)
  if (!isMounted || isAuthenticated === null) {
    console.log('⏳ Still checking authentication state...');
    return null; // Return nothing during SSR and initial client render
  }

  // Show 404 error if not authenticated
  if (!isAuthenticated) {
    console.log('🚫 Rendering 404 - Not authenticated');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center px-6 py-12 bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 text-base mb-6 leading-relaxed">
            This page is protected and requires authentication. Please log in to access this content.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Go to Login
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show 403 error if authenticated but not authorized (wrong role)
  if (!isAuthorized) {
    console.log('🚫 Rendering 403 - Not authorized for this role');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center px-6 py-12 bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Access Forbidden</h2>
          <p className="text-gray-600 text-base mb-6 leading-relaxed">
            You don't have permission to access this page. Please contact support if you believe this is an error.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated and authorized, show the protected content
  console.log('✅ Rendering protected content');
  return <>{children}</>;
}
