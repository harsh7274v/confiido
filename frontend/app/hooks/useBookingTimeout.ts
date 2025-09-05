import { useState, useEffect, useCallback, useRef } from 'react';

export interface BookingTimeout {
  bookingId: string;
  sessionId: string;
  timeoutAt: string;
  status: 'active' | 'expired' | 'completed';
  countdown: number;
}

export interface TimeoutUpdate {
  bookingId: string;
  sessionId: string;
  status: 'cancelled' | 'expired' | 'completed';
  reason?: string;
}

const TIMEOUT_STORAGE_KEY = 'booking_timeouts';

export const useBookingTimeout = () => {
  const [timeouts, setTimeouts] = useState<Record<string, BookingTimeout>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Load timeouts from localStorage on mount
  useEffect(() => {
    const loadTimeouts = () => {
      try {
        const stored = localStorage.getItem(TIMEOUT_STORAGE_KEY);
        if (stored) {
          const parsedTimeouts = JSON.parse(stored);
          const now = new Date();
          
          // Filter out expired timeouts and update countdowns
          const activeTimeouts: Record<string, BookingTimeout> = {};
          
          Object.entries(parsedTimeouts).forEach(([key, timeout]: [string, any]) => {
            const timeoutDate = new Date(timeout.timeoutAt);
            const timeLeft = Math.max(0, Math.floor((timeoutDate.getTime() - now.getTime()) / 1000));
            
            if (timeLeft > 0 && timeout.status === 'active') {
              activeTimeouts[key] = {
                ...timeout,
                countdown: timeLeft
              };
            }
          });
          
          setTimeouts(activeTimeouts);
        }
      } catch (error) {
        console.error('Error loading timeouts from localStorage:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadTimeouts();
  }, []);

  // Save timeouts to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(TIMEOUT_STORAGE_KEY, JSON.stringify(timeouts));
    }
  }, [timeouts, isInitialized]);

  // Countdown timer effect
  useEffect(() => {
    if (!isInitialized) return;
    // Guard against duplicate intervals (e.g., Strict Mode)
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = window.setInterval(() => {
      setTimeouts(prev => {
        const now = new Date();
        const updated = { ...prev };
        let hasActiveTimers = false;

        Object.keys(updated).forEach(key => {
          const timeout = updated[key];
          if (timeout.status === 'active') {
            const timeoutDate = new Date(timeout.timeoutAt);
            const timeLeft = Math.max(0, Math.floor((timeoutDate.getTime() - now.getTime()) / 1000));
            timeout.countdown = timeLeft;
            if (timeLeft > 0) {
              hasActiveTimers = true;
            } else {
              timeout.status = 'expired';
              timeout.countdown = 0;
              // Persist handled expiry key so timer won't restart later
              try {
                const stored = localStorage.getItem('handled_expiry_sessions');
                const handled: string[] = stored ? JSON.parse(stored) : [];
                if (!handled.includes(key)) {
                  handled.push(key);
                  localStorage.setItem('handled_expiry_sessions', JSON.stringify(handled));
                }
              } catch {}
            }
          }
        });

        return hasActiveTimers ? updated : {};
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isInitialized]);

  // Add a new timeout (idempotent: will not overwrite an existing active timer)
  const addTimeout = useCallback((bookingId: string, sessionId: string, timeoutAt: string) => {
    const now = new Date();
    const timeoutDate = new Date(timeoutAt);
    const timeLeft = Math.max(0, Math.floor((timeoutDate.getTime() - now.getTime()) / 1000));
    const key = `${bookingId}_${sessionId}`;

    console.log(`⏰ [TIMEOUT] Adding timeout for ${sessionId}:`, {
      timeoutAt: timeoutDate.toISOString(),
      now: now.toISOString(),
      timeLeft,
      key
    });

    // Do not add if this session was already handled as expired
    try {
      const stored = localStorage.getItem('handled_expiry_sessions');
      const handled: string[] = stored ? JSON.parse(stored) : [];
      if (handled.includes(key)) {
        console.log(`⏰ [TIMEOUT] Session ${sessionId} already handled, skipping`);
        return;
      }
    } catch {}

    if (timeLeft > 0) {
      setTimeouts(prev => {
        // If we already have a timeout for this key, keep the existing one
        if (prev[key]) {
          console.log(`⏰ [TIMEOUT] Timeout for ${sessionId} already exists, keeping existing`);
          return prev;
        }
        console.log(`⏰ [TIMEOUT] Creating new timeout for ${sessionId} with ${timeLeft} seconds`);
        return {
          ...prev,
          [key]: {
            bookingId,
            sessionId,
            timeoutAt,
            status: 'active',
            countdown: timeLeft
          }
        };
      });
    } else {
      console.log(`⏰ [TIMEOUT] Session ${sessionId} already expired, not adding timer`);
    }
  }, []);

  // Update timeout status
  const updateTimeoutStatus = useCallback((bookingId: string, sessionId: string, status: 'active' | 'expired' | 'completed') => {
    const key = `${bookingId}_${sessionId}`;
    setTimeouts(prev => {
      if (prev[key]) {
        return {
          ...prev,
          [key]: {
            ...prev[key],
            status,
            countdown: status === 'active' ? prev[key].countdown : 0
          }
        };
      }
      return prev;
    });
    if (status === 'expired') {
      // Persist handled expiry to prevent future restarts
      try {
        const stored = localStorage.getItem('handled_expiry_sessions');
        const handled: string[] = stored ? JSON.parse(stored) : [];
        if (!handled.includes(key)) {
          handled.push(key);
          localStorage.setItem('handled_expiry_sessions', JSON.stringify(handled));
        }
      } catch {}
    }
  }, []);

  // Remove a timeout
  const removeTimeout = useCallback((bookingId: string, sessionId: string) => {
    const key = `${bookingId}_${sessionId}`;
    setTimeouts(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // Get timeout for a specific booking/session
  const getTimeout = useCallback((bookingId: string, sessionId: string) => {
    return timeouts[`${bookingId}_${sessionId}`];
  }, [timeouts]);

  // Get all active timeouts
  const getActiveTimeouts = useCallback(() => {
    return Object.values(timeouts).filter(timeout => timeout.status === 'active');
  }, [timeouts]);

  // Format countdown time
  const formatCountdown = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Check if a booking is expired
  const isExpired = useCallback((bookingId: string, sessionId: string) => {
    const timeout = getTimeout(bookingId, sessionId);
    return timeout?.status === 'expired' || timeout?.countdown <= 0;
  }, [getTimeout]);

  return {
    timeouts,
    addTimeout,
    updateTimeoutStatus,
    removeTimeout,
    getTimeout,
    getActiveTimeouts,
    formatCountdown,
    isExpired,
    isInitialized
  };
};
