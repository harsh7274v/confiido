const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

interface DashboardData {
  user: {
    id: string;
    name: string;
    fullName: string;
    handle: string;
    email: string;
    avatar: string;
    profileUrl: string;
    userType: 'expert' | 'seeker';
  };
  setupSteps: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    action: string;
    icon: string;
  }>;
  goals: Array<{
    id: string;
    text: string;
    completed: boolean;
    createdAt: Date;
  }>;
  stats: {
    totalBookings?: number;
    completedBookings?: number;
    pendingBookings?: number;
    totalEarnings?: number;
    thisMonthEarnings?: number;
    averageRating?: number;
    totalReviews?: number;
    totalSpent?: number;
    thisMonthSpent?: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    time: string;
    amount?: number;
  }>;
  inspiration?: Array<{
    id: string;
    name: string;
    avatar: string;
    handle: string;
  }>;
}

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

interface UserProfile {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  handle?: string;
}

interface UserSettings {
  username?: string;
  currentPassword?: string;
  newPassword?: string;
  emailNotifications?: boolean;
}

class DashboardApi {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  async updateUserProfile(profileData: UserProfile): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async updateUserSettings(settingsData: UserSettings): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/settings`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(settingsData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  async createGoal(text: string): Promise<Goal> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/goals`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }

  async updateGoal(goalId: string, updates: { text?: string; completed?: boolean }): Promise<Goal> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/goals/${goalId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  }

  async deleteGoal(goalId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/goals/${goalId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }

  async getGoals(): Promise<Goal[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/goals`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  }

  async getSetupSteps(): Promise<SetupStep[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/setup-steps`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching setup steps:', error);
      throw error;
    }
  }

  async updateSetupSteps(steps: Array<{ id: string; completed: boolean }>): Promise<SetupStep[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/setup-steps`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ steps }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating setup steps:', error);
      throw error;
    }
  }
}

export const dashboardApi = new DashboardApi();
export type { DashboardData, Goal, SetupStep, UserProfile, UserSettings }; 