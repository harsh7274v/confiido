"use client";

import React, { useEffect, useState } from 'react';
import { 
  CreditCard, 
  Download, 
  Eye, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Video,
  Phone,
  MessageSquare,
  MapPin,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Hash,
  CheckCircle2,
  Loader2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { paymentsApi, Payment, PaymentStats } from '../services/paymentsApi';
import { transactionsApi } from '../services/transactionsApi';
import { timeoutApi } from '../services/timeoutApi';
import bookingApi from '../services/bookingApi';
import { useAuth } from '../contexts/AuthContext';
import CompleteTransactionPopup from './CompleteTransactionPopup';
import { useTimeout } from '../contexts/TimeoutContext';
import { PropagateLoader } from 'react-spinners';

export default function PaymentsPage() {
  // Generate unique instance ID for debugging
  const instanceId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);
  
  // Log component mount
  React.useEffect(() => {
    console.log(`🚀 [PAYMENTS-${instanceId}] Component mounted`);
    return () => {
      console.log(`🛑 [PAYMENTS-${instanceId}] Component unmounted`);
    };
  }, [instanceId]);
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(new Set());
  const [completingTransactions, setCompletingTransactions] = useState<Set<string>>(new Set());
  const [showTransactionPopup, setShowTransactionPopup] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  
  // Use the timeout context
  const { 
    timeouts, 
    addTimeout, 
    updateTimeoutStatus, 
    removeTimeout, 
    getTimeout, 
    formatCountdown, 
    isExpired,
    isInitialized 
  } = useTimeout();

  // Track sessions we've already handled expiry for (prevent duplicate backend calls)
  const [handledExpiry, setHandledExpiry] = useState<Set<string>>(new Set());

  // Retry helper to ensure backend is eventually updated (handles minor clock drift)
  const cancelExpiredWithRetry = async (bookingId: string, sessionId: string, attempts = 5, delayMs = 2000) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem9('token') : null;
    if (!token && !user) {
      throw new Error('UNAUTHENTICATED');
    }
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await timeoutApi.cancelExpiredSession(bookingId, sessionId);
        return;
      } catch (err: any) {
        const msg = typeof err?.message === 'string' ? err.message : '';
        if (msg.includes('400') && (msg.includes('not in pending status') || msg.includes('not in pending') || msg.includes('not expired'))) {
          // Surface as a special error so caller can fallback
          throw new Error('NOT_EXPIRED_OR_NOT_PENDING');
        }
        if (attempt === attempts) {
          throw err;
        }
        await new Promise(res => setTimeout(res, delayMs * attempt));
      }
    }
    throw new Error('CANCEL_EXPIRED_RETRIES_EXHAUSTED');
  };

  // Load handled expiry keys from localStorage so refresh won't restart timers
  useEffect(() => {
    try {
      const stored = localStorage.getItem('handled_expiry_sessions');
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        setHandledExpiry(new Set(parsed));
      }
    } catch (e) {
      console.error('Failed to load handled expiry sessions:', e);
    }
  }, []);

  // Persist handled expiry keys whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('handled_expiry_sessions', JSON.stringify(Array.from(handledExpiry)));
    } catch (e) {
      console.error('Failed to persist handled expiry sessions:', e);
    }
  }, [handledExpiry]);

  // Helper: determine expiry using server-provided timeoutAt (robust after refresh)
  const isExpiredByServerTime = (payment: Payment) => {
    if (!payment.timeoutAt) return false;
    // Consider expired if now is past timeoutAt and not completed
    try {
      const timeoutAtDate = payment.timeoutAt instanceof Date ? payment.timeoutAt : new Date(payment.timeoutAt as unknown as string);
      const isExpired = timeoutAtDate.getTime() <= Date.now();
      console.log(`🔍 [PAYMENTS] Checking server expiry for ${payment._id}:`, {
        timeoutAt: timeoutAtDate.toISOString(),
        now: new Date().toISOString(),
        isExpired,
        status: payment.status,
        paymentStatus: payment.paymentStatus
      });
      return isExpired;
    } catch (error) {
      console.error('Error checking server expiry:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentPage]);

  // Auto-open Complete Transaction by bookingId stored in localStorage (no URL identifiers)
  useEffect(() => {
    try {
      if (payments.length === 0) return;
      let targetBookingId = '';
      try {
        targetBookingId = localStorage.getItem('dashboard_target_bookingId') || '';
      } catch {}
      if (!targetBookingId) return;
      const match = payments.find(p => p.bookingId === targetBookingId && p.paymentStatus === 'pending');
      if (match) {
        setExpandedPayments(prev => new Set([...Array.from(prev), match._id]));
        setSelectedPayment(match);
        setShowTransactionPopup(true);
        // Optionally scroll into view
        setTimeout(() => {
          const el = document.querySelector(`[data-payment-id="${match._id}"]`);
          if (el && 'scrollIntoView' in el) {
            (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
        // Clear stored bookingId after use
        try { localStorage.removeItem('dashboard_target_bookingId'); } catch {}
      }
    } catch {}
  }, [payments]);

  // Initialize timeouts for pending bookings without resetting existing ones
  useEffect(() => {
    if (!isInitialized) return;
    
    payments.forEach(payment => {
      // Only start timers for pending payments that are not completed/paid
      if (payment.paymentStatus === 'pending' && 
          payment.status === 'pending' && 
          payment.timeoutAt && 
          payment.timeoutStatus === 'active') {
        const key = `${payment.bookingId}_${payment._id}`;
        
        // Check if already expired by server time
        if (isExpiredByServerTime(payment)) {
          console.log(`⏰ [PAYMENTS] Session ${payment._id} is already expired by server time, marking as handled`);
          // Mark as handled to prevent timer restart
          setHandledExpiry(prev => new Set([...prev, key]));
          // Update UI immediately
          setPayments(prev => prev.map(p => p._id === payment._id ? {
            ...p,
            paymentStatus: 'failed',
            status: 'cancelled',
            timeoutStatus: 'expired'
          } : p));
          return;
        }
        
        // Check if already handled
        if (handledExpiry.has(key)) {
          console.log(`⏰ [PAYMENTS] Session ${payment._id} already handled, skipping timer`);
          return;
        }
        
        const existing = getTimeout(payment.bookingId, payment._id);
        if (!existing) {
          console.log(`⏰ [PAYMENTS] Starting timer for session ${payment._id}`);
          addTimeout(
            payment.bookingId,
            payment._id,
            payment.timeoutAt.toISOString()
          );
        }
      } else if (payment.paymentStatus === 'paid' || payment.status === 'completed') {
        // Remove any existing timeout for completed/paid sessions
        const key = `${payment.bookingId}_${payment._id}`;
        const existing = getTimeout(payment.bookingId, payment._id);
        if (existing) {
          console.log(`⏰ [PAYMENTS] Removing timeout for completed/paid session ${payment._id}`);
          removeTimeout(payment.bookingId, payment._id);
          setHandledExpiry(prev => new Set([...prev, key]));
        }
      }
    });
  }, [payments, isInitialized, addTimeout, removeTimeout, handledExpiry, getTimeout]);

  // When a session expires, update frontend state and notify backend once
  useEffect(() => {
    if (!isInitialized || payments.length === 0) return;

    const newlyExpired: string[] = [];

    payments.forEach(payment => {
      // Only process expiry for pending payments that are not completed/paid
      if (payment.paymentStatus === 'pending' && payment.status === 'pending') {
        const expired = isExpired(payment.bookingId, payment._id) || isExpiredByServerTime(payment) || payment.timeoutStatus === 'expired';
        const key = `${payment.bookingId}_${payment._id}`;
        
        console.log(`🔍 [PAYMENTS] Checking expiry for ${payment._id}:`, {
          isExpiredByTimer: isExpired(payment.bookingId, payment._id),
          isExpiredByServer: isExpiredByServerTime(payment),
          timeoutStatus: payment.timeoutStatus,
          overallExpired: expired,
          alreadyHandled: handledExpiry.has(key)
        });
        
        if (expired && !handledExpiry.has(key)) {
          console.log(`⏰ [PAYMENTS] Session ${payment._id} has expired, processing...`);
          newlyExpired.push(key);
          
          // Optimistically update UI: mark as expired/failed and timeoutStatus
          setPayments(prev => prev.map(p => p._id === payment._id ? {
            ...p,
            paymentStatus: 'failed',
            status: 'cancelled',
            timeoutStatus: 'expired'
          } : p));

          // Update local timeout context: mark expired and remove timer
          updateTimeoutStatus(payment.bookingId, payment._id, 'expired');
          removeTimeout(payment.bookingId, payment._id);

          // Fire backend update to cancel the expired session
          if (payment.timeoutStatus !== 'expired') {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (token || user) {
              console.log(`📡 [PAYMENTS] Calling backend to cancel expired session ${payment._id}`);
              // Call the backend to cancel the expired session using the new endpoint
              bookingApi.cancelExpiredSession(payment.bookingId, payment._id)
                .then((response) => {
                  console.log('✅ [PAYMENTS] Successfully cancelled expired session:', response);
                  // Refetch payments to get updated status from backend
                  setTimeout(() => fetchPayments(), 1000); // Small delay to ensure backend has processed
                })
                .catch((error) => {
                  console.error('❌ [PAYMENTS] Failed to cancel expired session:', error);
                  console.error('Error details:', error.response?.data || error.message);
                  // Even if backend call fails, keep the frontend state updated
                  // The backend timeout service will eventually catch this
                });
            } else {
              console.warn('⚠️ [PAYMENTS] No authentication token available for backend call');
            }
          } else {
            console.log(`⏰ [PAYMENTS] Session ${payment._id} already marked as expired in backend`);
          }
        }
      }
    });

    if (newlyExpired.length > 0) {
      console.log(`📝 [PAYMENTS] Marking ${newlyExpired.length} sessions as handled`);
      setHandledExpiry(prev => {
        const next = new Set(prev);
        newlyExpired.forEach(k => next.add(k));
        return next;
      });
    }
  }, [timeouts, isInitialized, payments, handledExpiry, isExpired, removeTimeout, updateTimeoutStatus, user]);

  // Periodically refetch payments to reflect backend status changes (normalize pending->failed when cancelled)
  useEffect(() => {
    console.log(`🔄 [PAYMENTS-${instanceId}] Setting up 5-minute auto-refresh interval`);
    const interval = setInterval(() => {
      console.log(`🔄 [PAYMENTS-${instanceId}] Auto-refreshing payments (5-minute interval)`);
      fetchPayments();
    }, 300000); // 5 minutes = 300,000 milliseconds
    return () => {
      console.log(`🔄 [PAYMENTS-${instanceId}] Clearing auto-refresh interval`);
      clearInterval(interval);
    };
  }, [instanceId]);

  // Add a function to manually refresh payments (useful for testing)
  const refreshPayments = async () => {
    setIsRefreshing(true);
    try {
      await fetchPayments();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Debug function to check timeout status (useful for testing)
  const debugTimeoutStatus = () => {
    console.log('🔍 [DEBUG] Current timeout status:');
    console.log('  Handled expiry sessions:', Array.from(handledExpiry));
    console.log('  Active timeouts:', Object.keys(timeouts));
    console.log('  Payments with pending status:', payments.filter(p => p.paymentStatus === 'pending').map(p => ({
      id: p._id,
      bookingId: p.bookingId,
      status: p.status,
      paymentStatus: p.paymentStatus,
      timeoutAt: p.timeoutAt,
      timeoutStatus: p.timeoutStatus
    })));
  };

  // Expose debug function to window for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugTimeoutStatus = debugTimeoutStatus;
      (window as any).refreshPayments = refreshPayments;
    }
  }, [debugTimeoutStatus, refreshPayments]);

  // Initialize stats when component mounts
  useEffect(() => {
    if (user && payments.length === 0 && !loading) {
      setStats(null);
    }
  }, [user, payments.length, loading]);

  const fetchPayments = async () => {
    console.log(`📡 [PAYMENTS-${instanceId}] fetchPayments called at:`, new Date().toISOString());
    try {
      setLoading(true);
      setError(null);
      
      // Check if we have authentication
      const token = localStorage.getItem('token');
      if (!token && !user) {
        setError('Please log in to view your payments');
        return;
      }
      
      const params: any = {
        page: currentPage,
        limit: 10
      };
      const response = await paymentsApi.getPayments(params);
      const normalized = response.bookings.map(p => {
        if (p.status === 'cancelled' && p.paymentStatus === 'pending') {
          return { ...p, paymentStatus: 'failed' as const };
        }
        return p;
      });
      setPayments(normalized);
      setStats(response.stats);
      setTotalPages(response.pagination.pages);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'confirmed':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'no-show':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'refunded':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'no-show':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-blue-500" />;
      case 'audio':
        return <Phone className="w-4 h-4 text-green-500" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'in-person':
        return <MapPin className="w-4 h-4 text-orange-500" />;
      default:
        return <Video className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number, currency?: string) => {
    // Default to INR if currency is not provided
    const currencyCode = currency?.toUpperCase() || 'INR';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    try {
      // Handle both string and Date inputs
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      
      return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', date);
      return 'Invalid Date';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Determine the most accurate timestamp to display for a payment
  const getPaymentEffectiveDate = (p: any): Date => {
    // Prefer Razorpay's paymentCreatedAt if present (seconds since epoch)
    const rp = p?.paymentCreatedAt || p?.metadata?.paymentCreatedAt || p?.transaction?.metadata?.paymentCreatedAt;
    if (rp !== undefined && rp !== null) {
      const ts = typeof rp === 'number' ? rp : parseInt(String(rp), 10);
      if (!isNaN(ts)) {
        // Razorpay timestamps are usually in seconds
        const ms = ts < 10_000_000_000 ? ts * 1000 : ts;
        const d = new Date(ms);
        if (!isNaN(d.getTime())) return d;
      }
    }
    // Fallbacks
    const created = p?.createdAt ? new Date(p.createdAt) : undefined;
    if (created && !isNaN(created.getTime())) return created;
    const updated = p?.updatedAt ? new Date(p.updatedAt) : undefined;
    if (updated && !isNaN(updated.getTime())) return updated;
    const scheduled = p?.scheduledDate ? new Date(p.scheduledDate) : undefined;
    if (scheduled && !isNaN(scheduled.getTime())) return scheduled;
    return new Date();
  };

  const toggleExpanded = (paymentId: string) => {
    const newExpanded = new Set(expandedPayments);
    if (newExpanded.has(paymentId)) {
      newExpanded.delete(paymentId);
    } else {
      newExpanded.add(paymentId);
    }
    setExpandedPayments(newExpanded);
  };

  const handleCompleteTransaction = (paymentId: string) => {
    console.log('🔘 [PAYMENTS] Complete Transaction button clicked for payment:', paymentId);
    console.log('👤 [PAYMENTS] Current user:', user);
    console.log('👤 [PAYMENTS] User type:', typeof user);
    console.log('👤 [PAYMENTS] User keys:', user ? Object.keys(user) : 'null');
    const payment = payments.find(p => p._id === paymentId);
    if (payment) {
      console.log('✅ [PAYMENTS] Payment found, opening popup:', payment);
      setSelectedPayment(payment);
      setShowTransactionPopup(true);
    } else {
      console.error('❌ [PAYMENTS] Payment not found for ID:', paymentId);
    }
  };

  const handlePaymentSuccess = async (paymentId: string, loyaltyPointsUsed: number, paymentMethod?: string) => {
    console.log(`💳 [PAYMENTS-${instanceId}] Payment success for session ${paymentId}:`, {
      loyaltyPointsUsed,
      paymentMethod
    });

    // Find the payment to get booking ID
    const payment = payments.find(p => p._id === paymentId);
    if (!payment) {
      console.error('❌ [PAYMENTS] Payment not found for ID:', paymentId);
      return;
    }

    // Optimistically update the frontend state
    setPayments(prev => prev.map(p => 
      p._id === paymentId 
        ? { ...p, status: 'completed', paymentStatus: 'paid' }
        : p
    ));
    
    // Update stats
    if (stats) {
      const finalAmount = payment.price - loyaltyPointsUsed;
      setStats(prev => prev ? {
        ...prev,
        pending: prev.pending - 1,
        paid: prev.paid + 1,
        totalSpent: prev.totalSpent + finalAmount
      } : null);
    }

    // Remove the timeout from the timeout context since payment is completed
    console.log(`⏰ [PAYMENTS-${instanceId}] Removing timeout for completed payment ${paymentId}`);
    removeTimeout(payment.bookingId, paymentId);
    
    // Mark this session as handled to prevent timer restart
    const key = `${payment.bookingId}_${paymentId}`;
    setHandledExpiry(prev => new Set([...prev, key]));

    // Call backend to update payment status
    try {
      console.log(`📡 [PAYMENTS-${instanceId}] Calling backend to complete payment for session ${paymentId}`);
      const response = await bookingApi.completePayment(
        payment.bookingId, 
        paymentId, 
        paymentMethod || 'online', 
        loyaltyPointsUsed
      );
      
      console.log('✅ [PAYMENTS] Backend payment completion successful:', response);
      
      // Refetch payments to ensure data consistency
      setTimeout(() => fetchPayments(), 1000);
      
    } catch (error: any) {
      console.error('❌ [PAYMENTS] Backend payment completion failed:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Revert frontend state on backend failure
      setPayments(prev => prev.map(p => 
        p._id === paymentId 
          ? { ...p, status: 'pending', paymentStatus: 'pending' }
          : p
      ));
      
      // Revert stats
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          pending: prev.pending + 1,
          paid: prev.paid - 1,
          totalSpent: prev.totalSpent - (payment.price - loyaltyPointsUsed)
        } : null);
      }
      
      // Re-add the timeout since payment failed
      console.log(`⏰ [PAYMENTS-${instanceId}] Re-adding timeout for failed payment ${paymentId}`);
      if (payment.timeoutAt) {
        addTimeout(payment.bookingId, paymentId, payment.timeoutAt.toISOString());
      }
      
      // Remove from handled expiry since payment failed
      setHandledExpiry(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      
      // Show error message
      alert('Payment completion failed. Please try again or contact support.');
      return;
    }
    
    // Show success message
    alert(`Payment successful! ${loyaltyPointsUsed > 0 ? `Used ${loyaltyPointsUsed} loyalty points. ` : ''}Session completed.`);
  };

  // Sort payments by effective timestamp (most recent first)
  const filteredPayments = [...payments].sort((a, b) => {
    const aTime = getPaymentEffectiveDate(a).getTime();
    const bTime = getPaymentEffectiveDate(b).getTime();
    return bTime - aTime;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <PropagateLoader color="#9333ea" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Modern Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 shadow-lg flex items-center justify-center relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                {/* Logo Icon */}
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white/90 rounded-full flex items-center justify-center">
                    <CreditCard className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-gray-600" />
                  </div>
                </div>
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Booking Status
                </h1>
                <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">Track and manage all your session bookings</p>
              </div>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={refreshPayments}
              disabled={isRefreshing || loading}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-0"
              title="Refresh bookings"
            >
              <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline text-sm font-medium text-gray-700">
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>
        </div>



        {/* Bookings Grid */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <div className="text-red-700 text-lg font-medium">{error}</div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <div className="text-gray-500 text-xl font-medium mb-2">No bookings found</div>
            <p className="text-gray-400">Book your first session to see booking status</p>
            </div>
          ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
            <div className="space-y-3 sm:space-y-4">
            {filteredPayments.map((payment, index) => {
                const isExpanded = expandedPayments.has(payment._id);
              const isCompleting = completingTransactions.has(payment._id);
              const isPending = payment.paymentStatus === 'pending';
              const timeout = getTimeout(payment.bookingId, payment._id);
              const hasActiveCountdown = timeout?.status === 'active' && timeout?.countdown > 0;
              
                return (
                <div key={payment._id} data-payment-id={payment._id} className="no-focus bg-white shadow-lg hover:bg-yellow-50 hover:shadow-xl transition-all duration-300 overflow-hidden" tabIndex={-1}>
                  {/* Main Payment Card */}
                  <div className="p-2 sm:p-3">
                    {/* Mobile-first layout */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      {/* Expert Info Section */}
                      <div className="flex items-start space-x-1.5 sm:space-x-2 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          {/* Modern Logo Design */}
                          <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 shadow-lg flex items-center justify-center relative overflow-hidden">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                            {/* Logo Icon */}
                            <div className="relative z-10 flex items-center justify-center">
                              <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white/90 rounded-full flex items-center justify-center">
                                <Video className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-gray-600" />
                              </div>
                            </div>
                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
                          </div>
                          {isPending && (
                            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                              <Clock className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                            {payment.expertId?.userId?.firstName || 'Expert'} {payment.expertId?.userId?.lastName || ''}
                          </h3>
                          </div>
                          
                          <p className="text-gray-600 font-medium mb-1 text-xs">
                            {payment.expertId?.title || 'Expert'} at {payment.expertId?.company || 'Company'}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1 sm:gap-2">
                              {getSessionTypeIcon(payment.sessionType)}
                              <span className="font-medium">{payment.sessionType} • {formatDuration(payment.duration)}</span>
                            </span>
                            <span className="flex items-center gap-1 sm:gap-2">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">{formatDate(getPaymentEffectiveDate(payment))}</span>
                              <span className="sm:hidden">{getPaymentEffectiveDate(payment).toLocaleDateString()}</span>
                            </span>
                            {payment.expertUserId && (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full font-mono">
                                ID: {payment.expertUserId}
                              </span>
                            )}
                            {/* Countdown Timer for Pending Payments */}
                            {hasActiveCountdown && (
                              <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                <span>⏰ {formatCountdown(timeout?.countdown || 0)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Price and Actions Section */}
                      <div className="flex flex-col sm:flex-col items-start sm:items-end space-y-1.5 sm:space-y-2">
                        <div className="flex items-center justify-between w-full sm:w-auto sm:flex-col sm:items-end">
                          <p className="text-base sm:text-lg font-bold text-gray-900">
                            {formatCurrency(payment.price, payment.currency)}
                          </p>
                          {isExpired(payment.bookingId, payment._id) ? (
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-4 h-4 text-red-500" />
                              <span className="ml-1">expired</span>
                            </span>
                          ) : (
                          <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.paymentStatus)}`}>
                            {getPaymentStatusIcon(payment.paymentStatus)}
                            <span className="ml-1 capitalize">{payment.paymentStatus}</span>
                          </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 w-full sm:w-auto">
                          {/* Complete Transaction Button - Only show for pending payments */}
                          {isPending && (
                            <button
                              onClick={() => handleCompleteTransaction(payment._id)}
                              disabled={isCompleting}
                              className="no-focus flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-md hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl text-xs"
                            >
                              {isCompleting ? (
                                <>
                                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                  <span className="hidden sm:inline">Completing...</span>
                                  <span className="sm:hidden">...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="hidden sm:inline">Complete Transaction</span>
                                  <span className="sm:hidden">Complete</span>
                                </>
                              )}
                            </button>
                          )}
                          
                          <button 
                            onClick={() => toggleExpanded(payment._id)}
                            className="no-focus p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200 flex-shrink-0"
                            title="View Details"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />}
                          </button>
                        </div>
                      </div>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                    <div className="bg-gray-50 p-2 sm:p-3">
                      {/* Countdown Timer Section */}
                      {hasActiveCountdown && (
                        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                            <span className="text-lg font-semibold text-yellow-800">Payment Timeout</span>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-yellow-700 mb-2">
                              {formatCountdown(timeout?.countdown || 0)}
                            </div>
                            <p className="text-sm text-yellow-600">
                              Complete payment within this time or booking will be automatically cancelled
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5 sm:space-y-2">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            Session Details
                          </h4>
                          <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-0.5 gap-1 sm:gap-0">
                              <span className="text-gray-600 font-medium">Session ID:</span>
                              <span className="font-mono text-xs bg-white px-2 sm:px-3 py-1 rounded-lg break-all">{payment._id}</span>
                              </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-0.5 gap-1 sm:gap-0">
                              <span className="text-gray-600 font-medium">Booking ID:</span>
                              <span className="font-mono text-xs bg-white px-2 sm:px-3 py-1 rounded-lg break-all">{payment.bookingId}</span>
                              </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-0.5 gap-1 sm:gap-0">
                              <span className="text-gray-600 font-medium">Expert User ID:</span>
                              <span className="font-mono text-xs sm:text-sm">{payment.expertUserId}</span>
                              </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-0.5 gap-1 sm:gap-0">
                              <span className="text-gray-600 font-medium">Expert Email:</span>
                              <span className="text-xs sm:text-sm break-all">{payment.expertEmail}</span>
                              </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2">
                              <span className="text-gray-600 font-medium">Time:</span>
                              <span className="text-xs sm:text-sm font-medium">{payment.startTime} - {payment.endTime}</span>
                            </div>
                            </div>
                          </div>
                          
                        <div className="space-y-1.5 sm:space-y-2">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            Additional Information
                          </h4>
                          <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                              {payment.notes && (
                              <div className="bg-white p-1.5 sm:p-2 rounded-md border">
                                <span className="text-gray-600 font-medium block mb-2">Notes:</span>
                                <p className="text-gray-700">{payment.notes}</p>
                                </div>
                              )}
                              {payment.meetingLink && (
                              <div className="bg-white p-1.5 sm:p-2 rounded-md border">
                                <span className="text-gray-600 font-medium block mb-2">Meeting Link:</span>
                                  <a 
                                    href={payment.meetingLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline font-medium break-all"
                                  >
                                  Join Meeting →
                                  </a>
                                </div>
                              )}
                              {payment.cancellationReason && (
                              <div className="bg-red-50 p-1.5 sm:p-2 rounded-md border border-red-200">
                                <span className="text-red-600 font-medium block mb-2">Cancellation Reason:</span>
                                <p className="text-red-700">{payment.cancellationReason}</p>
                                  {payment.cancelledBy && (
                                  <p className="text-xs text-red-600 mt-2">Cancelled by: {payment.cancelledBy}</p>
                                  )}
                                </div>
                              )}
                              {payment.refundAmount && payment.refundAmount > 0 && (
                              <div className="bg-blue-50 p-1.5 sm:p-2 rounded-md border border-blue-200">
                                <span className="text-blue-600 font-medium block mb-2">Refund Amount:</span>
                                <span className="text-base sm:text-lg font-bold text-blue-700">{formatCurrency(payment.refundAmount, payment.currency)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 sm:mt-12 flex justify-center">
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-0"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
              
              {/* Show limited page numbers on mobile */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // On mobile, only show current page and adjacent pages
                const isVisible = totalPages <= 5 || 
                  page === 1 || 
                  page === totalPages || 
                  Math.abs(page - currentPage) <= 1;
                
                if (!isVisible) {
                  // Show ellipsis for hidden pages
                  if (page === 2 && currentPage > 3) {
                    return <span key={`ellipsis-${page}`} className="px-2 text-gray-500">...</span>;
                  }
                  if (page === totalPages - 1 && currentPage < totalPages - 2) {
                    return <span key={`ellipsis-${page}`} className="px-2 text-gray-500">...</span>;
                  }
                  return null;
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition-all duration-200 focus:outline-none focus:ring-0 ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-0"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
              </button>
            </nav>
          </div>
        )}

        {/* Complete Transaction Popup */}
        <CompleteTransactionPopup
          isOpen={showTransactionPopup}
          onClose={() => {
            console.log('🪟 [PAYMENTS] Closing popup, user was:', user);
            setShowTransactionPopup(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
          onPaymentSuccess={handlePaymentSuccess}
          user={user}
        />
      </div>
    </div>
  );
}
