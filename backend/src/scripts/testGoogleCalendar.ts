import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createMeetEventForSession } from '../services/googleCalendar';

dotenv.config();

async function testGoogleCalendar() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido';
    console.log('🔌 Connecting to MongoDB:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB successfully');

    // Test Google Calendar credentials
    console.log('\n🔍 Checking Google Calendar credentials:');
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
    console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
    console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI ? '✅ Set' : '❌ Missing');
    console.log('GOOGLE_REFRESH_TOKEN:', process.env.GOOGLE_REFRESH_TOKEN ? '✅ Set' : '❌ Missing');
    console.log('GOOGLE_CALENDAR_ID:', process.env.GOOGLE_CALENDAR_ID || '❌ Empty (will use primary)');

    // Test meeting link creation
    console.log('\n🧪 Testing meeting link creation...');
    
    const testParams = {
      expertUserObjectId: new mongoose.Types.ObjectId(), // Dummy ObjectId
      clientEmail: 'test@example.com',
      expertEmail: 'mentor@example.com',
      title: 'Test Session - Google Meet Integration',
      description: 'Testing Google Meet link generation',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      startTime: '10:00',
      endTime: '11:00'
    };

    console.log('Test parameters:', testParams);

    const result = await createMeetEventForSession(testParams);
    
    console.log('\n📋 Result:');
    console.log('Hangout Link:', result.hangoutLink);
    console.log('Event ID:', result.eventId);
    console.log('Calendar ID:', result.calendarId);
    
    if (result.hangoutLink?.includes('meet.jit.si')) {
      console.log('\n⚠️  WARNING: Jitsi fallback link generated instead of Google Meet!');
      console.log('This indicates an issue with Google Calendar integration.');
    } else if (result.hangoutLink?.includes('meet.google.com')) {
      console.log('\n✅ SUCCESS: Google Meet link generated successfully!');
    } else {
      console.log('\n❌ ERROR: No meeting link generated');
    }

  } catch (error) {
    console.error('❌ Error testing Google Calendar:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run if this script is executed directly
if (require.main === module) {
  testGoogleCalendar();
}

export default testGoogleCalendar;

