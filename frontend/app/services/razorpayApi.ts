import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

class RazorpayApi {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      // For development, use mock token
      console.warn('[RAZORPAY] No auth token found, using fallback for development');
      return {
        'Authorization': 'Bearer mock_token_test',
        'Content-Type': 'application/json'
      };
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Create Razorpay order (Production Ready with Test Key Support)
  async createOrder(amount: number, currency: string = 'INR', receipt?: string, notes?: any): Promise<RazorpayOrder> {
    try {
      console.log('[RAZORPAY] Creating order:', { amount, currency, receipt });
      
      const response = await axios.post(`${API_BASE_URL}/api/payments/create-razorpay-order`, {
        amount,
        currency,
        receipt,
        notes
      }, {
        headers: this.getAuthHeaders()
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create Razorpay order');
      }
    } catch (error: any) {
      console.error('[RAZORPAY] Order creation error:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Invalid request';
        throw new Error(`Payment setup failed: ${errorMessage}`);
      } else if (error.response?.status === 429) {
        throw new Error('Too many payment requests. Please wait a moment and try again.');
      } else if (error.response?.status === 500) {
        throw new Error('Payment service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error('Payment setup failed. Please try again.');
      }
    }
  }

  // Verify Razorpay payment (Production Ready)
  async verifyPayment(
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string
  ): Promise<{ success: boolean; verified: boolean }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/payments/verify-razorpay-payment`, {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      }, {
        headers: this.getAuthHeaders()
      });

      return {
        success: response.data.success,
        verified: response.data.data?.verified || false
      };
    } catch (error: any) {
      console.error('[RAZORPAY] Payment verification error:', error);
      
      // Provide more specific error messages based on the error type
      if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.message || 'Server error during payment verification';
        console.error('[RAZORPAY] Server error details:', error.response?.data);
        throw new Error(`Payment verification failed: ${errorMessage}. Please contact support if the amount was deducted.`);
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Invalid payment data';
        throw new Error(`Payment verification failed: ${errorMessage}`);
      } else if (error.response?.status === 429) {
        throw new Error('Too many verification requests. Please wait a moment and try again.');
      } else if (error.response?.status === 404) {
        throw new Error('Payment verification service not found. Please contact support.');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error('Network error during payment verification. Please check your internet connection and try again.');
      } else {
        throw new Error('Payment verification failed. Please contact support if the amount was deducted.');
      }
    }
  }

  // Initialize Razorpay payment window (Production Ready with Test Key Support)
  async initializePayment(
    order: RazorpayOrder,
    userDetails: {
      name: string;
      email: string;
      contact: string;
    },
    onSuccess: (paymentResponse: RazorpayPaymentResponse) => void,
    onError: (error: any) => void
  ): Promise<void> {
    try {
      // Use test key for development, live key for production
      const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';
      
      console.log('[RAZORPAY] Using key:', razorpayKeyId);
      console.log('[RAZORPAY] Key type:', razorpayKeyId.startsWith('rzp_live_') ? 'LIVE' : 'TEST');

      // Validate user details
      if (!userDetails.name || !userDetails.email) {
        throw new Error('Invalid user information. Please check your profile.');
      }

      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        console.log('[RAZORPAY] Script loaded successfully');
        
        const options = {
          key: razorpayKeyId,
          amount: order.amount,
          currency: order.currency,
          name: 'Conffido',
          description: 'Payment for expert consultation session',
          image: '/logo.png',
          order_id: order.id,
          timeout: 300, // 5 minutes timeout (300 seconds)
          handler: async (response: RazorpayPaymentResponse) => {
            console.log('[RAZORPAY] Payment response received:', response);
            try {
              // Verify payment on backend
              const verification = await this.verifyPayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );

              if (verification.success && verification.verified) {
                onSuccess(response);
              } else {
                onError(new Error('Payment verification failed. Please contact support if the amount was deducted.'));
              }
            } catch (error) {
              onError(error);
            }
          },
          prefill: {
            name: userDetails.name,
            email: userDetails.email,
            contact: userDetails.contact
          },
          notes: {
            order_id: order.id
          },
          theme: {
            color: '#059669'
          },
          modal: {
            ondismiss: () => {
              console.log('[RAZORPAY] Payment cancelled by user');
              onError(new Error('Payment was cancelled. You can try again anytime.'));
            }
          }
        };

        console.log('[RAZORPAY] Opening payment window');
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };

      script.onerror = () => {
        console.error('[RAZORPAY] Failed to load payment script');
        onError(new Error('Failed to load payment service. Please check your internet connection and try again.'));
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error('[RAZORPAY] Payment initialization error:', error);
      onError(error);
    }
  }
}

export default new RazorpayApi();