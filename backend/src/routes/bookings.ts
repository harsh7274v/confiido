 import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { protect } from '../middleware/auth';
import Booking, { ISession } from '../models/Booking';
import Expert from '../models/Expert';
import User from '../models/User';
import mongoose, { Types } from 'mongoose';
import SocketService from '../services/socketService';
import { sendSessionEmail } from '../services/mailer';
import { createMeetEventForSession } from '../services/googleCalendar';

const router = express.Router();

// Socket service instance (will be set by the main server)
let socketService: SocketService | null = null;

// Function to set socket service (called from main server)
export const setSocketService = (service: SocketService) => {
  socketService = service;
};

const STANDARD_DURATION_PRICING: Record<number, number> = {
  30: 750,
  60: 1150
};

const ensureExpertProfile = async (expertUserId: string) => {
  let expert = await Expert.findOne({ userId: expertUserId });

  if (expert) {
    return expert;
  }

  const mentorUser = await User.findById(expertUserId);
  if (!mentorUser) {
    return null;
  }

  const basicExpertData = {
    userId: expertUserId,
    title: `${mentorUser.firstName} ${mentorUser.lastName}`,
    company: 'Professional Mentor',
    expertise: ['Career Guidance', 'Professional Development'],
    description: `Experienced professional offering career guidance and mentorship services.`,
    hourlyRate: 50,
    currency: 'INR',
    availability: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '10:00', end: '16:00', available: false },
      sunday: { start: '10:00', end: '16:00', available: false }
    },
    sessionTypes: [
      {
        type: 'video',
        duration: 30,
        price: 750,
        description: '30-minute video consultation'
      },
      {
        type: 'video',
        duration: 60,
        price: 1150,
        description: '1-hour video consultation'
      },
      {
        type: 'chat',
        duration: 30,
        price: 750,
        description: '30-minute chat consultation'
      }
    ],
    languages: ['English', 'Hindi'],
    rating: 4.5,
    totalReviews: 0,
    totalSessions: 0,
    totalEarnings: 0,
    isFeatured: true,
    isAvailable: true,
    verificationStatus: 'verified'
  };

  try {
    expert = await Expert.create(basicExpertData);
    return expert;
  } catch (error) {
    console.error('Failed to create expert document:', error);
    return null;
  }
};

const applyStandardPricing = (duration: number, price: number, context: string) => {
  const overridePrice = STANDARD_DURATION_PRICING[duration];

  if (overridePrice && overridePrice !== price) {
    console.log('ℹ️ [BOOKING] Applying standard pricing override:', {
      context,
      requestedDuration: duration,
      originalPrice: price,
      overridePrice
    });
    return overridePrice;
  }

  return price;
};

// @route   GET /api/bookings/pricing
// @desc    Securely fetch pricing for a session
// @access  Private
router.get('/pricing', protect, [
  query('expertId')
    .notEmpty()
    .withMessage('Expert ID is required'),
  query('sessionType')
    .isIn(['video', 'audio', 'chat', 'in-person'])
    .withMessage('Invalid session type'),
  query('duration')
    .isInt({ min: 15 })
    .withMessage('Duration must be at least 15 minutes')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { expertId, sessionType } = req.query;
    const duration = parseInt(req.query.duration as string, 10);

    const expert = await ensureExpertProfile(expertId as string);
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Mentor not found'
      });
    }

    const sessionTypeConfig = expert.sessionTypes.find(
      s => s.type === sessionType && s.duration === duration
    );

    if (!sessionTypeConfig) {
      return res.status(400).json({
        success: false,
        error: 'Selected session type and duration is not available for this expert'
      });
    }

    const price = applyStandardPricing(duration, sessionTypeConfig.price, 'pricing-endpoint');

    res.json({
      success: true,
      data: {
        price,
        currency: 'INR'
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/bookings
// @desc    Create a new booking or add session to existing booking
// @access  Private
router.post('/', protect, [
  body('expertId')
    .notEmpty()
    .withMessage('Expert ID is required'),
  body('sessionType')
    .isIn(['video', 'audio', 'chat', 'in-person'])
    .withMessage('Invalid session type'),
  body('duration')
    .isInt({ min: 15 })
    .withMessage('Duration must be at least 15 minutes'),
  body('scheduledDate')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('startTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      expertId,
      sessionType,
      duration,
      scheduledDate,
      startTime,
      notes
    } = req.body;

    // Check if expert exists and is available
    // The expertId sent from frontend is the MENTOR's User ID (not the authenticated user's ID)
    const expert = await ensureExpertProfile(expertId);

    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Mentor not found'
      });
    }
    
    console.log('✅ [BOOKING] Expert found:', {
      expertId: expert._id,
      userId: expert.userId,
      title: expert.title,
      isAvailable: expert.isAvailable
    });

    if (!expert.isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Expert is not available for bookings'
      });
    }

    // Calculate end time
    const startTimeParts = startTime.split(':');
    const startHour = parseInt(startTimeParts[0]);
    const startMinute = parseInt(startTimeParts[1]);
    
    const endHour = Math.floor((startHour * 60 + startMinute + duration) / 60) % 24;
    const endMinute = (startHour * 60 + startMinute + duration) % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

    // Calculate price based on session type AND duration
    const sessionTypeConfig = expert.sessionTypes.find(s => s.type === sessionType && s.duration === duration);
    if (!sessionTypeConfig) {
      return res.status(400).json({
        success: false,
        error: 'Selected session type and duration is not available for this expert'
      });
    }

    const price = applyStandardPricing(duration, sessionTypeConfig.price, 'booking-create');

    // Check for booking conflicts in existing sessions (block overlaps for any user)
    // Allow rebooking if previous attempt failed/refunded/cancelled or expired
    const now = new Date();
    const existingBooking = await Booking.findOne({
      sessions: {
        $elemMatch: {
          expertId: expert._id,
          scheduledDate: new Date(scheduledDate),
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
          $or: [
            { paymentStatus: 'paid' },
            { status: { $in: ['confirmed', 'completed'] } },
            {
              status: 'pending',
              paymentStatus: 'pending',
              timeoutStatus: 'active',
              timeoutAt: { $gt: now }
            }
          ]
        }
      }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        error: 'This time slot is already booked'
      });
    }

    // Get client and expert user details
    // clientUser = authenticated user (the one making the booking)
    // expertUser = selected mentor (the one being booked)
    const clientUser = await User.findById(req.user._id);
    const expertUser = await User.findById(expert.userId);
    
    if (!clientUser || !expertUser) {
      return res.status(400).json({
        success: false,
        error: 'User information not found'
      });
    }

    // Validate that client and expert are different users
    if (clientUser._id.toString() === expertUser._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot book a session with yourself'
      });
    }

    // Create new session data
    const newSession: ISession = {
      sessionId: new Types.ObjectId(),
      expertId: expert._id as mongoose.Types.ObjectId,
      expertUserId: expertUser.user_id || '0000',
      expertEmail: (expertUser as any)?.mentor_email || expertUser.email,
      sessionType,
      duration,
      scheduledDate: new Date(scheduledDate),
      startTime,
      endTime,
      price,
      currency: 'INR',
      notes,
      status: 'pending',
      paymentStatus: 'pending',
      // Set 5-minute timeout for pending bookings
      timeoutAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      timeoutStatus: 'active',
      // Set creation time when book now is clicked
      createdTime: new Date()
    };

    // Try to find existing booking document for this client
    let booking = await Booking.findOne({ clientId: req.user._id });
    
    if (booking) {
      // Add new session to existing booking
      booking.sessions.push(newSession);
      booking.updatedAt = new Date(); // Explicitly update the timestamp
      await booking.save();
      
      console.log('✅ [BOOKING] Session added to existing booking:', {
        bookingId: booking._id,
        sessionId: newSession.sessionId,
        totalSessions: booking.totalSessions,
        totalSpent: booking.totalSpent
      });
    } else {
      // Create new booking document with first session
      const bookingData = {
        clientId: req.user._id,
        clientUserId: clientUser.user_id || '0000',
        clientEmail: clientUser.email,
        sessions: [newSession]
      };
      
      booking = await Booking.create(bookingData);
      
      console.log('✅ [BOOKING] New booking created:', {
        bookingId: booking._id,
        sessionId: newSession.sessionId,
        totalSessions: booking.totalSessions,
        totalSpent: booking.totalSpent
      });
    }

    // Emit socket event for new booking
    if (socketService) {
      socketService.emitBookingStatusUpdate(
        booking._id.toString(),
        newSession.sessionId.toString(),
        'pending',
        {
          session: newSession,
          booking: booking,
          message: 'New booking created with 5-minute payment timeout'
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Session booked successfully',
      data: { 
        booking,
        session: newSession
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter: any = {
      $or: [
        { clientId: req.user._id },
        { 'sessions.expertId': req.user._id }
      ]
    };

    if (status) {
      filter['sessions.status'] = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const bookings = await Booking.find(filter)
      .populate('clientId', 'firstName lastName email')
      .populate('sessions.expertId', 'title company')
      .populate({
        path: 'sessions.expertId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email avatar'
        }
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private

// @route   GET /api/bookings/user
// @desc    Get user's payment data from bookings (for payments page)
// @access  Private
router.get('/user', protect, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const user_id = req.user.user_id; // Get the 4-digit user_id

    // Find bookings for this user
    const filter: any = {
      clientUserId: user_id
    };

    if (status) {
      filter['sessions.status'] = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Get bookings for this user using aggregation to sort by session createdTime
    const bookings = await Booking.aggregate([
      { $match: filter },
      { $unwind: '$sessions' },
      { $sort: { 'sessions.createdTime': -1, updatedAt: -1 } },
      { $group: {
        _id: '$_id',
        clientId: { $first: '$clientId' },
        clientUserId: { $first: '$clientUserId' },
        clientEmail: { $first: '$clientEmail' },
        sessions: { $push: '$sessions' },
        totalSessions: { $first: '$totalSessions' },
        totalSpent: { $first: '$totalSpent' },
        createdAt: { $first: '$createdAt' },
        updatedAt: { $first: '$updatedAt' }
      }},
      { $sort: { 'sessions.createdTime': -1, updatedAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit as string) }
    ]);

    // Populate the aggregated results
    const populatedBookings = await Booking.populate(bookings, [
      { path: 'clientId', select: 'firstName lastName email' },
      { path: 'sessions.expertId', select: 'title company' },
      { 
        path: 'sessions.expertId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email avatar'
        }
      }
    ]);

    const total = await Booking.countDocuments(filter);

    // Get total counts across all bookings for this user
    const allBookings = await Booking.find({ clientUserId: user_id });
    let totalPaid = 0;
    let totalPending = 0;
    let totalFailed = 0;
    let totalRefunded = 0;
    let grandTotalSpent = 0;

    // Calculate stats from sessions in booking documents
    for (const booking of allBookings) {
      for (const session of booking.sessions) {
        switch (session.paymentStatus) {
          case 'paid':
            totalPaid++;
            grandTotalSpent += session.price || 0;
            break;
          case 'pending':
            totalPending++;
            break;
          case 'failed':
            totalFailed++;
            break;
          case 'refunded':
            totalRefunded++;
            break;
        }
      }
    }

    res.json({
      success: true,
      data: {
        bookings: populatedBookings,
        stats: { 
          total, 
          paid: totalPaid, 
          pending: totalPending, 
          failed: totalFailed, 
          refunded: totalRefunded, 
          totalSpent: grandTotalSpent 
        },
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('clientId', 'firstName lastName email phone')
      .populate('sessions.expertId', 'title company')
      .populate({
        path: 'sessions.expertId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email avatar phone'
        }
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user is authorized to view this booking
    if (booking.clientId.toString() !== req.user._id.toString() && 
        !booking.sessions.some(session => session.expertId.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bookings/:id/confirm
// @desc    Confirm booking
// @access  Private
router.put('/:id/confirm', protect, async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Find the specific session
    const session = booking.sessions.find(s => s.sessionId.toString() === sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user is the expert for this session
    if (session.expertId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to confirm this session'
      });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Session cannot be confirmed'
      });
    }

    session.status = 'confirmed';
    await booking.save();

    res.json({
      success: true,
      message: 'Session confirmed successfully',
      data: { booking, session }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.put('/:id/cancel', protect, [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required'),
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { sessionId, reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Find the specific session
    const session = booking.sessions.find(s => s.sessionId.toString() === sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user is authorized to cancel this session
    if (booking.clientId.toString() !== req.user._id.toString() && 
        session.expertId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this session'
      });
    }

    if (session.status === 'cancelled' || session.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Session cannot be cancelled'
      });
    }

    session.status = 'cancelled';
    session.cancellationReason = reason;
    session.cancelledBy = booking.clientId.toString() === req.user._id.toString() ? 'client' : 'expert';
    session.cancellationTime = new Date();
    await booking.save();

    res.json({
      success: true,
      message: 'Session cancelled successfully',
      data: { booking, session }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bookings/:id/complete
// @desc    Mark booking as completed
// @access  Private
router.put('/:id/complete', protect, async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Find the specific session
    const session = booking.sessions.find(s => s.sessionId.toString() === sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user is the expert for this session
    if (session.expertId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to complete this session'
      });
    }

    if (session.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        error: 'Session cannot be completed'
      });
    }

    session.status = 'completed';
    session.timeoutStatus = 'completed'; // Mark timeout as completed
    await booking.save();

    res.json({
      success: true,
      message: 'Session marked as completed',
      data: { booking, session }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bookings/:id/cancel-expired
// @desc    Cancel expired pending bookings (system endpoint)
// @access  Private
router.put('/:id/cancel-expired', protect, async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Find the specific session
    const session = booking.sessions.find(s => s.sessionId.toString() === sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if session is expired and still pending
    const now = new Date();
    if (session.timeoutAt && session.timeoutAt <= now && session.status === 'pending') {
      session.status = 'cancelled';
      session.timeoutStatus = 'expired';
      session.cancellationReason = 'Booking expired after 5 minutes';
      session.cancelledBy = 'system';
      session.cancellationTime = now;
      
      await booking.save();

      res.json({
        success: true,
        message: 'Expired booking cancelled successfully',
        data: { booking, session }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Session is not expired or not in pending status'
      });
    }
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bookings/expired/check
// @desc    Check and cancel all expired pending bookings
// @access  Private (Admin/System)
router.get('/expired/check', protect, async (req, res, next) => {
  try {
    const now = new Date();
    
    // Find all bookings with expired pending sessions (exclude completed/paid sessions)
    const bookings = await Booking.find({
      'sessions.status': 'pending',
      'sessions.paymentStatus': 'pending',
      'sessions.timeoutAt': { $lte: now },
      'sessions.timeoutStatus': 'active'
    });

    let cancelledCount = 0;
    const cancelledSessions = [];

    for (const booking of bookings) {
      for (const session of booking.sessions) {
        if (session.status === 'pending' && 
            session.paymentStatus === 'pending' &&
            session.timeoutAt && 
            session.timeoutAt <= now && 
            session.timeoutStatus === 'active') {
          
          session.status = 'cancelled';
          session.timeoutStatus = 'expired';
          session.cancellationReason = 'Booking expired after 5 minutes';
          session.cancelledBy = 'system';
          session.cancellationTime = now;
          
          cancelledCount++;
          cancelledSessions.push({
            bookingId: booking._id,
            sessionId: session.sessionId,
            expertId: session.expertId,
            clientId: booking.clientId
          });
        }
      }
      
      await booking.save();
    }

    res.json({
      success: true,
      message: `Cancelled ${cancelledCount} expired bookings`,
      data: {
        cancelledCount,
        cancelledSessions
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/bookings/timeout/sync
// @desc    Sync frontend timeout state with backend
// @access  Private
router.post('/timeout/sync', protect, async (req, res, next) => {
  try {
    const { timeouts } = req.body;
    
    if (!Array.isArray(timeouts)) {
      return res.status(400).json({
        success: false,
        error: 'Timeouts array is required'
      });
    }

    const now = new Date();
    const expiredSessions = [];

    for (const timeout of timeouts) {
      const { bookingId, sessionId, timeoutAt } = timeout;
      
      const booking = await Booking.findById(bookingId);
      if (!booking) continue;

      const session = booking.sessions.find(s => s.sessionId.toString() === sessionId);
      if (!session) continue;

      // Check if session has expired
      const timeoutDate = new Date(timeoutAt);
      if (timeoutDate <= now && session.status === 'pending') {
        session.status = 'cancelled';
        session.timeoutStatus = 'expired';
        session.cancellationReason = 'Booking expired after 5 minutes';
        session.cancelledBy = 'system';
        session.cancellationTime = now;
        
        expiredSessions.push({
          bookingId: booking._id.toString(),
          sessionId: session.sessionId.toString(),
          status: 'cancelled',
          reason: 'Booking expired after 5 minutes'
        });
      }
    }

    // Save all updated bookings
    if (expiredSessions.length > 0) {
      await Promise.all(
        expiredSessions.map(async (expiredSession) => {
          const booking = await Booking.findById(expiredSession.bookingId);
          if (booking) {
            await booking.save();
          }
        })
      );
    }

    res.json({
      success: true,
      message: `Synced ${timeouts.length} timeouts, ${expiredSessions.length} sessions expired`,
      data: {
        expiredSessions
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/bookings/timeout/status
// @desc    Get timeout status for specific sessions
// @access  Private
router.post('/timeout/status', protect, async (req, res, next) => {
  try {
    const { sessionIds } = req.body;
    
    if (!Array.isArray(sessionIds)) {
      return res.status(400).json({
        success: false,
        error: 'Session IDs array is required'
      });
    }

    const now = new Date();
    const sessionStatuses = [];

    for (const sessionId of sessionIds) {
      const booking = await Booking.findOne({
        'sessions.sessionId': sessionId
      });

      if (booking) {
        const session = booking.sessions.find(s => s.sessionId.toString() === sessionId);
        if (session) {
          const isExpired = session.timeoutAt && session.timeoutAt <= now && session.status === 'pending';
          
          sessionStatuses.push({
            sessionId,
            bookingId: booking._id.toString(),
            status: isExpired ? 'expired' : session.status,
            timeoutAt: session.timeoutAt,
            timeoutStatus: session.timeoutStatus
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        sessionStatuses
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bookings/:id/cancel-expired-session
// @desc    Cancel an expired session (called by frontend when timer expires)
// @access  Private
router.put('/:id/cancel-expired-session', protect, async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Find the specific session
    const session = booking.sessions.find(s => s.sessionId.toString() === sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user is authorized to cancel this session (must be the client)
    if (booking.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this session'
      });
    }

    // Check if session is expired and still pending
    const now = new Date();
    if (session.timeoutAt && session.timeoutAt <= now && session.status === 'pending') {
      session.status = 'cancelled';
      session.timeoutStatus = 'expired';
      session.cancellationReason = 'Booking expired after timeout';
      session.cancelledBy = 'client';
      session.cancellationTime = now;
      
      await booking.save();

      // Emit socket event for real-time updates
      if (socketService) {
        socketService.emitBookingStatusUpdate(
          booking._id.toString(),
          session.sessionId.toString(),
          'cancelled',
          {
            reason: 'Booking expired after timeout',
            cancelledBy: 'client',
            cancellationTime: now
          }
        );
      }

      console.log('✅ [BOOKING] Expired session cancelled by client:', {
        bookingId: booking._id,
        sessionId: session.sessionId,
        clientUserId: booking.clientUserId,
        expertUserId: session.expertUserId
      });

      res.json({
        success: true,
        message: 'Expired session cancelled successfully',
        data: { booking, session }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Session is not expired or not in pending status'
      });
    }
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bookings/:id/complete-payment
// @desc    Mark session as paid and completed (called after successful payment)
// @access  Private
router.put('/:id/complete-payment', protect, [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required'),
  body('paymentMethod')
    .optional()
    .isString()
    .withMessage('Payment method must be a string'),
  body('loyaltyPointsUsed')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Loyalty points used must be a non-negative integer')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { sessionId, paymentMethod, loyaltyPointsUsed } = req.body;
    
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Find the specific session
    const session = booking.sessions.find(s => s.sessionId.toString() === sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user is authorized to complete payment for this session (must be the client)
    if (booking.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to complete payment for this session'
      });
    }

    // Check if session is in pending status
    if (session.status !== 'pending' || session.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Session is not in pending status'
      });
    }

    // Update session status to completed and paid
    session.status = 'completed';
    session.paymentStatus = 'paid';
    session.timeoutStatus = 'completed';
    session.paymentMethod = paymentMethod || 'online';
    session.paymentCompletedAt = new Date();
    
    // Store loyalty points information if provided
    if (loyaltyPointsUsed && loyaltyPointsUsed > 0) {
      session.loyaltyPointsUsed = loyaltyPointsUsed;
      session.finalAmount = session.price - loyaltyPointsUsed;
    } else {
      session.finalAmount = session.price;
    }
    
    // Try to create a real Google Meet event if mentor has Google calendar connected
    try {
      console.log('🔍 [DEBUG] Starting Google Meet event creation...');
      const expertUser = await User.findById(session.expertId);
      const clientUser = await User.findById(booking.clientId);
      const title = `${session.sessionType.toUpperCase()} session with ${clientUser?.firstName || 'Client'}`;
      
      console.log('🔍 [DEBUG] Calling createMeetEventForSession with:', {
        expertUserObjectId: String(session.expertId),
        clientEmail: clientUser?.email || booking.clientEmail,
        expertEmail: (expertUser as any)?.mentor_email || session.expertEmail,
        title,
        scheduledDate: session.scheduledDate,
        startTime: session.startTime,
        endTime: session.endTime
      });
      
      const { hangoutLink } = await createMeetEventForSession({
        expertUserObjectId: session.expertId as any,
        clientEmail: clientUser?.email || booking.clientEmail,
        expertEmail: (expertUser as any)?.mentor_email || session.expertEmail,
        title,
        description: session.notes || undefined,
        scheduledDate: new Date(session.scheduledDate),
        startTime: session.startTime,
        endTime: session.endTime,
      });

      console.log('🔍 [DEBUG] createMeetEventForSession returned:', { hangoutLink });

      if (hangoutLink) {
        session.meetingLink = hangoutLink;
        console.log('✅ [DEBUG] Google Meet link set:', hangoutLink);
      } else {
        console.log('❌ [DEBUG] No hangout link returned from createMeetEventForSession');
      }
    } catch (gErr) {
      console.error('❌ [DEBUG] Failed to create Google Meet event:', gErr);
      console.error('❌ [DEBUG] Error details:', {
        message: gErr.message,
        stack: gErr.stack
      });
    }

    await booking.save();

    // Emit socket event for real-time updates
    if (socketService) {
      socketService.emitBookingStatusUpdate(
        booking._id.toString(),
        session.sessionId.toString(),
        'completed',
        {
          paymentStatus: 'paid',
          paymentMethod: session.paymentMethod,
          paymentCompletedAt: session.paymentCompletedAt,
          loyaltyPointsUsed: session.loyaltyPointsUsed,
          finalAmount: session.finalAmount
        }
      );
    }

    // Send meeting link emails to client and mentor
    try {
      const client = await User.findById(booking.clientId);
      const expertUser = await User.findById(session.expertId);
      const scheduled = new Date(session.scheduledDate);
      const scheduledStr = `${scheduled.toDateString()} ${session.startTime} - ${session.endTime}`;
      const subject = 'Your session is confirmed';
      const text = session.meetingLink
        ? `Your session is confirmed for ${scheduledStr}. Join link: ${session.meetingLink}`
        : `Your session is confirmed for ${scheduledStr}. A meeting link will be shared shortly.`;
      const html = session.meetingLink
        ? `<p>Your session is confirmed for <strong>${scheduledStr}</strong>.</p><p>Join: <a href=\"${session.meetingLink}\">${session.meetingLink}</a></p>`
        : `<p>Your session is confirmed for <strong>${scheduledStr}</strong>.</p><p>A meeting link will be shared shortly.</p>`;
      if (client?.email) {
        await sendSessionEmail(client.email, subject, text, html);
      }
      const mentorEmail = session.expertEmail || (expertUser as any)?.email;
      if (mentorEmail) {
        await sendSessionEmail(mentorEmail, 'You have a confirmed session - link inside', text, html);
      }
    } catch (emailErr) {
      console.error('⚠️ Failed to send session emails:', emailErr);
    }

    console.log('✅ [BOOKING] Payment completed successfully:', {
      bookingId: booking._id,
      sessionId: session.sessionId,
      clientUserId: booking.clientUserId,
      expertUserId: session.expertUserId,
      finalAmount: session.finalAmount,
      loyaltyPointsUsed: session.loyaltyPointsUsed
    });

    res.json({
      success: true,
      message: 'Payment completed successfully',
      data: { booking, session }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bookings/mentor/:mentorId
// @desc    Get completed and paid bookings for a specific mentor
// @access  Private
router.get('/mentor/:mentorId', protect, async (req, res, next) => {
  try {
    const { mentorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate mentorId (should be 4-digit string)
    if (!mentorId || !/^\d{4}$/.test(mentorId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mentor ID. Must be a 4-digit number.'
      });
    }

    // Check if the requesting user is the mentor or has permission
    if (req.user.user_id !== mentorId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this mentor\'s bookings'
      });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Find all bookings for this mentor using expertUserId (4-digit string)
    console.log('🔍 [MENTOR BOOKINGS] Searching for bookings with expertUserId:', mentorId);
    
    // First, let's check if there are any bookings at all for this expert
    const allBookingsForExpert = await Booking.find({
      'sessions.expertUserId': mentorId
    });
    console.log('🔍 [MENTOR BOOKINGS] All bookings for expert (any status):', allBookingsForExpert.length);
    
    const bookings = await Booking.find({
      'sessions.expertUserId': mentorId
    })
      .populate('clientId', 'firstName lastName email phone phoneNumber user_id profession domain location bio category age gender whatsappNumber socialLinks createdAt')
      .sort({ 'sessions.scheduledDate': -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    console.log('🔍 [MENTOR BOOKINGS] Found bookings:', bookings.length);
    console.log('🔍 [MENTOR BOOKINGS] Bookings data:', JSON.stringify(bookings, null, 2));
    
    // Debug: Log the first booking's clientId structure
    if (bookings.length > 0) {
      console.log('🔍 [MENTOR BOOKINGS] First booking clientId structure:', JSON.stringify(bookings[0].clientId, null, 2));
    }

    // Filter sessions to only include ones for this mentor (any status)
    const filteredBookings = bookings.map(booking => {
      const filteredSessions = booking.sessions.filter(session => 
        session.expertUserId === mentorId
      );
      
      return {
        ...booking.toObject(),
        sessions: filteredSessions
      };
    }).filter(booking => booking.sessions.length > 0);

    console.log('🔍 [MENTOR BOOKINGS] Before filtering - Total bookings found:', bookings.length);
    console.log('🔍 [MENTOR BOOKINGS] After filtering - Bookings with matching sessions:', filteredBookings.length);

    console.log('🔍 [MENTOR BOOKINGS] Filtered bookings:', filteredBookings.length);
    console.log('🔍 [MENTOR BOOKINGS] Filtered bookings data:', JSON.stringify(filteredBookings, null, 2));

    // Calculate total count for pagination
    const totalBookings = await Booking.countDocuments({
      'sessions.expertUserId': mentorId
    });

    // Calculate stats for this mentor (all bookings)
    const allBookings = await Booking.find({
      'sessions.expertUserId': mentorId
    });
    
    console.log('🔍 [MENTOR BOOKINGS] All bookings for stats calculation:', allBookings.length);

    let totalEarnings = 0;
    let totalSessions = 0;
    let completedSessions = 0;
    let paidSessions = 0;
    let pendingSessions = 0;
    let confirmedSessions = 0;
    let cancelledSessions = 0;

    console.log('🔍 [MENTOR BOOKINGS] Processing stats for', allBookings.length, 'bookings');
    
    for (const booking of allBookings) {
      console.log('🔍 [MENTOR BOOKINGS] Processing booking:', booking._id, 'with', booking.sessions.length, 'sessions');
      for (const session of booking.sessions) {
        console.log('🔍 [MENTOR BOOKINGS] Session:', session.sessionId, 'expertUserId:', session.expertUserId, 'status:', session.status, 'paymentStatus:', session.paymentStatus);
        if (session.expertUserId === mentorId) {
          totalSessions++;
          
          // Count by status
          switch (session.status) {
            case 'completed':
              completedSessions++;
              break;
            case 'confirmed':
              confirmedSessions++;
              break;
            case 'pending':
              pendingSessions++;
              break;
            case 'cancelled':
            case 'no-show':
              cancelledSessions++;
              break;
          }
          
          // Count paid sessions
          if (session.paymentStatus === 'paid') {
            paidSessions++;
            totalEarnings += session.finalAmount || session.price || 0;
          }
          
          console.log('🔍 [MENTOR BOOKINGS] Added session to stats. Total sessions:', totalSessions, 'Total earnings:', totalEarnings);
        }
      }
    }

    res.json({
      success: true,
      data: {
        bookings: filteredBookings,
        stats: {
          totalEarnings,
          totalSessions,
          totalBookings,
          completedSessions,
          paidSessions,
          pendingSessions,
          confirmedSessions,
          cancelledSessions
        },
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalBookings,
          pages: Math.ceil(totalBookings / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 