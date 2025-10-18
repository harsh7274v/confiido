'use client';
import React, { useState } from 'react';
import { LogOut, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LogoutOverlay from './LogoutOverlay';

interface LogoutButtonProps {
  className?: string;
  text?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  useOverlay?: boolean;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  className = '', 
  text = 'Logout',
  variant = 'default',
  size = 'md',
  useOverlay = false
}) => {
  const { logout, logoutLoading } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const baseClasses = "flex items-center justify-center gap-2 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    default: 'bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-sm hover:shadow-md',
    ghost: 'text-red-600 hover:bg-red-50 rounded-lg',
    outline: 'border border-red-300 text-red-600 hover:bg-red-50 rounded-lg'
  };

  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  const handleLogout = async () => {
    if (useOverlay) {
      setShowOverlay(true);
      return;
    }

    try {
      await logout();
      // Show success state briefly before redirect
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (showSuccess) {
    return (
      <div className={`${buttonClasses} bg-green-600 text-white transform scale-105 transition-all duration-300`}>
        <CheckCircle className="h-4 w-4 animate-pulse" />
        <span>Logged out successfully!</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleLogout}
        disabled={logoutLoading}
        className={`${buttonClasses} group hover:scale-105 transition-transform duration-200`}
      >
        {logoutLoading ? (
          <>
            <video autoPlay loop muted playsInline className="h-4 w-4 object-contain" style={{ pointerEvents: 'none' }}>
              <source src="/spinner.webm" type="video/webm" />
            </video>
            <span>Logging out...</span>
          </>
        ) : (
          <>
            <LogOut className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>{text}</span>
          </>
        )}
      </button>

      {useOverlay && (
        <LogoutOverlay 
          isOpen={showOverlay} 
          onClose={() => setShowOverlay(false)} 
        />
      )}
    </>
  );
};

export default LogoutButton;
