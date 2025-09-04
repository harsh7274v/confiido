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
  Gift
} from 'lucide-react';
import { Payment } from '../services/paymentsApi';
import { rewardsApi, RewardAccount } from '../services/rewardsApi';

interface CompleteTransactionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onPaymentSuccess: (paymentId: string, loyaltyPointsUsed: number) => void;
}

export default function CompleteTransactionPopup({
  isOpen,
  onClose,
  payment,
  onPaymentSuccess
}: CompleteTransactionPopupProps) {
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [maxLoyaltyPoints, setMaxLoyaltyPoints] = useState(0);
  const [loyaltyPointsToUse, setLoyaltyPointsToUse] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!payment) return;

    try {
      setProcessing(true);
      setError(null);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

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

      // Call success callback
      onPaymentSuccess(payment._id, useLoyaltyPoints ? loyaltyPointsToUse : 0);
      
      // Close popup
      onClose();
      
    } catch (err: any) {
      console.error('Payment error:', err);
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
                <img
                  className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl object-cover"
                  src={payment.expertId?.userId?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${payment.expertId?.userId?.firstName || 'Expert'}`}
                  alt={`${payment.expertId?.userId?.firstName || 'Expert'} ${payment.expertId?.userId?.lastName || ''}`}
                />
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
