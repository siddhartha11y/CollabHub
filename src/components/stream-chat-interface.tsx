"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { StreamChat, Channel as StreamChannel } from "stream-chat"
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react"
import { StreamVideo, StreamVideoClient, Call } from "@stream-io/video-react-sdk"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Search, 
  Phone, 
  Video, 
  Info, 
  UserPlus,
  Settings,
  Bell,
  Sparkles,
  Heart,
  Smile,
  Camera,
  Mic,
  PhoneCall
} from "lucide-react"
import "stream-chat-react/dist/css/v2/index.css"
import "./stream-custom.css"

interface User {
  id: string
  name: string
  email: string
  image?: string
  isOnline?: boolean
}

export function StreamChatInterface() {
  const { data: session } = useSession()
  const router = useRouter()
  const [client, setClient] = useState<StreamChat | null>(null)
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [activeCall, setActiveCall] = useState<Call | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<StreamChannel | null>(null)

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

        // Initialize Chat Client with MINIMAL data to avoid 5KB limit
        const chatClient = StreamChat.getInstance(apiKey)
        await chatClient.connectUser(
          {
            id: userId,
            name: userName,
            // Remove image to avoid 5KB limit - we'll handle avatars in UI
          },
          token
        )

        // Initialize Video Client with MINIMAL data
        const videoClientInstance = new StreamVideoClient({
          apiKey,
          user: {
            id: userId,
            name: userName,
            // Remove image to avoid 5KB limit
          },
          token,
        })

        setClient(chatClient)
        setVideoClient(videoClientInstance)
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
      if (videoClient) {
        videoClient.disconnectUser()
      }
    }
  }, [session])

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) return

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const users = await response.json()
        setSearchResults(users.map((user: any) => ({
          id: user.id,
          name: user.name || user.email.split('@')[0],
          email: user.email,
          image: user.image,
          isOnline: false // We'll implement real-time presence later
        })))
      }
    } catch (error) {
      console.error("Search error:", error)
    }
  }, [])

  const startDirectMessage = useCallback(async (userId: string) => {
    if (!client) return

    try {
      const channel = client.channel('messaging', {
        members: [client.userID!, userId],
      })
      await channel.create()
      setShowSearch(false)
      setSearchQuery("")
    } catch (error) {
      console.error("Failed to create channel:", error)
    }
  }, [client])

  const startCall = useCallback(async (callType: 'audio' | 'video') => {
    if (!videoClient || !selectedChannel) return

    try {
      const callId = `${selectedChannel.id}-${Date.now()}`
      const call = videoClient.call('default', callId)
      
      const memberIds = selectedChannel.state.members ? Object.keys(selectedChannel.state.members) : []
      
      await call.getOrCreate({
        data: {
          members: memberIds.map(id => ({ user_id: id })),
        },
      })

      setActiveCall(call)
    } catch (error) {
      console.error("Failed to start call:", error)
    }
  }, [videoClient, selectedChannel])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchQuery, searchUsers])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Chat Setup Required</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            
            <div className="space-y-4">
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              
              <div className="bg-black/50 rounded-xl p-4 text-left text-sm">
                <p className="font-semibold mb-3 text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Quick Setup:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-300">
                  <li>Visit getstream.io/chat/trial</li>
                  <li>Create free account</li>
                  <li>Get API credentials</li>
                  <li>Add to .env.local:</li>
                </ol>
                <pre className="mt-2 bg-gray-900 p-2 rounded text-xs text-green-400">
NEXT_PUBLIC_STREAM_API_KEY=your_key{'\n'}
STREAM_API_SECRET=your_secret
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!client || !videoClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500/30 rounded-full animate-ping mx-auto"></div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Connecting to CollabHub</h3>
          <p className="text-gray-400">Setting up your chat experience...</p>
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
    <StreamVideo client={videoClient}>
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <Chat client={client} theme="str-chat__theme-dark">
          <div className="flex h-full">
            {/* Enhanced Sidebar */}
            <div className="w-[380px] bg-black/50 backdrop-blur-xl border-r border-gray-800/50 flex flex-col">
              {/* Header with Back Button */}
              <div className="p-6 border-b border-gray-800/50 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard')}
                    className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="hover:bg-white/10">
                      <Bell className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="hover:bg-white/10">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-12 h-12 ring-2 ring-blue-500/50">
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                      {session?.user?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold text-white">{session?.user?.name || "Messages"}</h2>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                      Online
                    </Badge>
                  </div>
                </div>

                {/* Enhanced Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search people to chat..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowSearch(true)
                    }}
                    className="pl-10 bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-400 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("")
                        setShowSearch(false)
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-700/50"
                    >
                      ×
                    </Button>
                  )}
                </div>

                {/* Search Results */}
                {showSearch && searchResults.length > 0 && (
                  <div className="mt-3 bg-gray-800/50 rounded-xl border border-gray-700/50 max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => startDirectMessage(user.id)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-gray-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.image} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                            {user.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                        {user.isOnline && (
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Channel List */}
              <div className="flex-1 overflow-hidden">
                <ChannelList 
                  filters={filters} 
                  sort={sort}
                  options={options}
                />
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-t border-gray-800/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <div className="flex justify-center gap-2">
                  <Button size="sm" variant="ghost" className="hover:bg-white/10">
                    <UserPlus className="w-4 h-4 mr-2" />
                    New Chat
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Chat Area */}
            <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-900/50 to-black/50">
              <Channel>
                <Window>
                  {/* Custom Header with Video/Audio Buttons */}
                  <div className="bg-black/50 backdrop-blur-xl border-b border-gray-800/50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ChannelHeader />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startCall('audio')}
                          className="hover:bg-green-500/20 hover:text-green-400 transition-all duration-200"
                        >
                          <Phone className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startCall('video')}
                          className="hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-200"
                        >
                          <Video className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-purple-500/20 hover:text-purple-400 transition-all duration-200"
                        >
                          <Info className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Messages with Custom Styling */}
                  <div className="flex-1 relative">
                    <MessageList />
                    {/* Floating Action Buttons */}
                    <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                      <Button
                        size="sm"
                        className="rounded-full w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 shadow-lg"
                      >
                        <Heart className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Enhanced Message Input */}
                  <div className="bg-black/50 backdrop-blur-xl border-t border-gray-800/50 p-4">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" className="hover:bg-white/10">
                        <Camera className="w-5 h-5" />
                      </Button>
                      <div className="flex-1">
                        <MessageInput />
                      </div>
                      <Button variant="ghost" size="sm" className="hover:bg-white/10">
                        <Smile className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:bg-white/10">
                        <Mic className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </Window>
                <Thread />
              </Channel>
            </div>
          </div>
        </Chat>

        {/* Active Call Overlay */}
        {activeCall && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center">
            <div className="bg-gray-900/90 rounded-2xl p-8 text-center">
              <PhoneCall className="w-16 h-16 text-green-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-semibold text-white mb-2">Call in Progress</h3>
              <p className="text-gray-400 mb-6">Connecting...</p>
              <Button
                onClick={() => {
                  activeCall.leave()
                  setActiveCall(null)
                }}
                variant="destructive"
                className="rounded-full"
              >
                End Call
              </Button>
            </div>
          </div>
        )}
      </div>
    </StreamVideo>
  )
}
