// Test script to debug Google Meet service
require('dotenv').config();
const { google } = require('googleapis');
const mongoose = require('mongoose');

// Mock the CalendarIntegration model since we're not connecting to DB
const CalendarIntegration = {
  findOne: () => null // Return null to force central credentials usage
};

async function testGoogleMeetService() {
  console.log('🔍 Testing Google Meet Service...\n');
  
  try {
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
  console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');
  console.log('GOOGLE_REFRESH_TOKEN:', process.env.GOOGLE_REFRESH_TOKEN ? 'Set' : 'Not set');
  console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);
  console.log('GOOGLE_CALENDAR_ID:', process.env.GOOGLE_CALENDAR_ID || 'primary');
  console.log('');

  // Simulate the createMeetEventForSession function logic
  const expertUserObjectId = '507f1f77bcf86cd799439011';
  const clientEmail = 'client@example.com';
  const expertEmail = 'mentor@example.com';
  const title = 'VIDEO session with Client';
  const description = 'Test booking';
  const scheduledDate = new Date(Date.now() + 24*60*60*1000);
  const startTime = '10:00';
  const endTime = '11:00';

  // Check if central credentials are available
  const centralClientId = process.env.GOOGLE_CLIENT_ID;
  const centralClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const centralRedirectUri = process.env.GOOGLE_REDIRECT_URI;
  const centralRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const centralCalendarId = process.env.GOOGLE_CALENDAR_ID;

  console.log('Central credentials check:');
  console.log('centralClientId:', centralClientId ? 'Set' : 'Not set');
  console.log('centralClientSecret:', centralClientSecret ? 'Set' : 'Not set');
  console.log('centralRedirectUri:', centralRedirectUri ? 'Set' : 'Not set');
  console.log('centralRefreshToken:', centralRefreshToken ? 'Set' : 'Not set');
  console.log('');

  if (!centralClientId || !centralClientSecret || !centralRedirectUri || !centralRefreshToken) {
    console.log('❌ Missing central credentials - will fallback to Jitsi');
    return;
  }

  try {
    console.log('✅ Using central Google credentials');
    
    const oauth2Client = new google.auth.OAuth2(
      centralClientId,
      centralClientSecret,
      centralRedirectUri
    );
    
    oauth2Client.setCredentials({ refresh_token: centralRefreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Build start/end Date objects
    const [sHour, sMin] = startTime.split(':').map(n => parseInt(n, 10));
    const [eHour, eMin] = endTime.split(':').map(n => parseInt(n, 10));
    const start = new Date(scheduledDate);
    start.setHours(sHour, sMin, 0, 0);
    const end = new Date(scheduledDate);
    end.setHours(eHour, eMin, 0, 0);

    const timeZone = 'UTC';
    const calendarId = centralCalendarId || 'primary';

    console.log('Creating calendar event...');
    console.log('Title:', title);
    console.log('Start:', start.toISOString());
    console.log('End:', end.toISOString());
    console.log('Calendar ID:', calendarId);
    console.log('');

    const resp = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: title,
        description: description || 'Booked via Lumina Platform',
        start: { dateTime: start.toISOString(), timeZone },
        end: { dateTime: end.toISOString(), timeZone },
        attendees: [
          ...(expertEmail ? [{ email: expertEmail }] : []),
          ...(clientEmail ? [{ email: clientEmail }] : []),
        ],
        conferenceData: {
          createRequest: {
            requestId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
      conferenceDataVersion: 1,
    });

    const event = resp.data;
    const hangoutLink = event.hangoutLink;

    console.log('Event created successfully!');
    console.log('Event ID:', event.id);
    console.log('Meet Link:', hangoutLink);
    console.log('');

    if (!hangoutLink) {
      console.log('⚠️ Event created but no hangoutLink returned - will fallback to Jitsi');
      const fallbackSlugBase = `${title || 'Session'}-${start.toISOString()}`
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 100);
      const fallbackLink = `https://meet.jit.si/${fallbackSlugBase}`;
      console.log('Jitsi fallback link:', fallbackLink);
    } else {
      console.log('✅ Google Meet link created successfully!');
      if (hangoutLink.includes('meet.google.com')) {
        console.log('🎉 SUCCESS: Google Meet link generated!');
      } else {
        console.log('❌ Unexpected link format:', hangoutLink);
      }
    }

  } catch (error) {
    console.error('❌ Error creating Google Calendar event:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    console.log('');
    console.log('This error will cause fallback to Jitsi in your booking system');
  }
  } catch (error) {
    console.error('❌ Script error:', error.message);
    console.error('Full error:', error);
  }
}

testGoogleMeetService().catch(console.error);
