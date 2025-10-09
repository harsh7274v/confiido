'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(false); // Changed to false to prevent blocking
  const [redirecting, setRedirecting] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
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
            const data = await response.json();
            console.log('User synced with backend:', data);
            
            // Store the JWT token in localStorage for API calls
            if (data.data?.token) {
              localStorage.setItem('token', data.data.token);
              console.log('JWT token stored in localStorage');
            }
          } else {
            console.error('Failed to verify user with backend:', response.status);
            // Clear any existing token if verification fails
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Error syncing user with backend:', error);
          // Clear any existing token if sync fails
          localStorage.removeItem('token');
        }
      } else {
        // User is not authenticated, clear the token
        localStorage.removeItem('token');
        console.log('User logged out, token cleared');
      }
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
            const data = await response.json();
            const userRole = data.data?.user?.role;
            
            // Redirect based on role
            if (userRole === "expert") {
              router.push("/mentor/dashboard");
            } else {
              router.push("/dashboard");
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
      console.log('Starting logout process...');
      setLogoutLoading(true);
      
      // Clear any stored tokens first
      console.log('Clearing localStorage tokens...');
      localStorage.removeItem('token');
      
      // Add a small delay for better UX
      console.log('Waiting for UX delay...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Signing out from Firebase...');
      await signOut(auth);
      
      // Redirect to login page after logout
      console.log('Redirecting to login page...');
      router.push('/login');
      console.log('Logout process completed successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      // Ensure token is cleared even if logout fails
      localStorage.removeItem('token');
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
