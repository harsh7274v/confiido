import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';

const router = express.Router();

// @route   POST /api/reviews
// @desc    Create a review for an expert
// @access  Private
router.post('/', protect, [
  body('expertId')
    .notEmpty()
    .withMessage('Expert ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // TODO: Implement review creation
    res.status(201).json({
      success: true,
      message: 'Review created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/reviews/expert/:expertId
// @desc    Get reviews for an expert
// @access  Public
router.get('/expert/:expertId', async (req, res, next) => {
  try {
    // TODO: Implement review retrieval
    res.json({
      success: true,
      data: { reviews: [] }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 