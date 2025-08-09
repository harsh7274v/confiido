'use client';
import { useState } from 'react';
import { Bell, Check, X, MessageCircle, Calendar, Star, DollarSign, Settings, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Notifications() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'booking',
      title: 'New booking request',
      message: 'Sarah Johnson has requested a 60-minute career coaching session',
      time: '2 hours ago',
      read: false,
      action: 'View Details',
      icon: Calendar
    },
    {
      id: 2,
      type: 'review',
      title: 'New 5-star review',
      message: 'Alice Smith left a great review for your recent session',
      time: '1 day ago',
      read: false,
      action: 'View Review',
      icon: Star
    },
    {
      id: 3,
      type: 'payment',
      title: 'Payment received',
      message: 'You received $150 for your session with John Doe',
      time: '2 days ago',
      read: true,
      action: 'View Details',
      icon: DollarSign
    },
    {
      id: 4,
      type: 'message',
      title: 'New message',
      message: 'Mike Chen sent you a message about your services',
      time: '3 days ago',
      read: true,
      action: 'Reply',
      icon: MessageCircle
    },
    {
      id: 5,
      type: 'booking',
      title: 'Session reminder',
      message: 'Your session with Emily Rodriguez starts in 30 minutes',
      time: '4 days ago',
      read: true,
      action: 'Join Session',
      icon: Calendar
    },
    {
      id: 6,
      type: 'system',
      title: 'Profile verification complete',
      message: 'Your expert profile has been verified and is now live',
      time: '1 week ago',
      read: true,
      action: 'View Profile',
      icon: Settings
    }
  ]);

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !notification.read;
    return notification.type === activeFilter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Lumina
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/profile" className="text-slate-600 hover:text-slate-900">
                Profile
              </Link>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                JD
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
            <p className="text-slate-600 mt-2">Stay updated with your latest activities and messages.</p>
          </div>
          <div className="flex items-center space-x-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all as read
              </button>
            )}
            <button className="text-sm text-slate-600 hover:text-slate-700">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-700">Filter:</span>
            {[
              { id: 'all', name: 'All', count: notifications.length },
              { id: 'unread', name: 'Unread', count: unreadCount },
              { id: 'booking', name: 'Bookings', count: notifications.filter(n => n.type === 'booking').length },
              { id: 'message', name: 'Messages', count: notifications.filter(n => n.type === 'message').length },
              { id: 'review', name: 'Reviews', count: notifications.filter(n => n.type === 'review').length },
              { id: 'payment', name: 'Payments', count: notifications.filter(n => n.type === 'payment').length }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {filter.name} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-slate-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      notification.type === 'booking' ? 'bg-blue-100' :
                      notification.type === 'review' ? 'bg-yellow-100' :
                      notification.type === 'payment' ? 'bg-green-100' :
                      notification.type === 'message' ? 'bg-purple-100' :
                      'bg-slate-100'
                    }`}>
                      <notification.icon className={`h-5 w-5 ${
                        notification.type === 'booking' ? 'text-blue-600' :
                        notification.type === 'review' ? 'text-yellow-600' :
                        notification.type === 'payment' ? 'text-green-600' :
                        notification.type === 'message' ? 'text-purple-600' :
                        'text-slate-600'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className={`text-sm font-medium ${
                              !notification.read ? 'text-slate-900' : 'text-slate-700'
                            }`}>
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-slate-500 mt-2">{notification.time}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                            title="Delete notification"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                          {notification.action}
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No notifications</h3>
              <p className="text-slate-600">
                {activeFilter === 'all' 
                  ? "You're all caught up! Check back later for new notifications."
                  : `No ${activeFilter} notifications found.`
                }
              </p>
            </div>
          )}
        </div>

        {/* Load More */}
        {filteredNotifications.length > 0 && (
          <div className="text-center mt-6">
            <button className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50">
              Load More Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 