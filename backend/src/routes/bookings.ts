import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import Booking from '../models/Booking';
import Expert from '../models/Expert';

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking
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
    const expert = await Expert.findById(expertId);
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found'
      });
    }

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

    // Check for booking conflicts
    const conflictingBooking = await Booking.findOne({
      expertId,
      scheduledDate: new Date(scheduledDate),
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        error: 'This time slot is already booked'
      });
    }

    const booking = await Booking.create({
      clientId: req.user._id,
      expertId,
      sessionType,
      duration,
      scheduledDate: new Date(scheduledDate),
      startTime,
      endTime,
      price,
      currency: expert.currency,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
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
        { expertId: req.user._id }
      ]
    };

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const bookings = await Booking.find(filter)
      .populate('clientId', 'firstName lastName email')
      .populate('expertId', 'title company')
      .populate({
        path: 'expertId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email avatar'
        }
      })
      .sort({ scheduledDate: -1 })
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
router.get('/:id', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('clientId', 'firstName lastName email phone')
      .populate('expertId', 'title company')
      .populate({
        path: 'expertId',
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
        booking.expertId.toString() !== req.user._id.toString()) {
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
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user is the expert for this booking
    if (booking.expertId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to confirm this booking'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Booking cannot be confirmed'
      });
    }

    booking.status = 'confirmed';
    await booking.save();

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.put('/:id/cancel', protect, [
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

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user is authorized to cancel this booking
    if (booking.clientId.toString() !== req.user._id.toString() && 
        booking.expertId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this booking'
      });
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Booking cannot be cancelled'
      });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = req.body.reason;
    booking.cancelledBy = booking.clientId.toString() === req.user._id.toString() ? 'client' : 'expert';
    booking.cancellationTime = new Date();
    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking }
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
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user is the expert for this booking
    if (booking.expertId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to complete this booking'
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        error: 'Booking cannot be completed'
      });
    }

    booking.status = 'completed';
    await booking.save();

    res.json({
      success: true,
      message: 'Booking marked as completed',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 