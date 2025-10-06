"use client";
import { PropagateLoader } from 'react-spinners';

import React, { useState, useEffect } from 'react';
import { rewardsApi, type RewardAccount } from '../services/rewardsApi';
import { 
  Gift, 
  Star, 
  Trophy, 
  Coins, 
  TrendingUp,
  Calendar,
  Award,
  Zap,
  Target,
  ArrowRight,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  category: 'discount' | 'freebie' | 'upgrade' | 'exclusive';
  isAvailable: boolean;
  icon: React.ComponentType<any>;
}

export default function RewardsPage() {
  // Server-backed state
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [recentActivity, setRecentActivity] = useState<Array<{ id?: string; type: 'earned' | 'spent'; description: string; points: number; date: Date; status: 'completed' | 'pending' | 'failed'; }>>([]);
  const [newUserRewardRedeemed, setNewUserRewardRedeemed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reward account; backend initializes 250 points once per user
  useEffect(() => {
    let isMounted = true;
    async function loadRewards() {
      try {
        setLoading(true);
        setError(null);
        const account: RewardAccount = await rewardsApi.getMyRewards();
        if (!isMounted) return;
        setLoyaltyPoints(account.points);
        setTotalEarned(account.totalEarned);
        setTotalSpent(account.totalSpent);
        setNewUserRewardRedeemed(account.newUserRewardRedeemed);
        setRecentActivity(
          (account.history || []).map((h) => ({
            ...h,
            date: new Date(h.date),
          }))
        );
      } catch (e: any) {
        if (!isMounted) return;
        setError(e.message || 'Failed to load rewards');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRewards();
    return () => {
      isMounted = false;
    };
  }, []);

  const rewards: Reward[] = [
    {
      id: '1',
      title: 'New User Welcome Bonus',
      description: 'Welcome bonus for new users - one time only!',
      pointsRequired: 250,
      category: 'freebie',
      isAvailable: !newUserRewardRedeemed, // Always available unless already redeemed
      icon: Star
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'discount':
        return 'bg-green-100 text-green-800';
      case 'freebie':
        return 'bg-blue-100 text-blue-800';
      case 'upgrade':
        return 'bg-purple-100 text-purple-800';
      case 'exclusive':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'discount':
        return <Gift className="h-4 w-4" />;
      case 'freebie':
        return <Star className="h-4 w-4" />;
      case 'upgrade':
        return <Zap className="h-4 w-4" />;
      case 'exclusive':
        return <Award className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const handleRedeemReward = async (reward: Reward) => {
    console.log('Redeem button clicked for reward:', reward);
    console.log('Current loyalty points:', loyaltyPoints);
    console.log('Points required:', reward.pointsRequired);
    
    // For new user reward (ID '1'), allow redemption even if user doesn't have enough points
    // because it ADDS points rather than spending them
    if (reward.id !== '1' && loyaltyPoints < reward.pointsRequired) {
      console.log('Insufficient points for regular reward');
      return;
    }
    try {
      setLoading(true);
      console.log('Calling rewardsApi.redeem with:', { points: reward.pointsRequired, description: `Redeemed: ${reward.title}`, rewardId: reward.id });
      const account = await rewardsApi.redeem(reward.pointsRequired, `Redeemed: ${reward.title}`, reward.id);
      console.log('Redeem successful, new account data:', account);
      setLoyaltyPoints(account.points);
      setTotalSpent(account.totalSpent);
      setTotalEarned(account.totalEarned);
      setNewUserRewardRedeemed(account.newUserRewardRedeemed);
      setRecentActivity((account.history || []).map((h) => ({ ...h, date: new Date(h.date) })));
      
      // Show specific message for new user reward
      if (reward.id === '1') {
        alert(`🎉 Welcome! You've successfully claimed your ${reward.title} and earned 250 points!`);
      } else {
        alert(`Successfully redeemed: ${reward.title}`);
      }
    } catch (e: any) {
      console.error('Error redeeming reward:', e);
      setError(e.message || 'Failed to redeem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Rewards & Loyalty</h1>
          </div>
          {error && (
            <p className="text-red-600 mb-2">{error}</p>
          )}
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Earn points for every session and redeem them for amazing rewards!
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <PropagateLoader color="#9333ea" />
          </div>
        ) : (

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Loyalty Points Board */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sticky top-8">
              <div className="text-center mb-8">
                <div className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Coins className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{loyaltyPoints}</h2>
                <p className="text-lg text-gray-600 mb-1">Loyalty Points</p>
                <p className="text-sm text-gray-500">1 Point = ₹1</p>
              </div>

              {/* Points Summary */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Total Earned</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">{totalEarned}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-gray-700">Total Spent</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">{totalSpent}</span>
                </div>
              </div>

              {/* How to Earn */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Earn Points</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Complete Session</p>
                      <p className="text-xs text-gray-600">+50 points per session</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Star className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Leave Review</p>
                      <p className="text-xs text-gray-600">+25 points per review</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Target className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Refer Friends</p>
                      <p className="text-xs text-gray-600">+100 points per referral</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {recentActivity.slice(0, 3).map((activity, idx) => (
                    <div key={activity.id ?? `${activity.date.getTime()}-${idx}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {activity.type === 'earned' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Gift className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            {activity.date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${
                        activity.type === 'earned' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {activity.type === 'earned' ? '+' : ''}{activity.points}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Available Rewards */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Rewards</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rewards.map((reward) => (
                  <div key={reward.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <reward.icon className="h-6 w-6 text-purple-600" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(reward.category)}`}>
                        {reward.category.charAt(0).toUpperCase() + reward.category.slice(1)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{reward.title}</h3>
                    <p className="text-gray-600 mb-4">{reward.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-700">{reward.pointsRequired} points</span>
                      </div>
                      
                      <button
                        onClick={() => handleRedeemReward(reward)}
                        disabled={!reward.isAvailable || (reward.id !== '1' && loyaltyPoints < reward.pointsRequired)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                          reward.isAvailable && (reward.id === '1' || loyaltyPoints >= reward.pointsRequired)
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {reward.id === '1' && newUserRewardRedeemed ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Already Redeemed
                          </>
                        ) : reward.id === '1' ? (
                          <>
                            <Gift className="h-4 w-4" />
                            Redeem
                          </>
                        ) : reward.isAvailable ? (
                          <>
                            <Gift className="h-4 w-4" />
                            Redeem
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4" />
                            Need {reward.pointsRequired - loyaltyPoints} more
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coming Soon */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-200">
              <div className="text-center">
                <div className="p-3 bg-purple-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">More Rewards Coming Soon!</h3>
                <p className="text-gray-600 mb-4">
                  We're constantly adding new rewards and exclusive offers. Keep earning points to unlock more amazing benefits!
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <span>🎁 Exclusive merchandise</span>
                  <span>•</span>
                  <span>🏆 VIP events</span>
                  <span>•</span>
                  <span>💎 Premium features</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
