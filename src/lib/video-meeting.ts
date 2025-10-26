/**
 * Video Meeting Integration using Google Meet
 * Generates consistent Google Meet URLs so everyone joins the same room
 */

/**
 * Generates a consistent Google Meet link for the meeting
 * Creates the same URL for all participants so they join the same room
 */
export function generateMeetingLink(meetingTitle: string, creatorEmail: string, startTime: Date): string {
  // Generate a consistent Google Meet room ID
  const roomId = generateGoogleMeetRoomId(meetingTitle, creatorEmail, startTime)
  
  // Return Google Meet URL with consistent room ID
  return `https://meet.google.com/${roomId}`
}

/**
 * Generates a consistent Google Meet room ID
 * Same meeting details always generate the same room ID
 */
function generateGoogleMeetRoomId(meetingTitle: string, creatorEmail: string, startTime: Date): string {
  // Create a deterministic hash from meeting details
  const meetingData = `${meetingTitle}-${creatorEmail}-${startTime.toISOString().split('T')[0]}`
  const hash = simpleHash(meetingData)
  
  // Convert to Google Meet room format (xxx-xxxx-xxx)
  const roomId = formatAsGoogleMeetRoomId(hash)
  return roomId
}

/**
 * Simple hash function for consistent room ID generation
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).padStart(8, '0')
}

/**
 * Format hash as Google Meet room ID (xxx-xxxx-xxx)
 */
function formatAsGoogleMeetRoomId(hash: string): string {
  // Ensure we have enough characters
  const padded = (hash + 'abcdefghijk').substring(0, 10)
  
  // Format as Google Meet room ID
  return `${padded.substring(0, 3)}-${padded.substring(3, 7)}-${padded.substring(7, 10)}`
}

/**
 * Alternative: Generate Google Meet link (keeping for backward compatibility)
 */
export function generateGoogleMeetLink(meetingTitle: string, startTime: Date, endTime?: Date): string {
  // Use the same consistent room generation
  const roomId = generateGoogleMeetRoomId(meetingTitle, 'default', startTime)
  return `https://meet.google.com/${roomId}`
}

/**
 * Get meeting room information for Google Meet
 */
export function getMeetingConfig(meetingTitle: string, creatorEmail: string, startTime: Date) {
  const roomId = generateGoogleMeetRoomId(meetingTitle, creatorEmail, startTime)
  return {
    roomId,
    meetingUrl: `https://meet.google.com/${roomId}`,
    isGoogleMeet: true
  }
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
 * Creates a direct Google Meet link with consistent room ID
 */
export function createDirectMeetLink(meetingTitle: string, creatorEmail: string, startTime: Date): string {
  return generateMeetingLink(meetingTitle, creatorEmail, startTime)
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