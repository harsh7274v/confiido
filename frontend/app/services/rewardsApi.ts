// Use same convention as other services: base without /api and append /api/... per call
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

export interface RewardActivity {
  type: 'earned' | 'spent';
  description: string;
  points: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface RewardAccount {
  userId: string; // MongoDB ObjectId
  user_id: string; // 4-digit unique user ID
  points: number;
  totalEarned: number;
  totalSpent: number;
  history: RewardActivity[];
  newUserRewardRedeemed: boolean;
}

class RewardsApi {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async getMyRewards(): Promise<RewardAccount> {
    const response = await fetch(`${API_BASE_URL}/api/rewards/me`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch rewards: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  }

  async redeem(points: number, description?: string, rewardId?: string): Promise<RewardAccount> {
    console.log('Making redeem API call to:', `${API_BASE_URL}/api/rewards/redeem`);
    console.log('Request body:', { points, description, rewardId });
    console.log('Headers:', this.getAuthHeaders());
    
    const response = await fetch(`${API_BASE_URL}/api/rewards/redeem`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ points, description, rewardId }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Redeem API error response:', text);
      throw new Error(text || `Failed to redeem: ${response.status}`);
    }
    const data = await response.json();
    console.log('Redeem API success response:', data);
    return data.data;
  }

  async deductForPayment(points: number, description?: string, sessionId?: string, expertName?: string): Promise<RewardAccount> {
    console.log('Making payment deduction API call to:', `${API_BASE_URL}/api/rewards/deduct-payment`);
    console.log('Request body:', { points, description, sessionId, expertName });
    
    const response = await fetch(`${API_BASE_URL}/api/rewards/deduct-payment`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ points, description, sessionId, expertName }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Payment deduction API error response:', text);
      throw new Error(text || `Failed to deduct points: ${response.status}`);
    }
    const data = await response.json();
    console.log('Payment deduction API success response:', data);
    return data.data;
  }
}

export const rewardsApi = new RewardsApi();


