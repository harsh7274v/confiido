"use client";

import React from "react";
import { Calendar, Clock, User, Star, X } from "lucide-react";
import bookingApi from "../services/bookingApi";

interface Session {
  id: string;
  bookingId: string;
  sessionId: string;
  title: string;
  date: string;
  time: string;
  expert: string;
  expertUserId: string;
  duration: number;
  status: "Completed" | "Upcoming";
  pointsEarned: number;
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
              // Strictly compare DATES. Only move to completed if session date is in the past (yesterday or earlier).
              const sessionDate = new Date(session.scheduledDate);
              const today = new Date();

              // Normalize to midnight for date-only comparison
              sessionDate.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);

              const isCompleted = session.status === 'completed' || sessionDate < today;

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
                expert: expertName,
                expertUserId: session.expertId?.userId?._id,
                duration: session.duration || 60,
                status: isCompleted ? 'Completed' : 'Upcoming',
                pointsEarned: isCompleted ? 50 : 0
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
        const response = await bookingApi.getAvailableConsecutiveSlots(
          selectedSession.expertUserId,
          rescheduleDate,
          selectedSession.duration
        );

        if (response.success) {
          setAvailableSlots(response.data);
        }
      } catch (error) {
        console.error("Error fetching slots:", error);
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
    } catch (error) {
      console.error("Error rescheduling:", error);
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
                <div key={session.id} className="rounded-3xl p-4 flex flex-col gap-2 shadow-sm relative group" style={{ backgroundColor: '#f4acb7' }}>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" style={{ color: '#000000' }} />
                    <span className="font-medium" style={{ color: '#000000' }}>{session.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#000000' }}>
                    <Clock className="h-4 w-4" />
                    {session.date} at {session.time}
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#000000' }}>
                    <User className="h-4 w-4" />
                    Expert: {session.expert}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm mt-1">
                    <span className={session.status === "Completed" ? "text-green-700 font-medium" : "text-blue-700 font-medium"}>{session.status}</span>
                    {session.status === "Upcoming" && (
                      <button
                        onClick={() => handleOpenReschedule(session)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/50 hover:bg-white text-gray-800 transition-colors border border-black/5"
                        style={{ fontFamily: "'Rubik', sans-serif" }}
                      >
                        Request Reschedule
                      </button>
                    )}
                    {session.status === "Completed" && (
                      <span className="flex items-center gap-1 text-yellow-700 font-medium">
                        <Star className="h-4 w-4" />
                        +{session.pointsEarned} points
                      </span>
                    )}
                  </div>
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
                        {availableSlots.map(slot => (
                          <button
                            key={slot}
                            onClick={() => setRescheduleTime(slot)}
                            className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-all ${rescheduleTime === slot
                              ? 'bg-[#3a3a3a] text-white border-[#3a3a3a]'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                              }`}
                          >
                            {slot}
                          </button>
                        ))}
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
