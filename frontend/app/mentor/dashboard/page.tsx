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
    totalEarnings: 0,
    completedSessions: 0
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
          totalSessions: stats.completedSessions || 0,
          activeStudents: uniqueClients.size,
          unreadMessages: unreadRescheduleCount,
          totalEarnings: stats.totalEarnings || 0,
          completedSessions: stats.completedSessions || 0
        });

        // Set recent activity from bookings - sorted by session creation time (latest first)
        const allRecentSessions: any[] = [];

        bookings.forEach((booking: any) => {
          booking.sessions.forEach((session: any) => {
            const sessionDate = new Date(session.scheduledDate).toLocaleDateString();
            const sessionTime = session.startTime && session.endTime
              ? `${session.startTime} - ${session.endTime}`
              : '';

            allRecentSessions.push({
              id: `${booking._id}_${session.sessionId}`,
              type: 'booking',
              title: `New booking from ${booking.clientId?.firstName || 'Student'} ${booking.clientId?.lastName || ''}`,
              description: sessionTime
                ? `Session scheduled for ${sessionDate} at ${sessionTime}`
                : `Session scheduled for ${sessionDate}`,
              time: new Date(session.createdTime || booking.createdAt).toLocaleDateString(),
              amount: session.price || 0,
              createdAt: session.createdTime || booking.createdAt,
              status: session.status,
              paymentStatus: session.paymentStatus
            });
          });
        });

        // Sort by creation time and take the 5 most recent
        const recentBookings = allRecentSessions
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

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

  // Auto-refresh overview data every 2 minutes
  useEffect(() => {
    if (!user || userLoading) return;

    const interval = setInterval(() => {
      // Always refresh messages to update unread count
      fetchRescheduleMessages().then(() => {
        // Then refresh overview to get updated stats including unread count
        fetchOverviewData();
      }).catch((err) => {
        // Silently handle rate limit errors
        if (err?.response?.status === 429) {
          console.warn('⚠️ Rate limit reached, skipping this refresh');
        }
      });
    }, 120000); // Refresh every 2 minutes

    return () => clearInterval(interval);
  }, [user, userLoading, fetchOverviewData, fetchRescheduleMessages]);

  // Auto-refresh messages when messages tab is active
  useEffect(() => {
    if (activeTab === 'messages' && user && !userLoading) {
      fetchRescheduleMessages();

      // Auto-refresh messages every 2 minutes when tab is active
      const interval = setInterval(() => {
        fetchRescheduleMessages().catch((err) => {
          if (err?.response?.status === 429) {
            console.warn('⚠️ Rate limit reached, skipping this refresh');
          }
        });
        // Also refresh overview to update unread count
        fetchOverviewData().catch((err) => {
          if (err?.response?.status === 429) {
            console.warn('⚠️ Rate limit reached, skipping this refresh');
          }
        });
      }, 120000); // Refresh every 2 minutes

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {/* Total Sessions Card - Melon Pink */}
                  <div className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#f4acb7' }}>
                    <div className="flex items-center">
                      <div className="p-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: '#3a3a3a' }}>
                        <Calendar className="h-5 md:h-6 w-5 md:w-6 text-white" />
                      </div>
                      <div className="ml-3 md:ml-4">
                        <p className="text-xs md:text-sm font-medium text-gray-800 tracking-wide" style={{ fontFamily: "'Rubik', sans-serif" }}>Total Sessions</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Rubik', sans-serif" }}>{overviewData.totalSessions}</p>
                      </div>
                    </div>
                  </div>

                  {/* Active Students Card - Lavender Blush Darker */}
                  <div className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#fadde1' }}>
                    <div className="flex items-center">
                      <div className="p-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: '#3a3a3a' }}>
                        <Users className="h-5 md:h-6 w-5 md:w-6 text-white" />
                      </div>
                      <div className="ml-3 md:ml-4">
                        <p className="text-xs md:text-sm font-medium text-gray-800 tracking-wide" style={{ fontFamily: "'Rubik', sans-serif" }}>Active Students</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Rubik', sans-serif" }}>{overviewData.activeStudents}</p>
                      </div>
                    </div>
                  </div>

                  {/* Total Earnings Card - Melon Pink */}
                  <div className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#f4acb7' }}>
                    <div className="flex items-center">
                      <div className="p-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: '#3a3a3a' }}>
                        <DollarSign className="h-5 md:h-6 w-5 md:w-6 text-white" />
                      </div>
                      <div className="ml-3 md:ml-4">
                        <p className="text-xs md:text-sm font-medium text-gray-800 tracking-wide" style={{ fontFamily: "'Rubik', sans-serif" }}>Total Earnings</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Rubik', sans-serif" }}>₹{overviewData.totalEarnings}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Card */}
                <div className="bg-white rounded-3xl p-4 md:p-6 shadow-lg border border-gray-100" style={{ backgroundColor: '#fadde1' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl shadow-sm flex-shrink-0" style={{ backgroundColor: '#3a3a3a' }}>
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900" style={{ fontFamily: "'Rubik', sans-serif" }}>Recent Activity</h3>
                  </div>
                  <div className="space-y-3">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, index) => (
                        <div key={activity.id || index} className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/50 hover:bg-white/80 transition-all duration-300">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${activity.type === 'booking' ? 'bg-green-500' :
                                activity.type === 'completed' ? 'bg-green-600' : 'bg-gray-500'
                                }`}></div>
                              <div className="flex-1">
                                <p className="text-sm md:text-base font-medium text-gray-900" style={{ fontFamily: "'Rubik', sans-serif" }}>{activity.title}</p>
                                <p className="text-xs md:text-sm text-gray-600 mt-1">{activity.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 sm:ml-4">
                              {activity.amount > 0 && (
                                <span className="text-sm md:text-base font-semibold" style={{ color: '#3a3a3a', fontFamily: "'Rubik', sans-serif" }}>₹{activity.amount}</span>
                              )}
                              <span className="text-xs text-gray-500">{activity.time}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600" style={{ fontFamily: "'Rubik', sans-serif" }}>No recent activity</p>
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
                  className="px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  style={{ backgroundColor: '#3a3a3a' }}
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
              <div className="text-center py-12 bg-white/50 rounded-3xl border border-gray-100 p-8 shadow-sm">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: "'Rubik', sans-serif" }}>No Messages</h3>
                <p className="text-gray-500" style={{ fontFamily: "'Rubik', sans-serif" }}>You don't have any reschedule requests at the moment.</p>
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
                      className={`rounded-3xl p-4 md:p-6 border transition-all duration-300 ${isUnread
                        ? 'border-red-200/50 shadow-md ring-1 ring-red-100' // Slight red tint for unread
                        : 'border-white/40 hover:border-white/60 hover:shadow-sm'
                        }`}
                      style={{ backgroundColor: '#fadde1' }}
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
                                <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full border border-red-100">
                                  New
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatDate(message.requestedAt)}
                              </span>
                            </div>
                          </div>

                          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-3 border border-white/50">
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
                                <Calendar className="h-4 w-4 text-gray-600" />
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
                              <p className="text-sm text-gray-700 bg-white/40 rounded-xl p-3 italic border border-white/30" style={{ fontFamily: "'Rubik', sans-serif" }}>
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
                              className="px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                              style={{ backgroundColor: '#3a3a3a' }}
                            >
                              View Booking
                            </button>
                            <span className="text-xs text-gray-500 capitalize px-3 py-1 bg-gray-100 rounded-full">
                              {message.sessionType}
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
          <div className="text-center py-12 bg-white/50 rounded-3xl border border-gray-100 shadow-sm mx-auto max-w-lg mt-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#3a3a3a' }}>
              <Settings className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: "'Rubik', sans-serif" }}>Coming Soon</h3>
            <p className="text-gray-600" style={{ fontFamily: "'Rubik', sans-serif" }}>This feature is under development.</p>
          </div>
        );
    }
  };

  const userDisplayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : 'Mentor';

  // Add version identifier to force refresh in case of caching issues
  const dashboardVersion = 'v2.3.1';

  // Aggressive cache-busting effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Set version immediately
      const currentVersion = sessionStorage.getItem('mentor_dashboard_version');

      // If version doesn't match or doesn't exist, force reload
      if (!currentVersion || currentVersion !== dashboardVersion) {
        sessionStorage.setItem('mentor_dashboard_version', dashboardVersion);
        // Small delay to ensure state is set before reload
        setTimeout(() => {
          window.location.reload();
        }, 100);
        return;
      }

      // Prevent browser back/forward cache
      window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
          window.location.reload();
        }
      });

      // Add meta tags to prevent caching
      const metaTags = [
        { httpEquiv: 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
        { httpEquiv: 'Pragma', content: 'no-cache' },
        { httpEquiv: 'Expires', content: '0' }
      ];

      metaTags.forEach(tag => {
        let meta = document.querySelector(`meta[http-equiv="${tag.httpEquiv}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('http-equiv', tag.httpEquiv);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', tag.content);
      });
    }
  }, [dashboardVersion]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: '#fff0f3', fontFamily: "'Rubik', sans-serif" }} data-version={dashboardVersion}>
        <div className="max-w-7xl mx-auto">
          {/* Modern Header */}
          <section className="relative overflow-hidden py-6 sm:py-8" style={{ backgroundColor: '#fff0f3' }}>
            <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-20">
              <div className="flex flex-row items-center justify-between">
                {/* Left side - User avatar and Welcome text */}
                <div className="flex items-center gap-4">
                  {/* User Avatar */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100">
                    <User className="h-6 w-6 sm:h-7 sm:w-7 text-gray-600" />
                  </div>

                  {/* Welcome Text */}
                  <div className="flex flex-col">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-wide" style={{ color: '#4A4458', fontFamily: "'Rubik', sans-serif" }}>
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
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-all duration-200 focus:outline-none border border-gray-100"
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
          {/* Navigation Tabs - Hidden on mobile, shown on desktop */}
          <div className="hidden md:block bg-gray-200/90 backdrop-blur-md shadow-lg sticky top-4 z-30 rounded-2xl mx-4 md:mx-6 border border-white/20 transition-all duration-300">
            <div className="px-4 py-2">
              <nav className="flex space-x-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as DashboardTab)}
                      className={`py-2 px-4 rounded-lg font-medium text-sm flex items-center gap-2 transition-all duration-200 relative ${isActive
                        ? 'bg-black text-white shadow-md transform scale-105' // Active: Black bg, White text, Elevated
                        : 'text-gray-600 hover:bg-white hover:text-black hover:shadow-sm' // Inactive: Grey text, turn white on hover
                        }`}
                      style={{ fontFamily: "'Rubik', sans-serif" }}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-current'}`} />
                      {tab.label}
                      {tab.id === 'messages' && unreadCount > 0 && (
                        <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${isActive ? 'bg-red-500' : 'bg-red-500'}`}></span>
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
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 z-50 shadow-lg safe-area-bottom" style={{ backgroundColor: '#E5E7EB', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}>
          {/* Main Navigation Tabs */}
          <div className="flex justify-around items-center py-2">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className="flex flex-col items-center justify-center px-3 py-2 transition-all duration-200 min-w-[60px]"
                >
                  <div className="relative">
                    <Icon
                      className="h-5 w-5 mb-1 transition-colors duration-200"
                      style={{ color: isActive ? '#5D5869' : '#9CA3AF' }}
                    />
                    {tab.id === 'messages' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#E5E7EB]"></span>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-medium transition-colors duration-200"
                    style={{
                      fontFamily: "'Rubik', sans-serif",
                      color: isActive ? '#5D5869' : '#9CA3AF'
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}

            {/* Expand/Collapse Button */}
            <button
              onClick={() => setShowAllTabs(!showAllTabs)}
              className="flex flex-col items-center justify-center px-3 py-2 transition-all duration-200 min-w-[60px]"
            >
              {showAllTabs ? (
                <>
                  <ChevronUp
                    className="h-5 w-5 mb-1 transition-colors duration-200"
                    style={{ color: showAllTabs ? '#5D5869' : '#9CA3AF' }}
                  />
                  <span
                    className="text-[10px] font-medium transition-colors duration-200"
                    style={{
                      fontFamily: "'Rubik', sans-serif",
                      color: showAllTabs ? '#5D5869' : '#9CA3AF'
                    }}
                  >
                    Less
                  </span>
                </>
              ) : (
                <>
                  <ChevronDown
                    className="h-5 w-5 mb-1 transition-colors duration-200"
                    style={{ color: showAllTabs ? '#5D5869' : '#9CA3AF' }}
                  />
                  <span
                    className="text-[10px] font-medium transition-colors duration-200"
                    style={{
                      fontFamily: "'Rubik', sans-serif",
                      color: showAllTabs ? '#5D5869' : '#9CA3AF'
                    }}
                  >
                    More
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Hidden Tabs - Expandable */}
          {showAllTabs && (
            <div className="border-t border-gray-200 bg-[#E5E7EB] pb-4">
              <div className="grid grid-cols-3 gap-2 p-3">
                {hiddenTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as DashboardTab);
                        setShowAllTabs(false);
                      }}
                      className="flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 hover:bg-white/30"
                    >
                      <div className="relative">
                        <Icon
                          className="h-5 w-5 mb-1 transition-colors duration-200"
                          style={{ color: isActive ? '#5D5869' : '#9CA3AF' }}
                        />
                        {tab.id === 'messages' && unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[#E5E7EB]"></span>
                        )}
                      </div>
                      <span
                        className="text-xs font-medium text-center transition-colors duration-200"
                        style={{
                          fontFamily: "'Rubik', sans-serif",
                          color: isActive ? '#5D5869' : '#9CA3AF'
                        }}
                      >
                        {tab.label}
                      </span>
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
