const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

export interface Transaction {
  _id: string;
  user_id: string;
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  mentor_name: string;
  service: string;
  expertId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profession: string;
  };
  type: 'booking' | 'course' | 'webinar' | 'bundle' | 'digital_product' | 'priority_dm';
  itemId: string;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer' | 'upi' | 'crypto';
  paymentIntentId?: string;
  description: string;
  metadata?: {
    sessionTitle?: string;
    courseName?: string;
    webinarTitle?: string;
    bundleName?: string;
    productName?: string;
  };
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  totalSpent: number;
}

export interface TransactionResponse {
  transactions: Transaction[];
  stats: TransactionStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class TransactionsApi {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async getTransactions(params?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<TransactionResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

  // Use correct endpoint for user-specific transactions
  const url = `${API_BASE_URL}/api/transactions/user${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
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
  return data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async getTransactionById(id: string): Promise<Transaction> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/transactions/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  async completeTransaction(id: string, paymentMethodId?: string): Promise<Transaction> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/${id}/complete`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ paymentMethodId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error completing transaction:', error);
      throw error;
    }
  }
}

export const transactionsApi = new TransactionsApi();
