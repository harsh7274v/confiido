import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { DigitalProduct, ProductPurchase } from '../models/DigitalProduct';
import Expert from '../models/Expert';

const router = express.Router();

// @route   GET /api/digital-products
// @desc    Get all published digital products with filters
// @access  Public
router.get('/', [
  query('category').optional().isString(),
  query('productType').optional().isIn(['ebook', 'template', 'toolkit', 'checklist', 'guide', 'worksheet', 'audio', 'video', 'software', 'other']),
  query('priceRange').optional().isIn(['free', 'under-25', '25-50', '50-100', 'over-100']),
  query('skillLevel').optional().isIn(['beginner', 'intermediate', 'advanced', 'all_levels']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('search').optional().isString(),
  query('sortBy').optional().isIn(['newest', 'popular', 'rating', 'price_low', 'price_high'])
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
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { isPublished: true, isActive: true };
    
    if (req.query.category) filter.category = req.query.category;
    if (req.query.productType) filter.productType = req.query.productType;
    if (req.query.skillLevel) filter.skillLevel = req.query.skillLevel;
    
    // Price range filter
    if (req.query.priceRange) {
      switch (req.query.priceRange) {
        case 'free':
          filter.price = 0;
          break;
        case 'under-25':
          filter.price = { $gt: 0, $lt: 25 };
          break;
        case '25-50':
          filter.price = { $gte: 25, $lte: 50 };
          break;
        case '50-100':
          filter.price = { $gte: 50, $lte: 100 };
          break;
        case 'over-100':
          filter.price = { $gt: 100 };
          break;
      }
    }
    
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search as string, 'i')] } },
        { keywords: { $in: [new RegExp(req.query.search as string, 'i')] } }
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
        sort = { price: 1 };
        break;
      case 'price_high':
        sort = { price: -1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
        break;
    }

    const products = await DigitalProduct.find(filter)
      .populate('expertId', 'title company rating totalReviews')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await DigitalProduct.countDocuments(filter);

    res.json({
      success: true,
      data: {
        products,
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

// @route   GET /api/digital-products/featured
// @desc    Get featured digital products
// @access  Public
router.get('/featured', async (req, res, next) => {
  try {
    const products = await DigitalProduct.find({ 
      isPublished: true, 
      isFeatured: true,
      isActive: true
    })
    .populate('expertId', 'title company rating totalReviews')
    .sort({ rating: -1, purchaseCount: -1 })
    .limit(8);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/digital-products/:id
// @desc    Get digital product by ID
// @access  Public
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid product ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const product = await DigitalProduct.findById(req.params.id)
      .populate('expertId', 'title company description rating totalReviews expertise');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    await DigitalProduct.findByIdAndUpdate(req.params.id, {
      $inc: { viewCount: 1 }
    });

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/digital-products
// @desc    Create a new digital product
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
  body('productType')
    .isIn(['ebook', 'template', 'toolkit', 'checklist', 'guide', 'worksheet', 'audio', 'video', 'software', 'other'])
    .withMessage('Invalid product type'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('files')
    .isArray({ min: 1 })
    .withMessage('At least one file is required'),
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
        message: 'Only experts can create digital products'
      });
    }

    const productData = {
      ...req.body,
      expertId: expert._id
    };

    const product = new DigitalProduct(productData);
    await product.save();

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/digital-products/:id/purchase
// @desc    Purchase digital product
// @access  Private
router.post('/:id/purchase', protect, [
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('licenseType')
    .optional()
    .isIn(['personal', 'commercial', 'extended'])
    .withMessage('Invalid license type')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const product = await DigitalProduct.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.isPublished || !product.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Product is not available for purchase'
      });
    }

    // Check for duplicate purchase
    const existingPurchase = await ProductPurchase.findOne({
      productId: req.params.id,
      userId: req.user.id,
      paymentStatus: 'completed'
    });

    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: 'Product already purchased'
      });
    }

    const purchaseData = {
      productId: req.params.id,
      userId: req.user.id,
      expertId: product.expertId,
      purchasePrice: product.price,
      currency: product.currency,
      licenseType: req.body.licenseType || 'personal',
      productVersion: product.version,
      paymentStatus: product.price === 0 ? 'completed' : 'pending'
    };

    const purchase = new ProductPurchase(purchaseData);
    await purchase.save();

    // If free product, grant access immediately
    if (product.price === 0) {
      purchase.accessGranted = true;
      await purchase.save();

      // Update product stats
      await DigitalProduct.findByIdAndUpdate(req.params.id, {
        $inc: { purchaseCount: 1, downloadCount: 1 }
      });
    }

    res.status(201).json({
      success: true,
      data: purchase,
      message: product.price === 0 ? 'Product downloaded successfully' : 'Purchase created, payment required'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/digital-products/my/created
// @desc    Get digital products created by expert
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

    const products = await DigitalProduct.find({ expertId: expert._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/digital-products/my/purchased
// @desc    Get digital products purchased by user
// @access  Private
router.get('/my/purchased', protect, async (req, res, next) => {
  try {
    const purchases = await ProductPurchase.find({ 
      userId: req.user.id,
      paymentStatus: 'completed',
      isActive: true 
    })
    .populate('productId')
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

// @route   GET /api/digital-products/:id/download
// @desc    Download purchased digital product
// @access  Private
router.get('/:id/download', protect, [
  param('id').isMongoId().withMessage('Invalid product ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if user has purchased the product
    const purchase = await ProductPurchase.findOne({
      productId: req.params.id,
      userId: req.user.id,
      paymentStatus: 'completed',
      accessGranted: true
    });

    if (!purchase) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Product not purchased or payment not completed.'
      });
    }

    // Check access expiry
    if (purchase.accessExpiresAt && new Date() > purchase.accessExpiresAt) {
      return res.status(403).json({
        success: false,
        message: 'Access expired'
      });
    }

    // Check download limits
    if (purchase.maxDownloads && purchase.downloadCount >= purchase.maxDownloads) {
      return res.status(403).json({
        success: false,
        message: 'Download limit exceeded'
      });
    }

    const product = await DigitalProduct.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update download count
    await ProductPurchase.findByIdAndUpdate(purchase._id, {
      $inc: { downloadCount: 1 },
      $push: {
        downloads: {
          fileName: 'Product Files',
          downloadedAt: new Date(),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      }
    });

    res.json({
      success: true,
      data: {
        files: product.files,
        bonusContent: product.bonusContent
      },
      message: 'Download links provided'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/digital-products/:id
// @desc    Update digital product
// @access  Private (Expert who created it)
router.put('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid product ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const product = await DigitalProduct.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert || product.expertId.toString() !== expert._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    const updatedProduct = await DigitalProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/digital-products/:id
// @desc    Delete digital product
// @access  Private (Expert who created it)
router.delete('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid product ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const product = await DigitalProduct.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert || product.expertId.toString() !== expert._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await DigitalProduct.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
