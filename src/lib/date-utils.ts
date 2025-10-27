/**
 * Date utility functions for handling timezone conversions and formatting
 */

/**
 * Formats a date to local time string for datetime-local input
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Formats a date to display time in user's local timezone
 */
export function formatDisplayTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })
}

/**
 * Formats a date to display date and time in user's local timezone
 */
export function formatDisplayDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Checks if a meeting is in the past (completely finished)
 * A meeting is only "past" if it has ended, not just started
 */
export function isMeetingPast(startTime: Date | string, endTime?: Date | string): boolean {
  const now = new Date()
  
  if (endTime) {
    // If we have an end time, add small 2 minute buffer for grace period
    const endDate = typeof endTime === 'string' ? new Date(endTime) : endTime
    const endWithBuffer = new Date(endDate.getTime() + 2 * 60 * 1000) // +2 minutes
    return endWithBuffer < now
  } else {
    // If no end time, assume 2 hour duration (more generous)
    const startDate = typeof startTime === 'string' ? new Date(startTime) : startTime
    const assumedEndTime = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // +2 hours
    return assumedEndTime < now
  }
}

/**
 * Checks if a meeting is upcoming (not finished yet)
 */
export function isMeetingUpcoming(startTime: Date | string, endTime?: Date | string): boolean {
  return !isMeetingPast(startTime, endTime)
}

/**
 * Checks if a meeting is currently live (started but not ended)
 */
export function isMeetingLive(startTime: Date | string, endTime?: Date | string): boolean {
  const now = new Date()
  const startDate = typeof startTime === 'string' ? new Date(startTime) : startTime
  
  if (endTime) {
    const endDate = typeof endTime === 'string' ? new Date(endTime) : endTime
    return startDate <= now && now <= endDate
  } else {
    // If no end time, assume 1 hour duration for live status
    const assumedEndTime = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour
    return startDate <= now && now <= assumedEndTime
  }
}

/**
 * Checks if a meeting is currently active (includes buffer time)
 */
export function isMeetingActive(startTime: Date | string, endTime?: Date | string): boolean {
  const now = new Date()
  const startDate = typeof startTime === 'string' ? new Date(startTime) : startTime
  
  // Meeting is active if it started within the last 5 minutes or is currently running
  const startWithBuffer = new Date(startDate.getTime() - 5 * 60 * 1000) // -5 minutes
  
  if (endTime) {
    const endDate = typeof endTime === 'string' ? new Date(endTime) : endTime
    const endWithBuffer = new Date(endDate.getTime() + 2 * 60 * 1000) // +2 minutes
    return startWithBuffer <= now && now <= endWithBuffer
  } else {
    // If no end time, assume 2 hour duration
    const assumedEndTime = new Date(startDate.getTime() + 2 * 60 * 60 * 1000)
    return startWithBuffer <= now && now <= assumedEndTime
  }
}

/**
 * Gets the meeting status: 'upcoming', 'live', or 'past'
 */
export function getMeetingStatus(startTime: Date | string, endTime?: Date | string): 'upcoming' | 'live' | 'past' {
  if (isMeetingPast(startTime, endTime)) {
    return 'past'
  } else if (isMeetingLive(startTime, endTime)) {
    return 'live'
  } else {
    return 'upcoming'
  }
}

/**
 * Legacy functions for backward compatibility
 */
export function isPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj < new Date()
}

export function isUpcoming(date: Date | string): boolean {
  return !isPast(date)
}

/**
 * Converts datetime-local input value to proper Date object
 * The datetime-local input gives us local time in YYYY-MM-DDTHH:MM format
 */
export function parseInputDateTime(dateTimeString: string): Date {
  // The datetime-local input already gives us the correct local time
  // We just need to create a Date object from it
  return new Date(dateTimeString)
}

/**
 * Converts a Date object to datetime-local input format in local timezone
 */
export function toLocalDateTimeString(date: Date): string {
  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
  return localDate.toISOString().slice(0, 16)
}