/**
 * Session Management Utilities
 * Handles 24-hour session storage and validation in localStorage
 */

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const sessionManager = {
  /**
   * Set a new session with current timestamp
   * @param token - JWT token to store
   * @param userRole - User role (optional)
   */
  setSession: (token: string, userRole?: string): void => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      console.warn('⚠️ Cannot set session: Not in browser environment');
      return;
    }
    
    const timestamp = Date.now().toString();
    localStorage.setItem('token', token);
    localStorage.setItem('sessionTimestamp', timestamp);
    
    if (userRole) {
      localStorage.setItem('userRole', userRole);
    }
    
    const expiryDate = new Date(parseInt(timestamp) + SESSION_DURATION);
    console.log('✅ Session created:', {
      timestamp: new Date(parseInt(timestamp)).toLocaleString(),
      expiresAt: expiryDate.toLocaleString(),
      userRole: userRole || 'not set'
    });
  },

  /**
   * Refresh the session timestamp (extends the 24-hour window)
   */
  refreshSession: (): void => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      console.warn('⚠️ Cannot refresh session: Not in browser environment');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ Cannot refresh session: No token found');
      return;
    }

    const newTimestamp = Date.now().toString();
    localStorage.setItem('sessionTimestamp', newTimestamp);
    
    const expiryDate = new Date(parseInt(newTimestamp) + SESSION_DURATION);
    console.log('🔄 Session refreshed, new expiry:', expiryDate.toLocaleString());
  },

  /**
   * Check if the current session is expired
   * @returns true if session is expired or doesn't exist
   */
  isSessionExpired: (): boolean => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      return true; // Server-side, consider expired
    }
    
    const sessionTimestamp = localStorage.getItem('sessionTimestamp');
    const token = localStorage.getItem('token');
    
    // If there's a token but no timestamp, consider it valid (will be set by AuthContext)
    if (token && !sessionTimestamp) {
      console.log('ℹ️ Token found without timestamp - considered valid');
      return false;
    }
    
    // If no token or timestamp, consider expired
    if (!sessionTimestamp || !token) {
      console.log('❌ No session found');
      return true;
    }
    
    const sessionTime = parseInt(sessionTimestamp);
    const currentTime = Date.now();
    const isExpired = (currentTime - sessionTime) > SESSION_DURATION;
    
    if (isExpired) {
      const sessionDate = new Date(sessionTime);
      console.log('⏰ Session expired:', {
        startedAt: sessionDate.toLocaleString(),
        expiredAt: new Date(sessionTime + SESSION_DURATION).toLocaleString()
      });
    }
    
    return isExpired;
  },

  /**
   * Get remaining session time in milliseconds
   * @returns Remaining time in ms, or 0 if expired
   */
  getRemainingTime: (): number => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      return 0;
    }
    
    const sessionTimestamp = localStorage.getItem('sessionTimestamp');
    
    if (!sessionTimestamp) {
      return 0;
    }
    
    const sessionTime = parseInt(sessionTimestamp);
    const currentTime = Date.now();
    const remainingTime = (sessionTime + SESSION_DURATION) - currentTime;
    
    return Math.max(0, remainingTime);
  },

  /**
   * Get remaining session time formatted as a human-readable string
   * @returns Formatted string like "5 hours 23 minutes remaining"
   */
  getRemainingTimeFormatted: (): string => {
    const remaining = sessionManager.getRemainingTime();
    
    if (remaining === 0) {
      return 'Session expired';
    }
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
    }
    
    return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
  },

  /**
   * Clear all session data from localStorage
   */
  clearSession: (): void => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      console.warn('⚠️ Cannot clear session: Not in browser environment');
      return;
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('sessionTimestamp');
    localStorage.removeItem('userRole');
    console.log('🗑️ Session cleared');
  },

  /**
   * Get the current session token
   * @returns Token string or null
   */
  getToken: (): string | null => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      return null;
    }
    
    return localStorage.getItem('token');
  },

  /**
   * Get the current user role
   * @returns User role or null
   */
  getUserRole: (): string | null => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      return null;
    }
    
    return localStorage.getItem('userRole');
  },

  /**
   * Check if user is authenticated (has valid session)
   * @returns true if authenticated with valid session
   */
  isAuthenticated: (): boolean => {
    const token = sessionManager.getToken();
    const isExpired = sessionManager.isSessionExpired();
    
    return !!token && !isExpired;
  },

  /**
   * Get session information
   * @returns Object with session details
   */
  getSessionInfo: () => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      return {
        isAuthenticated: false,
        token: null,
        userRole: null,
        isExpired: true,
        remainingTime: 'N/A',
        sessionStartedAt: null,
      };
    }
    
    const token = sessionManager.getToken();
    const userRole = sessionManager.getUserRole();
    const isExpired = sessionManager.isSessionExpired();
    const remainingTime = sessionManager.getRemainingTimeFormatted();
    const sessionTimestamp = localStorage.getItem('sessionTimestamp');
    
    return {
      isAuthenticated: !!token && !isExpired,
      token,
      userRole,
      isExpired,
      remainingTime,
      sessionStartedAt: sessionTimestamp 
        ? new Date(parseInt(sessionTimestamp)).toLocaleString() 
        : null,
    };
  }
};

// Export for use in components
export default sessionManager;
