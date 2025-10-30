import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Select, SelectItem } from "./ui/Select";
import { availabilityApi } from '../services/availabilityApi';
import { expertsApi, Expert } from '../services/expertsApi';
import { bookingApi, BookingRequest } from '../services/bookingApi';
import { useTimeout } from '../contexts/TimeoutContext';
import { Calendar, Clock, User, Briefcase, X, Sparkles, RefreshCw } from 'lucide-react';

const services = [
  { name: '1:1 Career Guidance', duration: '30 min' },
  { name: 'Mock Interview', duration: '60 min' },
  { name: 'Resume Review', duration: '30 min' },
  { name: 'Public Speaking', duration: '60 min' },
];

const BookSessionPopup: React.FC<{ onClose: () => void; onGoToPayments?: (bookingId?: string) => void }> = ({ onClose, onGoToPayments }) => {
  const [service, setService] = useState<string | undefined>(undefined);
  const [mentor, setMentor] = useState<string | undefined>(undefined);
  const [date, setDate] = useState('');
  const [fromTime, setFromTime] = useState<string | undefined>(undefined);
  const [toTime, setToTime] = useState<string | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<Array<{ time: string; displayTime: string; available: boolean }>>([]);
  const [consecutiveSlots, setConsecutiveSlots] = useState<Array<{ 
    startTime: string; 
    endTime: string; 
    startDisplayTime: string; 
    endDisplayTime: string; 
    duration: number; 
    available: boolean 
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [mentors, setMentors] = useState<Expert[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  // Use the timeout context
  const { addTimeout } = useTimeout();
  const router = useRouter();

  // Get the duration for the selected service
  const getSelectedServiceDuration = () => {
    const selectedService = services.find(s => s.name === service);
    return selectedService ? selectedService.duration : '';
  };

  // Get the duration in minutes for the selected service
  const getSelectedServiceDurationMinutes = () => {
    const selectedService = services.find(s => s.name === service);
    if (selectedService) {
      const duration = selectedService.duration === '30 min' ? 30 : 60;
      console.log(`🔍 [FRONTEND] Service: ${service}, Duration: ${selectedService.duration}, Minutes: ${duration}`);
      return duration;
    }
    console.log(`❌ [FRONTEND] Service not found: ${service}`);
    return 0;
  };

  // Fetch mentors on component mount
  useEffect(() => {
    fetchMentors();
  }, []);

  // Fetch available slots when mentor or date changes
  useEffect(() => {
    if (mentor && date) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
      setConsecutiveSlots([]);
      setFromTime(undefined);
      setToTime(undefined);
    }
    // Clear any previous errors and info when selection changes
    setError('');
    setInfo('');
  }, [mentor, date]);

  // Clear error when service changes
  useEffect(() => {
    setError('');
    setInfo('');
    setFromTime(undefined);
    setToTime(undefined);
    // Show info message about service change
    if (service) {
      setInfo(`Service changed to ${service}. Please reselect your time slots.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  // Clear error when time selections change
  useEffect(() => {
    setError('');
    setInfo('');
  }, [fromTime, toTime]);

  const fetchMentors = async () => {
    setMentorsLoading(true);
    try {
      const response = await expertsApi.getFeaturedExperts();
      if (response.success) {
        setMentors(response.data.experts);
      }
    } catch (error) {
      console.error('❌ Error fetching mentors:', error);
    } finally {
      setMentorsLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!mentor || !date) return;
    const selectedMentor = mentors.find(m => `${m.userId.firstName} ${m.userId.lastName}` === mentor);
    if (!selectedMentor) {
      setError('Mentor not found');
      setAvailableSlots([]);
      setConsecutiveSlots([]);
      return;
    }
    const mentorUserId = selectedMentor.user_id;
    console.log('🔍 Fetching slots for mentor:', mentor, 'User ID:', mentorUserId);
    try {
      // Fetch individual 15-minute slots for display
      const response = await availabilityApi.getMentorSlotsForDateByUserId(mentorUserId, date);
      if (response.success) {
        setAvailableSlots(response.data.availableSlots);
        console.log('✅ Available slots fetched:', response.data.availableSlots);
      } else {
        setError('Failed to fetch available slots');
        setAvailableSlots([]);
      }

      // If service is selected, also fetch consecutive slots for that duration
      if (service) {
        const duration = getSelectedServiceDurationMinutes();
        console.log(`🔍 [FRONTEND] Fetching consecutive slots for ${duration} minutes`);
        const consecutiveResponse = await availabilityApi.getConsecutiveSlotsByUserId(mentorUserId, date, duration);
        if (consecutiveResponse.success) {
          setConsecutiveSlots(consecutiveResponse.data.consecutiveSlots);
          console.log('✅ Consecutive slots fetched:', consecutiveResponse.data.consecutiveSlots);
          console.log(`📊 [FRONTEND] Found ${consecutiveResponse.data.consecutiveSlots.length} consecutive slots for ${duration}min`);
        } else {
          console.log('❌ Failed to fetch consecutive slots');
          setConsecutiveSlots([]);
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('❌ Error fetching available slots:', err);
      setError('Failed to fetch available slots. Please try again.');
      setAvailableSlots([]);
      setConsecutiveSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch slots when mentor, date, or service changes
  useEffect(() => {
    if (mentor && date) {
      fetchAvailableSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentor, date, service]);

  // Generate time slots for the "To" dropdown based on selected "From" time
  const generateToTimeSlots = () => {
    if (!fromTime || !availableSlots.length || !service) {
      console.log('❌ generateToTimeSlots: Missing dependencies', { fromTime, availableSlotsLength: availableSlots.length, service });
      return [];
    }
    
    const fromTimeIndex = availableSlots.findIndex(slot => slot.time === fromTime);
    if (fromTimeIndex === -1) {
      console.log('❌ generateToTimeSlots: fromTime not found in availableSlots', { fromTime, availableSlots });
      return [];
    }
    
    // Get slots after the selected "from" time
    const remainingSlots = availableSlots.slice(fromTimeIndex + 1);
    console.log('🔍 generateToTimeSlots: remainingSlots', remainingSlots);
    
    // Filter out slots that would result in invalid durations AND only include available slots
    const validSlots = remainingSlots.filter(slot => {
      // First check if the slot is available
      if (!slot.available) {
        console.log(`🔒 Slot ${slot.time} is not available (already booked)`);
        return false;
      }
      
      const fromTimeObj = new Date(`2000-01-01T${fromTime}:00`);
      const toTimeObj = new Date(`2000-01-01T${slot.time}:00`);
      const durationMinutes = (toTimeObj.getTime() - fromTimeObj.getTime()) / (1000 * 60);
      
      // Check if duration exactly matches the selected service
      const serviceDurationMinutes = getSelectedServiceDurationMinutes();
      const isValid = durationMinutes === serviceDurationMinutes;
      console.log(`⏱️ Slot ${fromTime} to ${slot.time}: ${durationMinutes}min, expected: ${serviceDurationMinutes}min, valid: ${isValid}`);
      return isValid;
    });
    
    console.log('✅ generateToTimeSlots: validSlots', validSlots);
    return validSlots;
  };

  // Use useEffect to recalculate toTimeSlots when dependencies change
  useEffect(() => {
    console.log('🔄 useEffect: Recalculating toTimeSlots', { fromTime, availableSlotsLength: availableSlots.length, service });
    const slots = generateToTimeSlots();
    console.log('✅ useEffect: Updated toTimeSlots', slots);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromTime, availableSlots, service]);



  // Handle booking submission
  const handleBookingSubmit = async () => {
    if (!service || !mentor || !date || !fromTime || !toTime) {
      setError('Please fill in all required fields');
      return;
    }

    // Check if selected consecutive slot is still available
    const selectedConsecutiveSlot = consecutiveSlots.find(slot => 
      slot.startTime === fromTime && slot.endTime === toTime
    );
    
    if (!selectedConsecutiveSlot) {
      setError('The selected time slot is no longer available. Please select a different time slot.');
      return;
    }

    // Validate slot duration matches service duration
    const fromTimeObj = new Date(`2000-01-01T${fromTime}:00`);
    const toTimeObj = new Date(`2000-01-01T${toTime}:00`);
    const durationMinutes = Math.round((toTimeObj.getTime() - fromTimeObj.getTime()) / (1000 * 60));
    
    // Check if "To" time is after "From" time
    if (durationMinutes <= 0) {
      setError('Please check slot duration. The end time must be after the start time.');
      return;
    }
    
    const selectedService = services.find(s => s.name === service);
    if (selectedService) {
      const serviceDurationMinutes = selectedService.duration === '30 min' ? 30 : 60;
      
      if (durationMinutes !== serviceDurationMinutes) {
        const expectedDuration = getSelectedServiceDuration();
        setError(`Please check slot duration. The selected time slot (${durationMinutes} min) must match the service duration (${expectedDuration}).`);
        return;
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Find the selected mentor's expert ID
      const selectedMentor = mentors.find(m => `${m.userId.firstName} ${m.userId.lastName}` === mentor);
      
      if (!selectedMentor) {
        setError('Mentor not found');
        return;
      }



      // Duration is already calculated above for validation

      // Determine session type based on service
      let sessionType: 'video' | 'audio' | 'chat' | 'in-person' = 'video';
      if (service.includes('Mock Interview')) {
        sessionType = 'video';
      } else if (service.includes('Resume Review')) {
        sessionType = 'chat';
      } else if (service.includes('Public Speaking')) {
        sessionType = 'video';
      } else {
        sessionType = 'video'; // Default to video
      }

      // Prepare booking data
      // Note: selectedMentor._id is the User ID, which is what the backend expects
      const bookingData: BookingRequest = {
        expertId: selectedMentor._id, // This is the User ID
        sessionType,
        duration: durationMinutes,
        scheduledDate: date,
        startTime: fromTime,
        notes: `Service: ${service}`
      };



      // Create the booking
      const response = await bookingApi.createBooking(bookingData);
      
      if (response.success) {
        setBookingSuccess(true);
        
        // Add timeout to localStorage for persistence
        if (response.data.booking && response.data.session) {
          addTimeout(
            response.data.booking._id,
            response.data.session.sessionId,
            response.data.session.timeoutAt
          );
        }
        
        // Show success briefly then redirect to payments page
        setTimeout(() => {
          try { onClose(); } catch (e) {
            console.error('Error closing popup:', e);
          }
          const bookingId = response.data?.booking?._id;
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('dashboard_redirect_view', 'payments');
              if (bookingId) localStorage.setItem('dashboard_target_bookingId', bookingId);
            }
          } catch {}
          if (onGoToPayments) {
            onGoToPayments(bookingId);
          } else {
            router.push('/dashboard');
          }
        }, 1500);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; message?: string } } };
      console.error('❌ [FRONTEND] Error creating booking:', error);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show success message
  if (bookingSuccess) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-md">
        <div className="relative w-full max-w-sm animate-popup-in bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-600 mb-4">Booking Successful!</h2>
          <p className="text-gray-600 mb-4">Your session has been booked successfully. You will receive a confirmation email shortly.</p>
          
          {/* Payment Reminder */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-yellow-800">Payment Required</span>
            </div>
            <p className="text-sm text-yellow-600">
              Please complete payment within 5 minutes to confirm your booking
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
      <div className="relative w-full max-w-sm animate-popup-in" style={{ maxWidth: '35vw', width: '90%', minWidth: '320px' }}>
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200" style={{ maxHeight: '90vh' }}>
          {/* Modern Header with Gradient */}
          <div className="relative bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl shadow-lg" style={{ background: '#3E5F44' }}>
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                  Book a Session
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Schedule your personalized session</p>
              </div>
            </div>
            <button
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all duration-200"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto hide-scrollbar" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            <div className="space-y-4">
              {/* Service Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  Select the Service
                </label>
                <Select value={service} onValueChange={setService} placeholder="Select a service">
                  {services.map(s => (
                    <SelectItem key={s.name} value={s.name} className="text-base">{s.name}</SelectItem>
                  ))}
                </Select>
              </div>

              {/* Duration Info */}
              {service && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-sm font-medium text-blue-800 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duration: {getSelectedServiceDuration()}
                  </span>
                </div>
              )}

              {/* Mentor Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <User className="h-4 w-4 text-gray-500" />
                  Select Mentor
                </label>
                <Select value={mentor} onValueChange={setMentor} placeholder={mentorsLoading ? 'Loading mentors...' : 'Select a mentor'}>
                  {mentors.map(m => (
                    <SelectItem key={m._id} value={`${m.userId.firstName} ${m.userId.lastName}`} className="text-base">
                      <div className="flex flex-col">
                        <span className="font-semibold">{m.userId.firstName} {m.userId.lastName}</span>
                        <span className="text-xs text-gray-600">{m.title}</span>
                        <span className="text-xs text-gray-500">{m.expertise.join(', ')}</span>
                        <span className={`text-xs ${m.hasAvailability ? 'text-green-600' : 'text-orange-600'}`}>
                          {m.hasAvailability ? '✓ Available' : '⚠ No availability set'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Select Date
                </label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 hover:border-gray-400" 
                />
              </div>
              
              {/* Show available slots info */}
              {mentor && date && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Availability Status
                    </span>
                    <button
                      onClick={fetchAvailableSlots}
                      disabled={loading}
                      className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                      {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                  {loading ? (
                    <span className="text-sm text-gray-600">Loading available slots...</span>
                  ) : error ? (
                    <span className="text-sm text-red-600">{error}</span>
                  ) : availableSlots.length > 0 ? (
                    <div className="space-y-1">
                      <span className="text-sm text-green-600">
                        ✅ {availableSlots.filter(slot => slot.available).length} individual slots available on {new Date(date).toLocaleDateString()}
                      </span>
                      {availableSlots.some(slot => !slot.available) && (
                        <span className="text-sm text-red-600 block">
                          🔒 {availableSlots.filter(slot => !slot.available).length} slots already booked
                        </span>
                      )}
                      {service && consecutiveSlots.length > 0 && (
                        <span className="text-sm text-blue-600 block">
                          📅 {consecutiveSlots.length} {getSelectedServiceDuration()} slots available
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-orange-600">No availability found for this date</span>
                  )}
                </div>
              )}

              {availableSlots.length > 0 && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Clock className="h-4 w-4 text-gray-500" />
                    Book a Slot
                  </label>
                  {service && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl">
                      <span className="text-xs text-blue-700 flex items-center gap-1">
                        ⏱️ Select a {getSelectedServiceDuration()} time slot
                      </span>
                    </div>
                  )}
                  
                  {/* Show consecutive slots if service is selected */}
                  {service && consecutiveSlots.length > 0 ? (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Available {getSelectedServiceDuration()} Slots:</label>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                        {consecutiveSlots.map((slot, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setFromTime(slot.startTime);
                              setToTime(slot.endTime);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              fromTime === slot.startTime && toTime === slot.endTime
                                ? 'bg-blue-100 border-blue-300 text-blue-800 shadow-sm'
                                : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700'
                            }`}
                          >
                            <div className="font-medium text-sm">{slot.startDisplayTime} - {slot.endDisplayTime}</div>
                            <div className="text-xs text-gray-500">{slot.duration} minutes</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : service && consecutiveSlots.length === 0 ? (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
                      <span className="text-sm text-orange-600">
                        No {getSelectedServiceDuration()} slots available for this date
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <span className="text-sm text-gray-600">
                        Please select a service to see available time slots
                      </span>
                    </div>
                  )}
                  
                </div>
              )}
            </div>
            
            {/* Info Display */}
            {info && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-sm text-blue-600 font-medium">{info}</span>
              </div>
            )}
            
            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-sm text-red-600 font-medium">{error}</span>
              </div>
            )}
            
            <button 
              onClick={handleBookingSubmit}
              className={`mt-6 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 text-base flex items-center justify-center gap-2 ${
                service && mentor && date && fromTime && toTime && !isSubmitting
                  ? 'text-white hover:shadow-xl hover:scale-[1.02] active:scale-95'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
              style={
                service && mentor && date && fromTime && toTime && !isSubmitting
                  ? { backgroundColor: '#3E5F44' }
                  : {}
              }
              onMouseEnter={(e) => {
                if (service && mentor && date && fromTime && toTime && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#2F4A35';
                }
              }}
              onMouseLeave={(e) => {
                if (service && mentor && date && fromTime && toTime && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#3E5F44';
                }
              }}
              disabled={!service || !mentor || !date || !fromTime || !toTime || isSubmitting}
            >
              <Calendar className="h-4 w-4" />
              {isSubmitting ? 'Creating Booking...' : 'Book Now'}
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        .animate-popup-in {
          animation: popup-in 0.5s cubic-bezier(.4,2,.3,1) both;
        }
        @keyframes popup-in {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        /* Use 35vw for desktop, 90vw for mobile */
        .max-w-sm {
          max-width: 35vw !important;
        }
        @media (max-width: 640px) {
          .max-w-sm {
            max-width: 90vw !important;
          }
        }
        .p-8 {
          padding: 2rem !important;
        }
        .flex-col.gap-4 > div {
          margin-bottom: 1rem !important;
        }
        .text-base {
          font-size: 1rem !important;
        }
        /* Ensure dropdown menus appear directly below the trigger */
        .radix-select-content {
          position: fixed !important;
          left: auto !important;
          right: auto !important;
          min-width: 100% !important;
          width: 100% !important;
          top: auto !important;
          margin-top: 0 !important;
          z-index: 1000 !important;
        }
        
        /* Override for all select dropdowns */
        [data-radix-select-content] {
          position: absolute !important;
          left: 0 !important;
          right: auto !important;
          min-width: 100% !important;
          width: 100% !important;
          top: calc(100% + 2px) !important;
          margin-top: 0 !important;
          z-index: 1000 !important;
        }
        
        /* Specific positioning for time selectors in grid */
        .grid.grid-cols-2 [data-radix-select-content] {
          position: absolute !important;
          left: 0 !important;
          right: auto !important;
          min-width: 100% !important;
          width: 100% !important;
          top: calc(100% + 2px) !important;
          margin-top: 0 !important;
          z-index: 1000 !important;
        }
        
                 /* Force positioning for all select content */
         .radix-select-content,
         [data-radix-select-content],
         [data-radix-popper-content-wrapper] {
           position: absolute !important;
           left: 0 !important;
           right: auto !important;
           min-width: 100% !important;
           width: 100% !important;
           top: calc(100% + 2px) !important;
           margin-top: 0 !important;
           z-index: 1000 !important;
         }
         
                                                                                                                                                               /* Custom positioning for time selectors to align with form height */
             .grid.grid-cols-2 [data-radix-select-content] {
               position: absolute !important;
               left: 0 !important;
               right: auto !important;
               min-width: 100% !important;
               width: 100% !important;
               top: calc(100% - 120px) !important;
               margin-top: 0 !important;
               z-index: 1000 !important;
               max-height: 250px !important;
               min-height: 150px !important;
             }
        
        @media (max-width: 640px) {
          .radix-select-content,
          [data-radix-select-content] {
            min-width: 100% !important;
            width: 100% !important;
          }
        }
          .hide-scrollbar {
          scrollbar-width: none !important; /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important; /* Chrome, Safari */
        }
      `}</style>
    </div>
  );
};

export default BookSessionPopup;

