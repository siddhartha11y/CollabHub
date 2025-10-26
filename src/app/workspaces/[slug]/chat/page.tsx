"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MobileHeader } from "@/components/mobile-header"
import { 
  Plus, 
  MessageSquare,
  Send,
  Hash,
  Users
} from "lucide-react"
import { CreateChannelModal } from "@/components/create-channel-modal"
import { ChannelActionsDropdown } from "@/components/channel-actions-dropdown"
import { ChannelPermissions } from "@/lib/channel-permissions"

export default function ChatPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [channels, setChannels] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [workspace, setWorkspace] = useState<any>(null)
  const [activeChannel, setActiveChannel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [userRole, setUserRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER")
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session || !params.slug) return

    const fetchData = async () => {
      try {
        // Fetch workspace and channels
        const [workspaceRes, channelsRes] = await Promise.all([
          fetch(`/api/workspaces/${params.slug}`),
          fetch(`/api/workspaces/${params.slug}/chat`)
        ])

        if (workspaceRes.ok) {
          const workspaceData = await workspaceRes.json()
          setWorkspace(workspaceData)
          
          // Get current user's role in workspace
          const currentUserMember = workspaceData.members?.find(
            (member: any) => member.user.email === session?.user?.email
          )
          if (currentUserMember) {
            setUserRole(currentUserMember.role)
            setCurrentUserId(currentUserMember.user.id)
          }
        }

        if (channelsRes.ok) {
          const channelsData = await channelsRes.json()
          setChannels(channelsData)
          
          // Initialize channel ownership for existing channels
          channelsData.forEach((channel: any) => {
            const existingOwner = ChannelPermissions.getChannelOwner(params.slug as string, channel.id)
            if (!existingOwner) {
              // For existing channels without ownership, assume:
              // - "general" channels were created by workspace admin
              // - Other channels need to be claimed (for now, no ownership)
              if (channel.name === "general" && workspace?.creator?.id) {
                ChannelPermissions.setChannelOwner(
                  params.slug as string,
                  channel.id,
                  workspace.creator.id
                )
              }
            }
          })
          
          // Check if general channel exists, if not create it
          let generalChannel = channelsData.find((channel: any) => channel.name === "general")
          
          if (!generalChannel && channelsData.length === 0) {
            // Only create general channel if no channels exist at all
            generalChannel = await createDefaultChannel()
          } else if (!generalChannel && channelsData.length > 0) {
            // If channels exist but no general channel, don't create one
            generalChannel = channelsData[0]
          }
          
          // Try to restore last selected channel from localStorage, or use general channel
          const lastChannelId = localStorage.getItem(`lastChannel_${params.slug}`)
          const lastChannel = channelsData.find((channel: any) => channel.id === lastChannelId)
          
          if (lastChannel) {
            setActiveChannel(lastChannel)
          } else if (generalChannel) {
            setActiveChannel(generalChannel)
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session, params.slug])

  // Fetch messages when active channel changes
  useEffect(() => {
    if (!activeChannel) return

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/workspaces/${params.slug}/chat?channelId=${activeChannel.id}`)
        if (response.ok) {
          const messagesData = await response.json()
          setMessages(messagesData)
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error)
      }
    }

    fetchMessages()
  }, [activeChannel, params.slug])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const createDefaultChannel = async () => {
    try {
      const response = await fetch(`/api/workspaces/${params.slug}/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "general",
          description: "General discussion channel"
        }),
      })

      if (response.ok) {
        const channel = await response.json()
        setChannels([channel])
        
        // Track ownership of the default general channel
        if (currentUserId && params.slug) {
          ChannelPermissions.setChannelOwner(
            params.slug as string,
            channel.id,
            currentUserId
          )
        }
        
        return channel
      }
    } catch (error) {
      console.error("Failed to create default channel:", error)
    }
    return null
  }

  const handleChannelSelect = (channel: any) => {
    setActiveChannel(channel)
    // Save selected channel to localStorage
    localStorage.setItem(`lastChannel_${params.slug}`, channel.id)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChannel || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/workspaces/${params.slug}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          channelId: activeChannel.id
        }),
      })

      if (response.ok) {
        const message = await response.json()
        setMessages(prev => [...prev, message])
        setNewMessage("")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  const handleChannelCreated = (newChannel: any) => {
    setChannels(prev => [...prev, newChannel])
    handleChannelSelect(newChannel)
    
    // Track channel ownership
    if (currentUserId && params.slug) {
      ChannelPermissions.setChannelOwner(
        params.slug as string, 
        newChannel.id, 
        currentUserId
      )
    }
  }

  const handleChannelDeleted = (channelId: string) => {
    setChannels(prev => prev.filter(channel => channel.id !== channelId))
    // If deleted channel was active, switch to general or first available
    if (activeChannel?.id === channelId) {
      const remainingChannels = channels.filter(channel => channel.id !== channelId)
      const generalChannel = remainingChannels.find(channel => channel.name === "general")
      setActiveChannel(generalChannel || remainingChannels[0] || null)
    }
  }

  const handleChannelRenamed = (updatedChannel: any) => {
    setChannels(prev => prev.map(channel => 
      channel.id === updatedChannel.id ? updatedChannel : channel
    ))
    if (activeChannel?.id === updatedChannel.id) {
      setActiveChannel(updatedChannel)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <MobileHeader
        workspaceSlug={params.slug as string}
        workspaceName={workspace?.name}
        title="Chat"
        subtitle={`${workspace?.name} • ${activeChannel?.name ? `#${activeChannel.name}` : ''}`}
        backHref={`/workspaces/${params.slug}`}
        actions={[]}
      />

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Channels Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Channels</span>
                  <CreateChannelModal 
                    workspaceSlug={params.slug as string}
                    onChannelCreated={handleChannelCreated}
                  >
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </CreateChannelModal>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {channels.map((channel) => (
                    <div
                      key={channel.id}
                      className={`group relative rounded-lg transition-colors ${
                        activeChannel?.id === channel.id
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <button
                        onClick={() => handleChannelSelect(channel)}
                        className="w-full text-left p-2 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2 flex-1">
                          <Hash className="h-4 w-4" />
                          <div className="flex-1">
                            <span className="font-medium">{channel.name}</span>
                            {channel.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {channel.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                      
                      <div className="absolute right-2 top-2">
                        <ChannelActionsDropdown
                          channel={channel}
                          workspaceSlug={params.slug as string}
                          userRole={userRole}
                          currentUserId={currentUserId}
                          onChannelDeleted={handleChannelDeleted}
                          onChannelRenamed={handleChannelRenamed}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              {activeChannel ? (
                <>
                  {/* Channel Header */}
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center space-x-2">
                      <Hash className="h-5 w-5" />
                      <span>{activeChannel.name}</span>
                    </CardTitle>
                    {activeChannel.description && (
                      <CardDescription>{activeChannel.description}</CardDescription>
                    )}
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className="flex space-x-3">
                          <img 
                            src={message.author.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(message.author.name || "User") + "&background=3b82f6&color=fff"} 
                            alt={message.author.name} 
                            className="h-8 w-8 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {message.author.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mt-1">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {messages.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                      </div>
                    )}
                  </CardContent>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <form onSubmit={sendMessage} className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message #${activeChannel.name}`}
                        disabled={sending}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!newMessage.trim() || sending}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No channels available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Create a channel to start chatting with your team.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}