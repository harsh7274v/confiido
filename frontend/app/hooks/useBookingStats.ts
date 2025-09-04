import { useState, useEffect } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { bookingApi } from '../services/bookingApi';

interface BookingStats {
  totalSessions: number;
  activeStudents: number;
  pendingBookings: number;
  completedSessions: number;
}

export const useBookingStats = () => {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState<BookingStats>({
    totalSessions: 0,
    activeStudents: 0,
    pendingBookings: 0,
    completedSessions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.user_id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch all bookings for the expert
        const response = await bookingApi.getExpertBookings(user.user_id, undefined, 1, 1000);
        
        if (response.success) {
          const bookings = response.data.bookings;
          
          // Calculate statistics
          const totalSessions = bookings.length;
          const completedSessions = bookings.filter(b => b.status === 'completed').length;
          const pendingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
          
          // Count unique clients
          const uniqueClients = new Set(bookings.map(b => b.clientId._id));
          const activeStudents = uniqueClients.size;

          setStats({
            totalSessions,
            activeStudents,
            pendingBookings,
            completedSessions
          });
        }
      } catch (error) {
        console.error('Error fetching booking stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.user_id]);

  return { stats, loading };
};
