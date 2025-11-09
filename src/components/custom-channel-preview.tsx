"use client"

import { useState, useEffect } from "react"
import { useChatContext } from "stream-chat-react"
import { CustomAvatar } from "./custom-avatar"
import { Button } from "@/components/ui/button"
import { MoreVertical, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"

export function CustomChannelPreview(props: any) {
  const { channel, setActiveChannel, activeChannel } = props
  const { client } = useChatContext()
  const [otherUserName, setOtherUserName] = useState<string>("")
  const [lastMessage, setLastMessage] = useState<string>("")
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  
  // Safety checks
  if (!channel || !channel.state || !client) {
    return null
  }
  
  // Get the other user in the channel
  const members = Object.values(channel.state.members || {})
  const otherMember = members.find((member: any) => member.user_id !== client.userID)
  const otherUserId = otherMember?.user_id
  
  const isActive = activeChannel?.id === channel.id

  useEffect(() => {
    if (!otherUserId) return

    // Get user name from database
    fetch(`/api/users/${otherUserId}`)
      .then(res => res.json())
      .then(userData => {
        setOtherUserName(userData.name || otherUserId || 'Unknown')
      })
      .catch(() => {
        setOtherUserName(otherUserId || 'Unknown')
      })
  }, [otherUserId])

  useEffect(() => {
    if (!channel) return

    const updateChannelInfo = () => {
      // Get last message
      const messages = channel.state.messages || []
      const lastMsg = messages[messages.length - 1]
      
      if (lastMsg) {
        setLastMessage(lastMsg.text || 'Media message')
        setLastMessageTime(new Date(lastMsg.created_at || Date.now()))
      }

      // Get unread count
      setUnreadCount(channel.countUnread() || 0)
    }

    updateChannelInfo()

    // Listen for new messages
    channel.on('message.new', updateChannelInfo)
    channel.on('message.updated', updateChannelInfo)

    return () => {
      channel.off('message.new', updateChannelInfo)
      channel.off('message.updated', updateChannelInfo)
    }
  }, [channel])

  const handleDeleteChannel = async () => {
    try {
      await channel.delete()
      // The channel list will automatically update
    } catch (error) {
      console.error('Failed to delete channel:', error)
    }
  }

  const handleChannelClick = () => {
    setActiveChannel(channel)
  }

  return (
    <div 
      className={`flex items-center p-3 mx-2 rounded-xl cursor-pointer transition-all duration-200 group ${
        isActive 
          ? 'bg-blue-500/20 border border-blue-500/30' 
          : 'hover:bg-gray-800/50'
      }`}
      onClick={handleChannelClick}
    >
      {/* Avatar */}
      <div className="shrink-0 mr-3">
        {otherUserId && (
          <CustomAvatar 
            userId={otherUserId} 
            userName={otherUserName} 
            size="md"
          />
        )}
      </div>
      
      {/* Channel Info - Fixed width to prevent overflow */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-medium text-sm truncate pr-2">
            {otherUserName}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            {lastMessageTime && (
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(lastMessageTime, { addSuffix: false })}
              </span>
            )}
            {unreadCount > 0 && (
              <div className="bg-blue-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm truncate pr-2">
            {lastMessage || 'No messages yet...'}
          </p>
          
          {/* Dots Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteChannel()
                }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}