import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Availability from '../models/Availability';
import { protect } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// Test endpoint without authentication
router.get('/ping', (req, res) => {
  console.log('🔍 [AVAILABILITY] Ping endpoint hit');
  res.json({ success: true, message: 'Availability route ping successful' });
});

// Apply authentication middleware to all routes
router.use(protect);

// Test endpoint to verify route is working
router.get('/test', (req, res) => {
  console.log('🔍 [AVAILABILITY] Test endpoint hit');
  res.json({ success: true, message: 'Availability route is working' });
});

// @route   POST /api/availability
// @desc    Create or update mentor availability
// @access  Private (Mentors only)
router.post('/', (req, res, next) => {
  console.log('🔍 [AVAILABILITY] POST route hit!');
  console.log('🔍 [AVAILABILITY] Request method:', req.method);
  console.log('🔍 [AVAILABILITY] Request URL:', req.url);
  console.log('🔍 [AVAILABILITY] Request body:', req.body);
  console.log('🔍 [AVAILABILITY] Request user:', req.user);
  next();
}, [
  body('dateRange.startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('dateRange.endDate').isISO8601().withMessage('End date must be a valid date'),
  body('timeSlots').isArray().withMessage('Time slots must be an array'),
  body('timeSlots.*.dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0-6'),
  body('timeSlots.*.startTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('timeSlots.*.endTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], async (req, res, next) => {
  try {
    console.log('🔍 [AVAILABILITY] POST request received:', {
      body: req.body,
      user: req.user,
      headers: req.headers
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [AVAILABILITY] Validation errors:', errors.array());
      console.log('❌ [AVAILABILITY] Request body that failed validation:', req.body);
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { dateRange, timeSlots, notes } = req.body;
    const mentorId = req.user._id;
    const user_id = req.user.user_id; // Extract the 4-digit user_id from authenticated user
    
    console.log('🔍 [AVAILABILITY] Extracted data:', {
      mentorId,
      user_id,
      dateRange,
      timeSlots,
      notes
    });

    // Check if user is a mentor
    if (req.user.role !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only mentors can set availability' 
      });
    }

    // Check if user has a valid user_id
    if (!req.user.user_id || !/^\d{4}$/.test(req.user.user_id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user_id format. Must be a 4-digit number.' 
      });
    }

    // Validate date range
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    if (endDate <= startDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'End date must be after start date' 
      });
    }

    // Check if dates are in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      return res.status(400).json({ 
        success: false, 
        error: 'Start date cannot be in the past' 
      });
    }

    // Validate time slots
    for (const slot of timeSlots) {
      if (slot.startTime >= slot.endTime) {
        return res.status(400).json({ 
          success: false, 
          error: 'End time must be after start time for all time slots' 
        });
      }
    }

    // Check for overlapping availability within the same mentor's periods
    const existingAvailability = await Availability.findOne({
      mentorId,
      'availabilityPeriods.isActive': true,
      $or: [
        {
          'availabilityPeriods.dateRange.startDate': { $lte: endDate },
          'availabilityPeriods.dateRange.endDate': { $gte: startDate }
        }
      ]
    });

    if (existingAvailability) {
      return res.status(400).json({ 
        success: false, 
        error: 'Availability period overlaps with existing schedule' 
      });
    }

    console.log('🔍 [AVAILABILITY] About to save to database:', {
      mentorId,
      user_id,
      dateRange: { startDate, endDate },
      timeSlots,
      notes
    });

    // Create new availability period
    const newPeriod = {
      _id: new mongoose.Types.ObjectId(),
      dateRange: {
        startDate,
        endDate
      },
      timeSlots,
      notes,
      isActive: true,
      createdAt: new Date()
    };

    // Use upsert to either create new document or add to existing one
    const availability = await Availability.findOneAndUpdate(
      { mentorId },
      { 
        $push: { availabilityPeriods: newPeriod },
        $setOnInsert: { user_id }
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );

    console.log('✅ [AVAILABILITY] Successfully saved to database:', availability);

    res.status(201).json({
      success: true,
      message: 'Availability set successfully',
      data: { availability }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/availability
// @desc    Get mentor's availability
// @access  Private (Mentors only)
router.get('/', async (req, res, next) => {
  try {
    const mentorId = req.user._id;

    // Check if user is a mentor
    if (req.user.role !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only mentors can view availability' 
      });
    }

    const availability = await Availability.findOne({ mentorId });
    
    if (!availability) {
      return res.json({
        success: true,
        data: { availability: [] }
      });
    }

    // Return all active periods sorted by start date
    const activePeriods = availability.availabilityPeriods
      .filter(period => period.isActive)
      .sort((a, b) => new Date(a.dateRange.startDate).getTime() - new Date(b.dateRange.startDate).getTime());

    res.json({
      success: true,
      data: { availability: activePeriods }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/availability/:id
// @desc    Get specific availability by ID
// @access  Private (Mentors only)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const mentorId = req.user._id;

    // Check if user is a mentor
    if (req.user.role !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only mentors can view availability' 
      });
    }

    const availability = await Availability.findOne({ 
      _id: id, 
      mentorId 
    });

    if (!availability) {
      return res.status(404).json({ 
        success: false, 
        error: 'Availability not found' 
      });
    }

    res.json({
      success: true,
      data: { availability }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/availability/:id
// @desc    Update mentor availability
// @access  Private (Mentors only)
router.put('/:id', [
  body('dateRange.startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('dateRange.endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  body('timeSlots').optional().isArray().withMessage('Time slots must be an array'),
  body('timeSlots.*.dayOfWeek').optional().isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0-6'),
  body('timeSlots.*.startTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('timeSlots.*.endTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const mentorId = req.user._id;
    const updateData = req.body;

    // Check if user is a mentor
    if (req.user.role !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only mentors can update availability' 
      });
    }

    const availability = await Availability.findOne({ 
      _id: id, 
      mentorId 
    });

    if (!availability) {
      return res.status(404).json({ 
        success: false, 
        error: 'Availability not found' 
      });
    }

    // Validate date range if being updated
    if (updateData.dateRange) {
      const startDate = new Date(updateData.dateRange.startDate);
      const endDate = new Date(updateData.dateRange.endDate);
      
      if (endDate <= startDate) {
        return res.status(400).json({ 
          success: false, 
          error: 'End date must be after start date' 
        });
      }

      // Check if dates are in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        return res.status(400).json({ 
          success: false, 
          error: 'Start date cannot be in the past' 
        });
      }
    }

    // Validate time slots if being updated
    if (updateData.timeSlots) {
      for (const slot of updateData.timeSlots) {
        if (slot.startTime >= slot.endTime) {
          return res.status(400).json({ 
            success: false, 
            error: 'End time must be after start time for all time slots' 
          });
        }
      }
    }

    // Update availability
    const updatedAvailability = await Availability.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: { availability: updatedAvailability }
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/availability/:id
// @desc    Delete specific availability period (hard delete)
// @access  Private (Mentors only)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const mentorId = req.user._id;

    console.log('🔍 [AVAILABILITY] DELETE request for period ID:', id);
    console.log('🔍 [AVAILABILITY] Mentor ID:', mentorId);

    // Check if user is a mentor
    if (req.user.role !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only mentors can delete availability' 
      });
    }

    // Hard delete the matched availability period by pulling it from the array
    const result = await Availability.findOneAndUpdate(
      {
        mentorId,
        'availabilityPeriods._id': id
      },
      {
        $pull: { availabilityPeriods: { _id: new mongoose.Types.ObjectId(id) } }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!result) {
      return res.status(404).json({ 
        success: false, 
        error: 'Availability period not found' 
      });
    }

    console.log('✅ [AVAILABILITY] Successfully deleted period:', id);
    console.log('🔍 [AVAILABILITY] Updated document:', result);

    res.json({
      success: true,
      message: 'Availability period deleted successfully (hard delete)'
    });
  } catch (error) {
    console.error('❌ [AVAILABILITY] Error deleting period:', error);
    next(error);
  }
});

// @route   GET /api/availability/mentor/:mentorId
// @desc    Get public availability for a specific mentor (for booking)
// @access  Public
router.get('/mentor/:mentorId', async (req, res, next) => {
  try {
    const { mentorId } = req.params;

    const availability = await Availability.find({ 
      mentorId, 
      isActive: true 
    }).sort({ 'dateRange.startDate': 1 });

    res.json({
      success: true,
      data: { availability }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/availability/mentor/:mentorId/slots/:date
// @desc    Get available time slots for a specific mentor on a specific date
// @access  Public
  // @route   GET /api/availability/userid/:user_id/slots/:date
  // @desc    Get available time slots for a specific mentor by 4-digit user_id on a specific date
  // @access  Public
  router.get('/userid/:user_id/slots/:date', async (req, res, next) => {
    try {
      const { user_id, date } = req.params;
      // Validate user_id format
      if (!/^\d{4}$/.test(user_id)) {
        return res.status(400).json({ success: false, error: 'Invalid user_id format. Must be a 4-digit number.' });
      }
      // Validate date format
      const selectedDate = new Date(date);
      if (isNaN(selectedDate.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid date format' });
      }
      const dayOfWeek = selectedDate.getDay();
      // Find availability for this mentor by user_id
      const availability = await Availability.findOne({ 
        user_id,
        'availabilityPeriods.isActive': true,
        'availabilityPeriods.dateRange.startDate': { $lte: selectedDate },
        'availabilityPeriods.dateRange.endDate': { $gte: selectedDate }
      });
      if (!availability) {
        return res.json({ success: true, data: { availableSlots: [], message: 'No availability found for this date' } });
      }
      const relevantPeriod = availability.availabilityPeriods.find(period => {
        const periodStart = new Date(period.dateRange.startDate);
        const periodEnd = new Date(period.dateRange.endDate);
        return selectedDate >= periodStart && selectedDate <= periodEnd;
      });
      if (!relevantPeriod) {
        return res.json({ success: true, data: { availableSlots: [], message: 'No availability found for this date' } });
      }
      const daySlots = relevantPeriod.timeSlots.filter(slot => slot.dayOfWeek === dayOfWeek && slot.isAvailable);
      const availableSlots = [];
      for (const slot of daySlots) {
        const startTime = new Date(`2000-01-01T${slot.startTime}:00`);
        const endTime = new Date(`2000-01-01T${slot.endTime}:00`);
        let currentTime = new Date(startTime);
        while (currentTime < endTime) {
          const timeString = currentTime.toTimeString().slice(0, 5); // HH:MM format
          availableSlots.push({
            time: timeString,
            displayTime: formatTimeForDisplay(timeString),
            available: true
          });
          currentTime.setMinutes(currentTime.getMinutes() + 15);
        }
      }
      res.json({ success: true, data: { availableSlots, date } });
    } catch (error) {
      console.error('[AVAILABILITY] Error fetching slots by user_id:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });
router.get('/mentor/:mentorId/slots/:date', async (req, res, next) => {
  try {
    const { mentorId, date } = req.params;
    
    console.log('🔍 [AVAILABILITY] Fetching slots for mentor:', mentorId, 'on date:', date);

    // Validate date format
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }

    // Get the day of week (0-6, Sunday-Saturday)
    const dayOfWeek = selectedDate.getDay();
    
    // Find availability for this mentor
    const availability = await Availability.findOne({ 
      mentorId,
      'availabilityPeriods.isActive': true,
      'availabilityPeriods.dateRange.startDate': { $lte: selectedDate },
      'availabilityPeriods.dateRange.endDate': { $gte: selectedDate }
    });

    if (!availability) {
      return res.json({
        success: true,
        data: { 
          availableSlots: [],
          message: 'No availability found for this date'
        }
      });
    }

    // Find the period that covers this date
    const relevantPeriod = availability.availabilityPeriods.find(period => {
      const periodStart = new Date(period.dateRange.startDate);
      const periodEnd = new Date(period.dateRange.endDate);
      return selectedDate >= periodStart && selectedDate <= periodEnd;
    });

    if (!relevantPeriod) {
      return res.json({
        success: true,
        data: { 
          availableSlots: [],
          message: 'No availability found for this date'
        }
      });
    }

    // Get time slots for this day of week
    const daySlots = relevantPeriod.timeSlots.filter(slot => 
      slot.dayOfWeek === dayOfWeek && slot.isAvailable
    );

    // Generate 15-minute intervals for the available time slots
    const availableSlots = [];
    
    for (const slot of daySlots) {
      const startTime = new Date(`2000-01-01T${slot.startTime}:00`);
      const endTime = new Date(`2000-01-01T${slot.endTime}:00`);
      
      let currentTime = new Date(startTime);
      
      while (currentTime < endTime) {
        const timeString = currentTime.toTimeString().slice(0, 5); // HH:MM format
        
        availableSlots.push({
          time: timeString,
          displayTime: formatTimeForDisplay(timeString),
          available: true
        });
        
        // Add 15 minutes
        currentTime.setMinutes(currentTime.getMinutes() + 15);
      }
    }

    console.log('✅ [AVAILABILITY] Found available slots:', availableSlots.length);

    res.json({
      success: true,
      data: { 
        availableSlots,
        date: date,
        dayOfWeek: dayOfWeek,
        dayName: getDayName(dayOfWeek)
      }
    });
  } catch (error) {
    console.error('❌ [AVAILABILITY] Error fetching slots:', error);
    next(error);
  }
});

// Helper function to format time for display
function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Helper function to get day name
function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

export default router;
