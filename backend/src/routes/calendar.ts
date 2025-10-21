import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { CalendarIntegration, AvailabilityRule, AvailabilitySlot, CalendarEvent } from '../models/Calendar';
import Expert from '../models/Expert';
import {
  createCalendarEvent,
  listCalendarEvents,
  getCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
} from '../controllers/calendarController';

const router = express.Router();

// ===========================
// Google Calendar Event CRUD
// ===========================

// Create calendar event with Google Meet
router.post('/events', protect, createCalendarEvent);

// List calendar events
router.get('/events', protect, listCalendarEvents);

// Get single event
router.get('/events/:eventId', protect, getCalendarEvent);

// Update calendar event
router.put('/events/:eventId', protect, updateCalendarEvent);

// Delete calendar event
router.delete('/events/:eventId', protect, deleteCalendarEvent);

// ===========================
// Calendar Integration Routes
// ===========================

// @route   GET /api/calendar/integrations
// @desc    Get user's calendar integrations
// @access  Private
router.get('/integrations', protect, async (req, res, next) => {
  try {
    const integrations = await CalendarIntegration.find({ 
      userId: req.user.id,
      isActive: true 
    });

    res.json({
      success: true,
      data: integrations
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/calendar/integrations
// @desc    Add calendar integration
// @access  Private
router.post('/integrations', protect, [
  body('provider')
    .isIn(['google', 'outlook', 'apple', 'calendly', 'cal.com'])
    .withMessage('Invalid calendar provider'),
  body('accessToken')
    .notEmpty()
    .withMessage('Access token is required'),
  body('accountEmail')
    .isEmail()
    .withMessage('Valid account email is required'),
  body('timezone')
    .notEmpty()
    .withMessage('Timezone is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if integration already exists
    const existingIntegration = await CalendarIntegration.findOne({
      userId: req.user.id,
      provider: req.body.provider,
      accountEmail: req.body.accountEmail
    });

    if (existingIntegration) {
      return res.status(400).json({
        success: false,
        message: 'Calendar integration already exists'
      });
    }

    const expert = await Expert.findOne({ userId: req.user.id });
    
    const integrationData = {
      ...req.body,
      userId: req.user.id,
      expertId: expert?._id
    };

    const integration = new CalendarIntegration(integrationData);
    await integration.save();

    res.status(201).json({
      success: true,
      data: integration,
      message: 'Calendar integration added successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/calendar/integrations/:id
// @desc    Update calendar integration
// @access  Private
router.put('/integrations/:id', protect, [
  param('id').isMongoId().withMessage('Invalid integration ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const integration = await CalendarIntegration.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Calendar integration not found'
      });
    }

    const updatedIntegration = await CalendarIntegration.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedIntegration
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/calendar/integrations/:id
// @desc    Delete calendar integration
// @access  Private
router.delete('/integrations/:id', protect, [
  param('id').isMongoId().withMessage('Invalid integration ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const integration = await CalendarIntegration.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Calendar integration not found'
      });
    }

    await CalendarIntegration.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Calendar integration deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/calendar/availability-rules
// @desc    Get availability rules for expert
// @access  Private (Expert only)
router.get('/availability-rules', protect, async (req, res, next) => {
  try {
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      return res.status(403).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    const rules = await AvailabilityRule.find({ 
      expertId: expert._id,
      isActive: true 
    }).sort({ priority: -1, createdAt: -1 });

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/calendar/availability-rules
// @desc    Create availability rule
// @access  Private (Expert only)
router.post('/availability-rules', protect, [
  body('ruleType')
    .isIn(['availability', 'buffer_time', 'break', 'holiday', 'custom_block'])
    .withMessage('Invalid rule type'),
  body('pattern.type')
    .isIn(['weekly', 'specific_date', 'date_range', 'monthly'])
    .withMessage('Invalid pattern type'),
  body('isAvailable')
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),
  body('timezone')
    .notEmpty()
    .withMessage('Timezone is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      return res.status(403).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    const ruleData = {
      ...req.body,
      expertId: expert._id
    };

    const rule = new AvailabilityRule(ruleData);
    await rule.save();

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Availability rule created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/calendar/availability-rules/:id
// @desc    Update availability rule
// @access  Private (Expert only)
router.put('/availability-rules/:id', protect, [
  param('id').isMongoId().withMessage('Invalid rule ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      return res.status(403).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    const rule = await AvailabilityRule.findOne({
      _id: req.params.id,
      expertId: expert._id
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Availability rule not found'
      });
    }

    const updatedRule = await AvailabilityRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedRule
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/calendar/availability-rules/:id
// @desc    Delete availability rule
// @access  Private (Expert only)
router.delete('/availability-rules/:id', protect, [
  param('id').isMongoId().withMessage('Invalid rule ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      return res.status(403).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    const rule = await AvailabilityRule.findOne({
      _id: req.params.id,
      expertId: expert._id
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Availability rule not found'
      });
    }

    await AvailabilityRule.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Availability rule deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/calendar/availability-slots
// @desc    Get availability slots for expert
// @access  Public (for booking) / Private (for management)
router.get('/availability-slots', [
  query('expertId').optional().isMongoId().withMessage('Invalid expert ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('duration').optional().isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let expertId: string;
    
    if (req.query.expertId) {
      expertId = req.query.expertId as string;
    } else if (req.user) {
      const expert = await Expert.findOne({ userId: req.user.id });
      if (!expert) {
        return res.status(403).json({
          success: false,
          message: 'Expert profile not found'
        });
      }
      expertId = expert._id.toString();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Expert ID is required'
      });
    }

    // Default to next 7 days if no date range provided
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : 
      new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const slots = await AvailabilitySlot.find({
      expertId,
      startTime: { $gte: startDate },
      endTime: { $lte: endDate },
      status: 'available'
    }).sort({ startTime: 1 });

    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/calendar/availability-slots
// @desc    Create manual availability slot
// @access  Private (Expert only)
router.post('/availability-slots', protect, [
  body('startTime')
    .isISO8601()
    .withMessage('Valid start time is required'),
  body('endTime')
    .isISO8601()
    .withMessage('Valid end time is required'),
  body('timezone')
    .notEmpty()
    .withMessage('Timezone is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      return res.status(403).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    const startTime = new Date(req.body.startTime);
    const endTime = new Date(req.body.endTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    if (duration < 15) {
      return res.status(400).json({
        success: false,
        message: 'Slot duration must be at least 15 minutes'
      });
    }

    const slotData = {
      expertId: expert._id,
      startTime,
      endTime,
      duration,
      timezone: req.body.timezone,
      source: 'manual' as const,
      allowedSessionTypes: req.body.allowedSessionTypes,
      priceOverride: req.body.priceOverride
    };

    const slot = new AvailabilitySlot(slotData);
    await slot.save();

    res.status(201).json({
      success: true,
      data: slot,
      message: 'Availability slot created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/calendar/availability-slots/:id/block
// @desc    Block availability slot
// @access  Private (Expert only)
router.put('/availability-slots/:id/block', protect, [
  param('id').isMongoId().withMessage('Invalid slot ID'),
  body('blockReason').optional().isString(),
  body('blockType').optional().isIn(['manual', 'rule', 'calendar_sync', 'buffer'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      return res.status(403).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    const slot = await AvailabilitySlot.findOne({
      _id: req.params.id,
      expertId: expert._id
    });

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Availability slot not found'
      });
    }

    if (slot.status === 'booked') {
      return res.status(400).json({
        success: false,
        message: 'Cannot block a booked slot'
      });
    }

    const updatedSlot = await AvailabilitySlot.findByIdAndUpdate(
      req.params.id,
      {
        status: 'blocked',
        blockReason: req.body.blockReason || 'Manually blocked',
        blockType: req.body.blockType || 'manual'
      },
      { new: true }
    );

    res.json({
      success: true,
      data: updatedSlot,
      message: 'Slot blocked successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/calendar/sync
// @desc    Trigger calendar sync
// @access  Private
router.post('/sync', protect, [
  body('integrationId').optional().isMongoId().withMessage('Invalid integration ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let integrations;
    
    if (req.body.integrationId) {
      integrations = await CalendarIntegration.find({
        _id: req.body.integrationId,
        userId: req.user.id,
        isActive: true
      });
    } else {
      integrations = await CalendarIntegration.find({
        userId: req.user.id,
        isActive: true,
        'syncSettings.autoSync': true
      });
    }

    if (integrations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active calendar integrations found'
      });
    }

    // TODO: Implement actual calendar sync logic here
    // This would involve calling external calendar APIs

    // Update last sync time
    await CalendarIntegration.updateMany(
      { _id: { $in: integrations.map(i => i._id) } },
      { 
        lastSyncAt: new Date(),
        syncStatus: 'active'
      }
    );

    res.json({
      success: true,
      message: `Calendar sync initiated for ${integrations.length} integration(s)`,
      data: {
        syncedIntegrations: integrations.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/calendar/events
// @desc    Get calendar events
// @access  Private
router.get('/events', protect, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('eventType').optional().isIn(['booking', 'webinar', 'availability_block', 'external'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const filter: any = { userId: req.user.id };

    if (req.query.startDate || req.query.endDate) {
      filter.startTime = {};
      if (req.query.startDate) filter.startTime.$gte = new Date(req.query.startDate as string);
      if (req.query.endDate) filter.startTime.$lte = new Date(req.query.endDate as string);
    }

    if (req.query.eventType) {
      filter.eventType = req.query.eventType;
    }

    const events = await CalendarEvent.find(filter)
      .populate('integrationId')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    next(error);
  }
});

export default router;
