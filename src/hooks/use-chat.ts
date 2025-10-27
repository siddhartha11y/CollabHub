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

interface UseChatOptions {
  workspaceSlug: string
  channelId: string | null
}

export function useChat({ workspaceSlug, channelId }: UseChatOptions) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const currentUserIdRef = useRef<string>('')

  // Get current user ID
  useEffect(() => {
    if (session?.user?.email) {
      // We'll need to fetch user ID or pass it from parent component
      // For now, we'll use email as identifier
      currentUserIdRef.current = session.user.email
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

  // Setup real-time connection
  useEffect(() => {
    if (!channelId || !workspaceSlug) return

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // Load initial messages
    loadMessages()

    // Setup SSE connection for real-time updates
    const eventSource = new EventSource(
      `/api/workspaces/${workspaceSlug}/chat/stream?channelId=${channelId}`
    )

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'messages' && data.data.length > 0) {
          setMessages(prev => {
            const newMessages = data.data.filter((newMsg: Message) => 
              !prev.some(existingMsg => existingMsg.id === newMsg.id)
            )
            return [...prev, ...newMessages]
          })
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      // Reconnect after 3 seconds
      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          loadMessages()
        }
      }, 3000)
    }

    eventSourceRef.current = eventSource

    return () => {
      eventSource.close()
    }
  }, [channelId, workspaceSlug, loadMessages])

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !channelId || sending) return false

    setSending(true)
    try {
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
        // Add message immediately for instant feedback
        setMessages(prev => [...prev, message])
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to send message:', error)
      return false
    } finally {
      setSending(false)
    }
  }, [channelId, workspaceSlug, sending])

  // Format messages with "Me" vs actual name
  const formattedMessages = messages.map(message => ({
    ...message,
    displayName: message.author.email === currentUserIdRef.current ? 'Me' : message.author.name
  }))

  return {
    messages: formattedMessages,
    loading,
    sending,
    sendMessage,
    refreshMessages: loadMessages
  }
}