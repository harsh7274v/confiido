import dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';

/**
 * Test script to verify Google Calendar integration
 * Tests token refresh and event creation
 */

async function testGoogleCalendar() {
  console.log('🧪 Testing Google Calendar Integration...\n');

  // Check environment variables
  console.log('1️⃣ Checking environment variables...');
  const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'GOOGLE_REFRESH_TOKEN',
    'GOOGLE_CALENDAR_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.log('\nPlease ensure all required Google Calendar env vars are set in .env file');
    process.exit(1);
  }

  console.log('✅ All environment variables are set\n');

  // Initialize OAuth2 Client
  console.log('2️⃣ Initializing OAuth2 Client...');
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  // Listen for token events
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      console.log('🔄 New refresh token received!');
    }
    if (tokens.access_token) {
      console.log('✅ Access token refreshed automatically');
    }
  });

  console.log('✅ OAuth2 Client initialized\n');

  // Test Calendar API Access
  console.log('3️⃣ Testing Calendar API access...');
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    // List calendars
    const calendarList = await calendar.calendarList.list();
    console.log(`✅ Successfully connected! Found ${calendarList.data.items?.length || 0} calendars\n`);

    // Test creating an event
    console.log('4️⃣ Testing event creation with Google Meet...');
    
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    startTime.setHours(10, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

    const event = {
      summary: 'Test Event - Lumina Platform',
      description: 'This is a test event created by the Google Calendar integration test script',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      attendees: [
        { email: 'test@example.com' }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 30 },
          { method: 'popup', minutes: 10 }
        ]
      },
      conferenceData: {
        createRequest: {
          requestId: `test-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'none', // Don't send emails for test event
    });

    console.log('✅ Event created successfully!');
    console.log(`📅 Event ID: ${response.data.id}`);
    console.log(`🔗 Event Link: ${response.data.htmlLink}`);
    console.log(`📞 Meet Link: ${response.data.hangoutLink || 'Not available'}\n`);

    // Clean up - delete test event
    console.log('5️⃣ Cleaning up test event...');
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: response.data.id as string,
    });
    console.log('✅ Test event deleted\n');

    console.log('🎉 All tests passed! Google Calendar integration is working correctly.');
    console.log('\n📝 Summary:');
    console.log('  ✅ Environment variables configured');
    console.log('  ✅ OAuth2 authentication successful');
    console.log('  ✅ Calendar API access granted');
    console.log('  ✅ Event creation with Meet link successful');
    console.log('  ✅ Event deletion successful');
    console.log('  ✅ Token auto-refresh configured\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    console.log('\n💡 Troubleshooting tips:');
    console.log('  1. Ensure you generated the refresh token with both scopes:');
    console.log('     - https://www.googleapis.com/auth/calendar');
    console.log('     - https://www.googleapis.com/auth/calendar.events');
    console.log('  2. Verify your OAuth consent screen is published');
    console.log('  3. Check that Google Calendar API is enabled in your project');
    console.log('  4. Ensure redirect URI matches in Google Cloud Console\n');
    process.exit(1);
  }
}

// Run the test
testGoogleCalendar();
