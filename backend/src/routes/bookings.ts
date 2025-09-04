 import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import Booking, { ISession } from '../models/Booking';
import Expert from '../models/Expert';
import User from '../models/User';
import mongoose, { Types } from 'mongoose';

const router = express.Router();

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
    let expert = await Expert.findOne({ userId: expertId });
    
    if (!expert) {
      // Get mentor user details to create basic expert profile
      const mentorUser = await User.findById(expertId);
      if (!mentorUser) {
        return res.status(404).json({
          success: false,
          error: 'Mentor not found'
        });
      }
      
      // Create basic expert document for the mentor
      const basicExpertData = {
        userId: expertId, // This is the mentor's User ID
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
            price: 25,
            description: '30-minute video consultation'
          },
          {
            type: 'video',
            duration: 60,
            price: 50,
            description: '1-hour video consultation'
          },
          {
            type: 'chat',
            duration: 30,
            price: 20,
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
      } catch (createError) {
        console.error('Failed to create expert document:', createError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create expert profile'
        });
      }
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

    // Calculate price based on session type
    const sessionTypeConfig = expert.sessionTypes.find(s => s.type === sessionType);
    if (!sessionTypeConfig) {
      return res.status(400).json({
        success: false,
        error: 'Selected session type is not available for this expert'
      });
    }

    const price = sessionTypeConfig.price;

    // Check for booking conflicts in existing sessions
    const existingBooking = await Booking.findOne({
      clientId: req.user._id,
      'sessions.expertId': expert._id,
      'sessions.scheduledDate': new Date(scheduledDate),
      'sessions.status': { $in: ['pending', 'confirmed'] },
      $or: [
        {
          'sessions.startTime': { $lt: endTime },
          'sessions.endTime': { $gt: startTime }
        }
      ]
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
      expertEmail: expertUser.email,
      sessionType,
      duration,
      scheduledDate: new Date(scheduledDate),
      startTime,
      endTime,
      price,
      currency: 'INR',
      notes,
      status: 'pending',
      paymentStatus: 'pending'
    };

    // Try to find existing booking document for this client
    let booking = await Booking.findOne({ clientId: req.user._id });
    
    if (booking) {
      // Add new session to existing booking
      booking.sessions.push(newSession);
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
      .sort({ createdAt: -1 })
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

    // Get bookings for this user
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

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
        bookings,
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

export default router; 