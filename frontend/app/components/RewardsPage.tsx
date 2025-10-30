"use client";

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

// Skeleton Loader Component
const SkeletonLoader = () => {
  return (
    <>
      <style jsx>{`
        .loader {
          position: relative;
          width: 240px;
          height: 130px;
          margin-bottom: 10px;
          border: 1px solid #d3d3d3;
          padding: 15px;
          background-color: #e3e3e3;
          overflow: hidden;
        }

        .loader:after {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          background: linear-gradient(110deg, rgba(227, 227, 227, 0) 0%, rgba(227, 227, 227, 0) 40%, rgba(227, 227, 227, 0.5) 50%, rgba(227, 227, 227, 0) 60%, rgba(227, 227, 227, 0) 100%);
          animation: gradient-animation_2 1.2s linear infinite;
        }

        .loader .wrapper {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .loader .wrapper > div {
          background-color: #cacaca;
        }

        .loader .circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
        }

        .loader .button {
          display: inline-block;
          height: 32px;
          width: 75px;
        }

        .loader .line-1 {
          position: absolute;
          top: 11px;
          left: 58px;
          height: 10px;
          width: 100px;
        }

        .loader .line-2 {
          position: absolute;
          top: 34px;
          left: 58px;
          height: 10px;
          width: 150px;
        }

        .loader .line-3 {
          position: absolute;
          top: 57px;
          left: 0px;
          height: 10px;
          width: 100%;
        }

        .loader .line-4 {
          position: absolute;
          top: 80px;
          left: 0px;
          height: 10px;
          width: 92%;
        }

        @keyframes gradient-animation_2 {
          0% {
            transform: translateX(-100%);
          }

          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
      <div className="loader">
        <div className="wrapper">
          <div className="circle"></div>
          <div className="line-1"></div>
          <div className="line-2"></div>
          <div className="line-3"></div>
          <div className="line-4"></div>
        </div>
      </div>
    </>
  );
};

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
        return 'text-white';
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
        
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <SkeletonLoader />
          </div>
        ) : (
        <div>
        {/* Header and Loyalty Board Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12 pt-12">
          {/* Left Side - Header and Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg shadow-lg" style={{ background: '#5E936C' }}>
                <Gift className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                Rewards & Loyalty
              </h1>
            </div>
            <style jsx>{`
              @keyframes shimmer {
                0% {
                  background-position: -200% 0;
                }
                100% {
                  background-position: 200% 0;
                }
              }
              .animate-shimmer {
                animation: shimmer 3s ease-in-out infinite;
              }
            `}</style>
            <p className="text-base text-gray-600 mb-6">
              Earn points for every session and redeem them for amazing rewards!
            </p>
            
            {error && (
              <p className="text-red-600 mb-4 text-sm">{error}</p>
            )}

            {/* How to Earn Points - Compact */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900">How to Earn Points</h3>
              <div className="space-y-2">
                <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Complete Session</p>
                      <p className="text-xs text-gray-600">+50 points per session</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 rounded">
                      <Star className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Leave Review</p>
                      <p className="text-xs text-gray-600">+25 points per review</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded" style={{ backgroundColor: '#5E936C20' }}>
                      <Target className="h-4 w-4" style={{ color: '#5E936C' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Refer Friends</p>
                      <p className="text-xs text-gray-600">+100 points per referral</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Loyalty Points Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-lg">
            <div className="text-center mb-6">
              <div className="p-3 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center" style={{ background: '#5E936C' }}>
                <Coins className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">{loyaltyPoints}</h2>
              <p className="text-base text-gray-600">Loyalty Points</p>
              <p className="text-sm text-gray-500">1 Point = ₹1</p>
            </div>

            {/* Points Summary */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Total Earned</span>
                </div>
                <span className="text-sm font-bold text-green-600">{totalEarned}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">Total Spent</span>
                </div>
                <span className="text-sm font-bold text-red-600">{totalSpent}</span>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {recentActivity.slice(0, 3).map((activity, idx) => (
                  <div key={activity.id ?? `${activity.date.getTime()}-${idx}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {activity.type === 'earned' ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <Gift className="h-3 w-3 text-red-600" />
                      )}
                      <div>
                        <p className="text-xs font-medium text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {activity.date.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${
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

        {/* Available Rewards Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Available Rewards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map((reward) => (
                  <div key={reward.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg" style={{ backgroundColor: '#5E936C20' }}>
                        <reward.icon className="h-6 w-6" style={{ color: '#5E936C' }} />
                      </div>
                      <span 
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(reward.category)}`}
                        style={reward.category === 'upgrade' ? { backgroundColor: '#5E936C' } : {}}
                      >
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
                            ? 'text-white'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                        style={
                          reward.isAvailable && (reward.id === '1' || loyaltyPoints >= reward.pointsRequired)
                            ? { backgroundColor: '#5E936C' }
                            : {}
                        }
                        onMouseEnter={(e) => {
                          if (reward.isAvailable && (reward.id === '1' || loyaltyPoints >= reward.pointsRequired)) {
                            e.currentTarget.style.backgroundColor = '#4A7556';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (reward.isAvailable && (reward.id === '1' || loyaltyPoints >= reward.pointsRequired)) {
                            e.currentTarget.style.backgroundColor = '#5E936C';
                          }
                        }}
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
            <div className="rounded-2xl p-6 border mt-8" style={{ background: 'linear-gradient(to right, #5E936C15, #3B82F615)', borderColor: '#5E936C50' }}>
              <div className="text-center">
                <div className="p-2 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#5E936C' }}>
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">More Rewards Coming Soon!</h3>
                <p className="text-sm text-gray-600 mb-3">
                  We&apos;re constantly adding new rewards and exclusive offers. Keep earning points to unlock more amazing benefits!
                </p>
                <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                  <span>🎁 Exclusive merchandise</span>
                  <span>•</span>
                  <span>🏆 VIP events</span>
                  <span>•</span>
                  <span>💎 Premium features</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
