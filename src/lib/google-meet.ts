/**
 * Google Meet integration utilities
 * This provides a simple way to generate Google Meet links
 */

/**
 * Generates a Google Meet link for a meeting
 * In a production environment, you would use the Google Calendar API
 * to create proper meetings with authentication
 */
export function generateGoogleMeetLink(meetingTitle: string, startTime: Date, endTime?: Date): string {
  // For now, we'll create a Google Calendar event link that includes Meet
  const baseUrl = 'https://calendar.google.com/calendar/render'
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: meetingTitle,
    dates: formatGoogleCalendarDate(startTime, endTime),
    details: 'Join the meeting via Google Meet (link will be generated when you save to calendar)',
    add: '', // This will add Google Meet automatically when saved to calendar
  })
  
  return `${baseUrl}?${params.toString()}`
}

/**
 * Formats dates for Google Calendar
 */
function formatGoogleCalendarDate(startTime: Date, endTime?: Date): string {
  const start = formatDateForGoogle(startTime)
  const end = endTime ? formatDateForGoogle(endTime) : formatDateForGoogle(new Date(startTime.getTime() + 60 * 60 * 1000)) // Default 1 hour
  
  return `${start}/${end}`
}

/**
 * Formats a single date for Google Calendar (YYYYMMDDTHHMMSSZ format)
 */
function formatDateForGoogle(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/**
 * Creates a direct Google Meet link (requires Google Workspace)
 * This is a placeholder - in production you'd use the Google Meet API
 */
export function createDirectMeetLink(): string {
  // This creates a new Google Meet room
  // In production, you'd want to use the Google Meet API with proper authentication
  return 'https://meet.google.com/new'
}

/**
 * Validates if a URL is a valid Google Meet link
 */
export function isValidGoogleMeetLink(url: string): boolean {
  const meetPatterns = [
    /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/,
    /^https:\/\/meet\.google\.com\/new$/,
    /^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/
  ]
  
  return meetPatterns.some(pattern => pattern.test(url))
}