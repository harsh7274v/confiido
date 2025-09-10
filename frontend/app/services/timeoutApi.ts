const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

export interface TimeoutCheckResponse {
  success: boolean;
  message: string;
  data: {
    expiredSessions: Array<{
      bookingId: string;
      sessionId: string;
      status: 'cancelled' | 'expired';
      reason: string;
    }>;
  };
}

export interface CancelExpiredResponse {
  success: boolean;
  message: string;
  data: {
    booking: any;
    session: any;
  };
}

class TimeoutApi {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Check for expired sessions and get their status
   */
  async checkExpiredSessions(): Promise<TimeoutCheckResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/expired/check`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking expired sessions:', error);
      throw error;
    }
  }

  /**
   * Cancel a specific expired session
   */
  async cancelExpiredSession(bookingId: string, sessionId: string): Promise<CancelExpiredResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/cancel-expired`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        let details = '';
        try {
          const text = await response.text();
          details = text;
        } catch {}
        throw new Error(`HTTP error! status: ${response.status}${details ? ` - ${details}` : ''}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error cancelling expired session:', error);
      throw error;
    }
  }

  /**
   * Sync local timeout state with backend
   */
  async syncTimeoutState(localTimeouts: Array<{ bookingId: string; sessionId: string; timeoutAt: string }>) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/timeout/sync`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ timeouts: localTimeouts }),
      });

      if (!response.ok) {
        let details = '';
        try {
          const text = await response.text();
          details = text;
        } catch {}
        throw new Error(`HTTP error! status: ${response.status}${details ? ` - ${details}` : ''}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error syncing timeout state:', error);
      throw error;
    }
  }

  /**
   * Get timeout status for specific sessions
   */
  async getTimeoutStatus(sessionIds: string[]) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/timeout/status`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ sessionIds }),
      });

      if (!response.ok) {
        let details = '';
        try {
          const text = await response.text();
          details = text;
        } catch {}
        throw new Error(`HTTP error! status: ${response.status}${details ? ` - ${details}` : ''}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting timeout status:', error);
      throw error;
    }
  }
}

export const timeoutApi = new TimeoutApi();
