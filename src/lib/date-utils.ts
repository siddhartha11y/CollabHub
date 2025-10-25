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
    hour12: true
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
 * Checks if a date is in the past
 */
export function isPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj < new Date()
}

/**
 * Checks if a date is upcoming (in the future)
 */
export function isUpcoming(date: Date | string): boolean {
  return !isPast(date)
}

/**
 * Converts datetime-local input value to proper Date object
 * The datetime-local input gives us local time, but we need to ensure it's treated as local
 */
export function parseInputDateTime(dateTimeString: string): Date {
  // Create date object treating the input as local time
  const date = new Date(dateTimeString)
  
  // Adjust for timezone offset to ensure we store the actual local time
  const timezoneOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - timezoneOffset)
}

/**
 * Converts a Date object to datetime-local input format in local timezone
 */
export function toLocalDateTimeString(date: Date): string {
  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
  return localDate.toISOString().slice(0, 16)
}