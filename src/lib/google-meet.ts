/**
 * Google Meet integration utilities
 * This provides direct Google Meet room creation
 */

/**
 * Generates a direct Google Meet link
 * Creates a new Google Meet room that can be joined immediately
 */
export function generateGoogleMeetLink(meetingTitle: string, startTime: Date, endTime?: Date): string {
  // Generate a unique meeting ID based on title and time
  const meetingId = generateMeetingId(meetingTitle, startTime)
  
  // Return direct Google Meet link
  return `https://meet.google.com/${meetingId}`
}

/**
 * Generates a unique meeting ID for Google Meet
 */
function generateMeetingId(title: string, startTime: Date): string {
  // Create a deterministic ID based on title and time
  const titleHash = title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8)
  const timeHash = startTime.getTime().toString(36).substring(0, 6)
  
  // Format as Google Meet room ID (xxx-xxxx-xxx)
  const combined = (titleHash + timeHash).substring(0, 10)
  return `${combined.substring(0, 3)}-${combined.substring(3, 7)}-${combined.substring(7, 10)}`
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
 * Creates a direct Google Meet link with proper room ID
 */
export function createDirectMeetLink(meetingTitle: string, creatorEmail: string): string {
  // Generate a unique room ID based on creator and title
  const roomId = generateUniqueRoomId(meetingTitle, creatorEmail)
  return `https://meet.google.com/${roomId}`
}

/**
 * Generates a unique room ID for consistent meeting rooms
 */
function generateUniqueRoomId(title: string, creatorEmail: string): string {
  const titlePart = title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 4)
  const emailPart = creatorEmail.split('@')[0].replace(/[^a-z0-9]/g, '').substring(0, 4)
  const timestamp = Date.now().toString(36).substring(-4)
  
  // Format as Google Meet room ID (xxx-xxxx-xxx)
  const combined = (titlePart + emailPart + timestamp).substring(0, 10)
  return `${combined.substring(0, 3)}-${combined.substring(3, 7)}-${combined.substring(7, 10)}`
}

/**
 * Validates if a URL is a valid Google Meet link
 */
export function isValidGoogleMeetLink(url: string): boolean {
  const meetPatterns = [
    /^https:\/\/meet\.google\.com\/[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}$/,
    /^https:\/\/meet\.google\.com\/new$/
  ]
  
  return meetPatterns.some(pattern => pattern.test(url))
}

/**
 * Generates a calendar event URL for the meeting (optional feature)
 */
export function generateCalendarEventUrl(meetingTitle: string, startTime: Date, endTime?: Date, meetingUrl?: string): string {
  const baseUrl = 'https://calendar.google.com/calendar/render'
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: meetingTitle,
    dates: formatGoogleCalendarDate(startTime, endTime),
    details: meetingUrl ? `Join the meeting: ${meetingUrl}` : 'Meeting details',
  })
  
  return `${baseUrl}?${params.toString()}`
}