"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { StreamChat } from "stream-chat"
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  MessageInput,
  MessageList,
  Thread,
  Window,
  LoadingIndicator,
} from "stream-chat-react"
import "stream-chat-react/dist/css/v2/index.css"
import "./stream-custom.css"

export function StreamChatInterface() {
  const { data: session } = useSession()
  const [client, setClient] = useState<StreamChat | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initChat = async () => {
      if (!session?.user) return

      try {
        const response = await fetch("/api/stream/token")
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to get Stream token")
        }

        const { token, userId, apiKey, userName, userImage } = await response.json()

        const chatClient = StreamChat.getInstance(apiKey)

        await chatClient.connectUser(
          {
            id: userId,
            name: userName,
            image: userImage,
          },
          token
        )

        setClient(chatClient)
      } catch (err) {
        console.error("Stream initialization error:", err)
        setError(err instanceof Error ? err.message : "Failed to initialize chat")
      }
    }

    initChat()

    return () => {
      if (client) {
        client.disconnectUser()
      }
    }
  }, [session])

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center max-w-md p-8 bg-card rounded-lg border">
          <h2 className="text-xl font-bold text-destructive mb-4">Chat Configuration Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="text-left bg-muted p-4 rounded text-sm">
            <p className="font-semibold mb-2">To fix this:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to https://getstream.io/chat/trial/</li>
              <li>Create a free account</li>
              <li>Create a new app</li>
              <li>Copy your API Key and Secret</li>
              <li>Add to .env.local:</li>
            </ol>
            <pre className="mt-2 bg-background p-2 rounded text-xs">
              NEXT_PUBLIC_STREAM_API_KEY=your_key
              STREAM_API_SECRET=your_secret
            </pre>
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Connecting to chat...</p>
        </div>
      </div>
    )
  }

  const filters = { 
    type: 'messaging',
    members: { $in: [client.userID!] }
  }
  
  const sort = { last_message_at: -1 as const }
  
  const options = {
    state: true,
    watch: true,
    presence: true,
  }

  return (
    <div className="h-screen">
      <Chat client={client} theme="str-chat__theme-dark">
        <ChannelList 
          filters={filters} 
          sort={sort}
          options={options}
        />
        <Channel>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  )
}
