"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Bell, Check, X, Clock, CheckSquare, Users, UserPlus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  type: "TASK_ASSIGNED" | "TASK_STATUS_CHANGED" | "TASK_COMPLETED" | "WORKSPACE_INVITATION"
  title: string
  message: string
  isRead: boolean
  createdAt: string
  task?: {
    id: string
    title: string
    status: string
  }
  workspace: {
    id: string
    name: string
    slug: string
  }
}

export function RealNotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const unreadCount = notifications.filter(n => !n.isRead).length

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const handleMarkAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds, markAsRead: true })
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, isRead: true } : n
          )
        )
      }
    } catch (error) {
      console.error("Failed to mark notifications as read:", error)
    }
  }

  const handleDelete = async (notificationIds: string[]) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds })
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(n => !notificationIds.includes(n.id))
        )
      }
    } catch (error) {
      console.error("Failed to delete notifications:", error)
    }
  }

  const markAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    if (unreadIds.length > 0) {
      handleMarkAsRead(unreadIds)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      handleMarkAsRead([notification.id])
    }

    // Close dropdown
    setIsOpen(false)

    // Navigate to the relevant page based on notification type
    if (notification.type === "WORKSPACE_INVITATION") {
      // For workspace invitations, navigate to a join page or show invitation details
      router.push(`/workspaces/invitations`)
    } else if (notification.workspace?.slug) {
      router.push(`/workspaces/${notification.workspace.slug}/tasks`)
    }
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return <CheckSquare className="h-4 w-4 text-blue-500" />
      case "TASK_STATUS_CHANGED":
        return <Clock className="h-4 w-4 text-orange-500" />
      case "TASK_COMPLETED":
        return <Check className="h-4 w-4 text-green-500" />
      case "WORKSPACE_INVITATION":
        return <UserPlus className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 md:w-96" style={{ zIndex: 99998 }}>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="h-6 text-xs"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">
              You'll see task assignments and updates here
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start space-x-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  !notification.isRead ? "bg-blue-50 dark:bg-blue-950" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      {notification.workspace && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Users className="h-3 w-3 mr-1" />
                          <span>{notification.workspace.name}</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete([notification.id])
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => {
                  setIsOpen(false)
                  // Refresh notifications
                  fetchNotifications()
                }}
              >
                Refresh Notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}