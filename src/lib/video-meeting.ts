/**
 * Video Meeting Integration using Jitsi Meet
 * Jitsi Meet provides reliable, free video conferencing with proper room sharing
 */

/**
 * Generates a Jitsi Meet link for the meeting
 * Creates a consistent room that all participants can join
 */
export function generateMeetingLink(meetingTitle: string, creatorEmail: string, startTime: Date): string {
  // Create a unique but consistent room name
  const roomName = generateRoomName(meetingTitle, creatorEmail, startTime)
  
  // Use Jitsi Meet - free, reliable, and works perfectly for team meetings
  return `https://meet.jit.si/${roomName}`
}

/**
 * Generates a unique room name for the meeting
 * Same meeting always gets the same room name
 */
function generateRoomName(meetingTitle: string, creatorEmail: string, startTime: Date): string {
  // Clean the meeting title for URL
  const cleanTitle = meetingTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10)
  
  // Get creator identifier
  const creatorId = creatorEmail.split('@')[0].replace(/[^a-z0-9]/g, '').substring(0, 8)
  
  // Add date for uniqueness
  const dateStr = startTime.toISOString().split('T')[0].replace(/-/g, '')
  
  // Create room name: title-creator-date
  return `${cleanTitle}-${creatorId}-${dateStr}`
}

/**
 * Alternative: Generate Google Meet link (keeping for backward compatibility)
 */
export function generateGoogleMeetLink(meetingTitle: string, startTime: Date, endTime?: Date): string {
  // For now, redirect to Jitsi Meet which actually works
  const roomName = generateRoomName(meetingTitle, 'user', startTime)
  return `https://meet.jit.si/${roomName}`
}

/**
 * Get meeting room configuration for Jitsi
 */
export function getMeetingConfig(meetingTitle: string, creatorName: string, isHost: boolean) {
  return {
    roomName: generateRoomName(meetingTitle, creatorName, new Date()),
    config: {
      startWithAudioMuted: !isHost,
      startWithVideoMuted: !isHost,
      enableWelcomePage: false,
      enableClosePage: false,
      prejoinPageEnabled: false,
      disableModeratorIndicator: false,
      moderatorPassword: isHost ? 'host123' : undefined
    }
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