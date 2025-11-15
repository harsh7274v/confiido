# Session Time & Timezone - Quick Reference

## Important: How Session Times Work

### Data Storage
```typescript
// In MongoDB (Booking model)
{
  scheduledDate: Date,    // e.g., 2025-01-15T00:00:00.000Z
  startTime: "14:00",     // HH:mm format (24-hour)
  endTime: "15:00",       // HH:mm format (24-hour)
  duration: 60            // minutes
}
```

### Timezone Assumption
**All times are assumed to be in IST (Asia/Kolkata, UTC+5:30)**

### Creating Google Calendar Events
```typescript
// ✅ CORRECT WAY (as implemented)
const dateStr = scheduledDate.toISOString().split('T')[0]; // "2025-01-15"
const startISO = `${dateStr}T${startTime.padStart(5, '0')}:00+05:30`; // "2025-01-15T14:00:00+05:30"
const endISO = `${dateStr}T${endTime.padStart(5, '0')}:00+05:30`;     // "2025-01-15T15:00:00+05:30"

await calendar.events.insert({
  start: { dateTime: startISO, timeZone: 'Asia/Kolkata' },
  end: { dateTime: endISO, timeZone: 'Asia/Kolkata' }
});

// ❌ WRONG WAY (DO NOT USE)
const start = new Date(scheduledDate);
start.setHours(14, 0, 0, 0); // This uses server's local timezone!
```

### Sending Emails
```typescript
// Times are sent as-is with timezone label
{
  sessionDate: "Monday, January 15, 2025",
  startTime: "14:00",
  endTime: "15:00",
  timeZone: "IST"
}
// Email displays: "14:00 – 15:00 IST"
```

### Common Pitfalls
1. ❌ Using `setHours()` without timezone context
2. ❌ Assuming server timezone matches user timezone
3. ❌ Converting to ISO without explicit timezone offset
4. ❌ Using `new Date()` with time strings directly

### Testing Checklist
- [ ] Email shows correct time in IST
- [ ] Google Calendar invite shows correct time in IST
- [ ] Meeting link works at scheduled IST time
- [ ] Times match between email and calendar
- [ ] Works regardless of server timezone

---
**File**: `backend/src/services/googleCalendar.ts`
**Last Updated**: Session timezone fix applied
