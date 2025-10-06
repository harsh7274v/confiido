"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Calendar, 
  Clock, 
  CreditCard, 
  Coins, 
  CheckCircle,
  Loader2,
  AlertCircle,
  Sparkles,
  Gift,
  Video
} from 'lucide-react';
import { Payment } from '../services/paymentsApi';
import { rewardsApi, RewardAccount } from '../services/rewardsApi';
import razorpayApi from '../services/razorpayApi';
import { useAuth } from '../contexts/AuthContext';

interface CompleteTransactionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onPaymentSuccess: (paymentId: string, loyaltyPointsUsed: number) => void;
  user?: any; // Add user as optional prop
}

export default function CompleteTransactionPopup({
  isOpen,
  onClose,
  payment,
  onPaymentSuccess,
  user: propUser
}: CompleteTransactionPopupProps) {
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [maxLoyaltyPoints, setMaxLoyaltyPoints] = useState(0);
  const [loyaltyPointsToUse, setLoyaltyPointsToUse] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedOrder, setCachedOrder] = useState<any>(null);
  const [orderCreatedAt, setOrderCreatedAt] = useState<number | null>(null);
  const { user: authUser } = useAuth();
  
  // Use prop user if available, otherwise fall back to auth context
  const user = propUser || authUser;

  // Clear cached order when popup closes
  useEffect(() => {
    if (!isOpen) {
      setCachedOrder(null);
      setOrderCreatedAt(null);
    }
  }, [isOpen]);

  // Debug popup state
  useEffect(() => {
    console.log('🪟 [POPUP] CompleteTransactionPopup state changed:', {
      isOpen,
      payment: payment ? { id: payment._id, price: payment.price } : null,
      propUser: propUser ? { id: (propUser as any)._id, name: `${(propUser as any).firstName} ${(propUser as any).lastName}` } : null,
      authUser: authUser ? { id: (authUser as any)._id, name: `${(authUser as any).firstName} ${(authUser as any).lastName}` } : null,
      finalUser: user ? { id: (user as any)._id, name: `${(user as any).firstName} ${(user as any).lastName}` } : null
    });
  }, [isOpen, payment, propUser, authUser, user]);

  // Fetch loyalty points when popup opens
  useEffect(() => {
    if (isOpen && payment) {
      fetchLoyaltyPoints();
    }
  }, [isOpen, payment]);

  // Calculate max loyalty points that can be used (up to 100% of total price)
  useEffect(() => {
    if (payment && loyaltyPoints > 0) {
      const maxPoints = Math.min(loyaltyPoints, payment.price);
      setMaxLoyaltyPoints(maxPoints);
      setLoyaltyPointsToUse(maxPoints);
    }
  }, [payment, loyaltyPoints]);

  const fetchLoyaltyPoints = async () => {
    try {
      setLoading(true);
      setError(null);
      const account: RewardAccount = await rewardsApi.getMyRewards();
      setLoyaltyPoints(account.points);
    } catch (err: any) {
      console.error('Error fetching loyalty points:', err);
      setError('Failed to load loyalty points');
    } finally {
      setLoading(false);
    }
  };

  const handleLoyaltyPointsChange = (value: number) => {
    const clampedValue = Math.min(Math.max(0, value), maxLoyaltyPoints);
    setLoyaltyPointsToUse(clampedValue);
  };

  const calculateFinalPrice = () => {
    if (!payment) return 0;
    return Math.max(0, payment.price - (useLoyaltyPoints ? loyaltyPointsToUse : 0));
  };

  const handlePayment = async () => {
    console.log('💳 [POPUP] Pay button clicked!');
    console.log('🔍 [POPUP] Debugging user sources:');
    console.log('  - propUser:', propUser);
    console.log('  - authUser:', authUser);
    console.log('  - user (final):', user);
    console.log('  - localStorage user:', localStorage.getItem('user'));
    console.log('  - localStorage token:', localStorage.getItem('token'));
    
    // Check if we have a valid payment
    if (!payment) {
      console.error('❌ [POPUP] No payment data available');
      setError('Payment information is missing. Please try again.');
      return;
    }
    
    // Try to get user from multiple sources
    let currentUser = user;
    
    // If no user from props or auth context, try localStorage
    if (!currentUser) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
          console.log('🔄 [POPUP] Using user from localStorage:', currentUser);
        }
      } catch (error) {
        console.error('❌ [POPUP] Error parsing user from localStorage:', error);
      }
    }
    
    // If still no user, try to get from auth context
    if (!currentUser && authUser) {
      currentUser = authUser;
      console.log('🔄 [POPUP] Using user from auth context:', currentUser);
    }
    
    // If still no user, create a fallback user for testing
    if (!currentUser) {
      console.log('🧪 [POPUP] No user found, creating fallback user for testing...');
      currentUser = {
        _id: 'fallback-user-id',
        firstName: 'User',
        lastName: 'Test',
        email: 'user@example.com',
        phone: '1234567890'
      };
      console.log('🧪 [POPUP] Fallback user created:', currentUser);
    }
    
    console.log('✅ [POPUP] Final user object:', currentUser);

    try {
      setProcessing(true);
      setError(null);

      console.log('🚀 Starting payment process...');
      console.log('💰 Payment details:', payment);
      console.log('👤 User details:', currentUser);
      
      // Ensure we have a valid token for the API call
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔑 No token found, setting mock token for development');
        localStorage.setItem('token', 'mock_token_test');
      }

      const finalPrice = calculateFinalPrice();
      console.log('💵 Final price:', finalPrice);
      
      // If final price is 0 (fully paid with loyalty points), process directly
      if (finalPrice === 0) {
        console.log('🎁 Processing payment with loyalty points only');
        // If loyalty points are used, deduct them from rewards
        if (useLoyaltyPoints && loyaltyPointsToUse > 0) {
          try {
            await rewardsApi.deductForPayment(
              loyaltyPointsToUse, 
              `Payment discount for session with ${payment.expertId?.userId?.firstName} ${payment.expertId?.userId?.lastName}`,
              payment._id,
              `${payment.expertId?.userId?.firstName} ${payment.expertId?.userId?.lastName}`
            );
          } catch (rewardError) {
            console.error('Error deducting loyalty points:', rewardError);
            // Continue with payment even if loyalty points deduction fails
          }
        }

        // Clear cached order on successful payment
        setCachedOrder(null);
        setOrderCreatedAt(null);
        
        // Call success callback
        onPaymentSuccess(payment._id, useLoyaltyPoints ? loyaltyPointsToUse : 0);
        onClose();
        return;
      }

      console.log('💳 Creating Razorpay order for amount:', finalPrice);
      console.log('💳 Amount type:', typeof finalPrice);
      console.log('💳 Amount value:', finalPrice);
      
      // Ensure amount is a number
      const numericAmount = Number(finalPrice);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error('Invalid payment amount');
      }
      
      let order = cachedOrder;
      const now = Date.now();
      const ORDER_CACHE_DURATION = 4 * 60 * 1000; // 4 minutes cache (less than 5 min timeout)
      
      // Check if we have a valid cached order
      if (cachedOrder && orderCreatedAt && (now - orderCreatedAt) < ORDER_CACHE_DURATION) {
        console.log('🔄 Reusing cached Razorpay order:', cachedOrder.id);
        order = cachedOrder;
      } else {
        // Create new Razorpay order with shorter receipt ID (max 40 chars for Razorpay)
        const shortPaymentId = payment._id.slice(-8); // Use last 8 chars of payment ID
        const receiptId = `rcpt_${shortPaymentId}_${Date.now().toString().slice(-6)}`; // Max 40 chars
        
        console.log('📝 Receipt ID:', receiptId, 'Length:', receiptId.length);
        
        order = await razorpayApi.createOrder(
          numericAmount,
          'INR',
          receiptId,
          {
            payment_id: payment._id,
            expert_id: payment.expertId?._id,
            session_type: (payment as any).type || 'session',
            loyalty_points_used: useLoyaltyPoints ? loyaltyPointsToUse : 0
          }
        );

        console.log('✅ Razorpay order created:', order);
        
        // Cache the order and timestamp
        setCachedOrder(order);
        setOrderCreatedAt(now);
      }

      // Initialize Razorpay payment
      await razorpayApi.initializePayment(
        order,
        {
          name: `${(currentUser as any).firstName || 'User'} ${(currentUser as any).lastName || ''}`,
          email: (currentUser as any).email || 'user@example.com',
          contact: (currentUser as any).phone || '1234567890'
        },
        async (paymentResponse) => {
          console.log('🎉 Payment successful:', paymentResponse);
          try {
            // If loyalty points are used, deduct them from rewards
            if (useLoyaltyPoints && loyaltyPointsToUse > 0) {
              try {
                await rewardsApi.deductForPayment(
                  loyaltyPointsToUse, 
                  `Payment discount for session with ${payment.expertId?.userId?.firstName} ${payment.expertId?.userId?.lastName}`,
                  payment._id,
                  `${payment.expertId?.userId?.firstName} ${payment.expertId?.userId?.lastName}`
                );
              } catch (rewardError) {
                console.error('Error deducting loyalty points:', rewardError);
                // Continue with payment even if loyalty points deduction fails
              }
            }

            // Clear cached order on successful payment
            setCachedOrder(null);
            setOrderCreatedAt(null);
            
            // Call success callback
            onPaymentSuccess(payment._id, useLoyaltyPoints ? loyaltyPointsToUse : 0);
            onClose();
          } catch (error) {
            console.error('Error processing payment success:', error);
            setError('Payment processed but there was an error updating your account. Please contact support.');
          }
        },
        (error) => {
          console.error('❌ Razorpay payment error:', error);
          setError(error.message || 'Payment failed. Please try again.');
        }
      );
      
    } catch (err: any) {
      console.error('❌ Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen || !payment) return null;

  const finalPrice = calculateFinalPrice();
  const discount = payment.price - finalPrice;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
              <CreditCard className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Complete Transaction</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-red-100 rounded-lg transition-colors group"
          >
            <X className="h-4 w-4 sm:h-6 sm:w-6 text-gray-500 group-hover:text-red-600 transition-colors" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Session Details */}
          <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              Session Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Mentor Info */}
              <div className="flex items-center gap-2 sm:gap-3">
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
                <div>
                  <p className="text-sm sm:text-base font-semibold text-gray-900">
                    {payment.expertId?.userId?.firstName} {payment.expertId?.userId?.lastName}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {payment.expertId?.title} at {payment.expertId?.company}
                  </p>
                </div>
              </div>

              {/* Session Type & Duration */}
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                  <span className="text-xs sm:text-sm text-gray-600">
                    {payment.sessionType} • {payment.duration} minutes
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                  <span className="text-xs sm:text-sm text-gray-600">
                    {payment.scheduledDate.toLocaleDateString()} at {payment.startTime}
                  </span>
                </div>
              </div>
            </div>

            {payment.notes && (
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-white rounded-lg border">
                <p className="text-xs sm:text-sm text-gray-700">
                  <span className="font-medium">Notes:</span> {payment.notes}
                </p>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Pricing</h3>
            
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Session Price</span>
                <span className="text-sm sm:text-base font-semibold">₹{payment.price}</span>
              </div>
              
              {/* Loyalty Points Section */}
              {loyaltyPoints > 0 && (
                <div className="border-t border-gray-200 pt-2 sm:pt-3">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                      <span className="text-sm sm:text-base text-gray-600">Use Loyalty Points</span>
                      <span className="text-xs text-gray-500">({loyaltyPoints})</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useLoyaltyPoints}
                        onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                  
                  {useLoyaltyPoints && (
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <input
                          type="range"
                          min="0"
                          max={maxLoyaltyPoints}
                          value={loyaltyPointsToUse}
                          onChange={(e) => handleLoyaltyPointsChange(parseInt(e.target.value))}
                          className="flex-1 h-1.5 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <input
                            type="number"
                            min="0"
                            max={maxLoyaltyPoints}
                            value={loyaltyPointsToUse}
                            onChange={(e) => handleLoyaltyPointsChange(parseInt(e.target.value) || 0)}
                            className="w-16 sm:w-20 px-1.5 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                          />
                          <span className="text-xs sm:text-sm text-gray-500">pts</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-gray-600">Discount (Max 100%)</span>
                        <span className="font-semibold text-green-600">-₹{discount}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-2 sm:pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-semibold text-gray-900">Total Amount</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">₹{finalPrice}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm sm:text-base text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg sm:rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={processing || loading}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="hidden sm:inline">Processing Payment...</span>
                  <span className="sm:hidden">Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Pay ₹{finalPrice}</span>
                  <span className="sm:hidden">Pay ₹{finalPrice}</span>
                </>
              )}
            </button>
          </div>

          {/* Loyalty Points Info */}
          {loyaltyPoints > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                <span className="text-sm sm:text-base font-semibold text-purple-900">Loyalty Points</span>
              </div>
              <p className="text-xs sm:text-sm text-purple-700">
                You have {loyaltyPoints} loyalty points available. Use them to get up to 100% discount on your session!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
