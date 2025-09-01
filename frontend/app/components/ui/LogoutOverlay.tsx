'use client';
import React, { useState, useEffect } from 'react';
import { LogOut, Loader2, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LogoutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const LogoutOverlay: React.FC<LogoutOverlayProps> = ({ 
  isOpen, 
  onClose, 
  className = '' 
}) => {
  const { logout, logoutLoading } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen && !logoutLoading) {
      setProgress(0);
      setShowSuccess(false);
    }
  }, [isOpen, logoutLoading]);

  useEffect(() => {
    if (logoutLoading) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 80); // 800ms total duration

      return () => clearInterval(interval);
    }
  }, [logoutLoading]);

  const handleLogout = async () => {
    try {
      await logout();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Logout failed:', error);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform animate-in zoom-in-95 duration-300">
        <div className="text-center space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">Logout</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={logoutLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Icon and Status */}
          <div className="flex justify-center">
            {logoutLoading ? (
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <LogOut className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            ) : showSuccess ? (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <LogOut className="h-8 w-8 text-red-600" />
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {logoutLoading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-100 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">Logging out... {progress}%</p>
            </div>
          )}

          {/* Status Text */}
          <div className="space-y-2">
            {logoutLoading ? (
              <p className="text-gray-600">Please wait while we log you out...</p>
            ) : showSuccess ? (
              <div className="space-y-2">
                <p className="text-green-600 font-medium">Successfully logged out!</p>
                <p className="text-sm text-gray-500">Redirecting to home page...</p>
              </div>
            ) : (
              <p className="text-gray-600">Are you sure you want to logout?</p>
            )}
          </div>

          {/* Action Buttons */}
          {!logoutLoading && !showSuccess && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogoutOverlay;
