"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Phone, Video, Send, Smile, Search, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { EmojiPicker } from "@/components/emoji-picker"
import { formatDistanceToNow } from "date-fns"

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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        fetchMessages(selectedConversation)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
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

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const res = await fetch(`/api/conversations/${selectedConversation}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      })

      if (res.ok) {
        setNewMessage("")
        setShowEmojiPicker(false)
        fetchMessages(selectedConversation)
        fetchConversations() // Update conversation list
      }
    } catch (error) {
      console.error("Failed to send message:", error)
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

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Conversations List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No conversations yet. Search for users to start chatting!
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = getOtherParticipant(conv)
              const lastMessage = conv.messages[conv.messages.length - 1]
              
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={cn(
                    "w-full p-4 flex items-start gap-3 hover:bg-accent transition-colors border-b",
                    selectedConversation === conv.id && "bg-accent"
                  )}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={other?.image || undefined} />
                      <AvatarFallback>
                        {other?.name?.[0] || other?.username?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {other?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">
                        {other?.name || other?.username || "Unknown User"}
                      </span>
                      {lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    {lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {lastMessage.sender.id === session?.user?.id ? "You: " : ""}
                        {lastMessage.content}
                      </p>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {selectedConversation && otherUser ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={otherUser.image || undefined} />
                  <AvatarFallback>
                    {otherUser.name?.[0] || otherUser.username?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                {otherUser.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">
                  {otherUser.name || otherUser.username || "Unknown User"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {otherUser.isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startCall("VOICE")}
                title="Voice Call"
              >
                <Phone className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startCall("VIDEO")}
                title="Video Call"
              >
                <Video className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwn = message.sender.id === session?.user?.id
                
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      isOwn && "flex-row-reverse"
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender.image || undefined} />
                      <AvatarFallback>
                        {message.sender.name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn("flex flex-col gap-1", isOwn && "items-end")}>
                      <div
                        className={cn(
                          "rounded-lg px-4 py-2 max-w-md",
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-5 w-5" />
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
              <Button onClick={sendMessage} size="icon">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg mb-2">No conversation selected</p>
            <p className="text-sm">Choose a conversation from the list to start chatting</p>
          </div>
        </div>
      )}
    </div>
  )
}
