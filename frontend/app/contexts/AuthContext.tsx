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
    // Add a small delay to prevent immediate blocking
    const timer = setTimeout(() => {
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
            } else {
              console.error('Failed to verify user with backend:', response.status);
            }
          } catch (error) {
            console.error('Error syncing user with backend:', error);
          }
        }
        setUser(user);
        setLoading(false);
      });

      return unsubscribe;
    }, 100); // Small delay

    return () => {
      clearTimeout(timer);
    };
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
      setLogoutLoading(true);
      
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await signOut(auth);
      
      // Clear any stored tokens
      localStorage.removeItem('token');
      
      // Redirect to home page after logout
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
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
