"use client";

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useBookingTimeout } from '../hooks/useBookingTimeout';
import { timeoutApi } from '../services/timeoutApi';

interface TimeoutContextType {
  timeouts: Record<string, any>;
  addTimeout: (bookingId: string, sessionId: string, timeoutAt: string) => void;
  updateTimeoutStatus: (bookingId: string, sessionId: string, status: 'active' | 'expired' | 'completed') => void;
  removeTimeout: (bookingId: string, sessionId: string) => void;
  getTimeout: (bookingId: string, sessionId: string) => any;
  formatCountdown: (seconds: number) => string;
  isExpired: (bookingId: string, sessionId: string) => boolean;
  isInitialized: boolean;
  syncWithBackend: () => Promise<void>;
}

const TimeoutContext = createContext<TimeoutContextType | undefined>(undefined);

export const useTimeout = () => {
  const context = useContext(TimeoutContext);
  if (context === undefined) {
    throw new Error('useTimeout must be used within a TimeoutProvider');
  }
  return context;
};

export const TimeoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const timeoutHook = useBookingTimeout();

  // Sync with backend when component mounts
  useEffect(() => {
    if (timeoutHook.isInitialized) {
      syncWithBackend();
    }
  }, [timeoutHook.isInitialized]);

  // Sync with backend periodically
  useEffect(() => {
    if (!timeoutHook.isInitialized) return;

    const interval = setInterval(() => {
      syncWithBackend();
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(interval);
  }, [timeoutHook.isInitialized]);

  const syncWithBackend = useCallback(async () => {
    try {
      // Check if user is authenticated before attempting to sync
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found, skipping timeout sync');
        return;
      }

      const activeTimeouts = timeoutHook.getActiveTimeouts();
      
      if (activeTimeouts.length > 0) {
        const timeoutData = activeTimeouts.map(timeout => ({
          bookingId: timeout.bookingId,
          sessionId: timeout.sessionId,
          timeoutAt: timeout.timeoutAt
        }));

        const response = await timeoutApi.syncTimeoutState(timeoutData);
        
        if (response.success && response.data.expiredSessions) {
          // Update local state for expired sessions
          response.data.expiredSessions.forEach((expiredSession: any) => {
            timeoutHook.updateTimeoutStatus(
              expiredSession.bookingId,
              expiredSession.sessionId,
              'expired'
            );
          });
        }
      }
    } catch (error) {
      console.error('Error syncing timeout state with backend:', error);
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes('No authentication token found')) {
          console.log('No authentication token found, skipping timeout sync');
        } else if (error.message.includes('401')) {
          console.log('Authentication failed, user may need to log in again');
        }
      }
    }
  }, [timeoutHook]);

  const value: TimeoutContextType = {
    ...timeoutHook,
    syncWithBackend
  };

  return (
    <TimeoutContext.Provider value={value}>
      {children}
    </TimeoutContext.Provider>
  );
};
