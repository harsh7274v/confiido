"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Users, MessageSquare, BookOpen, Settings, BarChart3, LogOut, ChevronUp, ChevronDown, DollarSign, User } from "lucide-react";
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
  const [rescheduleMessages, setRescheduleMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(new Set());

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

  // Fetch reschedule request messages
  const fetchRescheduleMessages = useCallback(async () => {
    if (!user?.user_id) {
      setMessagesLoading(false);
      return;
    }

    try {
      setMessagesLoading(true);
      const response = await bookingApi.getMentorBookings(user.user_id, 1, 100);
      
      if (response.success) {
        const { bookings } = response.data;
        const messages: any[] = [];
        
        bookings.forEach((booking: any) => {
          booking.sessions.forEach((session: any) => {
            // Only show pending reschedule requests from clients
            if (session.rescheduleRequest && 
                session.rescheduleRequest.status === 'pending' && 
                session.rescheduleRequest.requestedBy === 'client') {
              messages.push({
                id: `${booking._id}_${session.sessionId}_reschedule`,
                bookingId: booking._id,
                sessionId: session.sessionId,
                clientName: booking.clientId?.firstName && booking.clientId?.lastName
                  ? `${booking.clientId.firstName} ${booking.clientId.lastName}`
                  : `Client ${booking.clientId?.user_id || booking.clientId?.clientUserId || 'Unknown'}`,
                clientEmail: booking.clientId?.email || booking.clientId?.clientEmail || 'N/A',
                sessionType: session.sessionType,
                originalDate: session.scheduledDate,
                originalTime: `${session.startTime} - ${session.endTime}`,
                requestedDate: session.rescheduleRequest.requestedDate,
                requestedTime: `${session.rescheduleRequest.requestedStartTime} - ${session.rescheduleRequest.requestedEndTime}`,
                reason: session.rescheduleRequest.reason || 'No reason provided',
                requestedAt: session.rescheduleRequest.requestedAt,
                status: session.rescheduleRequest.status
              });
            }
          });
        });
        
        // Sort by requestedAt (newest first)
        messages.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        setRescheduleMessages(messages);
      }
    } catch (error) {
      console.error('Error fetching reschedule messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  }, [user]);

  // Fetch overview data
  const fetchOverviewData = useCallback(async () => {
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

        // Calculate unread reschedule messages
        let unreadRescheduleCount = 0;
        bookings.forEach((booking: any) => {
          booking.sessions.forEach((session: any) => {
            if (session.rescheduleRequest && 
                session.rescheduleRequest.status === 'pending' && 
                session.rescheduleRequest.requestedBy === 'client') {
              const messageId = `${booking._id}_${session.sessionId}_reschedule`;
              if (!readMessageIds.has(messageId)) {
                unreadRescheduleCount++;
              }
            }
          });
        });

        setOverviewData({
          totalSessions: stats.totalSessions || 0,
          activeStudents: uniqueClients.size,
          unreadMessages: unreadRescheduleCount,
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
  }, [user, readMessageIds]);

  // Fetch overview data when user is loaded
  useEffect(() => {
    if (user && !userLoading) {
      fetchOverviewData();
      fetchRescheduleMessages();
    }
  }, [user, userLoading, fetchOverviewData, fetchRescheduleMessages]);

  // Auto-refresh overview data every 30 seconds
  useEffect(() => {
    if (!user || userLoading) return;

    const interval = setInterval(() => {
      // Always refresh messages to update unread count
      fetchRescheduleMessages().then(() => {
        // Then refresh overview to get updated stats including unread count
        fetchOverviewData();
      });
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user, userLoading, fetchOverviewData, fetchRescheduleMessages]);

  // Auto-refresh messages when messages tab is active
  useEffect(() => {
    if (activeTab === 'messages' && user && !userLoading) {
      fetchRescheduleMessages();
      
      // Auto-refresh messages every 30 seconds when tab is active
      const interval = setInterval(() => {
        fetchRescheduleMessages();
        // Also refresh overview to update unread count
        fetchOverviewData();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab, user, userLoading, fetchRescheduleMessages, fetchOverviewData]);

  // Load read message IDs from localStorage
  useEffect(() => {
    if (user?.user_id) {
      const stored = localStorage.getItem(`mentor_read_messages_${user.user_id}`);
      if (stored) {
        try {
          setReadMessageIds(new Set(JSON.parse(stored)));
        } catch (e) {
          console.error('Error loading read messages:', e);
        }
      }
    }
  }, [user]);

  // Save read message IDs to localStorage
  useEffect(() => {
    if (user?.user_id && readMessageIds.size > 0) {
      localStorage.setItem(`mentor_read_messages_${user.user_id}`, JSON.stringify(Array.from(readMessageIds)));
    }
  }, [readMessageIds, user]);

  // Mark message as read
  const markMessageAsRead = (messageId: string) => {
    setReadMessageIds(prev => new Set([...prev, messageId]));
    // Refresh overview to update unread count
    setTimeout(() => fetchOverviewData(), 100);
  };

  // Mark all messages as read
  const markAllMessagesAsRead = () => {
    const allIds = rescheduleMessages.map(m => m.id);
    setReadMessageIds(prev => new Set([...prev, ...allIds]));
    // Refresh overview to update unread count
    setTimeout(() => fetchOverviewData(), 100);
  };

  // Get unread message count - recalculated whenever messages or read status changes
  const unreadCount = React.useMemo(() => {
    return rescheduleMessages.filter(m => !readMessageIds.has(m.id)).length;
  }, [rescheduleMessages, readMessageIds]);

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
          <div className="space-y-6 md:space-y-8">
            {overviewLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-600">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p>Loading overview data...</p>
                </div>
              </div>
            ) : overviewError ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <p className="text-red-600 mb-4">{overviewError}</p>
                <button 
                  onClick={fetchOverviewData}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <div className="bg-gradient-to-br from-white to-gray-50 p-4 md:p-6 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-2.5 rounded-xl shadow-lg flex-shrink-0" style={{ backgroundColor: '#3E5F44' }}>
                        <Calendar className="h-5 md:h-6 w-5 md:w-6 text-white" />
                      </div>
                      <div className="ml-3 md:ml-4">
                        <p className="text-xs md:text-sm font-medium text-gray-600" style={{ fontFamily: "'Rubik', sans-serif" }}>Total Sessions</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Rubik', sans-serif" }}>{overviewData.totalSessions}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-white to-gray-50 p-4 md:p-6 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-2.5 rounded-xl shadow-lg flex-shrink-0" style={{ backgroundColor: '#3E5F44' }}>
                        <Users className="h-5 md:h-6 w-5 md:w-6 text-white" />
                      </div>
                      <div className="ml-3 md:ml-4">
                        <p className="text-xs md:text-sm font-medium text-gray-600" style={{ fontFamily: "'Rubik', sans-serif" }}>Active Students</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Rubik', sans-serif" }}>{overviewData.activeStudents}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-white to-gray-50 p-4 md:p-6 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-2.5 rounded-xl shadow-lg flex-shrink-0" style={{ backgroundColor: '#3E5F44' }}>
                        <BookOpen className="h-5 md:h-6 w-5 md:w-6 text-white" />
                      </div>
                      <div className="ml-3 md:ml-4">
                        <p className="text-xs md:text-sm font-medium text-gray-600" style={{ fontFamily: "'Rubik', sans-serif" }}>Pending Bookings</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Rubik', sans-serif" }}>{overviewData.pendingBookings}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-white to-gray-50 p-4 md:p-6 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-2.5 rounded-xl shadow-lg flex-shrink-0" style={{ backgroundColor: '#3E5F44' }}>
                        <DollarSign className="h-5 md:h-6 w-5 md:w-6 text-white" />
                      </div>
                      <div className="ml-3 md:ml-4">
                        <p className="text-xs md:text-sm font-medium text-gray-600" style={{ fontFamily: "'Rubik', sans-serif" }}>Total Earnings</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Rubik', sans-serif" }}>₹{overviewData.totalEarnings}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="bg-gradient-to-br from-white to-gray-50 p-4 md:p-6 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-2.5 rounded-xl shadow-lg flex-shrink-0" style={{ backgroundColor: '#3E5F44' }}>
                        <Calendar className="h-5 md:h-6 w-5 md:w-6 text-white" />
                      </div>
                      <div className="ml-3 md:ml-4">
                        <p className="text-xs md:text-sm font-medium text-gray-600" style={{ fontFamily: "'Rubik', sans-serif" }}>Completed</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Rubik', sans-serif" }}>{overviewData.completedSessions}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-white to-gray-50 p-4 md:p-6 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-2.5 rounded-xl shadow-lg flex-shrink-0" style={{ backgroundColor: '#3E5F44' }}>
                        <Calendar className="h-5 md:h-6 w-5 md:w-6 text-white" />
                      </div>
                      <div className="ml-3 md:ml-4">
                        <p className="text-xs md:text-sm font-medium text-gray-600" style={{ fontFamily: "'Rubik', sans-serif" }}>Confirmed</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Rubik', sans-serif" }}>{overviewData.confirmedSessions}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-white to-gray-50 p-4 md:p-6 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center">
                      <div className="p-2.5 rounded-xl shadow-lg flex-shrink-0" style={{ backgroundColor: '#3E5F44' }}>
                        <Calendar className="h-5 md:h-6 w-5 md:w-6 text-white" />
                      </div>
                      <div className="ml-3 md:ml-4">
                        <p className="text-xs md:text-sm font-medium text-gray-600" style={{ fontFamily: "'Rubik', sans-serif" }}>Cancelled</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Rubik', sans-serif" }}>{overviewData.cancelledSessions}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recent Activity Card */}
                <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-xl sm:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl shadow-lg flex-shrink-0" style={{ backgroundColor: '#3E5F44' }}>
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900" style={{ fontFamily: "'Rubik', sans-serif" }}>Recent Activity</h3>
                  </div>
                  <div className="space-y-3">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, index) => (
                        <div key={activity.id || index} className="bg-white rounded-lg p-3 md:p-4 border border-gray-200 hover:border-gray-300 transition-all duration-300">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                activity.type === 'booking' ? 'bg-green-500' : 
                                activity.type === 'completed' ? 'bg-green-600' : 'bg-gray-500'
                              }`}></div>
                              <div className="flex-1">
                                <p className="text-sm md:text-base font-medium text-gray-900" style={{ fontFamily: "'Rubik', sans-serif" }}>{activity.title}</p>
                                <p className="text-xs md:text-sm text-gray-500 mt-1">{activity.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 sm:ml-4">
                              {activity.amount > 0 && (
                                <span className="text-sm md:text-base font-semibold" style={{ color: '#3E5F44', fontFamily: "'Rubik', sans-serif" }}>₹{activity.amount}</span>
                              )}
                              <span className="text-xs text-gray-400">{activity.time}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500" style={{ fontFamily: "'Rubik', sans-serif" }}>No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 'messages':
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Rubik', sans-serif" }}>
                  Reschedule Requests
                </h2>
                <p className="text-sm md:text-base text-gray-600 mt-1" style={{ fontFamily: "'Rubik', sans-serif" }}>
                  Messages from clients requesting session reschedules
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllMessagesAsRead}
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors"
                  style={{ backgroundColor: '#3E5F44' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2F4A35'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3E5F44'}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {messagesLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-600">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p>Loading messages...</p>
                </div>
              </div>
            ) : rescheduleMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: "'Rubik', sans-serif" }}>No Messages</h3>
                <p className="text-gray-600" style={{ fontFamily: "'Rubik', sans-serif" }}>You don't have any reschedule requests at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rescheduleMessages.map((message) => {
                  const isUnread = !readMessageIds.has(message.id);
                  const formatDate = (dateString: string) => {
                    return new Date(dateString).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                  };
                  const formatTime = (timeString: string) => {
                    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    });
                  };

                  return (
                    <div
                      key={message.id}
                      className={`bg-white rounded-xl sm:rounded-2xl p-4 md:p-6 border-2 transition-all duration-300 ${
                        isUnread 
                          ? 'border-green-500 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => markMessageAsRead(message.id)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Unread Indicator */}
                        {isUnread && (
                          <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0 mt-1 animate-pulse"></div>
                        )}
                        {!isUnread && (
                          <div className="w-3 h-3 flex-shrink-0 mt-1"></div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1" style={{ fontFamily: "'Rubik', sans-serif" }}>
                                {message.clientName}
                              </h3>
                              <p className="text-sm text-gray-600">{message.clientEmail}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isUnread && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                  New
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatDate(message.requestedAt)}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-4 mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "'Rubik', sans-serif" }}>
                              Reschedule Request
                            </p>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>
                                  <strong>Original:</strong> {formatDate(message.originalDate)} at {formatTime(message.originalTime.split(' - ')[0])} - {formatTime(message.originalTime.split(' - ')[1])}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-green-500" />
                                <span>
                                  <strong>Requested:</strong> {formatDate(message.requestedDate)} at {formatTime(message.requestedTime.split(' - ')[0])} - {formatTime(message.requestedTime.split(' - ')[1])}
                                </span>
                              </div>
                            </div>
                          </div>

                          {message.reason && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: "'Rubik', sans-serif" }}>
                                Reason:
                              </p>
                              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 italic">
                                "{message.reason}"
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-3 mt-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab('bookings');
                              }}
                              className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors"
                              style={{ backgroundColor: '#3E5F44' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2F4A35'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3E5F44'}
                            >
                              View Booking
                            </button>
                            <span className="text-xs text-gray-500 capitalize">
                              Session Type: {message.sessionType}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#3E5F44' }}>
              <Settings className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: "'Rubik', sans-serif" }}>Coming Soon</h3>
            <p className="text-gray-600" style={{ fontFamily: "'Rubik', sans-serif" }}>This feature is under development.</p>
          </div>
        );
    }
  };

  const userDisplayName = user?.firstName || user?.name || 'Mentor';

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header */}
        <section className="relative overflow-hidden py-6 sm:py-8" style={{ background: 'linear-gradient(135deg, #e0e8ed 0%, #f0f4f7 100%)' }}>
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-20">
            <div className="flex flex-row items-center justify-between">
              {/* Left side - User avatar and Welcome text */}
              <div className="flex items-center gap-4">
                {/* User Avatar */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="h-6 w-6 sm:h-7 sm:w-7 text-gray-600" />
                </div>
                
                {/* Welcome Text */}
                <div className="flex flex-col">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800" style={{ fontFamily: "'Rubik', sans-serif" }}>
                    Hello, {userDisplayName}!
                  </h2>
                  <span className="text-sm sm:text-base text-gray-600 font-normal" style={{ fontFamily: "'Rubik', sans-serif" }}>
                    Manage your mentoring schedule
                  </span>
                </div>
              </div>
              
              {/* Right side - Logout button */}
              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-all duration-200 focus:outline-none"
                  title="Logout"
                >
                  {logoutLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                  ) : (
                    <LogOut className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs - Hidden on mobile, shown on desktop */}
        <div className="hidden md:block bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as DashboardTab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors relative ${
                      activeTab === tab.id
                        ? 'border-green-600 text-green-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    style={activeTab === tab.id ? { borderColor: '#3E5F44', color: '#3E5F44', fontFamily: "'Rubik', sans-serif" } : { fontFamily: "'Rubik', sans-serif" }}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.id === 'messages' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        {/* Main Navigation Tabs */}
        <div className="flex justify-around items-center py-2">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-white shadow-lg'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={activeTab === tab.id ? { backgroundColor: '#3E5F44' } : {}}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium" style={{ fontFamily: "'Rubik', sans-serif" }}>{tab.label}</span>
                {tab.id === 'messages' && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
            );
          })}
          
          {/* Expand/Collapse Button */}
          <button
            onClick={() => setShowAllTabs(!showAllTabs)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              showAllTabs ? 'text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'
            }`}
            style={showAllTabs ? { backgroundColor: '#3E5F44' } : {}}
          >
            {showAllTabs ? (
              <>
                <ChevronUp className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium" style={{ fontFamily: "'Rubik', sans-serif" }}>Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium" style={{ fontFamily: "'Rubik', sans-serif" }}>More</span>
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
                    className={`flex flex-col items-center py-3 px-2 rounded-lg transition-colors relative ${
                      activeTab === tab.id
                        ? 'text-white shadow-lg'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    style={activeTab === tab.id ? { backgroundColor: '#3E5F44' } : {}}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span className="text-xs font-medium text-center" style={{ fontFamily: "'Rubik', sans-serif" }}>{tab.label}</span>
                    {tab.id === 'messages' && unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    )}
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
