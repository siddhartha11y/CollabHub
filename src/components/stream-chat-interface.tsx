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
      if (!session?.user?.email) return

      try {
        const response = await fetch("/api/stream/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session.user.email }),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to get Stream token")
        }

        const { token, userId, apiKey, userName } = await response.json()

        const chatClient = StreamChat.getInstance(apiKey)

        await chatClient.connectUser(
          {
            id: userId,
            name: userName,
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
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center max-w-md p-8 bg-[#262626] rounded-lg border border-[#363636]">
          <h2 className="text-xl font-bold text-red-500 mb-4">Chat Setup Required</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <div className="text-left bg-[#1a1a1a] p-4 rounded text-sm">
            <p className="font-semibold mb-2 text-white">Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-300">
              <li>Go to https://getstream.io/chat/trial/</li>
              <li>Create a free account</li>
              <li>Create a new app</li>
              <li>Copy your API Key and Secret</li>
              <li>Add to .env.local:</li>
            </ol>
            <pre className="mt-2 bg-black p-2 rounded text-xs text-green-400">
              NEXT_PUBLIC_STREAM_API_KEY=your_key{'\n'}
              STREAM_API_SECRET=your_secret
            </pre>
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0095f6]"></div>
          <p className="text-gray-400">Connecting to chat...</p>
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
    <div className="fixed inset-0 bg-black">
      <Chat client={client} theme="str-chat__theme-dark">
        <div className="flex h-full">
          <div className="w-[350px] border-r border-[#262626]">
            <ChannelList 
              filters={filters} 
              sort={sort}
              options={options}
            />
          </div>
          <div className="flex-1 flex flex-col">
            <Channel>
              <Window>
                <ChannelHeader />
                <MessageList />
                <MessageInput />
              </Window>
              <Thread />
            </Channel>
          </div>
        </div>
      </Chat>
    </div>
  )
}
