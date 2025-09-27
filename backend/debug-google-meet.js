// Debug script to test Google Meet integration
require('dotenv').config();
const { google } = require('googleapis');

async function debugGoogleMeet() {
  console.log('🔍 Debugging Google Meet Integration...\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
  console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');
  console.log('GOOGLE_REFRESH_TOKEN:', process.env.GOOGLE_REFRESH_TOKEN ? 'Set' : 'Not set');
  console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);
  console.log('GOOGLE_CALENDAR_ID:', process.env.GOOGLE_CALENDAR_ID || 'primary');
  console.log('');

  // Test OAuth2 client
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    console.log('✅ OAuth2 client created successfully');
    
    // Test calendar access
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    console.log('✅ Calendar client created successfully');
    
    // Test creating a simple event
    const start = new Date(Date.now() + 24*60*60*1000);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start);
    end.setHours(11, 0, 0, 0);
    
    console.log('Creating test event...');
    const result = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: 'Debug Test Session',
        description: 'Testing Google Meet integration',
        start: { dateTime: start.toISOString(), timeZone: 'UTC' },
        end: { dateTime: end.toISOString(), timeZone: 'UTC' },
        attendees: [{ email: 'test@example.com' }],
        conferenceData: {
          createRequest: {
            requestId: Date.now().toString(),
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        }
      },
      conferenceDataVersion: 1
    });
    
    console.log('✅ Event created successfully!');
    console.log('Event ID:', result.data.id);
    console.log('Meet Link:', result.data.hangoutLink);
    
    if (result.data.hangoutLink?.includes('meet.google.com')) {
      console.log('🎉 SUCCESS: Google Meet link generated!');
    } else {
      console.log('❌ ERROR: No Google Meet link generated');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    console.error('Full error:', error);
  }
}

debugGoogleMeet().catch(console.error);
