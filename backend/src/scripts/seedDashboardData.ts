import mongoose from 'mongoose';
import User from '../models/User';
import { Goal } from '../models/Goal';
import { SetupStep } from '../models/SetupStep';
import dotenv from 'dotenv';

dotenv.config();

const setupSteps = [
  {
    title: 'Add availability',
    description: 'Add your availability so clients can book sessions with you',
    action: 'Add availability',
    icon: 'Calendar',
    order: 1
  },
  {
    title: 'Complete your profile',
    description: 'Add your bio, expertise, and profile picture to attract clients',
    action: 'Complete profile',
    icon: 'Users',
    order: 2
  },
  {
    title: 'Create a service',
    description: 'Create your first service to start earning from consultations',
    action: 'Create service',
    icon: 'DollarSign',
    order: 3
  }
];

const goals = [
  {
    text: 'Complete my profile setup',
    completed: false
  },
  {
    text: 'Book my first client session',
    completed: false
  },
  {
    text: 'Earn $500 this month',
    completed: false
  }
];

async function seedDashboardData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lumina');
    console.log('Connected to MongoDB');

    // Find or create a test user
    let user = await User.findOne({ email: 'test@example.com' });
    
    if (!user) {
      user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        handle: 'test_user',
        userType: 'expert',
        avatar: '/api/placeholder/40/40'
      });
      await user.save();
      console.log('Created test user');
    }

    // Clear existing setup steps and goals for this user
    await SetupStep.deleteMany({ userId: user._id });
    await Goal.deleteMany({ userId: user._id });

    // Create setup steps
    const createdSteps = await Promise.all(
      setupSteps.map(step => 
        new SetupStep({
          userId: user._id,
          ...step,
          completed: false
        }).save()
      )
    );
    console.log(`Created ${createdSteps.length} setup steps`);

    // Create goals
    const createdGoals = await Promise.all(
      goals.map(goal => 
        new Goal({
          userId: user._id,
          ...goal
        }).save()
      )
    );
    console.log(`Created ${createdGoals.length} goals`);

    console.log('Dashboard data seeded successfully!');
    console.log(`User ID: ${user._id}`);
    console.log('You can now test the dashboard with this user.');

  } catch (error) {
    console.error('Error seeding dashboard data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedDashboardData(); 