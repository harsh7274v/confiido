"use client";

import React from "react";
import { Calendar, Clock, User, Star, X, Mail, ExternalLink } from "lucide-react";
import bookingApi from "../services/bookingApi";

interface Session {
  id: string;
  bookingId: string;
  sessionId: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  expert: string;
  expertEmail: string;
  expertUserId: string;
  duration: number;
  status: "Completed" | "Upcoming";
  pointsEarned: number;
  sessionType: string;
  price: number;
  currency: string;
  notes?: string;
  meetingLink?: string;
  paymentStatus: string;
  rescheduleRequest?: {
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    requestedBy: 'client' | 'expert';
    requestedDate: string;
    requestedStartTime: string;
    requestedEndTime: string;
    reason?: string;
    responseNote?: string;
  };
}

export default function SessionsPage() {
  const [filter, setFilter] = React.useState<'upcoming' | 'completed'>('upcoming');
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Reschedule Modal State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = React.useState(false);
  const [selectedSession, setSelectedSession] = React.useState<Session | null>(null);
  const [rescheduleDate, setRescheduleDate] = React.useState("");
  const [rescheduleTime, setRescheduleTime] = React.useState("");
  const [availableSlots, setAvailableSlots] = React.useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [rescheduleReason, setRescheduleReason] = React.useState("");
  const [submittingReschedule, setSubmittingReschedule] = React.useState(false);

  React.useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Please log in to view your sessions');
          setLoading(false);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/user?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }

        const data = await response.json();

        if (data.success && data.data.bookings) {
          // Transform backend data to match our component structure
          const transformedSessions: Session[] = [];

          data.data.bookings.forEach((booking: any) => {
            booking.sessions.forEach((session: any) => {
              // Filter: Only show PAID sessions
              if (session.paymentStatus !== 'paid') return;

              // Determine if session is upcoming or completed
              // A session is completed only if:
              // 1. It's explicitly marked as 'completed' in the backend, OR
              // 2. The current time is past the session's end time (date + endTime)

              const now = new Date();

              // Create a datetime object combining scheduledDate and endTime
              const sessionEndDateTime = new Date(session.scheduledDate);
              const [endHour, endMinute] = (session.endTime || '23:59').split(':').map(Number);
              sessionEndDateTime.setHours(endHour, endMinute, 0, 0);

              // Debug logging
              console.log('🔍 Session Status Debug:', {
                expert: session.expertId?.userId
                  ? `${session.expertId.userId.firstName || ''} ${session.expertId.userId.lastName || ''}`.trim()
                  : 'Expert',
                sessionId: session.sessionId || session._id,
                scheduledDate: session.scheduledDate,
                scheduledDateFormatted: new Date(session.scheduledDate).toLocaleDateString('en-US'),
                startTime: session.startTime,
                endTime: session.endTime,
                backendStatus: session.status,
                sessionEndDateTime: sessionEndDateTime.toISOString(),
                sessionEndDateTimeLocal: sessionEndDateTime.toLocaleString('en-US'),
                currentTime: now.toISOString(),
                currentTimeLocal: now.toLocaleString('en-US'),
                isPastEndTime: now > sessionEndDateTime,
                willBeCompleted: now > sessionEndDateTime
              });

              // IMPORTANT: Prioritize time-based logic over backend status
              // A session is ONLY completed if the current time is past the session's end time
              // This prevents future sessions from being incorrectly marked as completed
              const isCompleted = now > sessionEndDateTime;

              // Get expert name
              const expertName = session.expertId?.userId
                ? `${session.expertId.userId.firstName || ''} ${session.expertId.userId.lastName || ''}`.trim()
                : 'Expert';

              transformedSessions.push({
                id: session.sessionId?.toString() || session._id?.toString() || Math.random().toString(),
                bookingId: booking._id,
                sessionId: session._id,
                title: session.expertId?.title || 'Mentorship Session',
                date: new Date(session.scheduledDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }),
                time: session.startTime || '',
                endTime: session.endTime || '',
                expert: expertName,
                expertEmail: session.expertEmail || session.expertId?.userId?.email || '',
                expertUserId: session.expertUserId || session.expertId?.userId?.user_id,
                duration: session.duration || 60,
                status: isCompleted ? 'Completed' : 'Upcoming',
                pointsEarned: isCompleted ? 50 : 0,
                sessionType: session.sessionType || 'video',
                price: session.price || 0,
                currency: session.currency || 'INR',
                notes: session.notes || '',
                meetingLink: session.meetingLink || '',
                paymentStatus: session.paymentStatus || 'pending',
                rescheduleRequest: session.rescheduleRequest
              });
            });
          });

          setSessions(transformedSessions);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load sessions');
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Fetch available slots when date changes
  React.useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedSession || !rescheduleDate) return;

      try {
        setLoadingSlots(true);

        console.log('🔍 Fetching slots with params:', {
          expertUserId: selectedSession.expertUserId,
          rescheduleDate,
          duration: selectedSession.duration
        });

        const response = await bookingApi.getAvailableConsecutiveSlots(
          selectedSession.expertUserId,
          rescheduleDate,
          selectedSession.duration
        );

        console.log('✅ Slots response:', response);

        if (response.success) {
          setAvailableSlots(response.data.consecutiveSlots || response.data);
        }
      } catch (error: any) {
        console.error("❌ Error fetching slots:", error);
        console.error("Error response:", error.response?.data);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [rescheduleDate, selectedSession]);

  const handleOpenReschedule = (session: Session) => {
    setSelectedSession(session);
    setIsRescheduleModalOpen(true);
    setRescheduleDate("");
    setRescheduleTime("");
    setRescheduleReason("");
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedSession || !rescheduleDate || !rescheduleTime) return;

    try {
      setSubmittingReschedule(true);

      console.log('🔍 Submitting reschedule request:', {
        bookingId: selectedSession.bookingId,
        sessionId: selectedSession.sessionId,
        payload: {
          scheduledDate: rescheduleDate,
          startTime: rescheduleTime,
          reason: rescheduleReason
        }
      });

      await bookingApi.requestSessionReschedule(
        selectedSession.bookingId,
        selectedSession.sessionId,
        {
          scheduledDate: rescheduleDate,
          startTime: rescheduleTime,
          reason: rescheduleReason
        }
      );

      // Close modal and maybe refresh or show success
      setIsRescheduleModalOpen(false);
      alert("Reschedule request sent successfully!");
      // Ideally refresh sessions here
    } catch (error: any) {
      console.error("❌ Error rescheduling:", error);
      console.error("Error response:", error.response?.data);
      alert("Failed to request reschedule");
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'upcoming') return session.status === 'Upcoming';
    return session.status === 'Completed';
  });

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: '#fff0f3' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2" style={{ color: '#4A4458', fontFamily: "'Rubik', sans-serif" }}>
            <Calendar className="h-7 w-7" style={{ color: '#4A4458' }} />
            Sessions
          </h1>
          <p className="text-gray-700 mb-4" style={{ fontFamily: "'Rubik', sans-serif" }}>View your upcoming and completed sessions. Earn points for every session!</p>

          {/* Filter Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('upcoming')}
              className="px-6 py-2.5 rounded-full flex items-center gap-2 transition-all hover:opacity-90"
              style={{
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                fontFamily: "'Rubik', sans-serif",
                fontWeight: '500'
              }}
            >
              Upcoming
              <div
                className="w-3 h-3 rounded-full transition-all"
                style={{
                  backgroundColor: filter === 'upcoming' ? '#22c55e' : 'transparent',
                  border: filter === 'upcoming' ? 'none' : '2px solid #ffffff'
                }}
              />
            </button>
            <button
              onClick={() => setFilter('completed')}
              className="px-6 py-2.5 rounded-full flex items-center gap-2 transition-all hover:opacity-90"
              style={{
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                fontFamily: "'Rubik', sans-serif",
                fontWeight: '500'
              }}
            >
              Completed
              <div
                className="w-3 h-3 rounded-full transition-all"
                style={{
                  backgroundColor: filter === 'completed' ? '#22c55e' : 'transparent',
                  border: filter === 'completed' ? 'none' : '2px solid #ffffff'
                }}
              />
            </button>
          </div>
        </div>
        <div className="rounded-4xl p-6 shadow-lg" style={{ backgroundColor: '#fadde1' }}>
          {loading ? (
            <div className="text-center py-8" style={{ color: '#000000', fontFamily: "'Rubik', sans-serif" }}>
              Loading sessions...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-700" style={{ fontFamily: "'Rubik', sans-serif" }}>
              {error}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#000000', fontFamily: "'Rubik', sans-serif" }}>
              No {filter} sessions found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSessions.map((session) => (
                <div key={session.id} className="rounded-3xl p-5 flex flex-col gap-3 shadow-sm relative group" style={{ backgroundColor: '#f4acb7' }}>
                  {/* Session Type and Title */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-base uppercase" style={{ color: '#000000' }}>
                          {session.sessionType.toUpperCase()} session with {session.expert}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#000000' }}>
                    <Calendar className="h-4 w-4" />
                    <span>{session.date}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm" style={{ color: '#000000' }}>
                    <Clock className="h-4 w-4" />
                    <span>{session.time} - {session.endTime}</span>
                  </div>

                  {/* Session Type Badge */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-3 py-1 rounded-full bg-white/50 font-medium" style={{ color: '#000000' }}>
                      {session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)}
                    </span>
                  </div>

                  {/* Expert Info */}
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#000000' }}>
                    <User className="h-4 w-4" />
                    <span>{session.expert}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm" style={{ color: '#000000' }}>
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{session.expertEmail}</span>
                  </div>

                  {/* Notes/Service */}
                  {session.notes && (
                    <div className="text-sm" style={{ color: '#000000' }}>
                      <span className="font-medium">Notes:</span>
                      <div className="mt-1">{session.notes}</div>
                    </div>
                  )}

                  {/* Status and Payment */}
                  <div className="flex items-center gap-2 text-sm mt-2">
                    <span className={session.status === "Completed" ? "text-green-700 font-medium" : "text-blue-700 font-medium"}>
                      {session.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      {session.paymentStatus.charAt(0).toUpperCase() + session.paymentStatus.slice(1)}
                    </span>
                  </div>

                  {/* Meeting Link and Reschedule for Upcoming Sessions */}
                  {session.status === "Upcoming" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {session.meetingLink && (
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          <Star className="h-4 w-4" />
                          Join Meeting
                        </a>
                      )}
                      {session.rescheduleRequest?.status !== 'pending' && (
                        <button
                          onClick={() => handleOpenReschedule(session)}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-white/50 hover:bg-white text-gray-800 transition-colors border border-black/10"
                          style={{ fontFamily: "'Rubik', sans-serif" }}
                        >
                          Request reschedule
                        </button>
                      )}
                    </div>
                  )}

                  {/* Price */}
                  <div className="text-sm font-medium" style={{ color: '#000000' }}>
                    Price: {session.currency} {session.price}
                  </div>

                  {/* Reschedule Request Status */}
                  {session.rescheduleRequest && session.status === "Upcoming" && (
                    <div className={`mt-3 p-3 rounded-lg border text-sm ${session.rescheduleRequest.status === 'pending'
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                      : session.rescheduleRequest.status === 'approved'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : session.rescheduleRequest.status === 'rejected'
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-gray-50 border-gray-200 text-gray-800'
                      }`}>
                      <p className="font-semibold mb-1">
                        {session.rescheduleRequest.status === 'pending' && '⏳ Reschedule Request Pending'}
                        {session.rescheduleRequest.status === 'approved' && '✅ Reschedule Approved'}
                        {session.rescheduleRequest.status === 'rejected' && '❌ Reschedule Request Declined'}
                        {session.rescheduleRequest.status === 'cancelled' && '🚫 Reschedule Request Cancelled'}
                      </p>
                      <p className="text-xs mt-1">
                        Requested: {new Date(session.rescheduleRequest.requestedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })} at {session.rescheduleRequest.requestedStartTime} - {session.rescheduleRequest.requestedEndTime}
                      </p>
                      {session.rescheduleRequest.status === 'rejected' && session.rescheduleRequest.responseNote && (
                        <p className="text-xs mt-2 italic">
                          Mentor's note: {session.rescheduleRequest.responseNote}
                        </p>
                      )}
                      {session.rescheduleRequest.status === 'pending' && (
                        <p className="text-xs mt-2">
                          Waiting for mentor approval...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Completed Session Points */}
                  {session.status === "Completed" && (
                    <div className="flex items-center gap-2 text-sm mt-2 pt-2 border-t border-black/10">
                      <span className="flex items-center gap-1 text-yellow-700 font-medium">
                        <Star className="h-4 w-4" />
                        +{session.pointsEarned} points
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reschedule Modal */}
        {isRescheduleModalOpen && selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="rounded-3xl p-6 shadow-2xl w-full max-w-md border border-white/50" style={{ backgroundColor: '#fff0f3' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#4A4458]" style={{ fontFamily: "'Rubik', sans-serif" }}>Reschedule Session</h3>
                <button
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: "'Rubik', sans-serif" }}>New Date</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3a3a3a] bg-white/50"
                  />
                </div>

                {rescheduleDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: "'Rubik', sans-serif" }}>Available Times</label>
                    {loadingSlots ? (
                      <div className="text-center py-2 text-sm text-gray-500">Checking availability...</div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                        {availableSlots.map((slot: any, index: number) => {
                          const timeValue = typeof slot === 'string' ? slot : slot.startTime;
                          const displayTime = typeof slot === 'string' ? slot : (slot.startDisplayTime || slot.startTime);

                          return (
                            <button
                              key={`${timeValue}-${index}`}
                              onClick={() => setRescheduleTime(timeValue)}
                              className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-all ${rescheduleTime === timeValue
                                ? 'bg-[#3a3a3a] text-white border-[#3a3a3a]'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                }`}
                            >
                              {displayTime}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-sm text-gray-500">No slots available for this date</div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: "'Rubik', sans-serif" }}>Reason (Optional)</label>
                  <textarea
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3a3a3a] bg-white/50 text-sm"
                    rows={2}
                    placeholder="Why do you need to reschedule?"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsRescheduleModalOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRescheduleSubmit}
                    disabled={submittingReschedule || !rescheduleDate || !rescheduleTime}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#3a3a3a] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReschedule ? 'Sending...' : 'Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
