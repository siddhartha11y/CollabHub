"use client"

import { useState, useEffect } from "react"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function MessageNotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUnreadCount()
    
    // Poll for unread messages every 3 seconds for real-time updates
    const interval = setInterval(fetchUnreadCount, 3000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/messages/unread")
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Link href="/messages">
      <Button 
        variant="ghost" 
        size="lg" 
        title={`Messages ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        className={cn(
          "relative hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200",
          unreadCount > 0 && "text-blue-600 dark:text-blue-400"
        )}
      >
        <MessageCircle className={cn(
          "transition-all duration-200",
          unreadCount > 0 ? "h-7 w-7" : "h-6 w-6"
        )} />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <span className="absolute -top-1 -right-1 bg-gray-400 rounded-full w-2 h-2 animate-pulse"></span>
        )}
        
        {/* Pulse animation for new messages */}
        {unreadCount > 0 && (
          <span className="absolute inset-0 rounded-lg bg-blue-400/20 animate-ping"></span>
        )}
      </Button>
    </Link>
  )
}
