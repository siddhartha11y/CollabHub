/**
 * Google Meet integration utilities
 * This creates new Google Meet rooms that work immediately
 */

/**
 * Generates a direct Google Meet link that creates a new room
 * Uses Google Meet's "new" endpoint which creates an instant room
 */
export function generateGoogleMeetLink(meetingTitle: string, startTime: Date, endTime?: Date): string {
  // Use Google Meet's instant room creation
  // This creates a new room every time, which is what we want
  return 'https://meet.google.com/new'
}

/**
 * Alternative: Generate a consistent meeting room based on meeting details
 * This creates the same room ID for the same meeting
 */
export function generateConsistentMeetLink(meetingTitle: string, creatorEmail: string, startTime: Date): string {
  // Create a hash from meeting details for consistent room ID
  const meetingData = `${meetingTitle}-${creatorEmail}-${startTime.toISOString().split('T')[0]}`
  const hash = simpleHash(meetingData)
  
  // Format as valid Google Meet room ID
  const roomId = formatAsGoogleMeetId(hash)
  return `https://meet.google.com/${roomId}`
}

/**
 * Simple hash function for generating consistent IDs
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Format hash as Google Meet room ID (xxx-xxxx-xxx)
 */
function formatAsGoogleMeetId(hash: string): string {
  // Pad with random characters if needed
  const padded = (hash + 'abcdefghijk').substring(0, 10)
  return `${padded.substring(0, 3)}-${padded.substring(3, 7)}-${padded.substring(7, 10)}`
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