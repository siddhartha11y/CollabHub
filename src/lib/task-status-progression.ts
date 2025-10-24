export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"

/**
 * Define the allowed status progression paths
 * Tasks can only move forward, never backward
 */
const STATUS_PROGRESSION: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS", "REVIEW", "DONE"],
  IN_PROGRESS: ["REVIEW", "DONE"],
  REVIEW: ["DONE"],
  DONE: [] // No further progression from DONE
}

/**
 * Get the next allowed statuses for a given current status
 */
export function getAllowedNextStatuses(currentStatus: TaskStatus): TaskStatus[] {
  return STATUS_PROGRESSION[currentStatus] || []
}

/**
 * Check if a status transition is valid (forward-only)
 */
export function isValidStatusTransition(
  currentStatus: TaskStatus, 
  newStatus: TaskStatus
): boolean {
  // Same status is always allowed (no change)
  if (currentStatus === newStatus) {
    return true
  }

  const allowedStatuses = getAllowedNextStatuses(currentStatus)
  return allowedStatuses.includes(newStatus)
}

/**
 * Get the status progression order for UI display
 */
export function getStatusOrder(): TaskStatus[] {
  return ["TODO", "IN_PROGRESS", "REVIEW", "DONE"]
}

/**
 * Get the next immediate status in progression
 */
export function getNextStatus(currentStatus: TaskStatus): TaskStatus | null {
  const allowedStatuses = getAllowedNextStatuses(currentStatus)
  
  // Return the first allowed status (immediate next step)
  if (allowedStatuses.length > 0) {
    const statusOrder = getStatusOrder()
    const currentIndex = statusOrder.indexOf(currentStatus)
    
    // Find the next status in order that's allowed
    for (let i = currentIndex + 1; i < statusOrder.length; i++) {
      if (allowedStatuses.includes(statusOrder[i])) {
        return statusOrder[i]
      }
    }
  }
  
  return null
}

/**
 * Check if a status is a final status (no further progression)
 */
export function isFinalStatus(status: TaskStatus): boolean {
  return getAllowedNextStatuses(status).length === 0
}

/**
 * Get status display information
 */
export function getStatusInfo(status: TaskStatus) {
  const statusInfo = {
    TODO: {
      label: "To Do",
      color: "gray",
      bgColor: "bg-gray-100",
      textColor: "text-gray-800",
      darkBgColor: "dark:bg-gray-800",
      darkTextColor: "dark:text-gray-300"
    },
    IN_PROGRESS: {
      label: "In Progress",
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      darkBgColor: "dark:bg-blue-900",
      darkTextColor: "dark:text-blue-300"
    },
    REVIEW: {
      label: "Review",
      color: "yellow",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
      darkBgColor: "dark:bg-yellow-900",
      darkTextColor: "dark:text-yellow-300"
    },
    DONE: {
      label: "Done",
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      darkBgColor: "dark:bg-green-900",
      darkTextColor: "dark:text-green-300"
    }
  }

  return statusInfo[status]
}

/**
 * Validate status transition with detailed error message
 */
export function validateStatusTransition(
  currentStatus: TaskStatus, 
  newStatus: TaskStatus
): { isValid: boolean; error?: string } {
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    const allowedStatuses = getAllowedNextStatuses(currentStatus)
    const allowedLabels = allowedStatuses.map(s => getStatusInfo(s).label).join(", ")
    
    return {
      isValid: false,
      error: `Cannot move from ${getStatusInfo(currentStatus).label} to ${getStatusInfo(newStatus).label}. Allowed transitions: ${allowedLabels || "None (task is complete)"}`
    }
  }

  return { isValid: true }
}