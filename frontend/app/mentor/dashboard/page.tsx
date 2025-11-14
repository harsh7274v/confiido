"use client";
import React, { useState, useEffect } from "react";
import { Calendar, Users, MessageSquare, BookOpen, Settings, BarChart3, LogOut, ChevronUp, ChevronDown, DollarSign } from "lucide-react";
import AvailabilityManager from "../../components/availability/AvailabilityManager";
import MentorBookings from "../../components/MentorBookings";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { bookingApi } from "../../services/bookingApi";

type DashboardTab = 'overview' | 'availability' | 'bookings' | 'messages' | 'analytics' | 'settings';

const MentorDashboard = () => {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showAllTabs, setShowAllTabs] = useState(false);
  
  // Overview data state
  const [overviewData, setOverviewData] = useState({
    totalSessions: 0,
    activeStudents: 0,
    unreadMessages: 0,
    pendingBookings: 0,
    totalEarnings: 0,
    completedSessions: 0,
    confirmedSessions: 0,
    cancelledSessions: 0
  });
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'bookings', label: 'Bookings', icon: BookOpen },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Show first 4 tabs by default, rest are hidden
  const visibleTabs = tabs.slice(0, 4);
  const hiddenTabs = tabs.slice(4);

  // Fetch overview data
  const fetchOverviewData = async () => {
    if (!user?.user_id) {
      setOverviewLoading(false);
      return;
    }

    try {
      setOverviewLoading(true);
      setOverviewError(null);

      // Fetch mentor bookings data which includes stats
      const response = await bookingApi.getMentorBookings(user.user_id, 1, 10);
      
      if (response.success) {
        const { stats, bookings } = response.data;
        
        // Calculate unique active students from recent bookings
        const uniqueClients = new Set();
        bookings.forEach((booking: any) => {
          if (booking.clientId && booking.clientId._id) {
            uniqueClients.add(booking.clientId._id);
          }
        });

        setOverviewData({
          totalSessions: stats.totalSessions || 0,
          activeStudents: uniqueClients.size,
          unreadMessages: 0, // TODO: Implement when messaging is ready
          pendingBookings: stats.pendingSessions || 0,
          totalEarnings: stats.totalEarnings || 0,
          completedSessions: stats.completedSessions || 0,
          confirmedSessions: stats.confirmedSessions || 0,
          cancelledSessions: stats.cancelledSessions || 0
        });

        // Set recent activity from bookings
        const recentBookings = bookings.slice(0, 5).map((booking: any) => ({
          id: booking._id,
          type: 'booking',
          title: `New booking from ${booking.clientId?.firstName || 'Student'} ${booking.clientId?.lastName || ''}`,
          description: `Session scheduled for ${new Date(booking.sessions[0]?.scheduledDate).toLocaleDateString()}`,
          time: new Date(booking.createdAt).toLocaleDateString(),
          amount: booking.sessions[0]?.price || 0
        }));
        setRecentActivity(recentBookings);
      } else {
        throw new Error('Failed to fetch overview data');
      }
    } catch (error) {
      console.error('Error fetching overview data:', error);
      setOverviewError(error instanceof Error ? error.message : 'Failed to load overview data');
    } finally {
      setOverviewLoading(false);
    }
  };

  // Fetch overview data when user is loaded
  useEffect(() => {
    if (user && !userLoading) {
      fetchOverviewData();
    }
  }, [user, userLoading]);

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return;
    
    try {
      setLogoutLoading(true);
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Show loading for a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still redirect even if there's an error
      router.push('/');
    } finally {
      setLogoutLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'availability':
        return <AvailabilityManager />;
      case 'bookings':
        return <MentorBookings />;
      case 'overview':
        return (
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard Overview</h2>
            
            {overviewLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-600">
                Loading overview data...
              </div>
            ) : overviewError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{overviewError}</p>
                <button 
                  onClick={fetchOverviewData}
                  className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <div className="bg-white p-3 md:p-6 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 md:h-6 w-5 md:w-6 text-blue-600" />
                  </div>
                  <div className="ml-2 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Total Sessions</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">{overviewData.totalSessions}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 md:p-6 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-5 md:h-6 w-5 md:w-6 text-green-600" />
                  </div>
                  <div className="ml-2 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Active Students</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">{overviewData.activeStudents}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 md:p-6 rounded-lg border border-gray-200">
                <div className="flex items-center">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <BookOpen className="h-5 md:h-6 w-5 md:w-6 text-orange-600" />
                  </div>
                  <div className="ml-2 md:ml-4">
                        <p className="text-xs md:text-sm font-medium text-gray-600">Pending Bookings</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">{overviewData.pendingBookings}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 md:p-6 rounded-lg border border-gray-200">
                <div className="flex items-center">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <DollarSign className="h-5 md:h-6 w-5 md:w-6 text-emerald-600" />
                  </div>
                  <div className="ml-2 md:ml-4">
                        <p className="text-xs md:text-sm font-medium text-gray-600">Total Earnings</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">₹{overviewData.totalEarnings}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional stats row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                  <div className="bg-white p-3 md:p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Calendar className="h-5 md:h-6 w-5 md:w-6 text-green-600" />
                      </div>
                      <div className="ml-2 md:ml-4">
                        <p className="text-xs md:text-sm font-medium text-gray-600">Completed</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">{overviewData.completedSessions}</p>
                </div>
              </div>
            </div>
            
                  <div className="bg-white p-3 md:p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Calendar className="h-5 md:h-6 w-5 md:w-6 text-yellow-600" />
                      </div>
                      <div className="ml-2 md:ml-4">
                        <p className="text-xs md:text-sm font-medium text-gray-600">Confirmed</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">{overviewData.confirmedSessions}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 md:p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Calendar className="h-5 md:h-6 w-5 md:w-6 text-red-600" />
                      </div>
                      <div className="ml-2 md:ml-4">
                        <p className="text-xs md:text-sm font-medium text-gray-600">Cancelled</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">{overviewData.cancelledSessions}</p>
                      </div>
                </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Recent Activity</h3>
                  <div className="space-y-2 md:space-y-3">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, index) => (
                        <div key={activity.id || index} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs md:text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              activity.type === 'booking' ? 'bg-blue-500' : 
                              activity.type === 'completed' ? 'bg-green-500' : 'bg-purple-500'
                            }`}></div>
                            <span className="break-words">{activity.title}</span>
                            {activity.amount > 0 && (
                              <span className="text-emerald-600 font-medium">₹{activity.amount}</span>
                            )}
                          </div>
                          <span className="text-gray-400 text-xs">{activity.time}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p>No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600">This feature is under development.</p>
          </div>
        );
    }
  };

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mentor Dashboard</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">Manage your mentoring schedule and student interactions</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 w-full md:w-auto"
            >
              {logoutLoading ? (
                <span>Logging out...</span>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs - Hidden on mobile, shown on desktop */}
        <div className="hidden md:block bg-white border-b border-gray-200">
          <div className="px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as DashboardTab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-6 pb-24 md:pb-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        {/* Main Navigation Tabs */}
        <div className="flex justify-around items-center py-2">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
          
          {/* Expand/Collapse Button */}
          <button
            onClick={() => setShowAllTabs(!showAllTabs)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              showAllTabs ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {showAllTabs ? (
              <>
                <ChevronUp className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">More</span>
              </>
            )}
          </button>
        </div>

        {/* Hidden Tabs - Expandable */}
        {showAllTabs && (
          <div className="border-t border-gray-100 bg-gray-50">
            <div className="grid grid-cols-3 gap-2 p-3">
              {hiddenTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as DashboardTab);
                      setShowAllTabs(false);
                    }}
                    className={`flex flex-col items-center py-3 px-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span className="text-xs font-medium text-center">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
};

export default MentorDashboard;
