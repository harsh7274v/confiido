'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Debug component to display authentication state
 * Add this to your dashboard during development to see auth status
 * 
 * Usage: <AuthDebugPanel />
 */
export default function AuthDebugPanel() {
  const { user, loading } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    const updateSessionInfo = () => {
      // Check if we're in the browser
      if (typeof window === 'undefined') {
        return;
      }
      
      const token = localStorage.getItem('token');
      const sessionTimestamp = localStorage.getItem('sessionTimestamp');
      const userRole = localStorage.getItem('userRole');
      
      let remainingTime = 'N/A';
      let isExpired = false;
      
      if (sessionTimestamp) {
        const sessionTime = parseInt(sessionTimestamp);
        const currentTime = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const remaining = (sessionTime + twentyFourHours) - currentTime;
        
        isExpired = remaining <= 0;
        
        if (!isExpired) {
          const hours = Math.floor(remaining / (60 * 60 * 1000));
          const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
          remainingTime = `${hours}h ${minutes}m`;
        } else {
          remainingTime = 'EXPIRED';
        }
      }
      
      setSessionInfo({
        hasUser: !!user,
        userEmail: user?.email || 'N/A',
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'N/A',
        hasTimestamp: !!sessionTimestamp,
        sessionStarted: sessionTimestamp 
          ? new Date(parseInt(sessionTimestamp)).toLocaleString() 
          : 'N/A',
        userRole: userRole || 'N/A',
        remainingTime,
        isExpired,
        loading,
        isAuthenticated: (!!user || !!token) && !isExpired
      });
    };
    
    updateSessionInfo();
    const interval = setInterval(updateSessionInfo, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, [user, loading]);

  if (!sessionInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-2xl max-w-sm text-xs font-mono z-50 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">🔐 Auth Debug Panel</h3>
        <div className={`px-2 py-1 rounded text-xs font-bold ${
          sessionInfo.isAuthenticated ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {sessionInfo.isAuthenticated ? '✓ AUTH' : '✗ NO AUTH'}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between border-b border-gray-700 pb-1">
          <span className="text-gray-400">Loading:</span>
          <span className={sessionInfo.loading ? 'text-yellow-400' : 'text-green-400'}>
            {sessionInfo.loading ? 'YES' : 'NO'}
          </span>
        </div>
        
        <div className="flex justify-between border-b border-gray-700 pb-1">
          <span className="text-gray-400">Firebase User:</span>
          <span className={sessionInfo.hasUser ? 'text-green-400' : 'text-red-400'}>
            {sessionInfo.hasUser ? '✓' : '✗'}
          </span>
        </div>
        
        {sessionInfo.hasUser && (
          <div className="flex justify-between border-b border-gray-700 pb-1">
            <span className="text-gray-400">Email:</span>
            <span className="text-blue-400 truncate ml-2" title={sessionInfo.userEmail}>
              {sessionInfo.userEmail}
            </span>
          </div>
        )}
        
        <div className="flex justify-between border-b border-gray-700 pb-1">
          <span className="text-gray-400">Token:</span>
          <span className={sessionInfo.hasToken ? 'text-green-400' : 'text-red-400'}>
            {sessionInfo.hasToken ? '✓' : '✗'}
          </span>
        </div>
        
        <div className="flex justify-between border-b border-gray-700 pb-1">
          <span className="text-gray-400">Timestamp:</span>
          <span className={sessionInfo.hasTimestamp ? 'text-green-400' : 'text-red-400'}>
            {sessionInfo.hasTimestamp ? '✓' : '✗'}
          </span>
        </div>
        
        {sessionInfo.hasTimestamp && (
          <>
            <div className="flex justify-between border-b border-gray-700 pb-1">
              <span className="text-gray-400">Started:</span>
              <span className="text-gray-300 text-[10px]">
                {sessionInfo.sessionStarted}
              </span>
            </div>
            
            <div className="flex justify-between border-b border-gray-700 pb-1">
              <span className="text-gray-400">Remaining:</span>
              <span className={sessionInfo.isExpired ? 'text-red-400 font-bold' : 'text-green-400'}>
                {sessionInfo.remainingTime}
              </span>
            </div>
          </>
        )}
        
        <div className="flex justify-between border-b border-gray-700 pb-1">
          <span className="text-gray-400">Role:</span>
          <span className="text-purple-400 uppercase">
            {sessionInfo.userRole}
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-700 text-[10px] text-gray-500 text-center">
        Updates every second • Dev only
      </div>
    </div>
  );
}
