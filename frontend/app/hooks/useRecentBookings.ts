import { useState, useEffect } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { bookingApi } from '../services/bookingApi';

export const useRecentBookings = () => {
  const { user } = useCurrentUser();
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentBookings = async () => {
      if (!user?.user_id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch recent bookings (last 5)
        const response = await bookingApi.getExpertBookings(user.user_id, undefined, 1, 5);
        
        if (response.success) {
          setRecentBookings(response.data.bookings);
        }
      } catch (error) {
        console.error('Error fetching recent bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentBookings();
  }, [user?.user_id]);

  return { recentBookings, loading };
};
