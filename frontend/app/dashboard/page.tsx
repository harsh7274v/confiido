"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Star, Users, Shield, Clock, Bell, Search } from "lucide-react";
import React, { useEffect, useMemo, useState, useLayoutEffect, useCallback } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import SessionsPage from '../components/SessionsPage';
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
  ChevronLeft,
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
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]); // Always holds upcoming sessions
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [showMessageToast, setShowMessageToast] = useState(false);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'transactions' | 'contact' | 'rewards' | 'payments' | 'sessions'>('dashboard');
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
        } catch { }
        // Clean the URL (remove any query params like view/bookingId)
        try {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        } catch { }
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

      // Always store upcoming sessions for the right column box
      setUpcomingSessions(upcoming);

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
  } async function addGoal() {
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
  } async function toggleGoal(goal: Goal) {
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
  } async function deleteGoal(goal: Goal) {
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
  }

  // Function to navigate to sessions page
  const scrollToSessions = () => {
    setCurrentView('sessions');
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
        <div className="min-h-screen overflow-hidden font-satoshi" style={{ backgroundColor: '#fff0f3' }}>
          {/* Semi-transparent overlay for better content readability */}
          <div className="absolute inset-0 bg-white/10 pointer-events-none z-0"></div>
          <div className="flex h-screen relative z-20 overflow-hidden">
            {/* Sidebar */}
            <Sidebar
              userName={userDisplayName}
              onProfileClick={handleProfileClick}
              onSessionsClick={() => setCurrentView('sessions')}
              onHomeClick={() => scrollToTop()}
              onTransactionsClick={() => setCurrentView('transactions')}
              onContactClick={handleContactClick}
              onRewardsClick={() => setCurrentView('rewards')}
              onPaymentsClick={() => setCurrentView('payments')}
              isProfileIncomplete={isProfileIncomplete}
            />

            {/* Main content */}
            <main ref={mainContentRef} className="flex-1 lg:ml-0 overflow-y-auto scrollbar-hide h-screen safe-area-main">
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
              ) : currentView === 'sessions' ? (
                <div className="w-full">
                  <SessionsPage />
                </div>
              ) : (
                <>
                  {/* Modern Header */}
                  <section className="relative overflow-hidden py-4 sm:py-6 border-0" style={{ backgroundColor: '#fff0f3' }}>
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 relative z-20">
                      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Left side - Welcome text */}
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-wide" style={{ color: '#4A4458', fontFamily: "'Rubik', sans-serif", letterSpacing: '0.05em' }}>
                          WELCOME BACK, {userDisplayName.toUpperCase()}!
                        </h2>

                        {/* Right side - Book Session button, notification and profile */}
                        <div className="flex items-center gap-2 sm:gap-4 justify-between lg:justify-end w-full lg:w-auto">
                          {/* Book a Session Button */}
                          <button
                            type="button"
                            onClick={() => setShowBookSessionPopup(true)}
                            className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-base transition-all duration-300 shadow-lg hover:shadow-xl flex-shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                              color: '#ffffff',
                              fontFamily: "'Rubik', sans-serif",
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              backdropFilter: 'blur(10px)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            Book a Session
                          </button>

                          {/* Notification and Profile Icons - grouped together on right in mobile */}
                          <div className="flex items-center gap-2 sm:gap-4">
                            {/* Notification Icon */}
                            <button
                              type="button"
                              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 transition-all duration-200 focus:outline-none shadow-sm flex-shrink-0"
                              onClick={() => {
                                // Handle notification click
                              }}
                            >
                              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                            </button>

                            {/* Profile Avatar */}
                            <button
                              type="button"
                              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center hover:opacity-90 transition-all duration-200 focus:outline-none shadow-sm flex-shrink-0"
                              onClick={() => {
                                setShowProfilePopup(true);
                              }}
                            >
                              <User className="h-4 w-4 sm:h-6 sm:w-6 text-blue-700" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Stats and Quick Actions */}
                  <section className="py-6 sm:py-8 border-0" style={{ backgroundColor: '#fff0f3' }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      {/* Main Grid Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                        {/* Left Column - 2 columns wide */}
                        <div className="lg:col-span-2 space-y-4 sm:space-y-6">

                          {/* Top Row - Career Journey Cards and Find Mentor */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

                            {/* Career Journey Section */}
                            <div className="rounded-4xl p-4 sm:p-6 shadow-lg h-[658px] overflow-y-auto scrollbar-hide" style={{ backgroundColor: '#fadde1' }}>
                              <h3 className="text-base sm:text-lg font-semibold mb-4" style={{ fontFamily: "'Rubik', sans-serif", color: '#000000' }}>
                                Next in Your Career Journey
                              </h3>
                              <div className="space-y-3">
                                {/* Card 1 */}
                                <div className="rounded-3xl p-3 shadow-sm h-[140px] flex flex-col" style={{ backgroundColor: '#f4acb7' }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700 flex items-center gap-1">
                                      <span>Interested</span>
                                      <ChevronDown className="w-3 h-3 text-gray-400" />
                                    </div>
                                    <span className="text-xl">💡</span>
                                  </div>
                                  <div className="text-sm font-medium mb-2 flex-1" style={{ fontFamily: "'Rubik', sans-serif", color: '#000000' }}>
                                    Not sure what direction to take?
                                  </div>
                                  <button
                                    onClick={() => setShowBookSessionPopup(true)}
                                    className="w-11/12 mx-auto text-white font-medium py-2 rounded-2xl text-xs transition-colors"
                                    style={{ fontFamily: "'Rubik', sans-serif", backgroundColor: '#3a3a3a' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                                  >
                                    Book Career guidance
                                  </button>
                                </div>

                                {/* Card 2 */}
                                <div className="rounded-3xl p-3 shadow-sm h-[140px] flex flex-col" style={{ backgroundColor: '#f4acb7' }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700 flex items-center gap-1">
                                      <span>Interested</span>
                                      <ChevronDown className="w-3 h-3 text-gray-400" />
                                    </div>
                                    <span className="text-xl">🚲</span>
                                  </div>
                                  <div className="text-sm font-medium mb-2 flex-1" style={{ fontFamily: "'Rubik', sans-serif", color: '#000000' }}>
                                    Need help creating a strong first resume?
                                  </div>
                                  <button
                                    onClick={() => setShowBookSessionPopup(true)}
                                    className="w-11/12 mx-auto text-white font-medium py-2 rounded-2xl text-xs transition-colors"
                                    style={{ fontFamily: "'Rubik', sans-serif", backgroundColor: '#3a3a3a' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                                  >
                                    Resume Review
                                  </button>
                                </div>

                                {/* Card 3 - Public Speaking */}
                                <div className="rounded-3xl p-3 shadow-sm h-[140px] flex flex-col" style={{ backgroundColor: '#f4acb7' }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700 flex items-center gap-1">
                                      <span>Interested</span>
                                      <ChevronDown className="w-3 h-3 text-gray-400" />
                                    </div>
                                    <span className="text-xl">🎤</span>
                                  </div>
                                  <div className="text-sm font-medium mb-2 flex-1" style={{ fontFamily: "'Rubik', sans-serif", color: '#000000' }}>
                                    Want to improve your public speaking skills?
                                  </div>
                                  <button
                                    onClick={() => setShowBookSessionPopup(true)}
                                    className="w-11/12 mx-auto text-white font-medium py-2 rounded-2xl text-xs transition-colors"
                                    style={{ fontFamily: "'Rubik', sans-serif", backgroundColor: '#3a3a3a' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                                  >
                                    Book Public Speaking
                                  </button>
                                </div>

                                {/* Card 4 - Mock Interview */}
                                <div className="rounded-3xl p-3 shadow-sm h-[140px] flex flex-col" style={{ backgroundColor: '#f4acb7' }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700 flex items-center gap-1">
                                      <span>Interested</span>
                                      <ChevronDown className="w-3 h-3 text-gray-400" />
                                    </div>
                                    <span className="text-xl">🎯</span>
                                  </div>
                                  <div className="text-sm font-medium mb-2 flex-1" style={{ fontFamily: "'Rubik', sans-serif", color: '#000000' }}>
                                    Applied to a few jobs but no response?
                                  </div>
                                  <button
                                    onClick={() => setShowBookSessionPopup(true)}
                                    className="w-11/12 mx-auto text-white font-medium py-2 rounded-2xl text-xs transition-colors"
                                    style={{ fontFamily: "'Rubik', sans-serif", backgroundColor: '#3a3a3a' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                                  >
                                    Book Mock Interview
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Find Your Mentor Section */}
                            <div className="space-y-8 sm:space-y-10">
                              {/* Mentors Box - Half Height */}
                              <div className="rounded-4xl p-4 sm:p-6 shadow-lg h-[280px] overflow-y-auto scrollbar-hide" style={{ backgroundColor: '#fadde1' }}>
                                <h3 className="text-base sm:text-lg font-semibold mb-4" style={{ fontFamily: "'Rubik', sans-serif", color: '#000000' }}>
                                  Find Your Mentor
                                </h3>
                                <div className="space-y-3">
                                  {mentors.slice(0, 3).map((mentor) => (
                                    <div
                                      key={mentor.id}
                                      className="flex items-center gap-3 rounded-3xl p-3 cursor-pointer hover:shadow-md transition-all duration-200"
                                      style={{ backgroundColor: '#f4acb7' }}
                                      onClick={() => {
                                        setSelectedMentor(mentor);
                                        setShowProfilePopup(true);
                                        setCurrentView('dashboard');
                                      }}
                                    >
                                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                        <img
                                          src={mentor.image}
                                          alt={mentor.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate" style={{ color: '#000000' }}>{mentor.name}</div>
                                        <div className="text-xs truncate" style={{ color: '#000000' }}>{mentor.title}</div>
                                      </div>
                                      <button
                                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: '#5D5869' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowBookSessionPopup(true);
                                        }}
                                      >
                                        <Phone className="w-4 h-4 text-white" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Recent Activity Box */}
                              <div className="rounded-4xl p-4 sm:p-6 shadow-lg h-[280px] overflow-y-auto scrollbar-hide" style={{ backgroundColor: '#fadde1' }}>
                                <h3 className="text-base sm:text-lg font-semibold mb-4" style={{ fontFamily: "'Rubik', sans-serif", color: '#000000' }}>
                                  Recent Activity
                                </h3>
                                <div className="space-y-3">
                                  <div className="text-center py-8">
                                    <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                    <div className="text-gray-500 text-sm">No recent activity</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Row - Removed, Sessions moved to right column */}

                        </div>

                        {/* Right Column - Upcoming Sessions Section */}
                        <div className="space-y-8 sm:space-y-10">

                          {/* Upcoming Sessions Card */}
                          <div className="rounded-4xl p-4 sm:p-6 shadow-lg h-[280px] overflow-y-auto scrollbar-hide" style={{ backgroundColor: '#fadde1' }}>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-base sm:text-lg font-semibold" style={{ fontFamily: "'Rubik', sans-serif", color: '#000000' }}>
                                Upcoming Sessions
                              </h3>
                              <button
                                className="text-sm font-medium flex items-center gap-1"
                                style={{ color: '#3a3a3a' }}
                                onClick={() => scrollToSessions()}
                              >
                                See more <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-3">
                              {sessionsLoading ? (
                                <div className="space-y-3">
                                  <SkeletonLoader />
                                </div>
                              ) : upcomingSessions.length === 0 ? (
                                <div className="text-center py-8">
                                  <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                  <div className="text-gray-500 text-sm">No upcoming sessions</div>
                                </div>
                              ) : (
                                upcomingSessions.slice(0, 10).map((session: any) => (
                                  <div key={session.id} className="rounded-3xl p-4 shadow-sm" style={{ backgroundColor: '#f4acb7' }}>
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm mb-1 truncate" style={{ color: '#000000' }}>
                                          {session.title}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2 text-xs mb-2" style={{ color: '#000000' }}>
                                          <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {session.date}
                                          </span>
                                          <span>•</span>
                                          <span>{session.time}</span>
                                        </div>
                                        <div className="text-xs" style={{ color: '#000000' }}>
                                          {session.expertName}
                                        </div>
                                      </div>
                                      <div className="flex-shrink-0">
                                        <div className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: '#3a3a3a', color: 'white' }}>
                                          {session.sessionType}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* My Schedule Box */}
                          <div className="rounded-4xl p-4 sm:p-6 shadow-lg h-[280px] overflow-y-auto scrollbar-hide" style={{ backgroundColor: '#fadde1' }}>
                            <h3 className="text-base sm:text-lg font-semibold mb-4" style={{ fontFamily: "'Rubik', sans-serif", color: '#000000' }}>
                              My Schedule
                            </h3>
                            <div className="space-y-3">
                              <div className="text-center py-8">
                                <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                <div className="text-gray-500 text-sm">No scheduled events</div>
                              </div>
                            </div>
                          </div>
                        </div>

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
                          } catch { }
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
                                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm cursor-pointer ${rescheduleModal.selectedSlot?.startTime === slot.startTime
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
                              style={{ backgroundColor: '#3a3a3a' }}
                            >
                              {rescheduleSubmitting ? 'Sending...' : 'Send request'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Modern Toast Notification */}
                    {showMessageToast && (
                      <div className="fixed top-6 right-6 z-50 flex items-center gap-3 text-white px-6 py-4 rounded-2xl shadow-2xl animate-fadeIn backdrop-blur-sm border border-white/20" style={{ backgroundColor: '#3a3a3a' }}>
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

















































































