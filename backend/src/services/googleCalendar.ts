import { google } from 'googleapis';
import mongoose from 'mongoose';
import { CalendarIntegration } from '../models/Calendar';

type CreateMeetEventParams = {
  expertUserObjectId: mongoose.Types.ObjectId;
  clientEmail: string;
  expertEmail: string;
  title: string;
  description?: string;
  scheduledDate: Date; // date portion is used
  startTime: string; // HH:mm (24h)
  endTime: string;   // HH:mm (24h)
};

export async function createMeetEventForSession(params: CreateMeetEventParams): Promise<{ hangoutLink?: string; eventId?: string; calendarId?: string }> {
  const {
    expertUserObjectId,
    clientEmail,
    expertEmail,
    title,
    description,
    scheduledDate,
    startTime,
    endTime
  } = params;

  console.log('🔍 [DEBUG] createMeetEventForSession called with:', {
    expertUserObjectId: String(expertUserObjectId),
    clientEmail,
    expertEmail,
    title,
    scheduledDate: scheduledDate.toISOString(),
    startTime,
    endTime
  });

  // Prefer centralized Google account credentials if provided via env
  const centralClientId = process.env.GOOGLE_CLIENT_ID;
  const centralClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const centralRedirectUri = process.env.GOOGLE_REDIRECT_URI;
  const centralRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const centralCalendarId = process.env.GOOGLE_CALENDAR_ID; // optional; defaults to 'primary'

  console.log('🔍 [DEBUG] Environment variables check:', {
    centralClientId: centralClientId ? 'Set' : 'Not set',
    centralClientSecret: centralClientSecret ? 'Set' : 'Not set',
    centralRedirectUri: centralRedirectUri ? 'Set' : 'Not set',
    centralRefreshToken: centralRefreshToken ? 'Set' : 'Not set',
    centralCalendarId: centralCalendarId || 'primary'
  });

  // Check if the scheduled date is in the past
  const now = new Date();
  const scheduledDateTime = new Date(scheduledDate);
  scheduledDateTime.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]), 0, 0);
  
  console.log('🔍 [DEBUG] Date validation:', {
    now: now.toISOString(),
    scheduledDateTime: scheduledDateTime.toISOString(),
    isPastDate: scheduledDateTime < now,
    timeDifference: scheduledDateTime.getTime() - now.getTime()
  });

  if (scheduledDateTime < now) {
    console.warn('⚠️ [DEBUG] Scheduled date is in the past - Google Calendar may reject this event');
    console.warn('⚠️ [DEBUG] This could cause the API to fail and fallback to Jitsi');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  let calendarIdToUse: string | undefined;
  let timeZoneToUse = 'UTC';

  // Use central confiido.io@gmail.com account as organizer
  if (centralClientId && centralClientSecret && centralRedirectUri && centralRefreshToken) {
    // Use centralized confiido.io@gmail.com account as organizer
    console.info('[Calendar] Using central Google credentials (confiido.io@gmail.com as organizer)');
    oauth2Client.setCredentials({ refresh_token: centralRefreshToken });
    calendarIdToUse = centralCalendarId || 'primary';
    timeZoneToUse = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } else {
    // Fallback: try mentor's own integration if central credentials not available
    const integration = await CalendarIntegration.findOne({
      userId: expertUserObjectId,
      provider: 'google',
      isActive: true
    });

    if (integration) {
      console.info('[Calendar] Using mentor Google integration as fallback for user:', String(expertUserObjectId));
      oauth2Client.setCredentials({
        access_token: (integration as any).accessToken,
        refresh_token: integration.refreshToken,
      });
      calendarIdToUse = integration.calendarMapping?.bookingsCalendarId || integration.calendarId || 'primary';
      timeZoneToUse = integration.timezone || timeZoneToUse;
    } else {
      // No credentials available → provide a fallback link
      try {
        const [sHour, sMin] = startTime.split(':').map(n => parseInt(n, 10));
        const start = new Date(scheduledDate);
        start.setHours(sHour, sMin, 0, 0);
        const fallbackSlugBase = `${title || 'Session'}-${start.toISOString()}`
          .replace(/[^a-zA-Z0-9]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 100);
        const hangoutLink = `https://meet.jit.si/${fallbackSlugBase}`;
        console.warn('[Calendar] Google credentials/integration missing. Using fallback link:', hangoutLink);
        return { hangoutLink };
      } catch (e) {
        console.warn('[Calendar] Failed to generate fallback meeting link:', e);
        return {};
      }
    }
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Build start/end Date objects from scheduledDate + HH:mm strings
  const [sHour, sMin] = startTime.split(':').map(n => parseInt(n, 10));
  const [eHour, eMin] = endTime.split(':').map(n => parseInt(n, 10));
  const start = new Date(scheduledDate);
  start.setHours(sHour, sMin, 0, 0);
  const end = new Date(scheduledDate);
  end.setHours(eHour, eMin, 0, 0);

  const timeZone = timeZoneToUse;
  const calendarId = calendarIdToUse || 'primary';

  try {
    const attendees = [
      ...(expertEmail ? [{ email: expertEmail, responseStatus: 'accepted' }] : []),
      ...(clientEmail ? [{ email: clientEmail, responseStatus: 'accepted' }] : []),
    ];

    console.log('🔍 [DEBUG] Creating Google Calendar event with confiido.io@gmail.com as organizer and attendees:', attendees);

    const resp = await calendar.events.insert({
      calendarId,
      sendUpdates: 'all',
      requestBody: {
        summary: title,
        description: description || 'Booked via Lumina Platform',
        start: { dateTime: start.toISOString(), timeZone },
        end: { dateTime: end.toISOString(), timeZone },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 30 },
            { method: 'popup', minutes: 10 }
          ]
        },
        attendees,
        conferenceData: {
          createRequest: {
            requestId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        visibility: 'public',
        guestsCanModify: false,
        guestsCanSeeOtherGuests: true,
      },
      conferenceDataVersion: 1,
    });

    const event = resp.data;
    const hangoutLink = event.hangoutLink;

    console.log('🔍 [DEBUG] Google Calendar event created successfully:', {
      eventId: event.id,
      hangoutLink: hangoutLink,
      attendees: event.attendees,
      reminders: event.reminders,
      summary: event.summary,
      start: event.start,
      end: event.end
    });

    if (!hangoutLink) {
      console.warn('[Calendar] Event created but no hangoutLink returned. Falling back. eventId=', event.id);
      const fallbackSlugBase = `${title || 'Session'}-${start.toISOString()}`
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 100);
      const fallbackLink = `https://meet.jit.si/${fallbackSlugBase}`;
      return { hangoutLink: fallbackLink, eventId: event.id || undefined, calendarId };
    }

    console.info('[Calendar] Google Meet link created:', hangoutLink);
    return { hangoutLink, eventId: event.id || undefined, calendarId };
  } catch (error) {
    console.error('❌ [DEBUG] Failed to create Google Calendar event with Meet:', error);
    console.error('❌ [DEBUG] Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data
    });
    // On error, provide a deterministic fallback so session still has a link
    try {
      const [sHour, sMin] = startTime.split(':').map(n => parseInt(n, 10));
      const start = new Date(scheduledDate);
      start.setHours(sHour, sMin, 0, 0);
      const fallbackSlugBase = `${title || 'Session'}-${start.toISOString()}`
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 100);
      const hangoutLink = `https://meet.jit.si/${fallbackSlugBase}`;
      console.warn('⚠️ [DEBUG] Using Jitsi fallback link due to error:', hangoutLink);
      return { hangoutLink };
    } catch (e) {
      console.warn('❌ [DEBUG] Failed to generate fallback meeting link after error:', e);
      return {};
    }
  }
}


