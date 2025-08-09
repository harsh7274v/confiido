import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { Webinar, WebinarRegistration } from '../models/Webinar';
import Expert from '../models/Expert';

const router = express.Router();

// @route   GET /api/webinars
// @desc    Get all published webinars with filters
// @access  Public
router.get('/', [
  query('category').optional().isString(),
  query('status').optional().isIn(['scheduled', 'live', 'completed']),
  query('price').optional().isIn(['free', 'paid']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('search').optional().isString()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { isPublished: true };
    
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.price === 'free') filter.price = 0;
    if (req.query.price === 'paid') filter.price = { $gt: 0 };
    
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search as string, 'i')] } }
      ];
    }

    const webinars = await Webinar.find(filter)
      .populate('expertId', 'title company rating totalReviews')
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Webinar.countDocuments(filter);

    res.json({
      success: true,
      data: {
        webinars,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/webinars/featured
// @desc    Get featured webinars
// @access  Public
router.get('/featured', async (req, res, next) => {
  try {
    const webinars = await Webinar.find({ 
      isPublished: true, 
      isFeatured: true,
      status: { $in: ['scheduled', 'live'] }
    })
    .populate('expertId', 'title company rating totalReviews')
    .sort({ scheduledDate: 1 })
    .limit(6);

    res.json({
      success: true,
      data: webinars
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/webinars/:id
// @desc    Get webinar by ID
// @access  Public
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid webinar ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const webinar = await Webinar.findById(req.params.id)
      .populate('expertId', 'title company description rating totalReviews expertise');

    if (!webinar) {
      return res.status(404).json({
        success: false,
        message: 'Webinar not found'
      });
    }

    // Increment view count
    await Webinar.findByIdAndUpdate(req.params.id, {
      $inc: { 'analytics.views': 1 }
    });

    res.json({
      success: true,
      data: webinar
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/webinars
// @desc    Create a new webinar
// @access  Private (Expert only)
router.post('/', protect, [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 100, max: 5000 })
    .withMessage('Description must be between 100 and 5000 characters'),
  body('shortDescription')
    .notEmpty()
    .withMessage('Short description is required')
    .isLength({ max: 300 })
    .withMessage('Short description cannot exceed 300 characters'),
  body('scheduledDate')
    .isISO8601()
    .withMessage('Valid scheduled date is required'),
  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('platform')
    .isIn(['zoom', 'teams', 'meet', 'webex', 'youtube', 'custom'])
    .withMessage('Invalid platform'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if user is an expert
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      return res.status(403).json({
        success: false,
        message: 'Only experts can create webinars'
      });
    }

    const webinarData = {
      ...req.body,
      expertId: expert._id
    };

    const webinar = new Webinar(webinarData);
    await webinar.save();

    res.status(201).json({
      success: true,
      data: webinar
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/webinars/:id/register
// @desc    Register for webinar
// @access  Private/Public (depending on registration settings)
router.post('/:id/register', [
  param('id').isMongoId().withMessage('Invalid webinar ID'),
  body('registrationData.name')
    .notEmpty()
    .withMessage('Name is required'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const webinar = await Webinar.findById(req.params.id);
    if (!webinar) {
      return res.status(404).json({
        success: false,
        message: 'Webinar not found'
      });
    }

    // Check if registration is still open
    if (webinar.registrationEndDate && new Date() > webinar.registrationEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Registration period has ended'
      });
    }

    // Check if webinar has capacity
    if (webinar.maxAttendees && webinar.registrationCount >= webinar.maxAttendees) {
      return res.status(400).json({
        success: false,
        message: 'Webinar is full'
      });
    }

    // Check for duplicate registration
    const existingRegistration = await WebinarRegistration.findOne({
      webinarId: req.params.id,
      email: req.body.email
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this webinar'
      });
    }

    const registrationData = {
      webinarId: req.params.id,
      userId: req.user?.id,
      email: req.body.email,
      registrationData: req.body.registrationData,
      paymentStatus: webinar.price > 0 ? 'pending' : 'completed'
    };

    const registration = new WebinarRegistration(registrationData);
    await registration.save();

    // Update webinar registration count
    await Webinar.findByIdAndUpdate(req.params.id, {
      $inc: { registrationCount: 1 }
    });

    res.status(201).json({
      success: true,
      data: registration,
      message: webinar.price > 0 ? 'Registration created, payment required' : 'Successfully registered'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/webinars/my/created
// @desc    Get webinars created by expert
// @access  Private (Expert only)
router.get('/my/created', protect, async (req, res, next) => {
  try {
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      return res.status(403).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    const webinars = await Webinar.find({ expertId: expert._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: webinars
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/webinars/my/registered
// @desc    Get webinars user is registered for
// @access  Private
router.get('/my/registered', protect, async (req, res, next) => {
  try {
    const registrations = await WebinarRegistration.find({ 
      userId: req.user.id,
      isActive: true 
    })
    .populate('webinarId')
    .sort({ registeredAt: -1 });

    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/webinars/:id
// @desc    Update webinar
// @access  Private (Expert who created it)
router.put('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid webinar ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const webinar = await Webinar.findById(req.params.id);
    if (!webinar) {
      return res.status(404).json({
        success: false,
        message: 'Webinar not found'
      });
    }

    // Check ownership
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert || webinar.expertId.toString() !== expert._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this webinar'
      });
    }

    const updatedWebinar = await Webinar.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedWebinar
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/webinars/:id
// @desc    Delete webinar
// @access  Private (Expert who created it)
router.delete('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid webinar ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const webinar = await Webinar.findById(req.params.id);
    if (!webinar) {
      return res.status(404).json({
        success: false,
        message: 'Webinar not found'
      });
    }

    // Check ownership
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert || webinar.expertId.toString() !== expert._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this webinar'
      });
    }

    await Webinar.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Webinar deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
