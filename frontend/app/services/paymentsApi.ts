const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

// Backend booking data structure
export interface BackendBooking {
  _id: string;
  clientId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  clientUserId: string;
  clientEmail: string;
  sessions: Array<{
    sessionId: string;
    expertId: {
      _id: string;
      title: string;
      company: string;
      userId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar?: string;
      };
    };
    expertUserId: string;
    expertEmail: string;
    sessionType: 'video' | 'audio' | 'chat' | 'in-person';
    duration: number;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
    price: number;
    currency: string;
    paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
    paymentMethod?: string;
    meetingLink?: string;
    notes?: string;
    cancellationReason?: string;
    cancelledBy?: 'client' | 'expert' | 'system';
    cancellationTime?: string;
    refundAmount?: number;
    // Timeout fields for 5-minute booking timeout
    timeoutAt?: string;
    timeoutStatus?: 'active' | 'expired' | 'completed';
    // Creation timestamp
    createdTime?: string;
  }>;
  totalSessions: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string; // This will be the sessionId
  bookingId: string; // This will be the booking _id
  clientUserId: string;
  expertId: {
    _id: string;
    title: string;
    company: string;
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
    };
  };
  expertUserId: string;
  expertEmail: string;
  sessionType: 'video' | 'audio' | 'chat' | 'in-person';
  duration: number;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  price: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentMethod?: string;
  meetingLink?: string;
  notes?: string;
  cancellationReason?: string;
  cancelledBy?: 'client' | 'expert' | 'system';
  cancellationTime?: Date;
  refundAmount?: number;
  // Timeout fields for 5-minute booking timeout
  timeoutAt?: Date;
  timeoutStatus?: 'active' | 'expired' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentStats {
  total: number;
  paid: number;
  pending: number;
  failed: number;
  refunded: number;
  totalSpent: number;
}

export interface PaymentResponse {
  bookings: Payment[];
  stats: PaymentStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class PaymentsApi {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async getPayments(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaymentResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      // Use the new endpoint for user-specific payments from bookings
      const url = `${API_BASE_URL}/api/bookings/user${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('Making request to:', url);
      console.log('Auth headers:', this.getAuthHeaders());
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      // Debug: Log the createdTime values from sessions
      if (data.data.bookings && Array.isArray(data.data.bookings)) {
        data.data.bookings.forEach((booking: BackendBooking, bookingIndex: number) => {
          if (booking.sessions && Array.isArray(booking.sessions)) {
            booking.sessions.forEach((session, sessionIndex: number) => {
              console.log(`Booking ${bookingIndex}, Session ${sessionIndex}:`, {
                sessionId: session.sessionId,
                createdTime: session.createdTime,
                scheduledDate: session.scheduledDate,
                status: session.status,
                paymentStatus: session.paymentStatus
              });
            });
          }
        });
      }
      
      // Transform booking sessions to individual payment entries
      const transformedPayments: Payment[] = [];
      
      if (data.data.bookings && Array.isArray(data.data.bookings)) {
        data.data.bookings.forEach((booking: BackendBooking) => {
          if (booking.sessions && Array.isArray(booking.sessions)) {
            booking.sessions.forEach((session) => {
              transformedPayments.push({
                _id: session.sessionId,
                bookingId: booking._id,
                clientUserId: booking.clientUserId,
                expertId: session.expertId,
                expertUserId: session.expertUserId,
                expertEmail: session.expertEmail,
                sessionType: session.sessionType,
                duration: session.duration,
                scheduledDate: new Date(session.scheduledDate),
                startTime: session.startTime,
                endTime: session.endTime,
                status: session.status,
                price: session.price,
                currency: session.currency,
                paymentStatus: session.paymentStatus,
                paymentMethod: session.paymentMethod,
                meetingLink: session.meetingLink,
                notes: session.notes,
                cancellationReason: session.cancellationReason,
                cancelledBy: session.cancelledBy,
                cancellationTime: session.cancellationTime ? new Date(session.cancellationTime) : undefined,
                refundAmount: session.refundAmount,
                // Timeout fields
                timeoutAt: session.timeoutAt ? new Date(session.timeoutAt) : undefined,
                timeoutStatus: session.timeoutStatus,
                createdAt: session.createdTime ? new Date(session.createdTime) : new Date(booking.createdAt),
                updatedAt: new Date(booking.updatedAt)
              });
            });
          }
        });
      }
      
      // Sort by createdAt (session createdTime, most recent first), with updatedAt as fallback
      transformedPayments.sort((a, b) => {
        // Primary sort: createdAt (session createdTime, most recent first)
        const createdAtDiff = b.createdAt.getTime() - a.createdAt.getTime();
        if (createdAtDiff !== 0) {
          return createdAtDiff;
        }
        // Secondary sort: updatedAt (most recent first)
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });
      
      // Debug: Log the sorted payments
      console.log('Sorted payments (most recent first):');
      transformedPayments.forEach((payment, index) => {
        console.log(`${index + 1}. Session ${payment._id}:`, {
          createdAt: payment.createdAt.toISOString(),
          status: payment.status,
          paymentStatus: payment.paymentStatus
        });
      });
      
      return {
        bookings: transformedPayments,
        stats: data.data.stats,
        pagination: data.data.pagination
      };
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  async getPaymentById(id: string): Promise<Payment> {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data.booking;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }
}

export const paymentsApi = new PaymentsApi();
