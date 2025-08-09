'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Star, 
  TrendingUp, 
  MessageSquare, 
  BookOpen, 
  Bell,
  Search,
  MoreVertical,
  CheckCircle,
  Heart,
  Bookmark,
  Star as StarIcon,
  Phone,
  Mail,
  Grid,
  Clock,
  Globe,
  Palette,
  Settings,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Plus,
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import Link from 'next/link';
import { dashboardApi, type DashboardData } from '../services/dashboardApi';

// Mock data for the Topmate-style dashboard
const mockData = {
  user: {
    name: 'Shweta',
    fullName: 'Shweta Jaiswal',
    handle: 'shweta_jaiswal15',
    email: 'jaiswalshweta021@gmail.com',
    avatar: '/api/placeholder/40/40',
    profileUrl: 'topmate.io/shweta_jaiswal15/'
  },
  setupSteps: [
    {
      id: 'availability',
      title: 'Add availability',
      description: 'Add your availability so clients can book sessions with you',
      completed: false,
      action: 'Add availability',
      icon: Calendar
    },
    {
      id: 'profile',
      title: 'Complete your profile',
      description: 'Add your bio, expertise, and profile picture to attract clients',
      completed: false,
      action: 'Complete profile',
      icon: Users
    },
    {
      id: 'service',
      title: 'Create a service',
      description: 'Create your first service to start earning from consultations',
      completed: false,
      action: 'Create service',
      icon: DollarSign
    }
  ],
  inspiration: [
    {
      id: 1,
      name: 'Pranita Bajoria',
      avatar: '/api/placeholder/40/40',
      handle: 'pranita_bajoria'
    },
    {
      id: 2,
      name: 'Aishwarya Srinivasan',
      avatar: '/api/placeholder/40/40',
      handle: 'aishwarya_srinivasan'
    },
    {
      id: 3,
      name: 'Colleen Ballesteros',
      avatar: '/api/placeholder/40/40',
      handle: 'colleen_ballesteros'
    }
  ],
  notifications: 3
};

export default function Dashboard() {
  const [expandedSteps, setExpandedSteps] = useState<string[]>(['availability']);
  const [userType, setUserType] = useState<'expert' | 'client'>('expert');
  const [activePage, setActivePage] = useState<'dashboard' | 'services' | 'bookings' | 'messages' | 'calendar' | 'payouts' | 'analytics' | 'testimonials' | 'sites' | 'customize' | 'settings' | 'find-people' | 'profile' | 'rewards' | 'find-category' | 'whats-new'>('dashboard');
  const [selectedServiceType, setSelectedServiceType] = useState<'1:1 Call' | 'Webinar' | 'Priority DM' | 'Digital Product' | 'Package'>('1:1 Call');
  const [settingsSubmenu, setSettingsSubmenu] = useState<'profile' | 'account' | 'payments'>('profile');
  const [showSettingsSubmenu, setShowSettingsSubmenu] = useState(false);
  const [goalText, setGoalText] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const toggleUserType = () => {
    setUserType(prev => prev === 'expert' ? 'client' : 'expert');
  };

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardApi.getDashboardData();
        setDashboardData(data);
        setUserType(data.user.userType === 'expert' ? 'expert' : 'client');
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle goal creation
  const handleCreateGoal = async () => {
    if (!goalText.trim()) return;
    
    try {
      const newGoal = await dashboardApi.createGoal(goalText);
      setDashboardData(prev => prev ? {
        ...prev,
        goals: [newGoal, ...prev.goals]
      } : null);
      setGoalText('');
    } catch (error) {
      console.error('Error creating goal:', error);
      setError('Failed to create goal');
    }
  };

  // Handle goal updates
  const handleUpdateGoal = async (goalId: string, updates: { text?: string; completed?: boolean }) => {
    try {
      const updatedGoal = await dashboardApi.updateGoal(goalId, updates);
      setDashboardData(prev => prev ? {
        ...prev,
        goals: prev.goals.map(goal => 
          goal.id === goalId ? updatedGoal : goal
        )
      } : null);
    } catch (error) {
      console.error('Error updating goal:', error);
      setError('Failed to update goal');
    }
  };

  // Handle goal deletion
  const handleDeleteGoal = async (goalId: string) => {
    try {
      await dashboardApi.deleteGoal(goalId);
      setDashboardData(prev => prev ? {
        ...prev,
        goals: prev.goals.filter(goal => goal.id !== goalId)
      } : null);
    } catch (error) {
      console.error('Error deleting goal:', error);
      setError('Failed to delete goal');
    }
  };

  // Handle setup step updates
  const handleUpdateSetupSteps = async (stepId: string, completed: boolean) => {
    try {
      const updatedSteps = await dashboardApi.updateSetupSteps([
        { id: stepId, completed }
      ]);
      setDashboardData(prev => prev ? {
        ...prev,
        setupSteps: prev.setupSteps.map(step => 
          step.id === stepId ? { ...step, completed } : step
        )
      } : null);
    } catch (error) {
      console.error('Error updating setup steps:', error);
      setError('Failed to update setup steps');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  // Use API data if available, otherwise fall back to mock data
  const data = dashboardData || {
    user: mockData.user,
    setupSteps: mockData.setupSteps,
    goals: [],
    stats: {},
    recentActivity: [],
    inspiration: mockData.inspiration
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                <div className="relative">
                  <button 
                    onClick={toggleUserType}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-amber-100 text-gray-900 rounded-md hover:bg-amber-200 transition-colors text-sm"
                  >
                    <Search className="h-3 w-3" />
                    <span className="font-medium">
                      {userType === 'expert' ? 'Expert Dashboard' : 'Seeker Dashboard'}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-text-muted">@{data.user.handle}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-text-muted hover:text-white">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <img 
                  src={data.user.avatar} 
                  alt={data.user.fullName}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-text-muted">{data.user.fullName}</span>
                <ChevronDown className="h-4 w-4 text-text-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-surface border-r border-border min-h-screen flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-120px)]">
            <nav className="space-y-6">
              {/* Main Navigation */}
              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                  Main
                </h3>
                <div className="space-y-2">
                  {userType === 'expert' ? (
                    // Expert Navigation
                    <>
                      <button 
                        onClick={() => setActivePage('bookings')}
                        className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                          activePage === 'bookings' 
                            ? 'text-white bg-amber-100 bg-opacity-20' 
                            : 'text-text-muted hover:text-white hover:bg-surface-light'
                        }`}
                      >
                        <Phone className="h-4 w-4" />
                        <span>Bookings</span>
                      </button>
                      <button 
                        onClick={() => setActivePage('messages')}
                        className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                          activePage === 'messages' 
                            ? 'text-white bg-amber-100 bg-opacity-20' 
                            : 'text-text-muted hover:text-white hover:bg-surface-light'
                        }`}
                      >
                        <Mail className="h-4 w-4" />
                        <span>Priority DM</span>
                      </button>
                      <button 
                        onClick={() => setActivePage('services')}
                        className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                          activePage === 'services' 
                            ? 'text-white bg-amber-100 bg-opacity-20' 
                            : 'text-text-muted hover:text-white hover:bg-surface-light'
                        }`}
                      >
                        <Grid className="h-4 w-4" />
                        <span>Services</span>
                        <div className="ml-auto w-2 h-2 bg-red-500 rounded-full"></div>
                      </button>
                      <button 
                        onClick={() => setActivePage('calendar')}
                        className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                          activePage === 'calendar' 
                            ? 'text-white bg-amber-100 bg-opacity-20' 
                            : 'text-text-muted hover:text-white hover:bg-surface-light'
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                        <span>Calendar</span>
                        <div className="ml-auto w-2 h-2 bg-red-500 rounded-full"></div>
                      </button>
                      <button 
                        onClick={() => setActivePage('payouts')}
                        className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                          activePage === 'payouts' 
                            ? 'text-white bg-amber-100 bg-opacity-20' 
                            : 'text-text-muted hover:text-white hover:bg-surface-light'
                        }`}
                      >
                        <DollarSign className="h-4 w-4" />
                        <span>Payouts</span>
                      </button>
                    </>
                  ) : (
                    // Seeker Navigation
                    <>
                      <button 
                        onClick={() => setActivePage('dashboard')}
                        className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                          activePage === 'dashboard' 
                            ? 'text-white bg-amber-100 bg-opacity-20' 
                            : 'text-text-muted hover:text-white hover:bg-surface-light'
                        }`}
                      >
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span>Home</span>
                      </button>
                      <button 
                        onClick={() => setActivePage('bookings')}
                        className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                          activePage === 'bookings' 
                            ? 'text-white bg-amber-100 bg-opacity-20' 
                            : 'text-text-muted hover:text-white hover:bg-surface-light'
                        }`}
                      >
                        <Phone className="h-4 w-4" />
                        <span>Bookings</span>
                      </button>
                      <button 
                        onClick={() => setActivePage('find-people')}
                        className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                          activePage === 'find-people' 
                            ? 'text-white bg-amber-100 bg-opacity-20' 
                            : 'text-text-muted hover:text-white hover:bg-surface-light'
                        }`}
                      >
                        <Search className="h-4 w-4" />
                        <span>Find People</span>
                      </button>
                      <button 
                        onClick={() => setActivePage('profile')}
                        className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                          activePage === 'profile' 
                            ? 'text-white bg-amber-100 bg-opacity-20' 
                            : 'text-text-muted hover:text-white hover:bg-surface-light'
                        }`}
                      >
                        <Users className="h-4 w-4" />
                        <span>Profile</span>
                      </button>
                      <button 
                        onClick={() => setActivePage('rewards')}
                        className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                          activePage === 'rewards' 
                            ? 'text-white bg-amber-100 bg-opacity-20' 
                            : 'text-text-muted hover:text-white hover:bg-surface-light'
                        }`}
                      >
                        <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span>Rewards</span>
                      </button>
                      <button 
                        onClick={() => setActivePage('find-category')}
                        className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                          activePage === 'find-category' 
                            ? 'text-white bg-amber-100 bg-opacity-20' 
                            : 'text-text-muted hover:text-white hover:bg-surface-light'
                        }`}
                      >
                        <Grid className="h-4 w-4" />
                        <span>Find by Category</span>
                      </button>
                      <button 
                        onClick={() => setActivePage('whats-new')}
                        className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                          activePage === 'whats-new' 
                            ? 'text-white bg-amber-100 bg-opacity-20' 
                            : 'text-text-muted hover:text-white hover:bg-surface-light'
                        }`}
                      >
                        <Bell className="h-4 w-4" />
                        <span>What's New</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Your Page - Only for Experts */}
              {userType === 'expert' && (
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                    Your Page
                  </h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setActivePage('analytics')}
                      className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                        activePage === 'analytics' 
                          ? 'text-white bg-amber-100 bg-opacity-20' 
                          : 'text-text-muted hover:text-white hover:bg-surface-light'
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      <span>Analytics</span>
                    </button>
                    <button 
                      onClick={() => setActivePage('testimonials')}
                      className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                        activePage === 'testimonials' 
                          ? 'text-white bg-amber-100 bg-opacity-20' 
                          : 'text-text-muted hover:text-white hover:bg-surface-light'
                      }`}
                    >
                      <Star className="h-4 w-4" />
                      <span>Testimonials</span>
                    </button>
                    <button 
                      onClick={() => setActivePage('sites')}
                      className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                        activePage === 'sites' 
                          ? 'text-white bg-amber-100 bg-opacity-20' 
                          : 'text-text-muted hover:text-white hover:bg-surface-light'
                      }`}
                    >
                      <Globe className="h-4 w-4" />
                      <span>Sites</span>
                    </button>
                    <button 
                      onClick={() => setActivePage('customize')}
                      className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                        activePage === 'customize' 
                          ? 'text-white bg-amber-100 bg-opacity-20' 
                          : 'text-text-muted hover:text-white hover:bg-surface-light'
                      }`}
                    >
                      <Palette className="h-4 w-4" />
                      <span>Customize Page</span>
                    </button>
                    <div>
                      <button 
                        onClick={() => {
                          setActivePage('settings');
                          setShowSettingsSubmenu(!showSettingsSubmenu);
                        }}
                        className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md w-full text-left ${
                          activePage === 'settings' 
                            ? 'text-white bg-amber-100 bg-opacity-20' 
                            : 'text-text-muted hover:text-white hover:bg-surface-light'
                        }`}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                        <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${showSettingsSubmenu ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showSettingsSubmenu && (
                        <div className="ml-6 mt-2 mb-4 space-y-1 transition-all duration-200 ease-in-out">
                          <button
                            onClick={() => setSettingsSubmenu('profile')}
                            className={`flex items-center px-3 py-2 text-sm rounded-md w-full text-left transition-colors ${
                              settingsSubmenu === 'profile'
                                ? 'text-white bg-amber-100 bg-opacity-20'
                                : 'text-text-muted hover:text-white hover:bg-surface-light'
                            }`}
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => setSettingsSubmenu('account')}
                            className={`flex items-center px-3 py-2 text-sm rounded-md w-full text-left transition-colors ${
                              settingsSubmenu === 'account'
                                ? 'text-white bg-amber-100 bg-opacity-20'
                                : 'text-text-muted hover:text-white hover:bg-surface-light'
                            }`}
                          >
                            Account
                          </button>
                          <button
                            onClick={() => setSettingsSubmenu('payments')}
                            className={`flex items-center px-3 py-2 text-sm rounded-md w-full text-left transition-colors ${
                              settingsSubmenu === 'payments'
                                ? 'text-white bg-amber-100 bg-opacity-20'
                                : 'text-text-muted hover:text-white hover:bg-surface-light'
                            }`}
                          >
                            Payments
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </nav>
          </div>

          {/* Bottom Profile Section */}
          <div className="p-6 border-t border-border mt-auto">
            <div className="flex items-center space-x-3">
              <img 
                src={mockData.user.avatar} 
                alt={mockData.user.fullName}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{mockData.user.fullName}</p>
                <p className="text-xs text-text-muted">{mockData.user.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-text-muted" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-black">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Greeting */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white">Hi, {mockData.user.name}</h1>
            </div>

            {/* Page Content */}
            {activePage === 'dashboard' && (
              userType === 'expert' ? (
                /* Expert Dashboard Content */
                <div className="bg-surface rounded-xl shadow-sm border border-border p-8 mb-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Make the page yours!</h2>
                      <p className="text-text-muted">Unlock the potential of your expert page</p>
                    </div>
                    <div className="relative">
                      <div className="w-16 h-16 bg-surface-light rounded-lg flex items-center justify-center">
                        <div className="w-8 h-8 bg-text-muted rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {data.setupSteps.map((step) => (
                      <div key={step.id} className="border border-border rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className={`w-6 h-6 border-2 border-dashed rounded-full mt-1 flex items-center justify-center ${
                              step.completed 
                                ? 'border-green-500 bg-green-500' 
                                : 'border-text-muted'
                            }`}>
                              {step.completed && <CheckCircle className="h-4 w-4 text-white" />}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                              <p className="text-text-muted text-sm mb-4">{step.description}</p>
                              
                              {expandedSteps.includes(step.id) && (
                                <div className="flex items-center space-x-3">
                                  <button className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors">
                                    {step.action}
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateSetupSteps(step.id, !step.completed)}
                                    className={`p-2 ${step.completed ? 'text-green-500' : 'text-text-muted hover:text-white'}`}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                  <button className="p-2 text-text-muted hover:text-white">
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => toggleStep(step.id)}
                            className="p-2 text-text-muted hover:text-white"
                          >
                            {expandedSteps.includes(step.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Seeker Dashboard Content */
                <div className="bg-black min-h-screen">
                  {/* Header */}
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-amber-600 rounded-lg flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded-full"></div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Next in Your Career Journey</h1>
                    <p className="text-text-muted max-w-2xl mx-auto">
                      Set a goal that moves you forward — from finding clarity to acing your next opportunity
                    </p>
                  </div>

                  {/* Content Cards */}
                  <div className="max-w-4xl mx-auto px-6 space-y-6">
                    {/* First Card */}
                    <div className="bg-surface rounded-lg border border-border p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 px-2 py-1 bg-surface-light rounded-md">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-text-muted">Interested</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-4 h-4 bg-teal-500 rounded-full"></div>
                          <div className="w-4 h-4 bg-teal-500 rounded-full"></div>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Not sure what direction to take?
                      </h3>
                      <p className="text-text-muted mb-4">
                        Get clarity on your career path with expert guidance
                      </p>
                      <button className="px-6 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors">
                        Book a career exploration session
                      </button>
                    </div>

                    {/* Second Card */}
                    <div className="bg-surface rounded-lg border border-border p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 px-2 py-1 bg-surface-light rounded-md">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-text-muted">Interested</span>
                          </div>
                        </div>
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Ready to ace your next interview?
                      </h3>
                      <p className="text-text-muted mb-4">
                        Prepare with mock interviews and expert feedback
                      </p>
                      <button className="px-6 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors">
                        Book interview prep session
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Services Page */}
            {activePage === 'services' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-white">Services</h1>
                  <div className="flex items-center space-x-3">
                    <button className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors">
                      + Add New
                    </button>
                    <button className="px-4 py-2 bg-surface border border-border text-text-muted text-sm font-medium rounded-md hover:bg-surface-light hover:text-white transition-colors">
                      Templates
                    </button>
                  </div>
                </div>

                {/* Service Type Tabs */}
                <div className="flex space-x-2">
                  {['1:1 Call', 'Webinar', 'Priority DM', 'Digital Product', 'Package'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedServiceType(type as any)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedServiceType === type
                          ? 'bg-surface-light text-white'
                          : 'bg-transparent text-text-muted hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Empty State */}
                <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center">
                  <div className="max-w-md mx-auto">
                    {/* Illustration */}
                    <div className="w-32 h-32 mx-auto mb-6 bg-surface-light rounded-lg flex items-center justify-center">
                      <div className="w-16 h-16 bg-text-muted rounded-full flex items-center justify-center">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-white mb-2">Create a {selectedServiceType} service</h2>
                    <p className="text-text-muted mb-6">Users on topmate sell over 10k services each month.</p>
                    
                    <div className="flex items-center justify-center space-x-3">
                      <button className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors">
                        + Add New
                      </button>
                      <button className="px-4 py-2 bg-surface border border-border text-text-muted text-sm font-medium rounded-md hover:bg-surface-light hover:text-white transition-colors">
                        See Templates
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Page */}
            {activePage === 'settings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-white">Settings</h1>
                </div>

                {/* Settings Content */}
                <div className="bg-surface rounded-xl shadow-sm border border-border p-8">
                  {settingsSubmenu === 'profile' && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">Profile</h2>
                        <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors">
                          Save changes
                        </button>
                      </div>
                      
                      <div className="space-y-6">
                        {/* Profile Photo Section */}
                        <div className="flex items-center space-x-4">
                          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">Profile photo</h3>
                            <p className="text-text-muted text-sm">Required</p>
                          </div>
                          <button className="text-accent underline text-sm hover:text-accent-hover">
                            Upload Photo
                          </button>
                        </div>

                        {/* Topmate Page Link */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Your topmate page link</label>
                          <div className="flex items-center">
                            <div className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-l-md border border-gray-300">
                              topmate.io/
                            </div>
                            <input 
                              type="text" 
                              defaultValue={mockData.user.handle}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                            <div className="ml-2 flex items-center space-x-2">
                              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-white" />
                              </div>
                              <button className="p-1 hover:bg-gray-100 rounded">
                                <ExternalLink className="h-4 w-4 text-gray-500" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">First Name</label>
                            <input 
                              type="text" 
                              defaultValue="Shweta"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">Last Name</label>
                            <input 
                              type="text" 
                              defaultValue="Jaiswal"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                          </div>
                        </div>

                        {/* Display Name */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Display Name</label>
                          <input 
                            type="text" 
                            defaultValue="Shweta Jaiswal"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>

                        {/* Topmate Intro */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Your topmate intro <span className="text-text-muted">(Required)</span>
                          </label>
                          <textarea 
                            placeholder="this is the first thing people will see"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                            rows={3}
                          />
                        </div>

                        {/* About Yourself */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">About yourself</label>
                          <textarea 
                            placeholder="Tell people more about yourself..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsSubmenu === 'account' && (
                    <div>
                      <h2 className="text-xl font-bold text-white mb-4">Account Settings</h2>
                      <p className="text-text-muted mb-6">Manage your account security and preferences.</p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Username</label>
                          <input type="text" defaultValue={mockData.user.handle} className="w-full px-3 py-2 bg-surface-light border border-border rounded-md text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Current Password</label>
                          <input type="password" className="w-full px-3 py-2 bg-surface-light border border-border rounded-md text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">New Password</label>
                          <input type="password" className="w-full px-3 py-2 bg-surface-light border border-border rounded-md text-white" />
                        </div>
                        <button className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors">
                          Update Password
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsSubmenu === 'payments' && (
                    <div>
                      <h2 className="text-xl font-bold text-white mb-4">Payment Settings</h2>
                      <p className="text-text-muted mb-6">Manage your payment methods and billing information.</p>
                      <div className="space-y-4">
                        <div className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-white">Payment Methods</h3>
                              <p className="text-text-muted text-sm">No payment methods added</p>
                            </div>
                            <button className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors">
                              Add Payment Method
                            </button>
                          </div>
                        </div>
                        <div className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-white">Billing Address</h3>
                              <p className="text-text-muted text-sm">No billing address set</p>
                            </div>
                            <button className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors">
                              Add Address
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Other Pages Placeholder */}
            {activePage !== 'dashboard' && activePage !== 'services' && activePage !== 'settings' && (
              <div className="bg-surface rounded-xl shadow-sm border border-border p-8">
                <h2 className="text-2xl font-bold text-white mb-4">{activePage.charAt(0).toUpperCase() + activePage.slice(1)}</h2>
                <p className="text-text-muted">This page is under development.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 bg-surface border-l border-border min-h-screen">
          <div className="p-6 space-y-6">
            {/* Goal Section */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                {/* Target Icon */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-white"></div>
                    </div>
                  </div>
                </div>
                {/* Arrow */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-4">We help you achieve your goals!</h3>
              
              <div className="space-y-4">
                <textarea 
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  placeholder="Tell us a GOAL you want to achieve today"
                  className="w-full px-4 py-3 border border-border bg-surface-light rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent text-white placeholder-text-muted"
                  rows={3}
                />
                <button 
                  onClick={handleCreateGoal}
                  disabled={!goalText.trim()}
                  className="w-full px-4 py-2 bg-surface border border-border text-text-muted text-sm font-medium rounded-md hover:bg-surface-light hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Goal
                </button>
              </div>

              {/* Display existing goals */}
              {data.goals.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-white mb-3">Your Goals</h4>
                  <div className="space-y-2">
                    {data.goals.map((goal) => (
                      <div key={goal.id} className="flex items-center space-x-3 p-3 bg-surface-light rounded-lg">
                        <input
                          type="checkbox"
                          checked={goal.completed}
                          onChange={(e) => handleUpdateGoal(goal.id, { completed: e.target.checked })}
                          className="w-4 h-4 text-accent bg-surface border-border rounded focus:ring-accent"
                        />
                        <span className={`flex-1 text-sm ${goal.completed ? 'line-through text-text-muted' : 'text-white'}`}>
                          {goal.text}
                        </span>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-text-muted hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 