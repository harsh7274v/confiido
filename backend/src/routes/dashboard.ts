import express from 'express';
import { protect } from '../middleware/auth';
import { 
  getDashboardData, 
  updateUserProfile, 
  updateUserSettings,
  createGoal,
  updateGoal,
  deleteGoal,
  getGoals,
  updateSetupSteps,
  getSetupSteps
} from '../services/dashboardService';

const router = express.Router();

// Apply authentication middleware to all dashboard routes
router.use(protect);

// Get dashboard data
router.get('/', getDashboardData);

// User profile management
router.put('/profile', updateUserProfile);

// User settings management
router.put('/settings', updateUserSettings);

// Goal management
router.get('/goals', getGoals);
router.post('/goals', createGoal);
router.put('/goals/:goalId', updateGoal);
router.delete('/goals/:goalId', deleteGoal);

// Setup steps management
router.get('/setup-steps', getSetupSteps);
router.put('/setup-steps', updateSetupSteps);

export default router;
