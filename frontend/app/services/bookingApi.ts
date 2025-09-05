import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

export interface BookingRequest {
  expertId: string;
  sessionType: 'video' | 'audio' | 'chat' | 'in-person';
  duration: number; // in minutes
  scheduledDate: string; // ISO date string
  startTime: string; // HH:MM format
  notes?: string;
}

export interface Booking {
  _id: string;
  clientId: string;
  expertId: string;
  sessionType: 'video' | 'audio' | 'chat' | 'in-person';
  duration: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  price: number;
  currency: 'INR';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

class BookingApi {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    console.log('🔍 [FRONTEND] Token from localStorage:', token ? 'Present' : 'Missing');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
    
    console.log('🔍 [FRONTEND] Final headers:', headers);
    return headers;
  }

  // Create a new booking
  async createBooking(bookingData: BookingRequest): Promise<{ success: boolean; data: { booking: Booking; session: any } }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/bookings`, bookingData, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  // Get user's bookings
  async getUserBookings(status?: string, page: number = 1, limit: number = 10): Promise<{ 
    success: boolean; 
    data: { 
      bookings: Booking[]; 
      pagination: { page: number; limit: number; total: number; pages: number } 
    } 
  }> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await axios.get(`${API_BASE_URL}/api/bookings?${params}`, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error fetching user bookings:', error);
      throw error;
    }
  }

  // Get booking by ID
  async getBookingById(bookingId: string): Promise<{ success: boolean; data: { booking: Booking } }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/bookings/${bookingId}`, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error fetching booking:', error);
      throw error;
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId: string, status: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/bookings/${bookingId}/status`, { status }, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error updating booking status:', error);
      throw error;
    }
  }

  // Cancel booking
  async cancelBooking(bookingId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/bookings/${bookingId}/cancel`, { reason }, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error cancelling booking:', error);
      throw error;
    }
  }

  // Cancel a specific session within a booking (backend expects sessionId)
  async cancelSession(bookingId: string, sessionId: string, reason?: string): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/bookings/${bookingId}/cancel`, { sessionId, reason }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error cancelling session:', error);
      throw error;
    }
  }

  // Cancel an expired session (called when timer expires)
  async cancelExpiredSession(bookingId: string, sessionId: string): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/bookings/${bookingId}/cancel-expired-session`, { sessionId }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error cancelling expired session:', error);
      throw error;
    }
  }

  // Complete payment for a session (called after successful payment)
  async completePayment(bookingId: string, sessionId: string, paymentMethod?: string, loyaltyPointsUsed?: number): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/bookings/${bookingId}/complete-payment`, { 
        sessionId, 
        paymentMethod, 
        loyaltyPointsUsed 
      }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error completing payment:', error);
      throw error;
    }
  }
}

export const bookingApi = new BookingApi();
export default bookingApi;
