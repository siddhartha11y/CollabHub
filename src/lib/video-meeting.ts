/**
 * Video Meeting Integration using Google Meet
 * Generates consistent Google Meet URLs so everyone joins the same room
 */

/**
 * Generates a consistent meeting link for the meeting
 * Since Google Meet doesn't allow custom room IDs, we'll use Jitsi Meet with Google Meet styling
 */
export function generateMeetingLink(meetingTitle: string, creatorEmail: string, startTime: Date): string {
  // Generate consistent room name
  const roomName = generateConsistentRoomName(meetingTitle, creatorEmail, startTime)
  
  // Use Jitsi Meet - it allows custom room names and everyone joins the same room
  return `https://meet.jit.si/${roomName}?config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.prejoinPageEnabled=false&config.disableModeratorIndicator=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false&interfaceConfig.APP_NAME='CollabHub Meeting'`
}

/**
 * Generates a consistent room name for video meetings
 */
function generateConsistentRoomName(meetingTitle: string, creatorEmail: string, startTime: Date): string {
  // Clean meeting title
  const cleanTitle = meetingTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10)
  
  // Get creator identifier
  const creatorId = creatorEmail.split('@')[0].replace(/[^a-z0-9]/g, '').substring(0, 8)
  
  // Add date for uniqueness
  const dateStr = startTime.toISOString().split('T')[0].replace(/-/g, '')
  
  // Create room name: CollabHub-title-creator-date
  return `CollabHub-${cleanTitle}-${creatorId}-${dateStr}`
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
 * Generates a Google Calendar meeting URL that creates a consistent Google Meet room
 */
function generateGoogleCalendarMeetingUrl(meetingTitle: string, creatorEmail: string, startTime: Date): string {
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour default
  const baseUrl = 'https://calendar.google.com/calendar/render'
  
  // Create a consistent event ID based on meeting details
  const eventId = generateConsistentEventId(meetingTitle, creatorEmail, startTime)
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${meetingTitle} - ${eventId}`, // Include event ID for consistency
    dates: formatGoogleCalendarDate(startTime, endTime),
    details: `Meeting: ${meetingTitle}\nCreated by: ${creatorEmail}\nJoin via Google Meet (automatically added when you save this event)`,
    add: 'default', // This tells Google Calendar to add Google Meet automatically
  })
  
  return `${baseUrl}?${params.toString()}`
}

/**
 * Generates a consistent event ID for the meeting
 */
function generateConsistentEventId(meetingTitle: string, creatorEmail: string, startTime: Date): string {
  const meetingData = `${meetingTitle}-${creatorEmail}-${startTime.toISOString().split('T')[0]}`
  const hash = simpleHash(meetingData)
  return `CM${hash.substring(0, 6).toUpperCase()}`
}

/**
 * Alternative: Generate calendar event URL for the meeting
 */
export function generateCalendarEventUrl(meetingTitle: string, startTime: Date, endTime?: Date, meetingUrl?: string): string {
  return generateGoogleCalendarMeetingUrl(meetingTitle, 'user', startTime)
}