"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { StreamChat } from "stream-chat"
import {
  Chat,
  Channel,
  ChannelList,
  MessageInput,
  MessageList,
  Thread,
  Window,
  useChannelStateContext,
  useChatContext,
} from "stream-chat-react"
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
  Settings,
  Bell,
  Sparkles,
  Smile,
  Camera,
  Mic,
  PhoneOff
} from "lucide-react"
import { 
  StreamVideo, 
  StreamVideoClient, 
  Call,
  CallControls,
  SpeakerLayout,
  StreamCall,
  useCallStateHooks
} from "@stream-io/video-react-sdk"
import "stream-chat-react/dist/css/v2/index.css"
import "./stream-custom.css"
import { useUserImage } from "@/hooks/use-user-image"
import { CustomAvatar } from "./custom-avatar"
import { CustomMessage } from "./custom-message"
import { CustomChannelPreview } from "./custom-channel-preview"



// User Profile Section Component
function UserProfileSection({ userId, userName }: { userId?: string, userName?: string | null }) {
  const { imageUrl } = useUserImage(userId)
  
  return (
    <div className="flex items-center gap-3 mb-4">
      <Avatar className="w-12 h-12 ring-2 ring-blue-500/50">
        <AvatarImage src={imageUrl || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
          {userName?.[0] || "U"}
        </AvatarFallback>
      </Avatar>
      <div>
        <h2 className="text-xl font-bold text-white">{userName || "Messages"}</h2>
        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
          Online
        </Badge>
      </div>
    </div>
  )
}

// Real Video Call Component
function VideoCallUI({ call, onEndCall }: { call: Call; onEndCall: () => void }) {
  return (
    <div className="fixed inset-0 bg-black z-50">
      <StreamCall call={call}>
        <SpeakerLayout />
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <CallControls onLeave={onEndCall} />
        </div>
      </StreamCall>
    </div>
  )
}

// Incoming Call Modal
function IncomingCallModal({ 
  isOpen, 
  callerName, 
  callType,
  onAccept, 
  onReject 
}: {
  isOpen: boolean
  callerName: string
  callType: 'audio' | 'video'
  onAccept: () => void
  onReject: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-8 text-center max-w-md w-full mx-4">
        <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          {callType === 'video' ? (
            <Video className="w-12 h-12 text-white" />
          ) : (
            <Phone className="w-12 h-12 text-white" />
          )}
        </div>
        
        <h3 className="text-2xl font-semibold text-white mb-2">Incoming {callType === 'video' ? 'Video' : 'Voice'} Call</h3>
        <p className="text-gray-400 mb-8">{callerName} is calling you</p>
        
        <div className="flex justify-center gap-6">
          <Button
            onClick={onReject}
            variant="destructive"
            size="lg"
            className="rounded-full w-16 h-16 p-0"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
          
          <Button
            onClick={onAccept}
            className="bg-green-500 hover:bg-green-600 rounded-full w-16 h-16 p-0"
          >
            <Phone className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Custom Chat Header Component using Stream Context
function CustomChatHeader({ onAudioCall, onVideoCall }: {
  onAudioCall: () => void
  onVideoCall: () => void
}) {
  const { client } = useChatContext()
  const { channel } = useChannelStateContext()
  const [otherUserId, setOtherUserId] = useState<string | null>(null)
  const [otherUserName, setOtherUserName] = useState<string | null>(null)

  useEffect(() => {
    if (!channel || !client) return

    const updateOtherUser = () => {
      const members = Object.values(channel.state.members || {})
      const otherMember = members.find((member: any) => member.user_id !== client.userID)
      
      if (otherMember && otherMember.user_id) {
        setOtherUserId(otherMember.user_id)
        
        // Get user name from database
        fetch(`/api/users/${otherMember.user_id}`)
          .then(res => res.json())
          .then(userData => {
            setOtherUserName(userData.name || otherMember.user_id || 'Unknown')
          })
          .catch(() => {
            setOtherUserName(otherMember.user_id || 'Unknown')
          })
      }
    }

    updateOtherUser()

    // Listen for member updates
    channel.on('member.added', updateOtherUser)
    channel.on('member.updated', updateOtherUser)

    return () => {
      channel.off('member.added', updateOtherUser)
      channel.off('member.updated', updateOtherUser)
    }
  }, [channel, client])

  return (
    <div className="bg-black/50 backdrop-blur-xl border-b border-gray-800/50 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {otherUserId ? (
          <>
            <CustomAvatar userId={otherUserId} userName={otherUserName || 'Unknown'} />
            <div>
              <h3 className="text-white font-semibold text-base">{otherUserName}</h3>
              <p className="text-gray-400 text-sm">Active now</p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full animate-pulse"></div>
            <div>
              <h3 className="text-white font-semibold">Loading...</h3>
              <p className="text-gray-400 text-sm">Getting user info</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            console.log('Audio call button clicked!')
            onAudioCall()
          }}
          className="hover:bg-green-500/20 hover:text-green-400 transition-all duration-200"
        >
          <Phone className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            console.log('Video call button clicked!')
            onVideoCall()
          }}
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
  )
}

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
  
  // Call states
  const [activeCall, setActiveCall] = useState<Call | null>(null)
  const [incomingCall, setIncomingCall] = useState<{
    call: Call
    callerName: string
    callType: 'audio' | 'video'
  } | null>(null)


  useEffect(() => {
    let isMounted = true
    
    const initChat = async () => {
      if (!session?.user?.email || !isMounted) return

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

        // Initialize Video Client
        const videoClientInstance = new StreamVideoClient({
          apiKey,
          user: {
            id: userId,
            name: userName,
          },
          token,
        })

        if (isMounted) {
          setClient(chatClient)
          setVideoClient(videoClientInstance)

          // Listen for incoming calls via Stream Video
          videoClientInstance.on('call.ring', (event) => {
            console.log('Incoming call event:', event)
            if (event.call) {
              // Get caller info
              const members = event.call.state.members || []
              const caller = members.find(m => m.user.id !== videoClientInstance.user.id)
              
              setIncomingCall({
                call: event.call,
                callerName: caller?.user.name || 'Unknown',
                callType: 'video' // Default to video, could be enhanced
              })
            }
          })

          // Listen for call messages (backup method)
          chatClient.on('message.new', async (event) => {
            const message = event.message
            if (message?.text?.includes('CALL_') && message.user?.id !== chatClient.userID) {
              console.log('Call message received:', message.text)
              // This is just for chat notification, real call handling is via Stream Video events
            }
          })
        }
      } catch (err) {
        console.error("Stream initialization error:", err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize chat")
        }
      }
    }

    initChat()

    return () => {
      isMounted = false
      if (client) {
        client.disconnectUser().catch(console.error)
      }
      if (videoClient) {
        videoClient.disconnectUser().catch(console.error)
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
    if (!client || !videoClient) return

    try {
      // Get current channel
      const channels = Object.values(client.activeChannels || {})
      const activeChannel = channels[0]
      
      if (!activeChannel) {
        console.error('No active channel found')
        return
      }

      // Get other members
      const members = Object.values(activeChannel.state.members || {})
      const otherMember = members.find((member: any) => member.user_id !== client.userID)
      
      if (!otherMember) {
        console.error('No other member to call')
        return
      }

      // Create unique call ID
      const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      console.log('Creating call with ID:', callId)
      
      // Create the call
      const call = videoClient.call('default', callId)
      
      // Create call with members and ring them
      const callResponse = await call.getOrCreate({
        data: {
          members: [
            { user_id: client.userID! },
            { user_id: otherMember.user_id || otherMember.user?.id }
          ],
          settings_override: {
            video: {
              camera_default_on: callType === 'video',
              target_resolution: {
                width: 640,
                height: 480,
              },
            },
            audio: {
              mic_default_on: true,
              default_device: 'speaker',
            },
          },
        },
        ring: true, // This will trigger call.ring event for other users
      })

      console.log('Call created:', callResponse)

      // Send call message to channel for backup notification
      await activeChannel.sendMessage({
        text: `📞 ${callType === 'video' ? 'Video' : 'Voice'} call started`
      })

      // Join the call immediately for caller
      await call.join()
      setActiveCall(call)

      console.log('Caller joined call')

    } catch (error) {
      console.error("Failed to start call:", error)
    }
  }, [client, videoClient])

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return

    try {
      console.log('Accepting call:', incomingCall.call.id)
      
      // Accept the call first
      await incomingCall.call.accept()
      
      // Then join the call
      await incomingCall.call.join()
      
      setActiveCall(incomingCall.call)
      setIncomingCall(null)
      
      console.log('Call accepted and joined successfully')
    } catch (error) {
      console.error('Failed to accept call:', error)
      // Clear the incoming call on error
      setIncomingCall(null)
    }
  }, [incomingCall])

  const rejectCall = useCallback(async () => {
    if (!incomingCall) return

    try {
      console.log('Rejecting call:', incomingCall.call.id)
      await incomingCall.call.reject()
      setIncomingCall(null)
      console.log('Call rejected successfully')
    } catch (error) {
      console.error('Failed to reject call:', error)
      // Clear the incoming call anyway
      setIncomingCall(null)
    }
  }, [incomingCall])

  const endCall = useCallback(async () => {
    if (!activeCall) return

    try {
      await activeCall.leave()
      setActiveCall(null)
    } catch (error) {
      console.error('Failed to end call:', error)
    }
  }, [activeCall])

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
      <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex">
        <Chat client={client} theme="str-chat__theme-dark">
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
              
              <UserProfileSection userId={session?.user?.id} userName={session?.user?.name} />

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
                      <CustomAvatar userId={user.id} userName={user.name} />
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
                Preview={CustomChannelPreview}
              />
            </div>


          </div>

          {/* Enhanced Chat Area */}
          <div className="flex-1 bg-gradient-to-b from-gray-900/50 to-black/50">
            <Channel>
              <Window>
                {/* COMPLETELY CUSTOM HEADER - No Stream components */}
                <CustomChatHeader 
                  onAudioCall={() => startCall('audio')}
                  onVideoCall={() => startCall('video')}
                />

                {/* Messages Area */}
                <MessageList Message={CustomMessage} />

                {/* Message Input Area */}
                <div className="bg-black/50 backdrop-blur-xl border-t border-gray-800/50 p-4">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="hover:bg-white/10 shrink-0">
                      <Camera className="w-5 h-5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <MessageInput />
                    </div>
                    <Button variant="ghost" size="sm" className="hover:bg-white/10 shrink-0">
                      <Smile className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="hover:bg-white/10 shrink-0">
                      <Mic className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Window>
              <Thread />
            </Channel>
          </div>
        </Chat>

        {/* Incoming Call Modal */}
        {incomingCall && (
          <IncomingCallModal
            isOpen={true}
            callerName={incomingCall.callerName}
            callType={incomingCall.callType}
            onAccept={acceptCall}
            onReject={rejectCall}
          />
        )}

        {/* Active Video Call */}
        {activeCall && (
          <VideoCallUI call={activeCall} onEndCall={endCall} />
        )}
      </div>
    </StreamVideo>
  )
}
