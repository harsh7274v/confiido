import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface TimeSlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // Format: "HH:MM" (24-hour)
  endTime: string; // Format: "HH:MM" (24-hour)
  isAvailable: boolean;
}

export interface DateRange {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export interface AvailabilityPeriod {
  _id: string;
  dateRange: DateRange;
  timeSlots: TimeSlot[];
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Availability {
  _id: string;
  mentorId: string;
  user_id: string;
  availabilityPeriods: AvailabilityPeriod[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAvailabilityRequest {
  dateRange: DateRange;
  timeSlots: TimeSlot[];
  notes?: string;
}

export interface UpdateAvailabilityRequest {
  dateRange?: DateRange;
  timeSlots?: TimeSlot[];
  notes?: string;
  isActive?: boolean;
}

class AvailabilityApi {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    console.log('🔍 [FRONTEND] Token from localStorage:', token ? 'Present' : 'Missing');
    console.log('🔍 [FRONTEND] Token value:', token);
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
    
    console.log('🔍 [FRONTEND] Final headers:', headers);
    return headers;
  }

  // Create new availability
  async createAvailability(data: CreateAvailabilityRequest): Promise<{ success: boolean; data: { availability: Availability } }> {
    console.log('🔍 [FRONTEND] Sending availability data:', data);
    console.log('🔍 [FRONTEND] API URL:', `${API_BASE_URL}/api/availability`);
    console.log('🔍 [FRONTEND] Headers:', this.getAuthHeaders());
    
    try {
      console.log('🚀 [FRONTEND] Making POST request...');
      const response = await axios.post(`${API_BASE_URL}/api/availability`, data, {
        headers: this.getAuthHeaders()
      });
      console.log('✅ [FRONTEND] API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [FRONTEND] Full error object:', error);
      console.error('❌ [FRONTEND] Error response:', error.response);
      console.error('❌ [FRONTEND] Error message:', error.message);
      console.error('❌ [FRONTEND] Error status:', error.response?.status);
      console.error('❌ [FRONTEND] Error data:', error.response?.data);
      console.error('❌ [FRONTEND] Error code:', error.code);
      console.error('❌ [FRONTEND] Error config:', error.config);
      
      // Log the specific error details for 400 errors
      if (error.response?.status === 400) {
        console.error('❌ [FRONTEND] 400 Error Details:', {
          errors: error.response.data?.errors,
          error: error.response.data?.error,
          message: error.response.data?.message
        });
      }
      
      throw error;
    }
  }

  // Get mentor's availability
  async getAvailability(): Promise<{ success: boolean; data: { availability: AvailabilityPeriod[] } }> {
    const response = await axios.get(`${API_BASE_URL}/api/availability`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // Get specific availability by ID
  async getAvailabilityById(id: string): Promise<{ success: boolean; data: { availability: Availability } }> {
    const response = await axios.get(`${API_BASE_URL}/api/availability/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // Update availability
  async updateAvailability(id: string, data: UpdateAvailabilityRequest): Promise<{ success: boolean; data: { availability: Availability } }> {
    const response = await axios.put(`${API_BASE_URL}/api/availability/${id}`, data, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // Delete availability (soft delete)
  async deleteAvailability(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${API_BASE_URL}/api/availability/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // Get public availability for a specific mentor (for booking)
  async getMentorAvailability(mentorId: string): Promise<{ success: boolean; data: { availability: Availability[] } }> {
    const response = await axios.get(`${API_BASE_URL}/api/availability/mentor/${mentorId}`);
    return response.data;
  }

  // Get available time slots for a specific mentor on a specific date
  async getMentorSlotsForDate(mentorId: string, date: string): Promise<{ 
    success: boolean; 
    data: { 
      availableSlots: Array<{ time: string; displayTime: string; available: boolean }>;
      date: string;
      dayOfWeek: number;
      dayName: string;
    } 
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/availability/mentor/${mentorId}/slots/${date}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error fetching mentor slots:', error);
      throw error;
    }
  }

    // Get available time slots for a specific mentor by 4-digit user_id on a specific date
    async getMentorSlotsForDateByUserId(user_id: string, date: string): Promise<{ 
      success: boolean; 
      data: { 
        availableSlots: Array<{ time: string; displayTime: string; available: boolean }>;
        date: string;
      } 
    }> {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/availability/userid/${user_id}/slots/${date}`,
          { headers: this.getAuthHeaders() }
        );
        return response.data;
      } catch (error: any) {
        console.error('❌ [FRONTEND] Error fetching mentor slots by user_id:', error);
        throw error;
      }
    }

    // Get available consecutive time slots for a specific mentor by 4-digit user_id on a specific date for a specific duration
    async getConsecutiveSlotsByUserId(user_id: string, date: string, duration: number): Promise<{ 
      success: boolean; 
      data: { 
        consecutiveSlots: Array<{ 
          startTime: string; 
          endTime: string; 
          startDisplayTime: string; 
          endDisplayTime: string; 
          duration: number; 
          available: boolean 
        }>;
        date: string;
        duration: number;
        totalSlots: number;
        availableSlots: number;
      } 
    }> {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/availability/userid/${user_id}/consecutive-slots/${date}/${duration}`,
          { headers: this.getAuthHeaders() }
        );
        return response.data;
      } catch (error: any) {
        console.error('❌ [FRONTEND] Error fetching consecutive slots by user_id:', error);
        throw error;
      }
    }
  // Generate time slots for a week
  generateWeeklyTimeSlots(): TimeSlot[] {
    const timeSlots: TimeSlot[] = [];
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let day = 0; day < 7; day++) {
      timeSlots.push({
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: day >= 1 && day <= 5 // Monday to Friday by default
      });
    }
    
    return timeSlots;
  }

  // Generate time options for time picker
  generateTimeOptions(): string[] {
    const times: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  }

  // Get day name from day number
  getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }

  // Get short day name
  getShortDayName(dayOfWeek: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayOfWeek];
  }

  // Format time for display
  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Validate time slot
  validateTimeSlot(slot: TimeSlot): boolean {
    if (slot.startTime >= slot.endTime) {
      return false;
    }
    return true;
  }

  // Validate date range
  validateDateRange(startDate: string, endDate: string): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return start >= today && end > start;
  }
}

export const availabilityApi = new AvailabilityApi();
export default availabilityApi;
