"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Phone, Video, Send, Smile, Search, MoreVertical, Info, Image as ImageIcon, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { EmojiPicker } from "@/components/emoji-picker"
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns"

interface Conversation {
  id: string
  participants: Array<{
    id: string
    name: string | null
    username: string | null
    image: string | null
    isOnline: boolean
  }>
  messages: Array<{
    id: string
    content: string
    createdAt: string
    sender: {
      id: string
      name: string | null
    }
  }>
  updatedAt: string
}

interface Message {
  id: string
  content: string
  createdAt: string
  isRead: boolean
  sender: {
    id: string
    name: string | null
    image: string | null
  }
}

export function MessagingInterface() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageCountRef = useRef(0)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchConversations()
    // Update online status
    updateOnlineStatus(true)
    
    // Cleanup on unmount
    return () => {
      updateOnlineStatus(false)
    }
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      setLoadingMessages(true)
      fetchMessages(selectedConversation).finally(() => setLoadingMessages(false))
      
      // Aggressive polling - every 500ms for near real-time
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(selectedConversation, true)
      }, 500)
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    }
  }, [selectedConversation])

  useEffect(() => {
    // Only scroll if new messages arrived
    if (messages.length > lastMessageCountRef.current) {
      scrollToBottom()
      lastMessageCountRef.current = messages.length
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const updateOnlineStatus = async (isOnline: boolean) => {
    try {
      await fetch("/api/user/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline }),
      })
    } catch (error) {
      console.error("Failed to update online status:", error)
    }
  }

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations")
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string, silent = false) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (error) {
      if (!silent) {
        console.error("Failed to fetch messages:", error)
      }
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    const messageContent = newMessage.trim()
    const tempId = `temp-${Date.now()}`
    
    // Optimistic update - add message immediately
    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent,
      createdAt: new Date().toISOString(),
      isRead: false,
      sender: {
        id: session?.user?.id || "",
        name: session?.user?.name || null,
        image: session?.user?.image || null,
      },
    }
    
    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage("")
    setShowEmojiPicker(false)
    setSending(true)

    try {
      const res = await fetch(`/api/conversations/${selectedConversation}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
      })

      if (res.ok) {
        // Replace temp message with real one
        const realMessage = await res.json()
        setMessages(prev => prev.map(m => m.id === tempId ? realMessage : m))
        fetchConversations() // Update conversation list
      } else {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setNewMessage(messageContent) // Restore message
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  const startCall = async (type: "VOICE" | "VIDEO") => {
    if (!selectedConversation) return

    try {
      const res = await fetch(`/api/conversations/${selectedConversation}/calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })

      if (res.ok) {
        const call = await res.json()
        alert(`${type} call started! Call ID: ${call.id}`)
      }
    } catch (error) {
      console.error("Failed to start call:", error)
    }
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== session?.user?.id)
  }

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv)
    return other?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           other?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const selectedConv = conversations.find(c => c.id === selectedConversation)
  const otherUser = selectedConv ? getOtherParticipant(selectedConv) : null

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, "h:mm a")
    } else if (isYesterday(date)) {
      return "Yesterday"
    } else {
      return format(date, "MMM d")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0095f6]"></div>
          <p className="text-gray-400">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Conversations List - Instagram Style */}
      <div className="w-[350px] border-r border-[#262626] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#262626]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">{session?.user?.name || "Messages"}</h2>
            <Button variant="ghost" size="icon" className="hover:bg-[#1a1a1a]">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#262626] border-none rounded-lg text-sm placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              No conversations yet
            </div>
          ) : (
            <div className="py-2">
              {filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv)
                const lastMessage = conv.messages[conv.messages.length - 1]
                const isActive = selectedConversation === conv.id
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={cn(
                      "w-full px-5 py-2 flex items-center gap-3 hover:bg-[#1a1a1a] transition-colors",
                      isActive && "bg-[#262626]"
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={other?.image || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {other?.name?.[0] || other?.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {other?.isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#22c55e] rounded-full border-[3px] border-black" />
                      )}
                    </div>
                    <div className="flex-1 text-left overflow-hidden min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="font-normal text-sm truncate">
                          {other?.name || other?.username || "Unknown User"}
                        </span>
                        {lastMessage && (
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatMessageTime(new Date(lastMessage.createdAt))}
                          </span>
                        )}
                      </div>
                      {lastMessage && (
                        <p className="text-sm text-gray-500 truncate">
                          {lastMessage.sender.id === session?.user?.id && "You: "}
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area - Instagram Style */}
      {selectedConversation && otherUser ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="px-6 py-3 border-b border-[#262626] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUser.image || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    {otherUser.name?.[0] || otherUser.username?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                {otherUser.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-black" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  {otherUser.name || otherUser.username || "Unknown User"}
                </h3>
                {otherUser.isOnline && (
                  <p className="text-xs text-gray-500">Active now</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startCall("VOICE")}
                className="hover:bg-[#1a1a1a] h-9 w-9"
              >
                <Phone className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startCall("VIDEO")}
                className="hover:bg-[#1a1a1a] h-9 w-9"
              >
                <Video className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-[#1a1a1a] h-9 w-9">
                <Info className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages - Instagram Style */}
          <ScrollArea className="flex-1 px-6 py-4">
            {loadingMessages && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0095f6]"></div>
                  <p className="text-gray-500 text-sm">Loading messages...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1 max-w-3xl mx-auto">
                {messages.map((message, index) => {
                  const isOwn = message.sender.id === session?.user?.id
                  const prevMessage = index > 0 ? messages[index - 1] : null
                  const showAvatar = !isOwn && (!prevMessage || prevMessage.sender.id !== message.sender.id)
                  
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2 items-end group",
                        isOwn ? "flex-row-reverse" : ""
                      )}
                    >
                      {/* Avatar for other user only */}
                      {!isOwn && (
                        <div className="w-7 h-7 flex-shrink-0">
                          {showAvatar && (
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={message.sender.image || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                                {message.sender.name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      
                      <div className={cn("flex flex-col", isOwn && "items-end")}>
                        <div
                          className={cn(
                            "rounded-[22px] px-4 py-2 max-w-[400px] break-words",
                            isOwn
                              ? "bg-[#0095f6] text-white"
                              : "bg-[#262626] text-white border border-[#363636]"
                          )}
                        >
                          <p className="text-[14px] leading-[18px]">
                            {message.content}
                          </p>
                        </div>
                        {/* Show time on hover */}
                        <span className="text-[11px] text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-3">
                          {format(new Date(message.createdAt), "h:mm a")}
                        </span>
                      </div>
                      
                      {/* Like button on hover (Instagram feature) */}
                      <button className={cn(
                        "opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500 mb-2",
                        isOwn ? "order-first" : ""
                      )}>
                        <Heart className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input - Instagram Style */}
          <div className="px-6 py-4 border-t border-[#262626]">
            <div className="flex items-center gap-3 max-w-3xl mx-auto">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-[#1a1a1a] h-9 w-9 flex-shrink-0"
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              
              <div className="flex-1 relative">
                <Input
                  placeholder="Message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  disabled={sending}
                  className="bg-transparent border border-[#363636] rounded-[22px] px-4 py-2 pr-10 text-sm placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#0095f6]"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-transparent h-8 w-8"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-5 w-5 text-gray-400" />
                </Button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2">
                    <EmojiPicker
                      onEmojiSelect={(emoji) => {
                        setNewMessage(prev => prev + emoji)
                        setShowEmojiPicker(false)
                      }}
                    />
                  </div>
                )}
              </div>
              
              {newMessage.trim() ? (
                <Button
                  onClick={sendMessage}
                  disabled={sending}
                  className="bg-transparent hover:bg-transparent text-[#0095f6] font-semibold text-sm h-auto p-0"
                >
                  Send
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-[#1a1a1a] h-9 w-9 flex-shrink-0"
                >
                  <Heart className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-white flex items-center justify-center">
              <Send className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-light mb-2">Your messages</h3>
            <p className="text-sm text-gray-500">Send private messages to a friend</p>
          </div>
        </div>
      )}
    </div>
  )
}
