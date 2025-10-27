import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useSocket } from './use-socket'

interface Message {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface TypingUser {
  userId: string
  userName: string
  userImage?: string
}

interface UseChatOptions {
  workspaceSlug: string
  channelId: string | null
}

export function useChat({ workspaceSlug, channelId }: UseChatOptions) {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)

  // Get current user info
  useEffect(() => {
    if (session?.user) {
      setCurrentUser({
        id: session.user.email, // Using email as ID for now
        name: session.user.name,
        email: session.user.email,
        image: session.user.image
      })
    }
  }, [session])

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!channelId || !workspaceSlug) return

    setLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/chat?channelId=${channelId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }, [channelId, workspaceSlug])

  // Setup Socket.IO listeners
  useEffect(() => {
    if (!socket || !channelId || !currentUser) return

    // Join workspace and channel
    socket.emit('join-workspace', workspaceSlug)
    socket.emit('join-channel', { channelId, user: currentUser })

    // Listen for new messages
    const handleMessageReceived = (message: Message) => {
      console.log('📨 Message received:', message)
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(msg => msg.id === message.id)) {
          return prev
        }
        return [...prev, message]
      })
    }

    // Listen for typing indicators
    const handleUserTyping = (data: TypingUser) => {
      if (data.userId !== currentUser.id) {
        setTypingUsers(prev => {
          if (prev.some(user => user.userId === data.userId)) {
            return prev
          }
          return [...prev, data]
        })
      }
    }

    const handleUserStoppedTyping = (data: { userId: string }) => {
      setTypingUsers(prev => prev.filter(user => user.userId !== data.userId))
    }

    // Attach listeners
    socket.on('message-received', handleMessageReceived)
    socket.on('user-typing', handleUserTyping)
    socket.on('user-stopped-typing', handleUserStoppedTyping)

    // Load initial messages
    loadMessages()

    return () => {
      // Leave channel when component unmounts or channel changes
      socket.emit('leave-channel', { channelId, user: currentUser })
      socket.off('message-received', handleMessageReceived)
      socket.off('user-typing', handleUserTyping)
      socket.off('user-stopped-typing', handleUserStoppedTyping)
    }
  }, [socket, channelId, workspaceSlug, currentUser, loadMessages])

  // Send message with Socket.IO
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !channelId || sending || !socket || !currentUser) return false

    setSending(true)
    try {
      // First save to database
      const response = await fetch(`/api/workspaces/${workspaceSlug}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          channelId
        }),
      })

      if (response.ok) {
        const message = await response.json()
        
        // Immediately broadcast via Socket.IO for real-time delivery
        socket.emit('send-message', {
          channelId,
          message,
          workspaceSlug
        })

        return true
      }
      return false
    } catch (error) {
      console.error('Failed to send message:', error)
      return false
    } finally {
      setSending(false)
    }
  }, [channelId, workspaceSlug, sending, socket, currentUser])

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!socket || !channelId || !currentUser) return

    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit('typing-start', { channelId, user: currentUser })
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false
        socket.emit('typing-stop', { channelId, user: currentUser })
      }
    }, 1000) // Stop typing after 1 second of inactivity
  }, [socket, channelId, currentUser])

  const stopTyping = useCallback(() => {
    if (!socket || !channelId || !currentUser) return

    if (isTypingRef.current) {
      isTypingRef.current = false
      socket.emit('typing-stop', { channelId, user: currentUser })
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }, [socket, channelId, currentUser])

  // Format messages with "Me" vs actual name
  const formattedMessages = messages.map(message => ({
    ...message,
    displayName: message.author.email === currentUser?.email ? 'Me' : message.author.name
  }))

  return {
    messages: formattedMessages,
    loading,
    sending,
    sendMessage,
    refreshMessages: loadMessages,
    typingUsers,
    handleTyping,
    stopTyping,
    isConnected
  }
}