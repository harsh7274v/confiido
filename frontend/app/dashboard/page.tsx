"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Star, Users, Shield, Clock } from "lucide-react";
import React, { useEffect, useMemo, useState, useLayoutEffect, useCallback } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
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
  CheckCircle,
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
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { bookingApi } from '../services/bookingApi';
import { availabilityApi } from '../services/availabilityApi';

// Skeleton Loader Component
const SkeletonLoader = () => {
  return (
    <>
      <style jsx>{`
        .loader {
          position: relative;
          width: 100%;
          height: 130px;
          margin-bottom: 10px;
          border: 1px solid #d3d3d3;
          padding: 15px;
          background-color: #e3e3e3;
          overflow: hidden;
          border-radius: 12px;
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

// Define types locally
interface Goal {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action: string;
  icon: string;
}

interface DashboardData {
  user: {
    id: string;
    name: string;
    fullName: string;
    handle: string;
    email: string;
    avatar?: string;
    profileUrl: string;
    userType: 'expert' | 'seeker';
  };
  setupSteps: SetupStep[];
  goals: Goal[];
  stats: any;
  sessions: any;
  recentActivity: any[];
  inspiration?: any[];
}

interface RescheduleSlotOption {
  startTime: string;
  endTime: string;
  startDisplayTime: string;
  endDisplayTime: string;
}

interface RescheduleModalState {
  session: any;
  date: string;
  reason: string;
  selectedSlot: RescheduleSlotOption | null;
}

// Utility function to create session datetime with proper timezone handling
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

const formatDateInputValue = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const formatReadableDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatReadableTime = (value?: string) => {
  if (!value) return '—';
  const [hours, minutes] = value.split(':').map((part) => parseInt(part, 10));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
};

const getRescheduleStatusStyles = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-50 border-green-200 text-green-700';
    case 'rejected':
      return 'bg-red-50 border-red-200 text-red-700';
    case 'cancelled':
      return 'bg-gray-50 border-gray-200 text-gray-600';
    default:
      return 'bg-yellow-50 border-yellow-200 text-yellow-700';
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const mainContentRef = React.useRef<HTMLElement>(null);
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
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'transactions' | 'contact' | 'rewards' | 'payments'>('dashboard');
  const [rescheduleModal, setRescheduleModal] = useState<RescheduleModalState | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<RescheduleSlotOption[]>([]);
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);
  const [rescheduleSlotsError, setRescheduleSlotsError] = useState<string | null>(null);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [sessionActionMessage, setSessionActionMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // On mount, check URL for view=payments and switch view
  useLayoutEffect(() => {
    try {
      let targetView: typeof currentView | null = null;
      // Read from localStorage first for speed and to avoid exposing identifiers
      if (!targetView && typeof window !== 'undefined') {
        const storedView = localStorage.getItem('dashboard_redirect_view') as typeof currentView | null;
        if (storedView === 'payments') targetView = 'payments';
      }
      // Also support query param if present (legacy)
      if (!targetView) {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view');
        if (view === 'payments') targetView = 'payments';
      }

      if (targetView) {
        setCurrentView(targetView);
        // Clear the redirect flag so it doesn't persist
        try {
          localStorage.removeItem('dashboard_redirect_view');
        } catch {}
        // Clean the URL (remove any query params like view/bookingId)
        try {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        } catch {}
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!sessionActionMessage) return;
    const timer = setTimeout(() => setSessionActionMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [sessionActionMessage]);






  // Mentor data
  const mentors = [
    {
      id: '1',
      name: 'Megha Upadhyay',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      title: 'Ex-ABP News, IIMC Alumni',
      company: 'Ex- ABP News',
      location: 'NOIDA, India',
      rating: 4.8,
      reviews: 127,
      hourlyRate: 'Starts from Rs750',
      expertise: ['On-Camera Communication', 'Storytelling', 'Structuring thoughts', 'Confidence boosting', 'Career Guidance', 'Social Media Growth'],
      bio: 'Experienced journalist with 4+ years on field. I started on Confiido to help students/professional find their authentic voice and speak with confidence.',
      experience: '4+ years in National Media/Journalism',
      languages: ['English', 'Hindi'],
      availability: 'Weekdays 11 AM-9 PM, Weekends 11 AM-7 PM'
    },
    {
      id: '2',
      name: 'Ajatika Singh',
      image: '/mento2.jpeg',
      title: 'Journalist',
      company: 'ABP News',
      location: 'Delhi, India',
      rating: 4.9,
      reviews: 89,
      hourlyRate: 'Starts from Rs3000',
      expertise: ['Leadership communication', 'Impromptu Speaking', 'Persuasive storytelling', 'Career Growth', 'Deep Research', 'Impactful writing'],
      bio: 'Senior journalist @ABP News, passionate about helping freshers/professionals grow their careers and build better online presence. 8+ years of experience of on-field journalism.',
      experience: '8+ years in Journalism',
      languages: ['English', 'Hindi'],
      availability: 'Weekdays 11 AM-9 PM, Weekends 11 AM-7 PM'
    }
  ];

  // Helper function to get auth headers
  const getAuthHeaders = useCallback(async () => {
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
  }, [user]);

  const fetchSessions = useCallback(async () => {
    // Check if we have authentication - be more lenient during initial load
    let storedToken = localStorage.getItem('token');
    const sessionTimestamp = localStorage.getItem('sessionTimestamp');
    
    // If no token, wait a bit and check again (in case it's being stored)
    if (!storedToken && !user) {
      console.log('⏳ No token found, waiting for authentication to load...');
      // Wait a bit and check again
      await new Promise(resolve => setTimeout(resolve, 500));
      storedToken = localStorage.getItem('token');
      
      if (!storedToken && !user) {
        console.log('⏳ Still no token after wait, skipping fetch');
        setSessionsLoading(false);
        return;
      } else if (storedToken) {
        console.log('✅ Token found after wait, proceeding with fetch');
      }
    }
    
    // Final check - if still no token and no user, return
    if (!user && !storedToken) {
      console.log('❌ No authentication available, cannot fetch sessions');
      setSessionsLoading(false);
      return;
    }
    
    // If we have token but it's expired, show error
    if (storedToken && sessionTimestamp) {
      const sessionTime = parseInt(sessionTimestamp);
      const currentTime = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if ((currentTime - sessionTime) > twentyFourHours) {
        console.log('❌ Session expired, please login again');
        setSessionsError('Session expired, please log in again');
        setSessionsLoading(false);
        return;
      }
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allSessions = bookings.flatMap((booking: any) => 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        booking.sessions.map((session: any) => ({
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
          expertUserId: session.expertUserId
            || session.expertId?.user_id
            || session.expertId?.userId?.user_id
            || session.expertId?.userId?.userId, // fallback if nested
          notes: session.notes,
          scheduledDate: session.scheduledDate,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration,
          bookingId: booking._id,
          rescheduleRequest: session.rescheduleRequest,
          rescheduleHistory: session.rescheduleHistory || []
        }))
      );
      
      console.log('=== FRONTEND DASHBOARD DEBUG ===');
      console.log('All sessions extracted:', allSessions.length);
      console.log('All sessions:', allSessions);
      
      // Debug: Show the first few sessions in detail
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allSessions.slice(0, 3).forEach((session: any, index: number) => {
        console.log(`Session ${index + 1} details:`, {
          id: session.id,
          scheduledDate: session.scheduledDate,
          time: session.time,
          status: session.status,
          paymentStatus: session.paymentStatus
        });
      });
      
      // Filter for paid sessions only
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paidSessions = allSessions.filter((session: any) => {
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
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const upcoming = paidSessions.filter((session: any) => {
        const sessionDateTime = createSessionDateTime(session.scheduledDate, session.time);
        return sessionDateTime > now;
      });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const completed = paidSessions.filter((session: any) => {
        const sessionDateTime = createSessionDateTime(session.scheduledDate, session.time);
        return sessionDateTime <= now;
      });
      
      console.log('Upcoming sessions:', upcoming.length);
      console.log('Completed sessions:', completed.length);
      
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
  }, [getAuthHeaders, sessionTab, user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

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
  }, [getAuthHeaders, user]);

  const handleProfileClick = () => {
    setShowProfilePopup(true);
    setCurrentView('dashboard');
  };
  const fetchRescheduleSlots = useCallback(async (sessionData: any, targetDate: string, preferredStart?: string | null) => {
    if (!sessionData?.expertUserId || !targetDate) {
      setRescheduleSlots([]);
      return;
    }
    setRescheduleSlotsLoading(true);
    setRescheduleSlotsError(null);
    try {
      const sessionDuration = typeof sessionData.duration === 'number' ? sessionData.duration : null;
      let durationMinutes = sessionDuration && sessionDuration > 0 ? sessionDuration : null;
      if (!durationMinutes && sessionData.startTime && sessionData.endTime) {
        const startTimeObj = new Date(`2000-01-01T${sessionData.startTime}:00`);
        const endTimeObj = new Date(`2000-01-01T${sessionData.endTime}:00`);
        durationMinutes = Math.round((endTimeObj.getTime() - startTimeObj.getTime()) / (1000 * 60));
      }
      if (!durationMinutes || durationMinutes < 15) {
        durationMinutes = 30;
      }

      const response = await availabilityApi.getConsecutiveSlotsByUserId(
        sessionData.expertUserId,
        targetDate,
        durationMinutes,
        sessionData.id
      );
      const consecutiveSlots = response?.data?.consecutiveSlots || [];
      const availableOptions: RescheduleSlotOption[] = consecutiveSlots
        .filter((slot: any) => slot.available)
        .map((slot: any) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          startDisplayTime: slot.startDisplayTime,
          endDisplayTime: slot.endDisplayTime
        }));
      setRescheduleSlots(availableOptions);

      if (preferredStart) {
        const matchingSlot = availableOptions.find(slot => slot.startTime === preferredStart);
        if (matchingSlot) {
          setRescheduleModal(prev => prev ? { ...prev, selectedSlot: matchingSlot } : prev);
        }
      } else {
        setRescheduleModal(prev => prev ? { ...prev, selectedSlot: null } : prev);
      }
    } catch (error: any) {
      console.error('Error fetching available slots:', error);
      setRescheduleSlots([]);
      setRescheduleSlotsError(error?.response?.data?.error || 'Unable to load available slots');
    } finally {
      setRescheduleSlotsLoading(false);
    }
  }, []);

  const handleContactClick = () => {
    setCurrentView('contact');
  };

  const handleOpenRescheduleModal = (session: any) => {
    const initialDate = formatDateInputValue(session.scheduledDate);
    const initialStartTime = session.startTime || session.time?.split(' - ')[0] || null;
    setRescheduleModal({
      session,
      date: initialDate,
      reason: '',
      selectedSlot: null
    });
    setRescheduleSlots([]);
    setRescheduleSlotsError(null);
    fetchRescheduleSlots(session, initialDate, initialStartTime);
  };

  const handleCloseRescheduleModal = () => {
    if (rescheduleSubmitting) return;
    setRescheduleModal(null);
    setRescheduleSlots([]);
    setRescheduleSlotsError(null);
  };

  const handleRescheduleDateChange = (newDate: string) => {
    if (!rescheduleModal) return;
    const sessionData = rescheduleModal.session;
    setRescheduleModal(prev => prev ? { ...prev, date: newDate, selectedSlot: null } : prev);
    setRescheduleSlots([]);
    setRescheduleSlotsError(null);
    fetchRescheduleSlots(sessionData, newDate);
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleModal?.session || !rescheduleModal.date || !rescheduleModal.selectedSlot) return;
    try {
      setRescheduleSubmitting(true);
      await bookingApi.requestSessionReschedule(
        rescheduleModal.session.bookingId,
        rescheduleModal.session.id,
        {
          scheduledDate: rescheduleModal.date,
          startTime: rescheduleModal.selectedSlot.startTime,
          reason: rescheduleModal.reason?.trim() ? rescheduleModal.reason.trim() : undefined
        }
      );
      setSessionActionMessage({
        type: 'success',
        message: 'Reschedule request sent to your mentor.'
      });
      setRescheduleModal(null);
      await fetchSessions();
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || 'Failed to send reschedule request';
      setSessionActionMessage({
        type: 'error',
        message
      });
    } finally {
      setRescheduleSubmitting(false);
    }
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
          sessions: [],
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
        
        // Add highlight effect with custom color
        sessionsSection.style.boxShadow = '0 0 0 4px rgba(94, 147, 108, 0.5)';
        setTimeout(() => {
          sessionsSection.style.boxShadow = '';
        }, 2000);
      }
    }, 100); // Small delay to ensure view transition is complete
  };

  // Function to scroll to top of dashboard
  const scrollToTop = () => {
    setCurrentView('dashboard');
    
    // Use setTimeout to ensure the dashboard view is rendered before scrolling
    setTimeout(() => {
      // Use ref if available, otherwise find the main scrollable container
      const mainContent = mainContentRef.current || document.querySelector('main.overflow-y-auto');
      if (mainContent) {
        mainContent.scrollTo({ 
          top: 0, 
          behavior: 'smooth' 
        });
      } else {
        // Fallback to window scroll if main element not found
        window.scrollTo({ 
          top: 0, 
          behavior: 'smooth' 
        });
      }
    }, 100); // Small delay to ensure view transition is complete
  };

  // Show 'User' as default if no username is set, otherwise use username from users collection
  const userDisplayName = profileData?.username && profileData.username.trim() !== ''
    ? profileData.username
    : 'User';
  const stats = data?.stats || {};

  // Check if profile is incomplete (missing username, phone number, or whatsapp number)
  const isProfileIncomplete = !profileData || 
    !profileData.username || profileData.username.trim() === '' ||
    !profileData.phoneNumber || profileData.phoneNumber.trim() === '' ||
    !profileData.whatsappNumber || profileData.whatsappNumber.trim() === '';

  return (
  <ProtectedRoute>
  <div>
    <style jsx global>{`
      .scrollbar-hide {
        -ms-overflow-style: none;  /* Internet Explorer 10+ */
        scrollbar-width: none;  /* Firefox */
      }
      .scrollbar-hide::-webkit-scrollbar { 
        display: none;  /* Safari and Chrome */
      }
      /* Hide all scrollbars in dashboard */
      body {
        overflow: hidden;
      }
      *::-webkit-scrollbar {
        display: none;
      }
      * {
        -ms-overflow-style: none;
        scrollbar-width: none;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 overflow-hidden">
      {/* Semi-transparent overlay for better content readability */}
      <div className="absolute inset-0 bg-white/10 pointer-events-none z-0"></div>
      <div className="flex h-screen relative z-20 overflow-hidden">
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
          isProfileIncomplete={isProfileIncomplete}
        />
        
        {/* Main content */}
        <main ref={mainContentRef} className="flex-1 lg:ml-0 overflow-y-auto scrollbar-hide h-screen">
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
              <section className="relative overflow-hidden py-6 sm:py-8" style={{ background: 'linear-gradient(135deg, #e0e8ed 0%, #f0f4f7 100%)' }}>
              <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-20">
                <div className="max-w-7xl mx-auto flex flex-row items-center justify-between">
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
                        Ready for your session?
                      </span>
                    </div>
                  </div>
                  
                  {/* Right side - Settings icon */}
                  <div className="flex-shrink-0">
                    <button
                      type="button"
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-all duration-200 focus:outline-none"
                      onClick={() => {
                        setShowProfilePopup(true);
                      }}
                    >
                      <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Stats and Quick Actions */}
            <section className="py-4 sm:py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
                {/* Mobile: Quick Actions First, Desktop: Career Journey First */}
                <div className="flex-1 order-2 lg:order-1">
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-2" style={{ fontFamily: "'Rubik', sans-serif", color: '#000000' }}>Next in Your Career Journey</h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8" style={{ fontFamily: "'Rubik', sans-serif" }}>Set a goal that moves you forward — from finding clarity to acing your next opportunity</p>
                  <div className="flex flex-col gap-4 sm:gap-6 items-start">
                    {/* Card 1 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-full max-w-none sm:max-w-[220px] flex flex-col gap-3 animate-float-gentle">
                      <div className="flex items-center justify-between">
                        <div className="bg-gray-50 px-3 py-1 rounded-full text-xs sm:text-sm text-gray-700 border border-gray-200 flex items-center gap-2">
                          <span>Interested</span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-2xl sm:text-3xl">💡</span>
                      </div>
                      <div className="text-base sm:text-lg font-semibold" style={{ fontFamily: "'Rubik', sans-serif", color: '#000000' }}>Not sure what direction to take?</div>
                      <button 
                        onClick={() => setShowBookSessionPopup(true)}
                        className="w-full text-white font-semibold py-2 rounded-lg mt-2 text-sm transition-colors" 
                        style={{ fontFamily: "'Rubik', sans-serif", backgroundColor: '#3E5F44' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2F4A35'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3E5F44'}
                      >
                        Book 1:1 Career guidance session
                      </button>
                    </div>
                    {/* Card 2 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-full max-w-none sm:max-w-[220px] flex flex-col gap-3 sm:ml-10 animate-float-slow">
                      <div className="flex items-center justify-between">
                        <div className="bg-gray-50 px-3 py-1 rounded-full text-xs sm:text-sm text-gray-700 border border-gray-200 flex items-center gap-2">
                          <span>Interested</span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-2xl sm:text-3xl">🚲</span>
                      </div>
                      <div className="text-base sm:text-lg font-semibold" style={{ fontFamily: "'Rubik', sans-serif", color: '#000000' }}>Need help creating a strong first resume?</div>
                      <button 
                        onClick={() => setShowBookSessionPopup(true)}
                        className="w-full text-white font-semibold py-2 rounded-lg mt-2 text-sm transition-colors" 
                        style={{ fontFamily: "'Rubik', sans-serif", backgroundColor: '#3E5F44' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2F4A35'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3E5F44'}
                      >
                        Resume Review
                      </button>
                    </div>
                    {/* Card 3 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-full max-w-none sm:max-w-[220px] flex flex-col gap-3 animate-float-fast">
                      <div className="flex items-center justify-between">
                        <div className="bg-gray-50 px-3 py-1 rounded-full text-xs sm:text-sm text-gray-700 border border-gray-200 flex items-center gap-2">
                          <span>Interested</span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-2xl sm:text-3xl">💡</span>
                      </div>
                      <div className="text-base sm:text-lg font-semibold" style={{ fontFamily: "'Rubik', sans-serif", color: '#000000' }}>Applied to a few jobs but no response?</div>
                      <button 
                        onClick={() => setShowBookSessionPopup(true)}
                        className="w-full text-white font-semibold py-2 rounded-lg mt-2 text-sm transition-colors" 
                        style={{ fontFamily: "'Rubik', sans-serif", backgroundColor: '#3E5F44' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2F4A35'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3E5F44'}
                      >
                        Book mock interview session
                      </button>
                    </div>
                  </div>
                </div>
                {/* Mobile: Career Journey Second, Desktop: Quick Actions Second */}
                <div className="flex flex-col gap-8 items-end w-full lg:w-auto order-1 lg:order-2">
                  {/* Quick Actions box removed; buttons retained below */}
                  <div className="w-full sm:min-w-[400px] sm:max-w-[500px]">
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      <button 
                        type="button"
                        className="group relative rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 focus:outline-none w-4/5 mx-auto cursor-pointer text-white"
                        onClick={() => setShowBookSessionPopup(true)}
                        style={{ position: 'relative', zIndex: 2000, pointerEvents: 'auto', backgroundColor: '#3E5F44' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2F4A35'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3E5F44'}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center shadow-lg flex-shrink-0">
                            <Calendar className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#3E5F44' }} />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-lg font-semibold mb-1">Book a session</p>
                            <p className="text-xs opacity-90">Find a coach and schedule</p>
                          </div>
                          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-white/80 group-hover:text-white transition-colors flex-shrink-0" />
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  {/* BookSessionPopup modal */}
                  <div className={`fixed inset-0 z-[9999] ${showBookSessionPopup ? 'block' : 'hidden'}`}>
                    <BookSessionPopup 
                      onClose={() => {
                        console.log('Closing BookSessionPopup');
                        setShowBookSessionPopup(false);
                      }}
                      onGoToPayments={(bookingId?: string) => {
                        try {
                          if (bookingId) localStorage.setItem('dashboard_target_bookingId', bookingId);
                          localStorage.setItem('dashboard_redirect_view', 'payments');
                        } catch {}
                        setCurrentView('payments');
                      }}
                    />
                  </div>

                  {/* Reschedule Request Modal */}
                  {rescheduleModal?.session && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
                        <button
                          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                          onClick={handleCloseRescheduleModal}
                          disabled={rescheduleSubmitting}
                        >
                          <X className="h-5 w-5" />
                        </button>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Request a reschedule</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Pick a new slot that works for you. Your mentor will review and confirm.
                        </p>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New date</label>
                            <input
                              type="date"
                              value={rescheduleModal.date}
                              min={formatDateInputValue(new Date().toISOString())}
                              onChange={(e) => handleRescheduleDateChange(e.target.value)}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-300 focus:outline-none"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-sm font-medium text-gray-700">Available slots</label>
                              <button
                                type="button"
                                className="text-xs text-gray-500 hover:text-gray-700"
                                onClick={() => rescheduleModal.session && fetchRescheduleSlots(rescheduleModal.session, rescheduleModal.date, rescheduleModal.selectedSlot?.startTime || null)}
                              >
                                Refresh
                              </button>
                            </div>
                            <div className="border border-gray-200 rounded-xl max-h-56 overflow-y-auto p-2">
                              {rescheduleSlotsLoading ? (
                                <div className="py-6 text-center text-sm text-gray-500">Loading available slots...</div>
                              ) : rescheduleSlotsError ? (
                                <div className="py-4 text-sm text-red-600">{rescheduleSlotsError}</div>
                              ) : rescheduleSlots.length === 0 ? (
                                <div className="py-4 text-sm text-gray-500">No slots available for this date.</div>
                              ) : (
                                <div className="space-y-2">
                                  {rescheduleSlots.map((slot) => (
                                    <label
                                      key={slot.startTime}
                                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                                        rescheduleModal.selectedSlot?.startTime === slot.startTime
                                          ? 'border-gray-800 bg-gray-50'
                                          : 'border-gray-200 hover:border-gray-400'
                                      }`}
                                    >
                                      <div>
                                        <div className="font-semibold text-gray-900">
                                          {slot.startDisplayTime} – {slot.endDisplayTime}
                                        </div>
                                        <div className="text-xs text-gray-500">{slot.startTime} - {slot.endTime}</div>
                                      </div>
                                      <input
                                        type="radio"
                                        className="h-4 w-4 text-gray-800"
                                        checked={rescheduleModal.selectedSlot?.startTime === slot.startTime}
                                        onChange={() => setRescheduleModal(prev => prev ? ({ ...prev, selectedSlot: slot }) : prev)}
                                      />
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message to mentor (optional)</label>
                            <textarea
                              value={rescheduleModal.reason}
                              onChange={(e) => setRescheduleModal(prev => prev ? ({ ...prev, reason: e.target.value }) : prev)}
                              rows={3}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-300 focus:outline-none"
                              placeholder="Share helpful context around the change..."
                            />
                          </div>
                        </div>
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={handleCloseRescheduleModal}
                            disabled={rescheduleSubmitting}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleRescheduleSubmit}
                            disabled={rescheduleSubmitting || !rescheduleModal.date || !rescheduleModal.selectedSlot}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl text-white font-semibold disabled:opacity-60"
                            style={{ backgroundColor: '#3E5F44' }}
                          >
                            {rescheduleSubmitting ? 'Sending...' : 'Send request'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Modern Toast Notification */}
                  {showMessageToast && (
                    <div className="fixed top-6 right-6 z-50 flex items-center gap-3 text-white px-6 py-4 rounded-2xl shadow-2xl animate-fadeIn backdrop-blur-sm border border-white/20" style={{ backgroundColor: '#3E5F44' }}>
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

                  {/* Logout Success Toast Notification */}
                  {showLogoutToast && (
                    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl animate-fadeIn backdrop-blur-sm border border-white/20">
                      <div className="p-2 bg-white/20 rounded-full">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">Logout Successful!</span>
                        <span className="text-xs opacity-90">Account logged out successfully</span>
                      </div>
                      <button
                        className="ml-4 text-white/80 hover:text-white focus:outline-none transition-colors"
                        onClick={() => setShowLogoutToast(false)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Find Your Mentor Section (outer box/background removed, cards retained) */}
                  <div className="mt-6 w-full sm:min-w-[400px] sm:max-w-[500px]">
                    <div className="flex items-center gap-3 mb-6 sm:mb-8 w-4/5 mx-auto">
                      <div className="p-2 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0" style={{ backgroundColor: '#3E5F44' }}>
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold" style={{ fontFamily: "'Rubik', sans-serif", color: '#000000' }}>Find Your Mentor</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-4/5 mx-auto">
                      {mentors.map((mentor) => (
                        <div 
                          key={mentor.id}
                          className="flex flex-col items-center cursor-pointer group h-full"
                          onClick={() => {
                            setSelectedMentor(mentor);
                            setShowProfilePopup(true);
                            setCurrentView('dashboard');
                          }}
                        >
                          <div className="relative mb-3 w-20 h-20 sm:w-24 sm:h-24">
                            <img 
                              src={mentor.image} 
                              alt={mentor.name} 
                              className="w-full h-full object-cover object-center rounded-xl sm:rounded-2xl border-2 border-gray-200 group-hover:border-gray-400 group-hover:shadow-xl transition-all duration-300" 
                              style={{ objectPosition: 'center center' }}
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
                        <div className="text-center flex flex-col items-center gap-2 w-full flex-grow">
                          <div className="flex-grow">
                            <span className="font-semibold text-gray-800 text-sm group-hover:text-gray-700 transition-colors duration-300 block">{mentor.name}</span>
                            <span className="text-xs text-gray-600 mt-1 block">{mentor.title}</span>
                          </div>
                          <button
                            type="button"
                            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:text-white hover:bg-gray-800 transition-colors duration-200 mt-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowBookSessionPopup(true);
                            }}
                          >
                            Book a session
                          </button>
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
                      <div className="p-2 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0" style={{ backgroundColor: '#3E5F44' }}>
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold" style={{ fontFamily: "'Rubik', sans-serif", color: '#000000' }}>Sessions</h2>
                    </div>
                    <div className="flex flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 w-full overflow-x-auto scrollbar-hide">
                      <button
                        className={`flex-1 min-w-[100px] px-2 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 focus:outline-none text-xs sm:text-base whitespace-nowrap ${sessionTab === 'upcoming' ? 'text-white shadow-lg' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                        style={sessionTab === 'upcoming' ? { backgroundColor: '#3E5F44' } : {}}
                        onClick={() => setSessionTab('upcoming')}
                      >
                        Upcoming
                      </button>
                      <button
                        className={`flex-1 min-w-[100px] px-2 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 focus:outline-none text-xs sm:text-base whitespace-nowrap ${sessionTab === 'completed' ? 'text-white shadow-lg' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                        style={sessionTab === 'completed' ? { backgroundColor: '#3E5F44' } : {}}
                        onClick={() => setSessionTab('completed')}
                      >
                        Completed
                      </button>
                    </div>
                    <div className="w-full flex-1 overflow-y-auto scrollbar-hide">
                      {sessionActionMessage && (
                        <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                          sessionActionMessage.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          {sessionActionMessage.message}
                        </div>
                      )}
                      {sessionsLoading ? (
                        <div className="space-y-3">
                          <SkeletonLoader />
                          <SkeletonLoader />
                          <SkeletonLoader />
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
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-base mb-1" style={{ color: '#3E5F44' }}>{session.title}</h3>
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
                                  {session.rescheduleRequest && (() => {
                                    const request = session.rescheduleRequest;
                                    const status = request.status;
                                    const requestedDateLabel = formatReadableDate(request.requestedDate);
                                    const requestedTimeLabel = `${formatReadableTime(request.requestedStartTime)} - ${formatReadableTime(request.requestedEndTime)}`;
                                    return (
                                      <div className={`mt-3 p-3 rounded-xl border ${getRescheduleStatusStyles(status)}`}>
                                        <div className="flex items-center justify-between text-sm font-semibold">
                                          <span>Reschedule Status</span>
                                          <span className="capitalize">{status}</span>
                                        </div>
                                        <p className="text-sm mt-2">
                                          New slot requested for <span className="font-medium">{requestedDateLabel}</span> at <span className="font-medium">{requestedTimeLabel}</span>.
                                        </p>
                                        {request.reason && (
                                          <p className="text-xs mt-2">
                                            <span className="font-semibold">Your note:</span> {request.reason}
                                          </p>
                                        )}
                                        {request.responseNote && request.status !== 'pending' && (
                                          <p className="text-xs mt-2">
                                            <span className="font-semibold">Mentor note:</span> {request.responseNote}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 flex-shrink-0">
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
                              {sessionTab === 'upcoming' && session.paymentStatus === 'paid' && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRescheduleModal(session)}
                                    disabled={session.rescheduleRequest?.status === 'pending'}
                                    className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${
                                      session.rescheduleRequest?.status === 'pending'
                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                  >
                                    {session.rescheduleRequest?.status === 'pending'
                                      ? 'Awaiting mentor response'
                                      : 'Request reschedule'}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Goals box */}
                  <div id="goals-section" className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl sm:shadow-2xl border border-gray-200/50 flex flex-col items-start justify-start h-[500px] sm:h-[600px] lg:h-[700px] transition-all duration-500 hover:shadow-2xl sm:hover:shadow-3xl">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <div className="p-2 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0" style={{ backgroundColor: '#3E5F44' }}>
                        <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold" style={{ fontFamily: "'Rubik', sans-serif", color: '#000000' }}>Goals</h2>
                    </div>
                    
                    {/* Add Goal Input */}
                    <div className="w-full mb-4 sm:mb-6">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newGoal}
                          onChange={(e) => setNewGoal(e.target.value)}
                          placeholder="Enter your goal..."
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 focus:border-gray-500 focus:outline-none transition-all duration-300 text-sm sm:text-base"
                          onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                        />
                        <button
                          onClick={addGoal}
                          disabled={saving || !newGoal.trim()}
                          className="px-4 sm:px-6 py-2 sm:py-3 text-white rounded-xl sm:rounded-2xl font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 text-sm sm:text-base"
                          style={{ backgroundColor: saving || !newGoal.trim() ? '' : '#3E5F44' }}
                          onMouseEnter={(e) => { if (!saving && newGoal.trim()) e.currentTarget.style.backgroundColor = '#2F4A35'; }}
                          onMouseLeave={(e) => { if (!saving && newGoal.trim()) e.currentTarget.style.backgroundColor = '#3E5F44'; }}
                        >
                          {saving ? 'Adding...' : 'Add'}
                        </button>
                      </div>
                    </div>

                    {/* Goals List */}
                    <div className="w-full flex-1 overflow-y-auto scrollbar-hide">
                      {goals.length === 0 ? (
                        <div className="text-center py-12">
                          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                                        : 'border-gray-300 hover:border-gray-500'
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
  </ProtectedRoute>
  );
}

















































































