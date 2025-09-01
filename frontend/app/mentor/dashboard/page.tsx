"use client";
import React, { useState } from "react";
import { Calendar, Users, MessageSquare, BookOpen, Settings, BarChart3, LogOut, ChevronUp, ChevronDown } from "lucide-react";
import AvailabilityManager from "../../components/availability/AvailabilityManager";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { useRouter } from "next/navigation";

type DashboardTab = 'overview' | 'availability' | 'bookings' | 'messages' | 'analytics' | 'settings';

const MentorDashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showAllTabs, setShowAllTabs] = useState(false);

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
      case 'overview':
        return (
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <div className="bg-white p-3 md:p-6 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 md:h-6 w-5 md:w-6 text-blue-600" />
                  </div>
                  <div className="ml-2 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Total Sessions</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">24</p>
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
                    <p className="text-lg md:text-2xl font-bold text-gray-900">12</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 md:p-6 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="h-5 md:h-6 w-5 md:w-6 text-purple-600" />
                  </div>
                  <div className="ml-2 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Unread Messages</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">3</p>
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
                    <p className="text-lg md:text-2xl font-bold text-gray-900">5</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Recent Activity</h3>
              <div className="space-y-2 md:space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs md:text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span className="break-words">New booking request from John Doe</span>
                  </div>
                  <span className="text-gray-400 text-xs">2 hours ago</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs md:text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="break-words">Session completed with Sarah Smith</span>
                  </div>
                  <span className="text-gray-400 text-xs">1 day ago</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs md:text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                    <span className="break-words">New message from Mike Johnson</span>
                  </div>
                  <span className="text-gray-400 text-xs">2 days ago</span>
                </div>
              </div>
            </div>
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
                <>
                  <LoadingSpinner size="sm" />
                  <span className="hidden sm:inline">Logging out...</span>
                </>
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
  );
};

export default MentorDashboard;
