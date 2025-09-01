import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Availability from '../models/Availability';

dotenv.config();

const testAvailability = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido';
    console.log('🔌 Connecting to MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Test creating a sample availability
    const testData = {
      mentorId: new mongoose.Types.ObjectId('68acbe18dc27479e2cb02d00'), // Your mentor ID
      user_id: '1533', // 4-digit user ID
      availabilityPeriods: [
        {
          _id: new mongoose.Types.ObjectId(),
          dateRange: {
            startDate: new Date('2025-01-15'),
            endDate: new Date('2025-01-31')
          },
          timeSlots: [
            {
              dayOfWeek: 1,
              startTime: '09:00',
              endTime: '17:00',
              isAvailable: true
            },
            {
              dayOfWeek: 2,
              startTime: '09:00',
              endTime: '17:00',
              isAvailable: true
            }
          ],
          notes: 'Test availability',
          isActive: true,
          createdAt: new Date()
        }
      ]
    };



    console.log('🔍 Testing availability creation with data:', testData);

    const availability = await Availability.create(testData);
    console.log('✅ Successfully created availability:', availability);

    // Test finding the availability
    const found = await Availability.findById(availability._id);
    console.log('🔍 Found availability:', found);

    // Test finding by mentor ID
    const mentorAvailabilities = await Availability.find({ 
      mentorId: testData.mentorId 
    });
    console.log('🔍 Found availabilities for mentor:', mentorAvailabilities);

    // Clean up test data
    await Availability.findByIdAndDelete(availability._id);
    console.log('🧹 Cleaned up test data');

  } catch (error) {
    console.error('❌ Error testing availability:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

testAvailability();
