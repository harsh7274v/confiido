import express from 'express';
import { body, validationResult, param } from 'express-validator';
import { protect } from '../middleware/auth';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';
import Expert from '../models/Expert';

const router = express.Router();

// @route   POST /api/enrollments
// @desc    Enroll in a course
// @access  Private
router.post('/', protect, [
  body('courseId')
    .isMongoId()
    .withMessage('Valid course ID is required'),
  body('paymentAmount')
    .isFloat({ min: 0 })
    .withMessage('Payment amount must be a positive number')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { courseId, paymentAmount, currency = 'USD' } = req.body;

    // Check if course exists and is published
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Course is not available for enrollment'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      userId: req.user.id,
      courseId: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    const enrollment = new Enrollment({
      userId: req.user.id,
      courseId: courseId,
      expertId: course.expertId,
      paymentAmount,
      currency
    });

    await enrollment.save();

    // Update course enrollment count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrollmentCount: 1 }
    });

    res.status(201).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/enrollments/my-courses
// @desc    Get user's enrolled courses
// @access  Private
router.get('/my-courses', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const enrollments = await Enrollment.find({ 
      userId: req.user.id,
      isActive: true 
    })
    .populate({
      path: 'courseId',
      populate: {
        path: 'expertId',
        select: 'title company rating totalReviews'
      }
    })
    .sort({ lastAccessedAt: -1 })
    .skip(skip)
    .limit(Number(limit));

    const total = await Enrollment.countDocuments({ 
      userId: req.user.id,
      isActive: true 
    });

    res.json({
      success: true,
      data: {
        enrollments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/enrollments/:id
// @desc    Get enrollment details
// @access  Private
router.get('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid enrollment ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const enrollment = await Enrollment.findById(req.params.id)
      .populate({
        path: 'courseId',
        populate: {
          path: 'expertId',
          select: 'title company description rating totalReviews'
        }
      });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user owns this enrollment
    if (enrollment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this enrollment'
      });
    }

    res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/enrollments/:id/progress
// @desc    Update course progress
// @access  Private
router.put('/:id/progress', protect, [
  param('id').isMongoId().withMessage('Invalid enrollment ID'),
  body('completedLessons')
    .isArray()
    .withMessage('Completed lessons must be an array'),
  body('currentLesson')
    .optional()
    .isMongoId()
    .withMessage('Current lesson must be a valid ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { completedLessons, currentLesson } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user owns this enrollment
    if (enrollment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this enrollment'
      });
    }

    // Get course to calculate progress
    const course = await Course.findById(enrollment.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const totalLessons = course.lessons.length;
    const progress = Math.round((completedLessons.length / totalLessons) * 100);

    // Check if course is completed
    let completionDate = enrollment.completionDate;
    if (progress === 100 && !enrollment.completionDate) {
      completionDate = new Date();
    }

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      {
        completedLessons,
        currentLesson,
        progress,
        completionDate,
        lastAccessedAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      data: updatedEnrollment
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/enrollments/expert/:expertId
// @desc    Get enrollments for expert's courses
// @access  Private (Expert only)
router.get('/expert/:expertId', protect, [
  param('expertId').isMongoId().withMessage('Invalid expert ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if user is the expert
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert || expert._id.toString() !== req.params.expertId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these enrollments'
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const enrollments = await Enrollment.find({ 
      expertId: req.params.expertId 
    })
    .populate('userId', 'name email')
    .populate('courseId', 'title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

    const total = await Enrollment.countDocuments({ 
      expertId: req.params.expertId 
    });

    res.json({
      success: true,
      data: {
        enrollments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 