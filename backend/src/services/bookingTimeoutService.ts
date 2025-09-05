import Booking from '../models/Booking';
import { ISession } from '../models/Booking';
import SocketService from './socketService';

class BookingTimeoutService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private socketService: SocketService | null = null;

  /**
   * Set the socket service instance
   */
  setSocketService(socketService: SocketService) {
    this.socketService = socketService;
  }

  /**
   * Start the background service to check for expired bookings
   * @param intervalMinutes - How often to check for expired bookings (default: 1 minute)
   */
  start(intervalMinutes: number = 1) {
    if (this.isRunning) {
      console.log('⚠️ [TIMEOUT_SERVICE] Service is already running');
      return;
    }

    console.log(`🚀 [TIMEOUT_SERVICE] Starting booking timeout service (checking every ${intervalMinutes} minute(s))`);
    
    this.isRunning = true;
    this.intervalId = setInterval(async () => {
      await this.checkAndCancelExpiredBookings();
    }, intervalMinutes * 60 * 1000);

    // Run immediately on start
    this.checkAndCancelExpiredBookings();
  }

  /**
   * Stop the background service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 [TIMEOUT_SERVICE] Booking timeout service stopped');
  }

  /**
   * Check for expired bookings and cancel them
   */
  async checkAndCancelExpiredBookings() {
    try {
      const now = new Date();
      console.log(`🔍 [TIMEOUT_SERVICE] Checking for expired bookings at ${now.toISOString()}`);
      
      // Find all bookings with expired pending sessions (exclude completed/paid sessions)
      const bookings = await Booking.find({
        'sessions.status': 'pending',
        'sessions.paymentStatus': 'pending',
        'sessions.timeoutAt': { $lte: now },
        'sessions.timeoutStatus': 'active'
      });

      if (bookings.length === 0) {
        console.log('✅ [TIMEOUT_SERVICE] No expired bookings found');
        return;
      }

      console.log(`📋 [TIMEOUT_SERVICE] Found ${bookings.length} booking(s) with expired sessions`);

      let totalCancelledSessions = 0;
      const cancelledSessions = [];

      for (const booking of bookings) {
        let bookingUpdated = false;
        
        for (const session of booking.sessions) {
          if (session.status === 'pending' && 
              session.paymentStatus === 'pending' &&
              session.timeoutAt && 
              session.timeoutAt <= now && 
              session.timeoutStatus === 'active') {
            
            // Cancel the expired session
            session.status = 'cancelled';
            session.timeoutStatus = 'expired';
            session.cancellationReason = 'Booking expired after 5 minutes';
            session.cancelledBy = 'system';
            session.cancellationTime = now;
            
            totalCancelledSessions++;
            bookingUpdated = true;
            
            cancelledSessions.push({
              bookingId: booking._id,
              sessionId: session.sessionId,
              expertId: session.expertId,
              clientId: booking.clientId,
              expertUserId: session.expertUserId,
              clientUserId: booking.clientUserId,
              scheduledDate: session.scheduledDate,
              startTime: session.startTime,
              price: session.price
            });

            // Emit socket event for real-time updates
            if (this.socketService) {
              this.socketService.emitBookingExpired(booking._id.toString(), session.sessionId.toString());
              this.socketService.emitBookingStatusUpdate(
                booking._id.toString(), 
                session.sessionId.toString(), 
                'cancelled', 
                {
                  reason: 'Booking expired after 5 minutes',
                  cancelledBy: 'system',
                  cancellationTime: now
                }
              );
            }

            console.log(`❌ [TIMEOUT_SERVICE] Cancelled expired session:`, {
              sessionId: session.sessionId,
              expertUserId: session.expertUserId,
              clientUserId: booking.clientUserId,
              scheduledDate: session.scheduledDate,
              startTime: session.startTime,
              price: session.price
            });
          }
        }
        
        // Save the booking if any sessions were updated
        if (bookingUpdated) {
          await booking.save();
          console.log(`💾 [TIMEOUT_SERVICE] Updated booking ${booking._id}`);
        }
      }

      if (totalCancelledSessions > 0) {
        console.log(`✅ [TIMEOUT_SERVICE] Successfully cancelled ${totalCancelledSessions} expired session(s)`);
        
        // Here you could add additional logic like:
        // - Send notifications to users
        // - Log to analytics
        // - Send emails about cancelled bookings
        // - Update user statistics
        
        this.logCancellationSummary(cancelledSessions);
      } else {
        console.log('✅ [TIMEOUT_SERVICE] No sessions needed to be cancelled');
      }

    } catch (error) {
      console.error('❌ [TIMEOUT_SERVICE] Error checking expired bookings:', error);
    }
  }

  /**
   * Log a summary of cancelled sessions
   */
  private logCancellationSummary(cancelledSessions: Array<{
    bookingId: any;
    sessionId: any;
    expertId: any;
    clientId: any;
    expertUserId: string;
    clientUserId: string;
    scheduledDate: Date;
    startTime: string;
    price: number;
  }>) {
    console.log('📊 [TIMEOUT_SERVICE] Cancellation Summary:');
    console.log(`   Total sessions cancelled: ${cancelledSessions.length}`);
    
    // Group by expert
    const expertStats = cancelledSessions.reduce((acc, session) => {
      const expertId = session.expertUserId;
      if (!acc[expertId]) {
        acc[expertId] = { count: 0, totalRevenue: 0 };
      }
      acc[expertId].count++;
      acc[expertId].totalRevenue += session.price;
      return acc;
    }, {} as Record<string, { count: number; totalRevenue: number }>);

    console.log('   By Expert:');
    Object.entries(expertStats).forEach(([expertId, stats]) => {
      console.log(`     Expert ${expertId}: ${stats.count} sessions, ₹${stats.totalRevenue} lost revenue`);
    });

    // Group by client
    const clientStats = cancelledSessions.reduce((acc, session) => {
      const clientId = session.clientUserId;
      if (!acc[clientId]) {
        acc[clientId] = { count: 0, totalAmount: 0 };
      }
      acc[clientId].count++;
      acc[clientId].totalAmount += session.price;
      return acc;
    }, {} as Record<string, { count: number; totalAmount: number }>);

    console.log('   By Client:');
    Object.entries(clientStats).forEach(([clientId, stats]) => {
      console.log(`     Client ${clientId}: ${stats.count} sessions, ₹${stats.totalAmount} total`);
    });
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId !== null,
      nextCheck: this.intervalId ? 'Running' : 'Stopped'
    };
  }

  /**
   * Manually trigger a check for expired bookings
   */
  async manualCheck() {
    console.log('🔧 [TIMEOUT_SERVICE] Manual check triggered');
    await this.checkAndCancelExpiredBookings();
  }
}

// Create singleton instance
const bookingTimeoutService = new BookingTimeoutService();

export default bookingTimeoutService;
