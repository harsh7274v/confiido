"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, User, DollarSign, CheckCircle, AlertCircle, Phone, Mail, Video, Mic, MessageSquare, Users, Briefcase, Globe, MapPin as LocationIcon, UserCheck, ExternalLink, ChevronDown, ChevronUp, X } from "lucide-react";
import Image from "next/image";
import { bookingApi } from "../services/bookingApi";
import { availabilityApi } from "../services/availabilityApi";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useRouter } from "next/navigation";

interface Session {
  sessionId: string;
  expertId: string;
  expertUserId: string;
  expertEmail: string;
  sessionType: 'video' | 'audio' | 'chat' | 'in-person';
  duration: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  price: number;
  currency: string;
  notes?: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  rescheduleRequest?: {
    requestedBy: 'client' | 'expert';
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    requestedDate: string;
    requestedStartTime: string;
    requestedEndTime: string;
    requestedAt: string;
    respondedAt?: string;
    reason?: string;
    responseNote?: string;
  };
  rescheduleHistory?: Array<{
    updatedBy: 'client' | 'expert' | 'system';
    fromDate: string;
    fromStartTime: string;
    fromEndTime: string;
    toDate: string;
    toStartTime: string;
    toEndTime: string;
    updatedAt: string;
    note?: string;
  }>;
}

interface Client {
  _id: string;
  clientId?: string;
  clientUserId?: string;
  clientEmail?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  user_id?: string;
  avatar?: string;
  profession?: string;
  domain?: string;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
  bio?: string;
  category?: 'student' | 'working_professional';
  age?: number;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  whatsappNumber?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  createdAt?: string;
}

interface Booking {
  _id: string;
  clientId: Client;
  sessions: Session[];
  totalSessions: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface SlotOption {
  startTime: string;
  endTime: string;
  startDisplayTime: string;
  endDisplayTime: string;
}

const MentorBookings: React.FC = () => {
  const { user, loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set());
  const [expandedSessionBookings, setExpandedSessionBookings] = useState<Set<string>>(new Set());
  const [respondingAction, setRespondingAction] = useState<string | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<{
    bookingId: string;
    session: Session | null;
    date: string;
    note: string;
    selectedSlot: SlotOption | null;
  } | null>(null);
  const [mentorRescheduleSlots, setMentorRescheduleSlots] = useState<SlotOption[]>([]);
  const [mentorRescheduleSlotsLoading, setMentorRescheduleSlotsLoading] = useState(false);
  const [mentorRescheduleSlotsError, setMentorRescheduleSlotsError] = useState<string | null>(null);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const toggleBookingDetails = (bookingId: string) => {
    setExpandedBookings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  const toggleBookingSessions = (bookingId: string) => {
    setExpandedSessionBookings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  const fetchMentorRescheduleSlots = useCallback(async (sessionData: Session, targetDate: string, preferredStart?: string | null) => {
    if (!sessionData?.expertUserId || !targetDate) {
      setMentorRescheduleSlots([]);
      return;
    }
    setMentorRescheduleSlotsLoading(true);
    setMentorRescheduleSlotsError(null);
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
        sessionData.sessionId
      );
      const consecutiveSlots = response?.data?.consecutiveSlots || [];
      const options: SlotOption[] = consecutiveSlots
        .filter((slot: any) => slot.available)
        .map((slot: any) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          startDisplayTime: slot.startDisplayTime,
          endDisplayTime: slot.endDisplayTime
        }));
      setMentorRescheduleSlots(options);

      if (preferredStart) {
        const matching = options.find(slot => slot.startTime === preferredStart);
        if (matching) {
          setRescheduleModal(prev => prev ? { ...prev, selectedSlot: matching } : prev);
        }
      } else {
        setRescheduleModal(prev => prev ? { ...prev, selectedSlot: null } : prev);
      }
    } catch (err: any) {
      console.error('Error fetching mentor reschedule slots:', err);
      setMentorRescheduleSlots([]);
      setMentorRescheduleSlotsError(err?.response?.data?.error || 'Unable to load available slots');
    } finally {
      setMentorRescheduleSlotsLoading(false);
    }
  }, []);

  const handleRescheduleResponse = async (bookingId: string, sessionId: string, action: 'approve' | 'reject') => {
    const actionKey = `${sessionId}-${action}`;
    try {
      setRespondingAction(actionKey);
      await bookingApi.respondSessionReschedule(bookingId, sessionId, action);
      setToastMessage({
        type: 'success',
        message: action === 'approve' ? 'Reschedule approved and updated.' : 'Reschedule request declined.'
      });
      await fetchBookings(currentPage);
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        message: err?.response?.data?.error || err?.message || 'Failed to update reschedule request.'
      });
    } finally {
      setRespondingAction(null);
    }
  };

  const openMentorRescheduleModal = (bookingId: string, session: Session) => {
    const initialDate = formatDateInputValue(session.scheduledDate);
    setRescheduleModal({
      bookingId,
      session,
      date: initialDate,
      note: '',
      selectedSlot: null
    });
    setMentorRescheduleSlots([]);
    setMentorRescheduleSlotsError(null);
    fetchMentorRescheduleSlots(session, initialDate, session.startTime);
  };

  const closeMentorRescheduleModal = () => {
    if (rescheduleSubmitting) return;
    setRescheduleModal(null);
    setMentorRescheduleSlots([]);
    setMentorRescheduleSlotsError(null);
  };

  const handleMentorDateChange = (newDate: string) => {
    if (!rescheduleModal?.session) return;
    const sessionData = rescheduleModal.session;
    setRescheduleModal(prev => prev ? { ...prev, date: newDate, selectedSlot: null } : prev);
    setMentorRescheduleSlots([]);
    setMentorRescheduleSlotsError(null);
    fetchMentorRescheduleSlots(sessionData, newDate);
  };

  const handleMentorReschedule = async () => {
    if (!rescheduleModal?.session || !rescheduleModal.date || !rescheduleModal.selectedSlot) return;
    try {
      setRescheduleSubmitting(true);
      await bookingApi.mentorRescheduleSession(
        rescheduleModal.bookingId,
        rescheduleModal.session.sessionId,
        {
          scheduledDate: rescheduleModal.date,
          startTime: rescheduleModal.selectedSlot.startTime,
          reason: rescheduleModal.note?.trim() ? rescheduleModal.note.trim() : undefined
        }
      );
      setToastMessage({
        type: 'success',
        message: 'Session has been rescheduled.'
      });
      setRescheduleModal(null);
      setMentorRescheduleSlots([]);
      setMentorRescheduleSlotsError(null);
      await fetchBookings(currentPage);
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        message: err?.response?.data?.error || err?.message || 'Failed to reschedule session.'
      });
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  const fetchBookings = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        console.log('No user found, checking localStorage for token...');
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        // For development: try to fetch user data from token
        console.log('Token found, but no user object. This might be a development scenario.');
        throw new Error('User authentication required. Please log in again.');
      }

      const mentorId = user.user_id;
      if (!mentorId) {
        throw new Error('User ID not found. Please log in again.');
      }
      console.log('Fetching bookings for mentor:', mentorId);

      const result = await bookingApi.getMentorBookings(mentorId, page, 10);
      
      if (result.success) {
        console.log('📊 [MENTOR BOOKINGS] Raw API Response:', result.data);
        console.log('📊 [MENTOR BOOKINGS] Bookings Array:', result.data.bookings);
        setBookings(result.data.bookings);
        setTotalPages(result.data.pagination.pages);
        setCurrentPage(result.data.pagination.page);
      } else {
        throw new Error('Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('MentorBookings useEffect - user:', user, 'userLoading:', userLoading);
    if (user && !userLoading) {
      fetchBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

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

const formatDateInputValue = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const getRescheduleStatusClasses = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-50 border-green-200 text-green-700';
    case 'rejected':
      return 'bg-red-50 border-red-200 text-red-700';
    case 'pending':
      return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-600';
  }
};

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5 text-blue-600" />;
      case 'audio':
        return <Mic className="h-5 w-5 text-green-600" />;
      case 'chat':
        return <MessageSquare className="h-5 w-5 text-purple-600" />;
      case 'in-person':
        return <Users className="h-5 w-5 text-orange-600" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Video Call';
      case 'audio':
        return 'Audio Call';
      case 'chat':
        return 'Chat Session';
      case 'in-person':
        return 'In-Person Meeting';
      default:
        return type;
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'audio':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'chat':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'in-person':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'refunded':
        return <DollarSign className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };


  if (userLoading || loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600">Loading bookings...</p>
      </div>
    );
  }

  if (!user && !userLoading) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
        <p className="text-gray-600 mb-4">Please log in to view your bookings.</p>
        <button
          onClick={() => router.push('/login')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Bookings</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => fetchBookings()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  console.log('🎯 [MENTOR BOOKINGS] Component Render - Bookings:', bookings);
  console.log('🎯 [MENTOR BOOKINGS] Component Render - Bookings Length:', bookings.length);
  
  // Debug: Log the first booking's clientId structure
  if (bookings.length > 0) {
    console.log('🎯 [MENTOR BOOKINGS] First booking clientId structure:', bookings[0].clientId);
  }

  const paidBookings = bookings
    .map((b) => ({ ...b, sessions: b.sessions.filter((s) => s.paymentStatus === 'paid') }))
    .filter((b) => b.sessions.length > 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">All Bookings</h2>
            <p className="text-gray-600">View detailed information about all your bookings and sessions</p>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            toastMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {toastMessage.message}
        </div>
      )}

      {/* Bookings List */}
      {paidBookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
          <p className="text-gray-600">You don&apos;t have any paid bookings yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Showing {paidBookings.length} bookings
            </h3>
          </div>
          {paidBookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
              {/* User Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex items-start space-x-4">
                    <div className="relative w-20 h-20">
                      <Image
                        src={(booking.clientId.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${booking.clientId.firstName} ${booking.clientId.lastName}`).trimEnd()}
                        alt={`${booking.clientId.firstName} ${booking.clientId.lastName}`}
                        width={80}
                        height={80}
                        className="rounded-full object-cover border-4 border-white shadow-md"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-2">
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                        {booking.clientId.firstName && booking.clientId.lastName 
                          ? `${booking.clientId.firstName} ${booking.clientId.lastName}`
                          : `Client ${booking.clientId.user_id || booking.clientId.clientUserId || 'Unknown'}`
                        }
                      </h3>
                      </div>
                      
                      {/* Detailed User Information - Only show when expanded */}
                      {expandedBookings.has(booking._id) && (
                        <>
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <span className="truncate">
                            {booking.clientId.email || booking.clientId.clientEmail || 'Email not available'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="h-4 w-4 text-green-500" />
                          <span>ID: {booking.clientId.user_id || booking.clientId.clientUserId || 'N/A'}</span>
                        </div>
                        {booking.clientId.phoneNumber && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4 text-purple-500" />
                            <span>{booking.clientId.phoneNumber}</span>
                          </div>
                        )}
                        {booking.clientId.whatsappNumber && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MessageSquare className="h-4 w-4 text-green-500" />
                            <span>WhatsApp: {booking.clientId.whatsappNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* Professional Info */}
                      {(booking.clientId.profession || booking.clientId.domain || booking.clientId.category) && (
                        <div className="bg-white/50 rounded-lg p-3 mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <Briefcase className="h-4 w-4 mr-1" />
                            Professional Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {booking.clientId.profession && (
                              <div className="flex items-center space-x-2 text-gray-600">
                                <Briefcase className="h-3 w-3 text-blue-500" />
                                <span>{booking.clientId.profession}</span>
                              </div>
                            )}
                            {booking.clientId.domain && (
                              <div className="flex items-center space-x-2 text-gray-600">
                                <Globe className="h-3 w-3 text-green-500" />
                                <span>{booking.clientId.domain}</span>
                              </div>
                            )}
                            {booking.clientId.category && (
                              <div className="flex items-center space-x-2 text-gray-600">
                                <UserCheck className="h-3 w-3 text-purple-500" />
                                <span className="capitalize">{booking.clientId.category.replace('_', ' ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Location Info */}
                      {booking.clientId.location && (booking.clientId.location.city || booking.clientId.location.country) && (
                        <div className="bg-white/50 rounded-lg p-3 mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <LocationIcon className="h-4 w-4 mr-1" />
                            Location
                          </h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <LocationIcon className="h-3 w-3 text-red-500" />
                            <span>
                              {booking.clientId.location.city && booking.clientId.location.country 
                                ? `${booking.clientId.location.city}, ${booking.clientId.location.country}`
                                : booking.clientId.location.city || booking.clientId.location.country
                              }
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Bio */}
                      {booking.clientId.bio && (
                        <div className="bg-white/50 rounded-lg p-3 mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">About</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{booking.clientId.bio}</p>
                        </div>
                      )}

                      {/* Social Links */}
                      {booking.clientId.socialLinks && (booking.clientId.socialLinks.linkedin || booking.clientId.socialLinks.twitter || booking.clientId.socialLinks.website) && (
                        <div className="bg-white/50 rounded-lg p-3 mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Social Links</h4>
                          <div className="flex flex-wrap gap-2">
                            {booking.clientId.socialLinks.linkedin && (
                              <a 
                                href={booking.clientId.socialLinks.linkedin} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>LinkedIn</span>
                              </a>
                            )}
                            {booking.clientId.socialLinks.twitter && (
                              <a 
                                href={booking.clientId.socialLinks.twitter} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-600 transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>Twitter</span>
                              </a>
                            )}
                            {booking.clientId.socialLinks.website && (
                              <a 
                                href={booking.clientId.socialLinks.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-sm text-green-600 hover:text-green-800 transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>Website</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Status Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active Client
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {booking.sessions.length} Session{booking.sessions.length !== 1 ? 's' : ''}
                        </span>
                        {booking.clientId.age && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Age: {booking.clientId.age}
                          </span>
                        )}
                        {booking.clientId.gender && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                            {booking.clientId.gender.replace('-', ' ')}
                          </span>
                        )}
                      </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={() => toggleBookingDetails(booking._id)}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200 shadow-sm w-full sm:w-auto"
                  >
                    {expandedBookings.has(booking._id) ? (
                      <ChevronUp className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    )}
                    {expandedBookings.has(booking._id) ? 'Hide Details' : 'View Details'}
                  </button>
                  <button
                    onClick={() => toggleBookingSessions(booking._id)}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors duration-200 shadow-sm w-full sm:w-auto"
                  >
                    {expandedSessionBookings.has(booking._id) ? (
                      <ChevronUp className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    )}
                    {expandedSessionBookings.has(booking._id) ? 'Hide Sessions' : 'View Sessions'}
                  </button>
                </div>
              </div>

              {/* Sessions Details */}
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                  Session Details
                </h4>
                
                {/* Desktop Table View */}
                {expandedSessionBookings.has(booking._id) && (
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Session Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expert Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reschedule
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {booking.sessions.map((session) => {
                        const isApproving = respondingAction === `${session.sessionId}-approve`;
                        const isRejecting = respondingAction === `${session.sessionId}-reject`;
                        const pendingClientRequest = session.rescheduleRequest?.status === 'pending' && session.rescheduleRequest?.requestedBy === 'client';
                        return (
                        <tr key={session.sessionId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`p-2 rounded-lg border ${getSessionTypeColor(session.sessionType)} mr-3`}>
                                {getSessionTypeIcon(session.sessionType)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {session.notes || getSessionTypeLabel(session.sessionType)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {getSessionTypeLabel(session.sessionType)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(session.scheduledDate)}</div>
                            <div className="text-sm text-gray-500">
                              {formatTime(session.startTime)} - {formatTime(session.endTime)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{session.duration} minutes</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">₹{session.price}</div>
                            <div className="text-xs text-gray-500">{session.currency}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{session.expertEmail}</div>
                            <div className="text-sm text-gray-500">
                              Expert ID: {session.expertUserId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(session.paymentStatus)} shadow-sm`}>
                                {getPaymentStatusIcon(session.paymentStatus)}
                                <span className="ml-1 capitalize">{session.paymentStatus}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {session.rescheduleRequest ? (
                              <div className={`text-xs rounded-lg border px-3 py-2 ${getRescheduleStatusClasses(session.rescheduleRequest.status)} mb-3`}>
                                <p className="font-semibold">Request from {session.rescheduleRequest.requestedBy}</p>
                                <p className="mt-1">
                                  {formatDate(session.rescheduleRequest.requestedDate)} • {formatTime(session.rescheduleRequest.requestedStartTime)} - {formatTime(session.rescheduleRequest.requestedEndTime)}
                                </p>
                                {session.rescheduleRequest.reason && (
                                  <p className="mt-1 italic">{session.rescheduleRequest.reason}</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 mb-3">No reschedule requests</p>
                            )}
                            {pendingClientRequest && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                <button
                                  onClick={() => handleRescheduleResponse(booking._id, session.sessionId, 'approve')}
                                  disabled={isApproving}
                                  className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold disabled:opacity-60"
                                >
                                  {isApproving ? 'Approving...' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleRescheduleResponse(booking._id, session.sessionId, 'reject')}
                                  disabled={isRejecting}
                                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-60"
                                >
                                  {isRejecting ? 'Rejecting...' : 'Decline'}
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => openMentorRescheduleModal(booking._id, session)}
                              className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 w-full"
                            >
                              Reschedule session
                            </button>
                          </td>
                        </tr>
                      );
                      })}
                    </tbody>
                  </table>
                </div>
                )}

                {/* Mobile Card View */}
                {expandedSessionBookings.has(booking._id) && (
                <div className="md:hidden space-y-4">
                  {booking.sessions.map((session) => {
                    const isApproving = respondingAction === `${session.sessionId}-approve`;
                    const isRejecting = respondingAction === `${session.sessionId}-reject`;
                    const pendingClientRequest = session.rescheduleRequest?.status === 'pending' && session.rescheduleRequest?.requestedBy === 'client';
                    return (
                    <div key={session.sessionId} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg border ${getSessionTypeColor(session.sessionType)} mr-3`}>
                            {getSessionTypeIcon(session.sessionType)}
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">
                              {session.notes || getSessionTypeLabel(session.sessionType)}
                            </h5>
                            <p className="text-sm text-gray-500">{getSessionTypeLabel(session.sessionType)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(session.paymentStatus)} shadow-sm`}>
                            {getPaymentStatusIcon(session.paymentStatus)}
                            <span className="ml-1 capitalize">{session.paymentStatus}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Date & Time</p>
                          <p className="font-medium text-gray-900">{formatDate(session.scheduledDate)}</p>
                          <p className="text-gray-600">{formatTime(session.startTime)} - {formatTime(session.endTime)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Duration</p>
                          <p className="font-medium text-gray-900">{session.duration} minutes</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Amount</p>
                          <p className="font-medium text-gray-900">₹{session.price}</p>
                          <p className="text-gray-600 text-xs">{session.currency}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Expert Details</p>
                          <p className="font-medium text-gray-900">{session.expertEmail}</p>
                          <p className="text-gray-600 text-xs">ID: {session.expertUserId}</p>
                        </div>
                      </div>
                      {session.rescheduleRequest && (
                        <div className={`mt-3 text-xs rounded-lg border px-3 py-2 ${getRescheduleStatusClasses(session.rescheduleRequest.status)}`}>
                          <p className="font-semibold">Reschedule ({session.rescheduleRequest.requestedBy})</p>
                          <p className="mt-1">
                            {formatDate(session.rescheduleRequest.requestedDate)} • {formatTime(session.rescheduleRequest.requestedStartTime)} - {formatTime(session.rescheduleRequest.requestedEndTime)}
                          </p>
                          {session.rescheduleRequest.reason && (
                            <p className="mt-1 italic">{session.rescheduleRequest.reason}</p>
                          )}
                        </div>
                      )}
                      {pendingClientRequest && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => handleRescheduleResponse(booking._id, session.sessionId, 'approve')}
                            disabled={isApproving}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold disabled:opacity-60"
                          >
                            {isApproving ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleRescheduleResponse(booking._id, session.sessionId, 'reject')}
                            disabled={isRejecting}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-60"
                          >
                            {isRejecting ? 'Declining...' : 'Decline'}
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => openMentorRescheduleModal(booking._id, session)}
                        className="mt-3 w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Reschedule session
                      </button>
                    </div>
                  );
                  })}
                </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

          {/* Pagination */}
          {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
                <button
            onClick={() => fetchBookings(currentPage - 1)}
                  disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
          
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
          
                <button
            onClick={() => fetchBookings(currentPage + 1)}
                  disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
      )}
      {rescheduleModal?.session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={closeMentorRescheduleModal}
              disabled={rescheduleSubmitting}
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Reschedule Session</h3>
            <p className="text-sm text-gray-500 mb-4">
              Pick a new slot for this session. The client will be notified automatically.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New date</label>
                <input
                  type="date"
                  value={rescheduleModal.date}
                  min={formatDateInputValue(new Date().toISOString())}
                  onChange={(e) => handleMentorDateChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Available slots</label>
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => rescheduleModal.session && fetchMentorRescheduleSlots(rescheduleModal.session, rescheduleModal.date, rescheduleModal.selectedSlot?.startTime || null)}
                  >
                    Refresh
                  </button>
                </div>
                <div className="border border-gray-200 rounded-xl max-h-56 overflow-y-auto p-2">
                  {mentorRescheduleSlotsLoading ? (
                    <div className="py-6 text-center text-sm text-gray-500">Loading available slots...</div>
                  ) : mentorRescheduleSlotsError ? (
                    <div className="py-4 text-sm text-red-600">{mentorRescheduleSlotsError}</div>
                  ) : mentorRescheduleSlots.length === 0 ? (
                    <div className="py-4 text-sm text-gray-500">No slots available for this date.</div>
                  ) : (
                    <div className="space-y-2">
                      {mentorRescheduleSlots.map((slot) => (
                        <label
                          key={slot.startTime}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                            rescheduleModal.selectedSlot?.startTime === slot.startTime
                              ? 'border-blue-600 bg-blue-50'
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
                            className="h-4 w-4 text-blue-600"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Note to client (optional)</label>
                <textarea
                  rows={3}
                  value={rescheduleModal.note}
                  onChange={(e) => setRescheduleModal(prev => prev ? { ...prev, note: e.target.value } : prev)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  placeholder="Share the reason for the change or preparation notes."
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={closeMentorRescheduleModal}
                disabled={rescheduleSubmitting}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleMentorReschedule}
                disabled={rescheduleSubmitting || !rescheduleModal.date || !rescheduleModal.selectedSlot}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {rescheduleSubmitting ? 'Rescheduling...' : 'Confirm reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorBookings;