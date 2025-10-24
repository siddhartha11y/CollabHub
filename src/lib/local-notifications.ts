// Temporary notification system using localStorage until database is available

export interface LocalNotification {
  id: string
  type: "TASK_ASSIGNED" | "TASK_STATUS_CHANGED" | "TASK_COMPLETED"
  title: string
  message: string
  isRead: boolean
  createdAt: string
  taskId?: string
  workspaceSlug?: string
  workspaceName?: string
}

const NOTIFICATIONS_KEY = "collabhub_notifications"

export function getStoredNotifications(): LocalNotification[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error reading notifications from localStorage:", error)
    return []
  }
}

export function storeNotifications(notifications: LocalNotification[]) {
  if (typeof window === "undefined") return
  
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
  } catch (error) {
    console.error("Error storing notifications to localStorage:", error)
  }
}

export function addNotification(notification: Omit<LocalNotification, "id" | "createdAt">) {
  const notifications = getStoredNotifications()
  const newNotification: LocalNotification = {
    ...notification,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString()
  }
  
  notifications.unshift(newNotification)
  
  // Keep only the last 50 notifications
  if (notifications.length > 50) {
    notifications.splice(50)
  }
  
  storeNotifications(notifications)
  
  // Trigger a custom event to notify components
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("notificationAdded", { detail: newNotification }))
  }
  
  return newNotification
}

export function markNotificationsAsRead(notificationIds: string[]) {
  const notifications = getStoredNotifications()
  const updated = notifications.map(notification => 
    notificationIds.includes(notification.id) 
      ? { ...notification, isRead: true }
      : notification
  )
  storeNotifications(updated)
  
  // Trigger update event
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("notificationsUpdated"))
  }
}

export function deleteNotifications(notificationIds: string[]) {
  const notifications = getStoredNotifications()
  const filtered = notifications.filter(notification => 
    !notificationIds.includes(notification.id)
  )
  storeNotifications(filtered)
  
  // Trigger update event
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("notificationsUpdated"))
  }
}

export function createTaskAssignedNotification(
  assignerName: string,
  taskTitle: string,
  workspaceSlug: string,
  workspaceName: string,
  taskId?: string
) {
  return addNotification({
    type: "TASK_ASSIGNED",
    title: "New Task Assigned",
    message: `${assignerName} assigned you the task "${taskTitle}"`,
    isRead: false,
    taskId,
    workspaceSlug,
    workspaceName
  })
}