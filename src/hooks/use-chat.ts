import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'

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
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(true) // Always connected for simplicity
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageIdRef = useRef<string>('')

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
        if (data.length > 0) {
          lastMessageIdRef.current = data[data.length - 1].id
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }, [channelId, workspaceSlug])

  // Poll for new messages (fast polling - every 1 second)
  const pollForNewMessages = useCallback(async () => {
    if (!channelId || !workspaceSlug) return

    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/chat?channelId=${channelId}&after=${lastMessageIdRef.current}`)
      if (response.ok) {
        const newMessages = await response.json()
        if (newMessages.length > 0) {
          setMessages(prev => {
            const combined = [...prev, ...newMessages]
            // Remove duplicates
            const unique = combined.filter((msg, index, self) => 
              index === self.findIndex(m => m.id === msg.id)
            )
            return unique
          })
          lastMessageIdRef.current = newMessages[newMessages.length - 1].id
        }
      }
    } catch (error) {
      console.error('Failed to poll messages:', error)
    }
  }, [channelId, workspaceSlug])

  // Setup polling
  useEffect(() => {
    if (!channelId || !currentUser) return

    // Load initial messages
    loadMessages()

    // Start fast polling for new messages
    pollIntervalRef.current = setInterval(pollForNewMessages, 1000) // Poll every 1 second

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [channelId, currentUser, loadMessages, pollForNewMessages])

  // Send message with optimistic updates
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !channelId || sending || !currentUser) return false

    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}-${Math.random()}`,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      author: currentUser
    }

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage])
    setSending(true)

    try {
      // Send to server
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
        const realMessage = await response.json()
        
        // Replace optimistic message with real message
        setMessages(prev => 
          prev.map(msg => 
            msg.id === optimisticMessage.id ? realMessage : msg
          )
        )

        // Update last message ID
        lastMessageIdRef.current = realMessage.id

        return true
      } else {
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
        return false
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
      return false
    } finally {
      setSending(false)
    }
  }, [channelId, workspaceSlug, sending, currentUser])

  // Simplified typing indicators (no real-time for now)
  const handleTyping = useCallback(() => {
    // For now, just a placeholder
  }, [])

  const stopTyping = useCallback(() => {
    // For now, just a placeholder
  }, [])

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
    typingUsers: [], // Disabled for now
    handleTyping,
    stopTyping,
    isConnected
  }
}