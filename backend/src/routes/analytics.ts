import express from 'express';
import { query, param, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { Analytics, UserActivity, ExpertPerformance } from '../models/Analytics';
import Expert from '../models/Expert';

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics for expert
// @access  Private (Expert only)
router.get('/dashboard', protect, [
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
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

    const period = req.query.period as string || 'monthly';
    
    // Calculate date range if not provided
    let startDate: Date, endDate: Date;
    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate as string);
      endDate = new Date(req.query.endDate as string);
    } else {
      endDate = new Date();
      switch (period) {
        case 'daily':
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'yearly':
          startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
        default:
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    // Get analytics for the period
    const analytics = await Analytics.findOne({
      expertId: expert._id,
      period,
      startDate: { $lte: startDate },
      endDate: { $gte: endDate }
    });

    // Get performance data
    const performance = await ExpertPerformance.findOne({
      expertId: expert._id
    });

    // Get recent activities
    const recentActivities = await UserActivity.find({
      expertId: expert._id,
      timestamp: { $gte: startDate, $lte: endDate }
    })
    .sort({ timestamp: -1 })
    .limit(20);

    res.json({
      success: true,
      data: {
        analytics: analytics || {},
        performance: performance || {},
        recentActivities,
        period: {
          startDate,
          endDate,
          period
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/revenue
// @desc    Get revenue analytics for expert
// @access  Private (Expert only)
router.get('/revenue', protect, [
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('groupBy').optional().isIn(['day', 'week', 'month'])
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

    const period = req.query.period as string || 'monthly';
    const groupBy = req.query.groupBy as string || 'month';

    // Get revenue analytics with breakdown by service type
    const analytics = await Analytics.find({
      expertId: expert._id,
      period
    })
    .sort({ startDate: -1 })
    .limit(12); // Last 12 periods

    // Calculate revenue trends
    const revenueData = analytics.map(item => ({
      period: item.startDate,
      total: item.revenue.total,
      byService: item.revenue.byService,
      growth: item.revenue.growth,
      currency: item.revenue.currency
    }));

    // Calculate totals
    const totalRevenue = analytics.reduce((sum, item) => sum + item.revenue.total, 0);
    const averageRevenue = totalRevenue / Math.max(analytics.length, 1);

    res.json({
      success: true,
      data: {
        revenueData,
        summary: {
          totalRevenue,
          averageRevenue,
          currency: analytics[0]?.revenue.currency || 'USD',
          periodsAnalyzed: analytics.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/bookings
// @desc    Get booking analytics for expert
// @access  Private (Expert only)
router.get('/bookings', protect, [
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly'])
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

    const period = req.query.period as string || 'monthly';

    const analytics = await Analytics.find({
      expertId: expert._id,
      period
    })
    .sort({ startDate: -1 })
    .limit(12);

    const bookingData = analytics.map(item => ({
      period: item.startDate,
      total: item.bookings.total,
      completed: item.bookings.completed,
      cancelled: item.bookings.cancelled,
      noShow: item.bookings.noShow,
      rescheduled: item.bookings.rescheduled,
      conversionRate: item.bookings.conversionRate,
      averageSessionValue: item.bookings.averageSessionValue,
      repeatBookingRate: item.bookings.repeatBookingRate
    }));

    res.json({
      success: true,
      data: bookingData
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/performance
// @desc    Get performance metrics for expert
// @access  Private (Expert only)
router.get('/performance', protect, async (req, res, next) => {
  try {
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      return res.status(403).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    const performance = await ExpertPerformance.findOne({
      expertId: expert._id
    });

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'Performance data not available'
      });
    }

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/audience
// @desc    Get audience demographics and geography
// @access  Private (Expert only)
router.get('/audience', protect, [
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly'])
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

    const period = req.query.period as string || 'monthly';

    const analytics = await Analytics.findOne({
      expertId: expert._id,
      period
    })
    .sort({ startDate: -1 });

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Analytics data not available'
      });
    }

    res.json({
      success: true,
      data: {
        demographics: analytics.demographics,
        geography: analytics.geography,
        trafficSources: analytics.trafficSources,
        engagement: analytics.engagement
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/analytics/activity
// @desc    Track user activity
// @access  Private/Public
router.post('/activity', [
  // This can be called without authentication for anonymous tracking
], async (req, res, next) => {
  try {
    const activityData = {
      userId: req.user?.id,
      expertId: req.body.expertId,
      activityType: req.body.activityType,
      relatedEntity: req.body.relatedEntity,
      metadata: {
        ...req.body.metadata,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    };

    const activity = new UserActivity(activityData);
    await activity.save();

    res.json({
      success: true,
      message: 'Activity tracked'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/courses
// @desc    Get course analytics for expert
// @access  Private (Expert only)
router.get('/courses', protect, [
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly'])
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

    const period = req.query.period as string || 'monthly';

    const analytics = await Analytics.find({
      expertId: expert._id,
      period
    })
    .sort({ startDate: -1 })
    .limit(12);

    const courseData = analytics.map(item => ({
      period: item.startDate,
      enrollments: item.courses.totalEnrollments,
      completionRate: item.courses.completionRate,
      averageRating: item.courses.averageRating,
      totalWatchTime: item.courses.totalWatchTime,
      dropOffPoints: item.courses.dropOffPoints
    }));

    res.json({
      success: true,
      data: courseData
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/compare
// @desc    Compare performance with similar experts
// @access  Private (Expert only)
router.get('/compare', protect, async (req, res, next) => {
  try {
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      return res.status(403).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    // Get performance data for current expert
    const userPerformance = await ExpertPerformance.findOne({
      expertId: expert._id
    });

    if (!userPerformance) {
      return res.status(404).json({
        success: false,
        message: 'Performance data not available'
      });
    }

    // Get average performance for experts in same category
    const similarExperts = await ExpertPerformance.find({
      'marketPosition.category': userPerformance.marketPosition.category,
      expertId: { $ne: expert._id }
    });

    // Calculate averages
    const avgPerformance = {
      performanceScore: similarExperts.reduce((sum, exp) => sum + exp.performanceScore, 0) / similarExperts.length,
      responseTime: similarExperts.reduce((sum, exp) => sum + exp.metrics.responseTime.average, 0) / similarExperts.length,
      clientSatisfaction: similarExperts.reduce((sum, exp) => sum + exp.metrics.clientSatisfaction.averageRating, 0) / similarExperts.length,
      availability: similarExperts.reduce((sum, exp) => sum + exp.metrics.availability.percentage, 0) / similarExperts.length
    };

    res.json({
      success: true,
      data: {
        userPerformance: {
          performanceScore: userPerformance.performanceScore,
          responseTime: userPerformance.metrics.responseTime.average,
          clientSatisfaction: userPerformance.metrics.clientSatisfaction.averageRating,
          availability: userPerformance.metrics.availability.percentage,
          ranking: userPerformance.marketPosition.ranking,
          percentile: userPerformance.marketPosition.percentile
        },
        categoryAverage: avgPerformance,
        comparison: {
          performanceScore: userPerformance.performanceScore - avgPerformance.performanceScore,
          responseTime: avgPerformance.responseTime - userPerformance.metrics.responseTime.average, // Lower is better
          clientSatisfaction: userPerformance.metrics.clientSatisfaction.averageRating - avgPerformance.clientSatisfaction,
          availability: userPerformance.metrics.availability.percentage - avgPerformance.availability
        },
        totalExpertsInCategory: similarExperts.length + 1
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/export
// @desc    Export analytics data
// @access  Private (Expert only)
router.get('/export', protect, [
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('format').optional().isIn(['json', 'csv'])
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

    const period = req.query.period as string || 'monthly';
    const format = req.query.format as string || 'json';

    // Build date filter
    const dateFilter: any = { expertId: expert._id, period };
    if (req.query.startDate) {
      dateFilter.startDate = { $gte: new Date(req.query.startDate as string) };
    }
    if (req.query.endDate) {
      dateFilter.endDate = { $lte: new Date(req.query.endDate as string) };
    }

    const analytics = await Analytics.find(dateFilter)
      .sort({ startDate: 1 });

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = analytics.map(item => ({
        period: item.startDate.toISOString().split('T')[0],
        totalRevenue: item.revenue.total,
        totalBookings: item.bookings.total,
        completedBookings: item.bookings.completed,
        profileViews: item.engagement.profileViews,
        conversionRate: item.bookings.conversionRate,
        averageRating: item.reviews.averageRating
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv');
      
      // Simple CSV conversion (in production, use a proper CSV library)
      const csvContent = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      res.send(csvContent);
    } else {
      res.json({
        success: true,
        data: analytics
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
