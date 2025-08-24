"use client";

import Link from "next/link";
import { Calendar, Star, Users, Shield } from "lucide-react";
import React, { useEffect, useMemo, useState } from 'react';
import EditProfilePopup from '../components/EditProfilePopup';
import EditProfilePopupUser, { ProfileData } from '../components/EditProfilePopupUser';
import BookSessionPopup from '../components/BookSessionPopup';
import MentorModal from '../components/ui/MentorModal';
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
import { type DashboardData, type Goal, type SetupStep } from '../services/dashboardApi';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export default function DashboardPage() {
  const [showBookSessionPopup, setShowBookSessionPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [sessionTab, setSessionTab] = useState('upcoming');
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [showMessageToast, setShowMessageToast] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [transactionTab, setTransactionTab] = useState<'success' | 'failed'>('success');

  // Sample transaction data
  const successfulTransactions = [
    {
      id: '1',
      title: 'Session Payment',
      amount: 2500,
      date: 'Today, 2:30 PM',
      status: 'success'
    },
    {
      id: '2',
      title: 'Course Enrollment',
      amount: 5000,
      date: 'Yesterday, 10:15 AM',
      status: 'success'
    },
    {
      id: '3',
      title: 'Consultation Fee',
      amount: 1800,
      date: '2 days ago, 4:45 PM',
      status: 'success'
    }
  ];

  const failedTransactions = [
    {
      id: '4',
      title: 'Premium Course Payment',
      amount: 8000,
      date: 'Today, 11:20 AM',
      status: 'failed',
      reason: 'Insufficient funds'
    },
    {
      id: '5',
      title: 'Mentor Session Booking',
      amount: 3000,
      date: 'Yesterday, 3:15 PM',
      status: 'failed',
      reason: 'Card declined'
    },
    {
      id: '6',
      title: 'Workshop Registration',
      amount: 1500,
      date: '3 days ago, 9:30 AM',
      status: 'failed',
      reason: 'Network timeout'
    }
  ];

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
      if (!user && !storedToken) return;
      
      setSessionsLoading(true);
      setSessionsError(null);
      setApiStatus('loading');
      try {
        const headers = await getAuthHeaders();
        console.log('Making API call to dashboard with headers:', headers);
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/dashboard`, { headers });
        console.log('Dashboard API response:', res.data);
        const dashboardData = res.data?.data;
        if (dashboardData && dashboardData.sessions) {
          setSessions(sessionTab === 'upcoming' ? dashboardData.sessions.upcoming : dashboardData.sessions.completed);
        } else {
          setSessions([]);
        }
        setApiStatus('success');
      } catch (err: any) {
        console.error('Error fetching sessions:', err);
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
        setGoals(mockData.goals);
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
  }

  async function addGoal() {
    if (!newGoal.trim()) return;
    try {
      setSaving(true);
      // TODO: Connect to backend when auth is properly set up
      // const created = await dashboardApi.createGoal(newGoal.trim());
      const newGoalObj: Goal = {
        id: Date.now().toString(),
        text: newGoal.trim(),
        completed: false,
        createdAt: new Date()
      };
      setGoals(prev => [newGoalObj, ...prev]);
      setNewGoal('');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function toggleGoal(goal: Goal) {
    try {
      // TODO: Connect to backend when auth is properly set up
      // const updated = await dashboardApi.updateGoal(goal.id, { completed: !goal.completed });
      setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, completed: !g.completed } : g));
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteGoal(goal: Goal) {
    try {
      // TODO: Connect to backend when auth is properly set up
      // await dashboardApi.deleteGoal(goal.id);
      setGoals(prev => prev.filter(g => g.id !== goal.id));
    } catch (e) {
      console.error(e);
    }
  }

  // Show 'User' as default if no username is set, otherwise use username from users collection
  const userDisplayName = profileData?.username && profileData.username.trim() !== ''
    ? profileData.username
    : 'User';
  const stats = data?.stats || {};

  return (
  <div>
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
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="flex">
        <main className="flex-1">
            {/* Modern Header */}
            <section className="relative overflow-hidden bg-gradient-to-r from-gray-50 to-gray-100 py-10 sm:py-5">
              <div className="mx-auto max-w-2xl px-6 py-6 flex items-center justify-between bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 transition-all duration-500 hover:shadow-3xl">
                <div className="flex flex-col items-start space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 tracking-tight">
                      Welcome back, <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">{userDisplayName}</span>
                    </h2>
                  </div>
                  <span className="text-sm text-gray-600 font-medium ml-12">Ready to accelerate your career journey?</span>
                </div>
                <div className="ml-4">
                  <button
                    type="button"
                    className="focus:outline-none group"
                    onClick={() => {
                      setShowProfilePopup(true);
                    }}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 flex items-center justify-center overflow-hidden border-2 border-gray-300 shadow-2xl group-hover:scale-110 group-hover:shadow-3xl group-hover:border-gray-400 transition-all duration-300">
                      <img src="https://api.dicebear.com/7.x/initials/svg?seed=User" alt="Default Profile" className="w-full h-full object-cover rounded-2xl" />
                    </div>
                  </button>
                </div>
              </div>
            </section>

            {/* Stats and Quick Actions */}
            <section className="py-4">
              <div className="max-w-7xl mx-auto px-2 lg:px-8 flex flex-col lg:flex-row gap-8 items-start">
                {/* Left: Career Journey Cards */}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Next in Your Career Journey</h2>
                  <p className="text-gray-600 mb-8">Set a goal that moves you forward — from finding clarity to acing your next opportunity</p>
                  <div className="flex flex-col gap-6 items-start">
                    {/* Card 1 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-full max-w-[220px] flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="bg-gray-50 px-3 py-1 rounded-full text-sm text-gray-700 border border-gray-200 flex items-center gap-2">
                          <span>Interested</span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-3xl">💡</span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">Not sure what direction to take?</div>
                      <button className="w-full bg-gray-900 text-white font-semibold py-2 rounded-lg mt-2">Book a career exploration session</button>
                    </div>
                    {/* Card 2 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-full max-w-[220px] flex flex-col gap-3 ml-10">
                      <div className="flex items-center justify-between">
                        <div className="bg-gray-50 px-3 py-1 rounded-full text-sm text-gray-700 border border-gray-200 flex items-center gap-2">
                          <span>Interested</span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-3xl">🚲</span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">Need help creating a strong first resume?</div>
                      <button className="w-full bg-gray-900 text-white font-semibold py-2 rounded-lg mt-2">Resume review for freshers</button>
                    </div>
                    {/* Card 3 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-full max-w-[220px] flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="bg-gray-50 px-3 py-1 rounded-full text-sm text-gray-700 border border-gray-200 flex items-center gap-2">
                          <span>Interested</span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-3xl">💡</span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">Applied to a few jobs but no response?</div>
                      <button className="w-full bg-gray-900 text-white font-semibold py-2 rounded-lg mt-2">Audit your job strategy</button>
                    </div>
                  </div>
                </div>
                {/* Right: Quick Actions */}
                <div className="flex flex-col gap-8 items-end w-full lg:w-auto">
                  <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-3xl p-8 shadow-2xl border border-gray-200/50 min-w-[400px] max-w-[500px] w-full transition-all duration-500 hover:shadow-3xl">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl shadow-lg flex-shrink-0">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <button
                        type="button"
                        className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl border border-gray-200 transition-all duration-300 hover:-translate-y-1 focus:outline-none min-w-[180px]"
                        onClick={() => setShowBookSessionPopup(true)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center shadow-lg flex-shrink-0">
                            <Calendar className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="font-bold text-gray-900 mb-1 text-sm">Book a session</p>
                            <p className="text-xs text-gray-600">Find a coach and schedule</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-colors flex-shrink-0" />
                        </div>
                      </button>

                      <button
                        type="button"
                        className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl border border-gray-200 transition-all duration-300 hover:-translate-y-1 focus:outline-none min-w-[180px]"
                        onClick={() => setShowMessageToast(true)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center shadow-lg flex-shrink-0">
                            <MessageSquare className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="font-bold text-gray-900 mb-1 text-sm">Open messages</p>
                            <p className="text-xs text-gray-600">Chat with your coach</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-colors flex-shrink-0" />
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
                  <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-3xl p-8 shadow-2xl border border-gray-200/50 mt-6 w-full min-w-[400px] max-w-[500px] transition-all duration-500 hover:shadow-3xl">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl shadow-lg flex-shrink-0">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-800">Find Your Mentor</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      {mentors.map((mentor) => (
                        <div 
                          key={mentor.id}
                          className="flex flex-col items-center cursor-pointer group"
                          onClick={() => {
                            setSelectedMentor(mentor);
                            setShowProfilePopup(true);
                          }}
                        >
                          <div className="relative mb-3">
                            <img 
                              src={mentor.image} 
                              alt={mentor.name} 
                              className="w-24 h-24 object-cover rounded-2xl border-2 border-gray-200 group-hover:border-gray-400 group-hover:shadow-xl transition-all duration-300 flex-shrink-0" 
                            />
                            <div className="absolute inset-0 bg-gray-600 bg-opacity-0 group-hover:bg-opacity-10 rounded-2xl transition-all duration-300 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-white rounded-full p-2 shadow-lg">
                                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <section className="py-8 pb-16">
              <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Sessions box */}
                  <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-3xl p-8 shadow-2xl border border-gray-200/50 flex flex-col items-start justify-start h-[700px] transition-all duration-500 hover:shadow-3xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl shadow-lg flex-shrink-0">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-800">Sessions</h2>
                    </div>
                    <div className="flex flex-row gap-4 mb-6 w-full">
                      <button
                        className={`flex-1 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 focus:outline-none ${sessionTab === 'upcoming' ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => setSessionTab('upcoming')}
                      >
                        Upcoming
                      </button>
                      <button
                        className={`flex-1 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 focus:outline-none ${sessionTab === 'completed' ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => setSessionTab('completed')}
                      >
                        Completed
                      </button>
                    </div>
                    <div className="w-full flex-1 overflow-y-auto">
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
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-bold text-gray-900 text-base mb-1">{session.title}</h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="h-4 w-4" />
                                    <span>{session.date}</span>
                                  </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  sessionTab === 'upcoming' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {sessionTab.charAt(0).toUpperCase() + sessionTab.slice(1)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transactions box */}
                  <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-3xl p-8 shadow-2xl border border-gray-200/50 flex flex-col items-start justify-start h-[700px] transition-all duration-500 hover:shadow-3xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl shadow-lg flex-shrink-0">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-800">Transactions</h2>
                    </div>
                    <div className="flex flex-row gap-4 mb-6 w-full">
                      <button
                        className={`flex-1 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 focus:outline-none ${transactionTab === 'success' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => setTransactionTab('success')}
                      >
                        Success
                      </button>
                      <button
                        className={`flex-1 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 focus:outline-none ${transactionTab === 'failed' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => setTransactionTab('failed')}
                      >
                        Failed
                      </button>
                    </div>
                    <div className="w-full flex-1 overflow-y-auto">
                      <div className="space-y-4">
                        {transactionTab === 'success' ? (
                          // Successful transactions
                          successfulTransactions.map((transaction) => (
                            <div key={transaction.id} className="bg-white rounded-2xl p-4 border border-gray-200 hover:border-gray-300 transition-all duration-300">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-bold text-gray-900 text-base mb-1">{transaction.title}</h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="h-4 w-4" />
                                    <span>{transaction.date}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-green-600">₹{transaction.amount.toLocaleString()}</div>
                                  <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                    Success
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          // Failed transactions
                          failedTransactions.map((transaction) => (
                            <div key={transaction.id} className="bg-white rounded-2xl p-4 border border-gray-200 hover:border-gray-300 transition-all duration-300">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-bold text-gray-900 text-base mb-1">{transaction.title}</h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="h-4 w-4" />
                                    <span>{transaction.date}</span>
                                  </div>
                                  <div className="text-xs text-red-600 mt-1">
                                    Reason: {transaction.reason}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-red-600">₹{transaction.amount.toLocaleString()}</div>
                                  <div className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                    Failed
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

