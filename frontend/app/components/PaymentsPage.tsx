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
  Sparkles
} from 'lucide-react';
import { paymentsApi, Payment, PaymentStats } from '../services/paymentsApi';
import { transactionsApi } from '../services/transactionsApi';
import { useAuth } from '../contexts/AuthContext';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(new Set());
  const [completingTransactions, setCompletingTransactions] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    fetchPayments();
  }, [currentPage]);

  // Show mock data on mount if no authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    // Only show mock data if not authenticated
    if (!token && !user && payments.length === 0) {
      setMockData();
    } else if ((token || user) && payments.length === 0 && !loading) {
      // If authenticated and no payments, do nothing (show 'No payments found')
      setStats(null);
    }
  }, [user, payments.length, loading]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      // Check if we have authentication
      const token = localStorage.getItem('token');
      if (!token && !user) {
        // No authentication available, show mock data
        setMockData();
        return;
      }
      const params: any = {
        page: currentPage,
        limit: 10
      };
      const response = await paymentsApi.getPayments(params);
      setPayments(response.bookings);
      setStats(response.stats);
      setTotalPages(response.pagination.pages);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      // If it's an authentication error, show mock data
      if (err.message && err.message.includes('401')) {
        setMockData();
      } else {
        setError(err.message || 'Failed to fetch payments');
      }
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    const mockPayments: Payment[] = [
      {
        _id: '1',
        bookingId: 'booking_1',
        clientUserId: '1001',
        expertId: {
          _id: 'expert1',
          title: 'Senior Product Manager',
          company: 'Google',
          userId: {
            _id: 'user1',
            firstName: 'Priya',
            lastName: 'Sharma',
            email: 'priya.sharma@example.com',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
          }
        },
        expertUserId: 'expert_user_1',
        expertEmail: 'priya.sharma@example.com',
        sessionType: 'video',
        duration: 60,
        scheduledDate: new Date(Date.now() - 86400000), // 1 day ago
        startTime: '14:00',
        endTime: '15:00',
        status: 'completed',
        price: 2500,
        currency: 'INR',
        paymentStatus: 'paid',
        paymentMethod: 'stripe',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        notes: 'Career coaching session',
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000)
      },
      {
        _id: '2',
        bookingId: 'booking_2',
        clientUserId: '1001',
        expertId: {
          _id: 'expert2',
          title: 'Software Engineering Manager',
          company: 'Microsoft',
          userId: {
            _id: 'user2',
            firstName: 'Rahul',
            lastName: 'Verma',
            email: 'rahul.verma@example.com',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
          }
        },
        expertUserId: 'expert_user_2',
        expertEmail: 'rahul.verma@example.com',
        sessionType: 'chat',
        duration: 30,
        scheduledDate: new Date(Date.now() - 172800000), // 2 days ago
        startTime: '10:00',
        endTime: '10:30',
        status: 'confirmed',
        price: 1200,
        currency: 'INR',
        paymentStatus: 'pending',
        paymentMethod: 'paypal',
        notes: 'Resume review session',
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 172800000)
      },
      {
        _id: '3',
        bookingId: 'booking_3',
        clientUserId: '1001',
        expertId: {
          _id: 'expert3',
          title: 'UX Design Director',
          company: 'Adobe',
          userId: {
            _id: 'user3',
            firstName: 'Anjali',
            lastName: 'Patel',
            email: 'anjali.patel@example.com',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
          }
        },
        expertUserId: 'expert_user_3',
        expertEmail: 'anjali.patel@example.com',
        sessionType: 'video',
        duration: 45,
        scheduledDate: new Date(Date.now() - 259200000), // 3 days ago
        startTime: '16:00',
        endTime: '16:45',
        status: 'cancelled',
        price: 1800,
        currency: 'INR',
        paymentStatus: 'refunded',
        paymentMethod: 'stripe',
        notes: 'Design portfolio review - cancelled',
        createdAt: new Date(Date.now() - 259200000),
        updatedAt: new Date(Date.now() - 259200000)
      },
      // Add more mock data with pending payments as shown in the user's example
      {
        _id: '4',
        bookingId: 'booking_4',
        clientUserId: '1001',
        expertId: {
          _id: 'expert4',
          title: 'Data Science Lead',
          company: 'Amazon',
          userId: {
            _id: 'user4',
            firstName: 'Arjun',
            lastName: 'Kumar',
            email: 'arjun.kumar@example.com',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
          }
        },
        expertUserId: '1534',
        expertEmail: 'arjun.kumar@example.com',
        sessionType: 'chat',
        duration: 30,
        scheduledDate: new Date('2025-08-29T05:30:00Z'),
        startTime: '05:30',
        endTime: '06:00',
        status: 'pending',
        price: 20,
        currency: 'INR',
        paymentStatus: 'pending',
        paymentMethod: 'upi',
        notes: 'Data science career guidance',
        createdAt: new Date('2025-08-29T05:30:00Z'),
        updatedAt: new Date('2025-08-29T05:30:00Z')
      }
    ];
    const mockStats: PaymentStats = {
      total: 4,
      paid: 1,
      pending: 2,
      failed: 0,
      refunded: 1,
      totalSpent: 2500
    };
    setPayments(mockPayments);
    setStats(mockStats);
    setTotalPages(1);
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

  const toggleExpanded = (paymentId: string) => {
    const newExpanded = new Set(expandedPayments);
    if (newExpanded.has(paymentId)) {
      newExpanded.delete(paymentId);
    } else {
      newExpanded.add(paymentId);
    }
    setExpandedPayments(newExpanded);
  };

  const handleCompleteTransaction = async (paymentId: string) => {
    try {
      setCompletingTransactions(prev => new Set(prev).add(paymentId));
      
      // For demo purposes, we'll simulate the API call
      // In a real app, you would call: await transactionsApi.completeTransaction(paymentId);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update the payment status locally
      setPayments(prev => prev.map(payment => 
        payment._id === paymentId 
          ? { ...payment, status: 'completed', paymentStatus: 'paid' }
          : payment
      ));
      
      // Update stats
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          pending: prev.pending - 1,
          paid: prev.paid + 1,
          totalSpent: prev.totalSpent + (payments.find(p => p._id === paymentId)?.price || 0)
        } : null);
      }
      
    } catch (error) {
      console.error('Error completing transaction:', error);
      // You could add a toast notification here
    } finally {
      setCompletingTransactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  // Use all payments without filtering
  const filteredPayments = payments;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl sm:rounded-2xl shadow-lg">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Booking Status
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">Track and manage all your session bookings</p>
            </div>
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
          <div className="grid gap-6">
            {filteredPayments.map((payment) => {
                const isExpanded = expandedPayments.has(payment._id);
              const isCompleting = completingTransactions.has(payment._id);
              const isPending = payment.paymentStatus === 'pending';
              
                return (
                <div key={payment._id} className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Main Payment Card */}
                  <div className="p-4 sm:p-6">
                    {/* Mobile-first layout */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Expert Info Section */}
                      <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl object-cover shadow-md"
                            src={payment.expertId?.userId?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${payment.expertId?.userId?.firstName || 'Expert'}`}
                            alt={`${payment.expertId?.userId?.firstName || 'Expert'} ${payment.expertId?.userId?.lastName || ''}`}
                          />
                          {isPending && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                            {payment.expertId?.userId?.firstName || 'Expert'} {payment.expertId?.userId?.lastName || ''}
                          </h3>
                          </div>
                          
                          <p className="text-gray-600 font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                            {payment.expertId?.title || 'Expert'} at {payment.expertId?.company || 'Company'}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                            <span className="flex items-center gap-1 sm:gap-2">
                              {getSessionTypeIcon(payment.sessionType)}
                              <span className="font-medium">{payment.sessionType} • {formatDuration(payment.duration)}</span>
                            </span>
                            <span className="flex items-center gap-1 sm:gap-2">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">{payment.createdAt ? formatDate(payment.createdAt) : 'Date not available'}</span>
                              <span className="sm:hidden">{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </span>
                            {payment.expertUserId && (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full font-mono">
                                ID: {payment.expertUserId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Price and Actions Section */}
                      <div className="flex flex-col sm:flex-col items-start sm:items-end space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between w-full sm:w-auto sm:flex-col sm:items-end">
                          <p className="text-xl sm:text-2xl font-bold text-gray-900">
                            {formatCurrency(payment.price, payment.currency)}
                          </p>
                          <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.paymentStatus)}`}>
                            {getPaymentStatusIcon(payment.paymentStatus)}
                            <span className="ml-1 capitalize">{payment.paymentStatus}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                          {/* Complete Transaction Button - Only show for pending payments */}
                          {isPending && (
                            <button
                              onClick={() => handleCompleteTransaction(payment._id)}
                              disabled={isCompleting}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
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
                            className="p-2 sm:p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all duration-200 flex-shrink-0"
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
                    <div className="border-t border-gray-100 bg-gray-50 p-4 sm:p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-3 sm:space-y-4">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            Session Details
                          </h4>
                          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0">
                              <span className="text-gray-600 font-medium">Session ID:</span>
                              <span className="font-mono text-xs bg-white px-2 sm:px-3 py-1 rounded-lg border break-all">{payment._id}</span>
                              </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0">
                              <span className="text-gray-600 font-medium">Booking ID:</span>
                              <span className="font-mono text-xs bg-white px-2 sm:px-3 py-1 rounded-lg border break-all">{payment.bookingId}</span>
                              </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0">
                              <span className="text-gray-600 font-medium">Expert User ID:</span>
                              <span className="font-mono text-xs sm:text-sm">{payment.expertUserId}</span>
                              </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0">
                              <span className="text-gray-600 font-medium">Expert Email:</span>
                              <span className="text-xs sm:text-sm break-all">{payment.expertEmail}</span>
                              </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2">
                              <span className="text-gray-600 font-medium">Time:</span>
                              <span className="text-xs sm:text-sm font-medium">{payment.startTime} - {payment.endTime}</span>
                            </div>
                            </div>
                          </div>
                          
                        <div className="space-y-3 sm:space-y-4">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            Additional Information
                          </h4>
                          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                              {payment.notes && (
                              <div className="bg-white p-3 sm:p-4 rounded-xl border">
                                <span className="text-gray-600 font-medium block mb-2">Notes:</span>
                                <p className="text-gray-700">{payment.notes}</p>
                                </div>
                              )}
                              {payment.meetingLink && (
                              <div className="bg-white p-3 sm:p-4 rounded-xl border">
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
                              <div className="bg-red-50 p-3 sm:p-4 rounded-xl border border-red-200">
                                <span className="text-red-600 font-medium block mb-2">Cancellation Reason:</span>
                                <p className="text-red-700">{payment.cancellationReason}</p>
                                  {payment.cancelledBy && (
                                  <p className="text-xs text-red-600 mt-2">Cancelled by: {payment.cancelledBy}</p>
                                  )}
                                </div>
                              )}
                              {payment.refundAmount && payment.refundAmount > 0 && (
                              <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-200">
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
          )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 sm:mt-12 flex justify-center">
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition-all duration-200 ${
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
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
