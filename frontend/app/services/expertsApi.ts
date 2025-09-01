import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

export interface Expert {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    email: string;
  };
  user_id: string;
  title: string;
  company: string;
  expertise: string[];
  description: string;
  hourlyRate: number;
  currency: 'INR';
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isFeatured: boolean;
  hasAvailability: boolean;
}

export interface SearchExpertsResponse {
  success: boolean;
  data: {
    experts: Expert[];
    total: number;
  };
}

class ExpertsApi {
  // Search experts by name
  async searchByName(name: string): Promise<SearchExpertsResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/experts/search/name?name=${encodeURIComponent(name)}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error searching experts by name:', error);
      throw error;
    }
  }

  // Get all experts
  async getAllExperts(page = 1, limit = 10): Promise<{ success: boolean; data: { experts: Expert[]; pagination: any } }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/experts?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error fetching experts:', error);
      throw error;
    }
  }

  // Get expert by ID
  async getExpertById(id: string): Promise<{ success: boolean; data: { expert: Expert } }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/experts/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error fetching expert by ID:', error);
      throw error;
    }
  }

  // Get featured experts (now fetches from users/experts endpoint)
  async getFeaturedExperts(): Promise<{ success: boolean; data: { experts: Expert[] } }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/experts`, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching featured experts:', error);
      throw error;
    }
  }

  // Get all expert users
  async getAllExpertUsers(): Promise<{ success: boolean; data: { experts: Expert[]; total: number } }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/experts`);
      return response.data;
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error fetching all expert users:', error);
      throw error;
    }
  }
}

export const expertsApi = new ExpertsApi();
export default expertsApi;
