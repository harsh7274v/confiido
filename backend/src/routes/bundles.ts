import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { ServiceBundle, BundlePurchase } from '../models/ServiceBundle';
import Expert from '../models/Expert';

const router = express.Router();

// @route   GET /api/bundles
// @desc    Get all published service bundles with filters
// @access  Public
router.get('/', [
  query('category').optional().isString(),
  query('bundleType').optional().isIn(['course_bundle', 'session_bundle', 'mixed_bundle', 'subscription']),
  query('priceRange').optional().isIn(['under-50', '50-100', '100-200', 'over-200']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('search').optional().isString(),
  query('sortBy').optional().isIn(['newest', 'popular', 'rating', 'price_low', 'price_high', 'discount'])
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
    const filter: any = { isPublished: true, isActive: true };
    
    if (req.query.category) filter.category = req.query.category;
    if (req.query.bundleType) filter.bundleType = req.query.bundleType;
    
    // Price range filter
    if (req.query.priceRange) {
      switch (req.query.priceRange) {
        case 'under-50':
          filter.bundlePrice = { $lt: 50 };
          break;
        case '50-100':
          filter.bundlePrice = { $gte: 50, $lte: 100 };
          break;
        case '100-200':
          filter.bundlePrice = { $gte: 100, $lte: 200 };
          break;
        case 'over-200':
          filter.bundlePrice = { $gt: 200 };
          break;
      }
    }
    
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search as string, 'i')] } }
      ];
    }

    // Build sort
    let sort: any = { createdAt: -1 };
    switch (req.query.sortBy) {
      case 'popular':
        sort = { purchaseCount: -1, viewCount: -1 };
        break;
      case 'rating':
        sort = { rating: -1, totalReviews: -1 };
        break;
      case 'price_low':
        sort = { bundlePrice: 1 };
        break;
      case 'price_high':
        sort = { bundlePrice: -1 };
        break;
      case 'discount':
        sort = { discountPercentage: -1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
        break;
    }

    const bundles = await ServiceBundle.find(filter)
      .populate('expertId', 'title company rating totalReviews')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await ServiceBundle.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bundles,
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

// @route   GET /api/bundles/featured
// @desc    Get featured bundles
// @access  Public
router.get('/featured', async (req, res, next) => {
  try {
    const bundles = await ServiceBundle.find({ 
      isPublished: true, 
      isFeatured: true,
      isActive: true
    })
    .populate('expertId', 'title company rating totalReviews')
    .sort({ rating: -1, purchaseCount: -1 })
    .limit(6);

    res.json({
      success: true,
      data: bundles
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bundles/:id
// @desc    Get bundle by ID
// @access  Public
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid bundle ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const bundle = await ServiceBundle.findById(req.params.id)
      .populate('expertId', 'title company description rating totalReviews expertise')
      .populate('services.serviceId');

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: 'Bundle not found'
      });
    }

    // Increment view count
    await ServiceBundle.findByIdAndUpdate(req.params.id, {
      $inc: { viewCount: 1 }
    });

    res.json({
      success: true,
      data: bundle
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/bundles
// @desc    Create a new service bundle
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
  body('bundleType')
    .isIn(['course_bundle', 'session_bundle', 'mixed_bundle', 'subscription'])
    .withMessage('Invalid bundle type'),
  body('bundlePrice')
    .isFloat({ min: 0 })
    .withMessage('Bundle price must be a positive number'),
  body('services')
    .isArray({ min: 1 })
    .withMessage('At least one service is required'),
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
        message: 'Only experts can create service bundles'
      });
    }

    // Calculate discount percentage
    const totalOriginalPrice = req.body.services.reduce((total: number, service: any) => total + service.originalPrice, 0);
    const discountPercentage = Math.round(((totalOriginalPrice - req.body.bundlePrice) / totalOriginalPrice) * 100);

    const bundleData = {
      ...req.body,
      expertId: expert._id,
      totalOriginalPrice,
      discountPercentage
    };

    const bundle = new ServiceBundle(bundleData);
    await bundle.save();

    res.status(201).json({
      success: true,
      data: bundle
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/bundles/:id/purchase
// @desc    Purchase service bundle
// @access  Private
router.post('/:id/purchase', protect, [
  param('id').isMongoId().withMessage('Invalid bundle ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const bundle = await ServiceBundle.findById(req.params.id);
    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: 'Bundle not found'
      });
    }

    if (!bundle.isPublished || !bundle.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Bundle is not available for purchase'
      });
    }

    // Check purchase limits
    if (bundle.maxPurchases) {
      const userPurchases = await BundlePurchase.countDocuments({
        bundleId: req.params.id,
        userId: req.user.id,
        paymentStatus: 'completed'
      });

      if (userPurchases >= bundle.maxPurchases) {
        return res.status(400).json({
          success: false,
          message: 'Purchase limit exceeded for this bundle'
        });
      }
    }

    // Check global purchase limits
    if (bundle.totalMaxPurchases && bundle.currentPurchases >= bundle.totalMaxPurchases) {
      return res.status(400).json({
        success: false,
        message: 'Bundle is sold out'
      });
    }

    const purchaseData: any = {
      bundleId: req.params.id,
      userId: req.user.id,
      expertId: bundle.expertId,
      purchasePrice: bundle.bundlePrice,
      currency: bundle.currency,
      remainingValue: bundle.bundlePrice,
      paymentStatus: bundle.bundlePrice === 0 ? 'completed' : 'pending'
    };

    // Set validity period
    if (bundle.validityPeriod) {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + bundle.validityPeriod);
      purchaseData.validUntil = validUntil;
    }

    const purchase = new BundlePurchase(purchaseData);
    await purchase.save();

    // If free bundle, grant access immediately
    if (bundle.bundlePrice === 0) {
      purchase.accessGranted = true;
      await purchase.save();

      // Update bundle stats
      await ServiceBundle.findByIdAndUpdate(req.params.id, {
        $inc: { purchaseCount: 1, currentPurchases: 1 }
      });
    }

    res.status(201).json({
      success: true,
      data: purchase,
      message: bundle.bundlePrice === 0 ? 'Bundle accessed successfully' : 'Purchase created, payment required'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/bundles/:id/redeem
// @desc    Redeem service from bundle
// @access  Private
router.post('/:id/redeem', protect, [
  param('id').isMongoId().withMessage('Invalid bundle ID'),
  body('serviceType')
    .isIn(['course', 'session', 'webinar', 'priority_dm'])
    .withMessage('Invalid service type'),
  body('serviceId')
    .isMongoId()
    .withMessage('Valid service ID is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if user has purchased the bundle
    const purchase = await BundlePurchase.findOne({
      bundleId: req.params.id,
      userId: req.user.id,
      paymentStatus: 'completed',
      accessGranted: true
    });

    if (!purchase) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Bundle not purchased or payment not completed.'
      });
    }

    // Check validity
    if (purchase.validUntil && new Date() > purchase.validUntil) {
      return res.status(403).json({
        success: false,
        message: 'Bundle access expired'
      });
    }

    const bundle = await ServiceBundle.findById(req.params.id);
    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: 'Bundle not found'
      });
    }

    // Check if service is included in bundle
    const includedService = bundle.services.find(
      s => s.type === req.body.serviceType && s.serviceId.toString() === req.body.serviceId
    );

    if (!includedService) {
      return res.status(400).json({
        success: false,
        message: 'Service not included in this bundle'
      });
    }

    // Check redemption limits
    if (bundle.maxRedemptions) {
      const currentRedemptions = purchase.redemptions.length;
      if (currentRedemptions >= bundle.maxRedemptions) {
        return res.status(400).json({
          success: false,
          message: 'Redemption limit exceeded'
        });
      }
    }

    // Add redemption
    purchase.redemptions.push({
      serviceType: req.body.serviceType,
      serviceId: req.body.serviceId,
      redeemedAt: new Date(),
      status: 'redeemed'
    });

    purchase.totalValueRedeemed += includedService.originalPrice;
    purchase.remainingValue = Math.max(0, purchase.remainingValue - includedService.originalPrice);

    await purchase.save();

    res.json({
      success: true,
      data: purchase,
      message: 'Service redeemed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bundles/my/created
// @desc    Get bundles created by expert
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

    const bundles = await ServiceBundle.find({ expertId: expert._id })
      .populate('services.serviceId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bundles
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bundles/my/purchased
// @desc    Get bundles purchased by user
// @access  Private
router.get('/my/purchased', protect, async (req, res, next) => {
  try {
    const purchases = await BundlePurchase.find({ 
      userId: req.user.id,
      paymentStatus: 'completed',
      isActive: true 
    })
    .populate('bundleId')
    .populate('expertId', 'title company')
    .sort({ purchasedAt: -1 });

    res.json({
      success: true,
      data: purchases
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bundles/:id
// @desc    Update service bundle
// @access  Private (Expert who created it)
router.put('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid bundle ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const bundle = await ServiceBundle.findById(req.params.id);
    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: 'Bundle not found'
      });
    }

    // Check ownership
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert || bundle.expertId.toString() !== expert._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this bundle'
      });
    }

    // Recalculate discount if services or price changed
    if (req.body.services || req.body.bundlePrice) {
      const services = req.body.services || bundle.services;
      const bundlePrice = req.body.bundlePrice || bundle.bundlePrice;
      const totalOriginalPrice = services.reduce((total: number, service: any) => total + service.originalPrice, 0);
      const discountPercentage = Math.round(((totalOriginalPrice - bundlePrice) / totalOriginalPrice) * 100);
      
      req.body.totalOriginalPrice = totalOriginalPrice;
      req.body.discountPercentage = discountPercentage;
    }

    const updatedBundle = await ServiceBundle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedBundle
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/bundles/:id
// @desc    Delete service bundle
// @access  Private (Expert who created it)
router.delete('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid bundle ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const bundle = await ServiceBundle.findById(req.params.id);
    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: 'Bundle not found'
      });
    }

    // Check ownership
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert || bundle.expertId.toString() !== expert._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this bundle'
      });
    }

    await ServiceBundle.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Bundle deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
