import express from 'express';
import { body, validationResult, param } from 'express-validator';
import { protect } from '../middleware/auth';
import Course from '../models/Course';
import Expert from '../models/Expert';

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all published courses with filters
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const {
      category,
      level,
      expertId,
      search,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    const filter: any = { isPublished: true };
    
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (expertId) filter.expertId = expertId;
    
    if (search && typeof search === 'string') {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const skip = (Number(page) - 1) * Number(limit);

    const courses = await Course.find(filter)
      .populate('expertId', 'title company rating totalReviews')
      .sort({ [sort as string]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      data: {
        courses,
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

// @route   GET /api/courses/featured
// @desc    Get featured courses
// @access  Public
router.get('/featured', async (req, res, next) => {
  try {
    const courses = await Course.find({ 
      isPublished: true, 
      isFeatured: true 
    })
    .populate('expertId', 'title company rating totalReviews')
    .sort({ enrollmentCount: -1 })
    .limit(6);

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Public
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid course ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const course = await Course.findById(req.params.id)
      .populate('expertId', 'title company description rating totalReviews expertise');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (Expert only)
router.post('/', protect, [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 100, max: 2000 })
    .withMessage('Description must be between 100 and 2000 characters'),
  body('shortDescription')
    .notEmpty()
    .withMessage('Short description is required')
    .isLength({ max: 200 })
    .withMessage('Short description cannot exceed 200 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .notEmpty()
    .withMessage('Category is required'),
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid level'),
  body('lessons')
    .isArray({ min: 1 })
    .withMessage('At least one lesson is required'),
  body('thumbnail')
    .notEmpty()
    .withMessage('Thumbnail is required')
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
        message: 'Only experts can create courses'
      });
    }

    const courseData = {
      ...req.body,
      expertId: expert._id,
      duration: req.body.lessons.reduce((total: number, lesson: any) => total + lesson.duration, 0)
    };

    const course = new Course(courseData);
    await course.save();

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Course owner only)
router.put('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid course ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user owns this course
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert || course.expertId.toString() !== expert._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    // Update duration if lessons changed
    if (req.body.lessons) {
      req.body.duration = req.body.lessons.reduce((total: number, lesson: any) => total + lesson.duration, 0);
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedCourse
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Course owner only)
router.delete('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid course ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user owns this course
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert || course.expertId.toString() !== expert._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 