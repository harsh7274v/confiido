import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { protect, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import Expert from '../models/Expert';
import User from '../models/User';

const router = express.Router();

// @route   GET /api/experts
// @desc    Get all experts with filtering and pagination
// @access  Public
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('expertise').optional().isString().withMessage('Expertise must be a string'),
  query('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
  query('priceMin').optional().isFloat({ min: 0 }).withMessage('Minimum price must be positive'),
  query('priceMax').optional().isFloat({ min: 0 }).withMessage('Maximum price must be positive'),
  query('availability').optional().isIn(['available', 'unavailable']).withMessage('Availability must be available or unavailable'),
  query('verified').optional().isBoolean().withMessage('Verified must be a boolean'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  query('sort').optional().isIn(['rating', 'price', 'reviews', 'createdAt']).withMessage('Invalid sort field'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc')
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
      page = 1,
      limit = 10,
      expertise,
      rating,
      priceMin,
      priceMax,
      availability,
      verified,
      featured,
      sort = 'rating',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter: any = { isAvailable: true, verificationStatus: 'verified' };

    if (expertise) {
      filter.expertise = { $regex: expertise, $options: 'i' };
    }

    if (rating) {
      filter.rating = { $gte: parseFloat(rating as string) };
    }

    if (priceMin || priceMax) {
      filter.hourlyRate = {};
      if (priceMin) filter.hourlyRate.$gte = parseFloat(priceMin as string);
      if (priceMax) filter.hourlyRate.$lte = parseFloat(priceMax as string);
    }

    if (availability === 'available') {
      filter.isAvailable = true;
    } else if (availability === 'unavailable') {
      filter.isAvailable = false;
    }

    if (verified !== undefined) {
      filter.verificationStatus = verified === 'true' ? 'verified' : 'pending';
    }

    if (featured !== undefined) {
      filter.isFeatured = featured === 'true';
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sort as string] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const experts = await Expert.find(filter)
      .populate('userId', 'firstName lastName avatar email')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Expert.countDocuments(filter);

    res.json({
      success: true,
      data: {
        experts,
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

// @route   GET /api/experts/:id
// @desc    Get expert by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const expert = await Expert.findById(req.params.id)
      .populate('userId', 'firstName lastName avatar email bio location socialLinks');

    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found'
      });
    }

    res.json({
      success: true,
      data: { expert }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/experts
// @desc    Create expert profile
// @access  Private
router.post('/', protect, [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('company')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company must be between 2 and 100 characters'),
  body('expertise')
    .isArray({ min: 1 })
    .withMessage('At least one expertise area is required'),
  body('expertise.*')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Expertise areas must be at least 2 characters'),
  body('description')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Description must be between 50 and 2000 characters'),
  body('hourlyRate')
    .isFloat({ min: 10 })
    .withMessage('Hourly rate must be at least $10'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
    .withMessage('Invalid currency'),
  body('languages')
    .isArray({ min: 1 })
    .withMessage('At least one language is required'),
  body('sessionTypes')
    .isArray({ min: 1 })
    .withMessage('At least one session type is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if user already has an expert profile
    const existingExpert = await Expert.findOne({ userId: req.user._id });
    if (existingExpert) {
      return res.status(400).json({
        success: false,
        error: 'Expert profile already exists'
      });
    }

    const expertData = {
      userId: req.user._id,
      ...req.body
    };

    const expert = await Expert.create(expertData);

    // Update user to mark as expert
    await User.findByIdAndUpdate(req.user._id, { isExpert: true });

    res.status(201).json({
      success: true,
      message: 'Expert profile created successfully',
      data: { expert }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/experts/:id
// @desc    Update expert profile
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    const expert = await Expert.findById(req.params.id);

    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert profile not found'
      });
    }

    // Check if user owns this expert profile
    if (expert.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this expert profile'
      });
    }

    const updatedExpert = await Expert.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Expert profile updated successfully',
      data: { expert: updatedExpert }
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/experts/:id
// @desc    Delete expert profile
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const expert = await Expert.findById(req.params.id);

    if (!expert) {
      return res.status(404).json({
        success: false,
        error: 'Expert profile not found'
      });
    }

    // Check if user owns this expert profile
    if (expert.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this expert profile'
      });
    }

    await Expert.findByIdAndDelete(req.params.id);

    // Update user to remove expert status
    await User.findByIdAndUpdate(req.user._id, { isExpert: false });

    res.json({
      success: true,
      message: 'Expert profile deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/experts/featured
// @desc    Get featured experts
// @access  Public
router.get('/featured', optionalAuth, async (req, res, next) => {
  try {
    const experts = await Expert.find({ 
      isFeatured: true, 
      isAvailable: true, 
      verificationStatus: 'verified' 
    })
      .populate('userId', 'firstName lastName avatar email')
      .sort({ rating: -1 })
      .limit(6);

    res.json({
      success: true,
      data: { experts }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/experts/search
// @desc    Search experts
// @access  Public
router.get('/search', optionalAuth, [
  query('q')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { q } = req.query;

    const experts = await Expert.find({
      $and: [
        { isAvailable: true, verificationStatus: 'verified' },
        {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { company: { $regex: q, $options: 'i' } },
            { expertise: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
      .populate('userId', 'firstName lastName avatar email')
      .sort({ rating: -1 })
      .limit(10);

    res.json({
      success: true,
      data: { experts }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 