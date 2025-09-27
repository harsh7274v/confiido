"use client";

import Link from "next/link";
import { Calendar, Star, Users, Shield, Clock } from "lucide-react";
import React, { useEffect, useMemo, useState } from 'react';
import EditProfilePopup from '../components/EditProfilePopup';
import EditProfilePopupUser, { ProfileData } from '../components/EditProfilePopupUser';
import BookSessionPopup from '../components/BookSessionPopup';
import TransactionsPage from '../transactions/page';
import ContactPage from '../components/ContactPage';
import RewardsPage from '../components/RewardsPage';
import PaymentsPage from '../components/PaymentsPage';
import Sidebar from '../components/Sidebar';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  DollarSign,
  MessageSquare,
  Target,
  TrendingUp,
  LogOut,
  MoreHorizontal,
  Megaphone,
  Home,
  Phone,
  Boxes,
  Wallet,
  BarChart3,
  Globe,
  Palette,
  User,
  Settings,
  Zap,
  X,
} from 'lucide-react';
import { type DashboardData, type SetupStep } from '../services/dashboardApi';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

// Define types locally
interface Goal {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action: string;
  icon: string;
}interface DashboardData {
  user: {
    id: string;
    name: string;
    fullName: string;
    handle: string;
    email: string;
    profileUrl: string;
    userType: 'expert' | 'seeker';
  };
  setupSteps: SetupStep[];
  goals: Goal[];
  stats: any;
  sessions: any;
  recentActivity: any[];
  inspiration?: any[];
}// Utility function to create session datetime with proper timezone handling
const createSessionDateTime = (scheduledDate: string, time: string): Date => {
  try {
    console.log('Creating session datetime:', { scheduledDate, time });
    
    const sessionDate = new Date(scheduledDate);
    console.log('Parsed session date:', sessionDate.toISOString());
    
    const timeParts = time.split(' - ')[0].split(':');
    const hours = parseInt(timeParts[0]) || 0;
    const minutes = parseInt(timeParts[1]) || 0;
    
    console.log('Time parts:', { timeParts, hours, minutes });
    
    // Create datetime in local timezone
    const sessionDateTime = new Date(sessionDate);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    
    console.log('Final session datetime:', sessionDateTime.toISOString());
    
    return sessionDateTime;
  } catch (error) {
    console.error('Error parsing session datetime:', error);
    return new Date();
  }
};

export default function DashboardPage() {
  const [showBookSessionPopup, setShowBookSessionPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [sessionTab, setSessionTab] = useState('upcoming');
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [showMessageToast, setShowMessageToast] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'transactions' | 'contact' | 'rewards' | 'payments'>('dashboard');





  // Mentor data
  const mentors = [
    {
      id: '1',
      name: 'Priya Sharma',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      title: 'Senior Product Manager',
      company: 'Google',
      location: 'Mumbai, India',
      rating: 4.8,
      reviews: 127,
      hourlyRate: 2500,
      expertise: ['Product Strategy', 'User Research', 'Agile', 'Data Analysis'],
      bio: 'Experienced product manager with 8+ years in tech. I help professionals transition into product management and develop strategic thinking skills.',
      experience: '8+ years in Product Management',
      languages: ['English', 'Hindi', 'Marathi'],
      availability: 'Weekdays 6-9 PM, Weekends 10 AM-2 PM'
    },
    {
      id: '2',
      name: 'Rahul Verma',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      title: 'Software Engineering Manager',
      company: 'Microsoft',
      location: 'Bangalore, India',
      rating: 4.9,
      reviews: 89,
      hourlyRate: 3000,
      expertise: ['Leadership', 'System Design', 'Team Building', 'Career Growth'],
      bio: 'Engineering leader passionate about helping developers grow their careers and build better software. 10+ years of experience in tech leadership.',
      experience: '10+ years in Software Engineering',
      languages: ['English', 'Hindi', 'Kannada'],
      availability: 'Weekdays 7-10 PM, Weekends 2-6 PM'
    },
    {
      id: '3',
      name: 'Anjali Patel',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      title: 'UX Design Director',
      company: 'Adobe',
      location: 'Delhi, India',
      rating: 4.7,
      reviews: 156,
      hourlyRate: 2800,
      expertise: ['UX Design', 'Design Systems', 'User Testing', 'Design Leadership'],
      bio: 'Creative design leader with expertise in building user-centered products. I mentor designers to create impactful user experiences.',
      experience: '12+ years in UX Design',
      languages: ['English', 'Hindi', 'Gujarati'],
      availability: 'Weekdays 5-8 PM, Weekends 11 AM-3 PM'
    }
  ];

  // Helper function to get auth headers
  const getAuthHeaders = async () => {
    // First, try to get traditional auth token from localStorage
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      return {
        'Authorization': `Bearer ${storedToken}`,
        'Content-Type': 'application/json'
      };
    }
    
    // If no stored token, try Firebase authentication
    if (user) {
      try {
        const token = await user.getIdToken();
        return {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
      } catch (error) {
        console.error('Error getting Firebase token:', error);
        // Fallback: try to use a mock token for development
        return {
          'Authorization': `Bearer mock_token_${user.uid || 'test'}`,
          'Content-Type': 'application/json'
        };
      }
    }
    
    // If no authentication available, return basic headers
    return {
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    async function fetchSessions() {
      // Check if we have any form of authentication
      const storedToken = localStorage.getItem('token');
      
      // For development/testing: if no auth, set a mock token
      if (!user && !storedToken) {
        console.log('No authentication found, using mock token for development');
        localStorage.setItem('token', 'mock_token_test');
      }
      
      setSessionsLoading(true);
      setSessionsError(null);
      setApiStatus('loading');
      try {
        const headers = await getAuthHeaders();
        console.log('Making API call to bookings/user with headers:', headers);
        
        // Use the same API endpoint that works for the payment page
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/bookings/user?page=1&limit=100`, { headers });
        console.log('Bookings API response:', res.data);
        
        // Transform the bookings data to sessions format
        const bookings = res.data?.data?.bookings || [];
        console.log('Bookings found:', bookings.length);
        
        // Extract all sessions from all bookings
        const allSessions = bookings.flatMap(booking => 
          booking.sessions.map(session => ({
            id: session.sessionId || session._id,
            title: `${session.sessionType?.toUpperCase() || 'SESSION'} session with ${session.expertId?.title || 'Expert'}`,
            date: session.scheduledDate ? new Date(session.scheduledDate).toLocaleDateString() : 'Unknown Date',
            time: session.startTime && session.endTime ? `${session.startTime} - ${session.endTime}` : 'Unknown Time',
            expertName: session.expertId?.title || 'Expert',
            sessionType: session.sessionType || 'unknown',
            status: session.status || 'unknown',
            paymentStatus: session.paymentStatus || 'unknown',
            meetingLink: session.meetingLink,
            price: session.price || 0,
            currency: session.currency || 'INR',
            expertEmail: session.expertEmail,
            notes: session.notes,
            scheduledDate: session.scheduledDate
          }))
        );
        
        console.log('=== FRONTEND DASHBOARD DEBUG ===');
        console.log('All sessions extracted:', allSessions.length);
        console.log('All sessions:', allSessions);
        
        // Debug: Show the first few sessions in detail
        allSessions.slice(0, 3).forEach((session, index) => {
          console.log(`Session ${index + 1} details:`, {
            id: session.id,
            scheduledDate: session.scheduledDate,
            time: session.time,
            status: session.status,
            paymentStatus: session.paymentStatus
          });
        });
        
        // Filter for paid sessions only
        const paidSessions = allSessions.filter(session => {
          const isPaid = session.paymentStatus === 'paid';
          if (!isPaid) {
            console.log(`Skipping unpaid session: ${session.id} (status: ${session.paymentStatus})`);
          }
          return isPaid;
        });
        console.log('Paid sessions:', paidSessions.length);
        console.log('Total sessions before filtering:', allSessions.length);
        
        // Separate upcoming and completed sessions with proper date/time comparison
        const now = new Date();
        console.log('Current date/time:', now.toISOString());
        
        // Test: Create a future date to verify the logic works
        const testFutureDate = new Date();
        testFutureDate.setDate(testFutureDate.getDate() + 1); // Tomorrow
        testFutureDate.setHours(10, 0, 0, 0); // 10:00 AM
        console.log('Test future date:', testFutureDate.toISOString());
        console.log('Is test future date > now?', testFutureDate > now);
        
        const upcoming = paidSessions.filter(session => {
          const sessionDateTime = createSessionDateTime(session.scheduledDate, session.time);
          
          console.log(`Session ${session.id}:`, {
            scheduledDate: session.scheduledDate,
            time: session.time,
            sessionDateTime: sessionDateTime.toISOString(),
            currentTime: now.toISOString(),
            isUpcoming: sessionDateTime > now,
            status: session.status // Just for debugging, not used in logic
          });
          
          // Only use date/time comparison, ignore backend status
          return sessionDateTime > now;
        });
        
        const completed = paidSessions.filter(session => {
          const sessionDateTime = createSessionDateTime(session.scheduledDate, session.time);
          
          // Only use date/time comparison, ignore backend status
          return sessionDateTime <= now;
        });
        
        console.log('Upcoming sessions:', upcoming.length);
        console.log('Completed sessions:', completed.length);
        
        // Debug: Show which sessions are in which category
        console.log('=== SESSION CATEGORIZATION (DATE-BASED ONLY) ===');
        console.log('Note: Categorization is based ONLY on scheduledDate + time, ignoring backend status');
        console.log('Upcoming sessions:', upcoming.map(s => ({ id: s.id, date: s.date, time: s.time, status: s.status })));
        console.log('Completed sessions:', completed.map(s => ({ id: s.id, date: s.date, time: s.time, status: s.status })));
        
        const selectedSessions = sessionTab === 'upcoming' ? upcoming : completed;
        console.log(`Selected ${sessionTab} sessions:`, selectedSessions);
        setSessions(selectedSessions);
        
        setApiStatus('success');
      } catch (err: any) {
        console.error('Error fetching sessions:', err);
        console.error('Error response:', err.response?.data);
        setSessions([]);
        setSessionsError(err.response?.data?.message || 'Failed to load sessions');
        setApiStatus('error');
      } finally {
        setSessionsLoading(false);
      }
    }
    fetchSessions();
  }, [sessionTab, user]);

  useEffect(() => {
    async function fetchProfileData() {
      // Check if we have any form of authentication
      const storedToken = localStorage.getItem('token');
      if (!user && !storedToken) return;
      
      try {
        const headers = await getAuthHeaders();
        console.log('Making API call to userdata with headers:', headers);
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/users/userdata`, { headers });
        console.log('Userdata API response:', res.data);
        if (res.data && res.data.data && res.data.data.userdata) {
          setProfileData(res.data.data.userdata);
        }
      } catch (err: any) {
        console.error('Error fetching profile data:', err);
      }
    }
    fetchProfileData();
  }, [user]);

  const handleProfileClick = () => {
    setShowProfilePopup(true);
    setCurrentView('dashboard');
  };

  const handleContactClick = () => {
    setCurrentView('contact');
  };

  const handleSaveProfile = async (profile: ProfileData) => {
    // Check if we have any form of authentication
    const storedToken = localStorage.getItem('token');
    if (!user && !storedToken) {
      console.error('No authentication available');
      return;
    }
    
    try {
      console.log('=== FRONTEND SAVE PROFILE DEBUG ===');
      console.log('Profile data to save:', JSON.stringify(profile, null, 2));
      
      const headers = await getAuthHeaders();
      console.log('Auth headers:', headers);
      
      const requestData = { userdata: profile };
      console.log('Request data being sent:', JSON.stringify(requestData, null, 2));
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/users/profile`;
      console.log('API URL:', apiUrl);
      
      const response = await axios.put(apiUrl, requestData, { headers });
      console.log('Profile save response:', JSON.stringify(response.data, null, 2));
      
      // Refresh profile data after save
      console.log('Refreshing profile data...');
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/users/userdata`, { headers });
      console.log('Refresh response:', JSON.stringify(res.data, null, 2));
      
      if (res.data && res.data.data && res.data.data.userdata) {
        console.log('Setting refreshed profile data:', JSON.stringify(res.data.data.userdata, null, 2));
        setProfileData(res.data.data.userdata);
      }
      
      console.log('=== FRONTEND SAVE PROFILE SUCCESS ===');
    } catch (error: any) {
      console.error('=== FRONTEND SAVE PROFILE ERROR ===');
      console.error('Error saving profile:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      // Optionally show error message to user
    }
    setShowProfilePopup(false);
  };

  const handleMentorClick = (mentor: any) => {
    setSelectedMentor(mentor);
    setIsMentorModalOpen(true);
    setCurrentView('dashboard');
  };

  const handleCloseMentorModal = () => {
    setIsMentorModalOpen(false);
    setSelectedMentor(null);
  };
  // ...existing code...
  // ...existing code...
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        // For now, use mock data since backend auth isn't fully connected
        // TODO: Connect to real backend when auth is properly set up
        const mockData: DashboardData = {
          user: {
            id: '1',
            name: 'John Doe',
            fullName: 'John Doe',
            handle: 'johndoe',
            email: 'john@example.com',
            avatar: '',
            profileUrl: '/profile/1',
            userType: 'seeker'
          },
          setupSteps: [
            {
              id: '1',
              title: 'Complete your profile',
              description: 'Add your photo and bio to help coaches get to know you',
              completed: false,
              action: 'Update profile',
              icon: 'user'
            },
            {
              id: '2', 
              title: 'Set your goals',
              description: 'Tell us what you want to achieve',
              completed: false,
              action: 'Add goals',
              icon: 'target'
            },
            {
              id: '3',
              title: 'Book your first session',
              description: 'Find a coach and schedule your first consultation',
              completed: false,
              action: 'Browse coaches',
              icon: 'calendar'
            }
          ],
          goals: [
            {
              id: '1',
              text: 'Improve public speaking skills',
              completed: false,
              createdAt: new Date()
            },
            {
              id: '2', 
              text: 'Learn leadership techniques',
              completed: true,
              createdAt: new Date(Date.now() - 86400000)
            }
          ],
          stats: {
            totalBookings: 0,
            completedBookings: 0,
            pendingBookings: 0,
            totalEarnings: 0,
            thisMonthEarnings: 0,
            averageRating: 0,
            totalReviews: 0
          },
          recentActivity: [
            {
              id: '1',
              type: 'profile_updated',
              title: 'Profile updated',
              description: 'You updated your profile information',
              time: '2 hours ago'
            }
          ]
        };
        if (!isMounted) return;
        setData(mockData);
        setSetupSteps(mockData.setupSteps);
        
        // Load goals from localStorage
        const savedGoals = localStorage.getItem('userGoals');
        if (savedGoals) {
          try {
            const parsedGoals = JSON.parse(savedGoals).map((goal: any) => ({
              ...goal,
              createdAt: new Date(goal.createdAt)
            }));
            setGoals(parsedGoals);
          } catch (e) {
            console.error('Error parsing saved goals:', e);
            setGoals(mockData.goals);
          }
        } else {
          setGoals(mockData.goals);
        }
        
        setError(null);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load dashboard');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const completedSteps = useMemo(() => setupSteps.filter((s: SetupStep) => s.completed).length, [setupSteps]);
  const totalSteps = setupSteps.length || 1;
  const stepsProgressPct = Math.round((completedSteps / totalSteps) * 100);

  async function toggleStep(step: SetupStep) {
    try {
      const next = setupSteps.map(s => s.id === step.id ? { ...s, completed: !s.completed } : s);
      setSetupSteps(next);
      // TODO: Connect to backend when auth is properly set up
      // await dashboardApi.updateSetupSteps(next.map(s => ({ id: s.id, completed: s.completed })));
    } catch {
      // revert on error
      setSetupSteps(prev => prev.map(s => s.id === step.id ? { ...s, completed: step.completed } : s));
    }
  }  async function addGoal() {
    if (!newGoal.trim()) return;
    try {
      setSaving(true);
      const newGoalObj: Goal = {
        id: Date.now().toString(),
        text: newGoal.trim(),
        completed: false,
        createdAt: new Date()
      };
      
      const updatedGoals = [newGoalObj, ...goals];
      setGoals(updatedGoals);
      
      // Save to localStorage
      localStorage.setItem('userGoals', JSON.stringify(updatedGoals.map(goal => ({
        ...goal,
        createdAt: goal.createdAt.toISOString()
      }))));
      
      setNewGoal('');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }  async function toggleGoal(goal: Goal) {
    try {
      const updatedGoals = goals.map(g => g.id === goal.id ? { ...g, completed: !g.completed } : g);
      setGoals(updatedGoals);
      
      // Save to localStorage
      localStorage.setItem('userGoals', JSON.stringify(updatedGoals.map(goal => ({
        ...goal,
        createdAt: goal.createdAt.toISOString()
      }))));
    } catch (e) {
      console.error(e);
    }
  }  async function deleteGoal(goal: Goal) {
    try {
      const updatedGoals = goals.filter(g => g.id !== goal.id);
      setGoals(updatedGoals);
      
      // Save to localStorage
      localStorage.setItem('userGoals', JSON.stringify(updatedGoals.map(goal => ({
        ...goal,
        createdAt: goal.createdAt.toISOString()
      }))));
    } catch (e) {
      console.error(e);
    }
  }  // Function to scroll to sessions section
  const scrollToSessions = () => {
    setCurrentView('dashboard');
    
    // Use setTimeout to ensure the dashboard view is rendered before scrolling
    setTimeout(() => {
      const sessionsSection = document.getElementById('sessions-section');
      if (sessionsSection) {
        sessionsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Add highlight effect
        sessionsSection.classList.add('ring-4', 'ring-purple-300', 'ring-opacity-50');
        setTimeout(() => {
          sessionsSection.classList.remove('ring-4', 'ring-purple-300', 'ring-opacity-50');
        }, 2000);
      }
    }, 100); // Small delay to ensure view transition is complete
  };

  // Function to scroll to top of dashboard
  const scrollToTop = () => {
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
    setCurrentView('dashboard');
  };

  // Show 'User' as default if no username is set, otherwise use username from users collection
  const userDisplayName = profileData?.username && profileData.username.trim() !== ''
    ? profileData.username
    : 'User';
  const stats = data?.stats || {};

  return (
  <div>
    <style jsx>{`
      .scrollbar-hide {
        -ms-overflow-style: none;  /* Internet Explorer 10+ */
        scrollbar-width: none;  /* Firefox */
      }
      .scrollbar-hide::-webkit-scrollbar { 
        display: none;  /* Safari and Chrome */
      }
    `}</style>
    {/* Popup logic fixed with fragment */}
    {showProfilePopup && (
      <>
        {selectedMentor ? (
          <EditProfilePopup
            onClose={() => {
              setShowProfilePopup(false);
              setSelectedMentor(null);
            }}
            mentor={selectedMentor}
          />
        ) : (
          <EditProfilePopupUser
            onClose={() => setShowProfilePopup(false)}
            onSave={handleSaveProfile}
            initialProfile={profileData}
          />
        )}
      </>
    )}
    <div className="min-h-screen bg-[#f5f5f5] grid-pattern">
      <div className="flex h-full">
        {/* Sidebar */}
                <Sidebar
          userName={userDisplayName}
          onProfileClick={handleProfileClick}
          onSessionsClick={() => scrollToSessions()}
          onHomeClick={() => scrollToTop()}
          onTransactionsClick={() => setCurrentView('transactions')}
          onContactClick={handleContactClick}
          onRewardsClick={() => setCurrentView('rewards')}
          onPaymentsClick={() => setCurrentView('payments')}
        />
        
        {/* Main content */}
        <main className="flex-1 lg:ml-0 grid-pattern">
          {currentView === 'transactions' ? (
            <div className="w-full">
              <TransactionsPage />
            </div>
          ) : currentView === 'contact' ? (
            <div className="w-full">
              <ContactPage />
            </div>
          ) : currentView === 'rewards' ? (
            <div className="w-full">
              <RewardsPage />
            </div>
          ) : currentView === 'payments' ? (
            <div className="w-full">
              <PaymentsPage />
            </div>
          ) : (
            <>
              {/* Modern Header */}
              <section className="relative overflow-hidden bg-gray-100 py-6 sm:py-10 grid-pattern">
              <div className="mx-auto max-w-md sm:max-w-lg lg:max-w-2xl px-6 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border-4 border-purple-300 transition-all duration-500 hover:shadow-2xl sm:hover:shadow-3xl">
                <div className="flex flex-col items-start space-y-2 mb-4 sm:mb-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl sm:rounded-2xl shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-gray-800 tracking-tight">
                      Welcome back, <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">{userDisplayName}</span>
                    </h2>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600 font-medium ml-0 sm:ml-12">Ready to accelerate your career journey?</span>
                </div>
                <div className="self-end sm:ml-4">
                  <button
                    type="button"
                    className="focus:outline-none group"
                    onClick={handleProfileClick}
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 flex items-center justify-center overflow-hidden border-2 border-gray-300 shadow-xl sm:shadow-2xl group-hover:scale-110 group-hover:shadow-2xl sm:group-hover:shadow-3xl group-hover:border-gray-400 transition-all duration-300">
                      <img src="https://api.dicebear.com/7.x/initials/svg?seed=User" alt="Default Profile" className="w-full h-full object-cover rounded-xl sm:rounded-2xl" />
                    </div>
                  </button>
                </div>
              </div>
            </section>

            {/* Stats and Quick Actions */}
            <section className="py-4 sm:py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
                {/* Mobile: Quick Actions First, Desktop: Career Journey First */}
                <div className="flex-1 order-2 lg:order-1">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-black mb-2">Next in Your Career Journey</h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Set a goal that moves you forward — from finding clarity to acing your next opportunity</p>
                  <div className="flex flex-col gap-4 sm:gap-6 items-start">
                    {/* Card 1 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-full max-w-none sm:max-w-[220px] flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="bg-gray-50 px-3 py-1 rounded-full text-xs sm:text-sm text-gray-700 border border-gray-200 flex items-center gap-2">
                          <span>Interested</span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-2xl sm:text-3xl">💡</span>
                      </div>
                      <div className="text-base sm:text-lg font-semibold text-black">Not sure what direction to take?</div>
                      <button className="w-full bg-gray-900 text-white font-semibold py-2 rounded-lg mt-2 text-sm">Book a career exploration session</button>
                    </div>
                    {/* Card 2 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-full max-w-none sm:max-w-[220px] flex flex-col gap-3 sm:ml-10">
                      <div className="flex items-center justify-between">
                        <div className="bg-gray-50 px-3 py-1 rounded-full text-xs sm:text-sm text-gray-700 border border-gray-200 flex items-center gap-2">
                          <span>Interested</span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-2xl sm:text-3xl">🚲</span>
                      </div>
                      <div className="text-base sm:text-lg font-semibold text-black">Need help creating a strong first resume?</div>
                      <button className="w-full bg-gray-900 text-white font-semibold py-2 rounded-lg mt-2 text-sm">Resume review for freshers</button>
                    </div>
                    {/* Card 3 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-full max-w-none sm:max-w-[220px] flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="bg-gray-50 px-3 py-1 rounded-full text-xs sm:text-sm text-gray-700 border border-gray-200 flex items-center gap-2">
                          <span>Interested</span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-2xl sm:text-3xl">💡</span>
                      </div>
                      <div className="text-base sm:text-lg font-semibold text-black">Applied to a few jobs but no response?</div>
                      <button className="w-full bg-gray-900 text-white font-semibold py-2 rounded-lg mt-2 text-sm">Audit your job strategy</button>
                    </div>
                  </div>
                </div>
                {/* Mobile: Career Journey Second, Desktop: Quick Actions Second */}
                <div className="flex flex-col gap-8 items-end w-full lg:w-auto order-1 lg:order-2">
                  <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl sm:shadow-2xl border border-gray-200/50 w-full max-w-none sm:min-w-[400px] sm:max-w-[500px] transition-all duration-500 hover:shadow-2xl sm:hover:shadow-3xl">
                    <div className="flex items-center gap-3 mb-6 sm:mb-8">
                      <div className="p-2 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
                        <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-black">Quick Actions</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      <button
                        type="button"
                        className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl border border-gray-200 transition-all duration-300 hover:-translate-y-1 focus:outline-none w-full"
                        onClick={() => setShowBookSessionPopup(true)}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-center shadow-lg flex-shrink-0">
                            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-lg font-semibold text-black mb-1">Book a session</p>
                            <p className="text-xs text-gray-600">Find a coach and schedule</p>
                          </div>
                          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-hover:text-gray-700 transition-colors flex-shrink-0" />
                        </div>
                      </button>

                      <button
                        type="button"
                        className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl border border-gray-200 transition-all duration-300 hover:-translate-y-1 focus:outline-none w-full"
                        onClick={() => setShowMessageToast(true)}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-center shadow-lg flex-shrink-0">
                            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-lg font-semibold text-black mb-1">Open messages</p>
                            <p className="text-xs text-gray-600">Chat with your coach</p>
                          </div>
                          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-hover:text-gray-700 transition-colors flex-shrink-0" />
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  {/* BookSessionPopup modal */}
                  {showBookSessionPopup && (
                    <BookSessionPopup onClose={() => setShowBookSessionPopup(false)} />
                  )}
                  
                  {/* Modern Toast Notification */}
                  {showMessageToast && (
                    <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-4 rounded-2xl shadow-2xl animate-fadeIn backdrop-blur-sm border border-white/20">
                      <MessageSquare className="h-6 w-6 text-white" />
                      <span className="font-semibold">This feature is not available at this moment</span>
                      <button
                        className="ml-4 text-white hover:text-gray-200 focus:outline-none transition-colors"
                        onClick={() => setShowMessageToast(false)}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                  {/* Find Your Mentor Section */}
                  <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl sm:shadow-2xl border border-gray-200/50 mt-6 w-full max-w-none sm:min-w-[400px] sm:max-w-[500px] transition-all duration-500 hover:shadow-2xl sm:hover:shadow-3xl">
                    <div className="flex items-center gap-3 mb-6 sm:mb-8">
                      <div className="p-2 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-black">Find Your Mentor</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                      {mentors.map((mentor) => (
                        <div 
                          key={mentor.id}
                          className="flex flex-col items-center cursor-pointer group"
                          onClick={() => {
                            setSelectedMentor(mentor);
                            setShowProfilePopup(true);
                            setCurrentView('dashboard');
                          }}
                        >
                          <div className="relative mb-3">
                            <img 
                              src={mentor.image} 
                              alt={mentor.name} 
                              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl sm:rounded-2xl border-2 border-gray-200 group-hover:border-gray-400 group-hover:shadow-xl transition-all duration-300 flex-shrink-0" 
                            />
                            <div className="absolute inset-0 bg-gray-600 bg-opacity-0 group-hover:bg-opacity-10 rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-white rounded-full p-2 shadow-lg">
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <span className="font-semibold text-gray-800 text-sm group-hover:text-gray-700 transition-colors duration-300 block">{mentor.name}</span>
                            <span className="text-xs text-gray-600 mt-1 block">{mentor.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Main content */}
            <section className="py-6 sm:py-8 pb-24 lg:pb-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Sessions box */}
                  <div id="sessions-section" className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl sm:shadow-2xl border border-gray-200/50 flex flex-col items-start justify-start h-[500px] sm:h-[600px] lg:h-[700px] transition-all duration-500 hover:shadow-2xl sm:hover:shadow-3xl">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <div className="p-2 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-black">Sessions</h2>
                    </div>
                    <div className="flex flex-row gap-3 sm:gap-4 mb-4 sm:mb-6 w-full">
                      <button
                        className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 focus:outline-none text-sm sm:text-base ${sessionTab === 'upcoming' ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => setSessionTab('upcoming')}
                      >
                        Upcoming
                      </button>
                      <button
                        className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 focus:outline-none text-sm sm:text-base ${sessionTab === 'completed' ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => setSessionTab('completed')}
                      >
                        Completed
                      </button>
                    </div>
                    <div className="w-full flex-1 overflow-y-auto scrollbar-hide">
                      {sessionsLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
                        </div>
                      ) : sessionsError ? (
                        <div className="text-center py-12">
                          <div className="text-gray-500 text-lg">{sessionsError}</div>
                        </div>
                      ) : sessions.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-gray-500 text-lg">No sessions found</div>
                          <p className="text-gray-400 mt-2">Book your first session to get started!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sessions.map((session: any) => (
                            <div key={session.id} className="bg-white rounded-2xl p-4 border border-gray-200 hover:border-gray-300 transition-all duration-300">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h3 className="font-semibold text-black text-base mb-1">{session.title}</h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{session.date}</span>
                                    <span className="text-gray-400">•</span>
                                    <span>{session.time}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span className="capitalize">{session.sessionType}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="font-medium">{session.expertName}</span>
                                  </div>
                                  {session.expertEmail && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      <span>{session.expertEmail}</span>
                                    </div>
                                  )}
                                  {session.notes && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        <span className="font-medium">Notes:</span>
                                      </div>
                                      <p className="text-sm text-gray-700">{session.notes}</p>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    sessionTab === 'upcoming' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {sessionTab.charAt(0).toUpperCase() + sessionTab.slice(1)}
                                  </div>
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    session.paymentStatus === 'paid' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {session.paymentStatus.charAt(0).toUpperCase() + session.paymentStatus.slice(1)}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Meeting Link Section - Show for all sessions with meeting link */}
                              {session.meetingLink && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 bg-blue-100 rounded-lg">
                                        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                      <span className="text-sm font-medium text-gray-700">Meeting Link</span>
                                    </div>
                                    <a
                                      href={session.meetingLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                    >
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                      Join Meeting
                                    </a>
                                  </div>
                                </div>
                              )}
                              
                              {/* Price Information */}
                              <div className="mt-2 flex items-center justify-between text-sm">
                                <span className="text-gray-500">Price: {session.currency} {session.price}</span>
                                {session.paymentStatus !== 'paid' && (
                                  <span className="text-orange-600 font-medium">Payment Pending</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Goals box */}
                  <div id="goals-section" className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl sm:shadow-2xl border border-gray-200/50 flex flex-col items-start justify-start h-[500px] sm:h-[600px] lg:h-[700px] transition-all duration-500 hover:shadow-2xl sm:hover:shadow-3xl">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <div className="p-2 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
                        <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-black">Goals</h2>
                    </div>
                    
                    {/* Add Goal Input */}
                    <div className="w-full mb-4 sm:mb-6">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newGoal}
                          onChange={(e) => setNewGoal(e.target.value)}
                          placeholder="Enter your goal..."
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 focus:border-purple-500 focus:outline-none transition-all duration-300 text-sm sm:text-base"
                          onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                        />
                        <button
                          onClick={addGoal}
                          disabled={saving || !newGoal.trim()}
                          className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-xl sm:rounded-2xl font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 text-sm sm:text-base"
                        >
                          {saving ? 'Adding...' : 'Add'}
                        </button>
                      </div>
                    </div>

                    {/* Goals List */}
                    <div className="w-full flex-1 overflow-y-auto scrollbar-hide">
                      {goals.length === 0 ? (
                        <div className="text-center py-12">
                          <Target className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                          <div className="text-gray-500 text-lg">No goals yet</div>
                          <p className="text-gray-400 mt-2">Add your first goal to get started!</p>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          {goals.map((goal) => (
                            <div key={goal.id} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 hover:border-gray-300 transition-all duration-300">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <button
                                    onClick={() => toggleGoal(goal)}
                                    className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                                      goal.completed
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'border-gray-300 hover:border-purple-500'
                                    }`}
                                  >
                                    {goal.completed && (
                                      <svg className="w-3 h-3 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <h3 className={`font-medium text-gray-900 text-sm sm:text-base ${
                                      goal.completed ? 'line-through text-gray-500' : ''
                                    }`}>
                                      {goal.text}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Added {goal.createdAt.toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => deleteGoal(goal)}
                                  className="ml-2 p-1 sm:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Delete goal"
                                >
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
            </>
          )}
        </main>
        </div>
      </div>
    </div>
  );
}

















































































