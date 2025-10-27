"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { MobileHeader } from "@/components/mobile-header"
import { CreateChannelModal } from "@/components/create-channel-modal"
import { ModernChatInterface } from "@/components/modern-chat-interface"
import { EnhancedChannelSidebar } from "@/components/enhanced-channel-sidebar"
import { useChat } from "@/hooks/use-chat"
import { useChannelManagement } from "@/hooks/use-channel-management"

export default function ChatPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [workspace, setWorkspace] = useState<any>(null)
  const [activeChannel, setActiveChannel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER")
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [createChannelModalOpen, setCreateChannelModalOpen] = useState(false)

  // Use custom hooks for chat and channel management
  const { messages, sending, sendMessage } = useChat({
    workspaceSlug: params.slug as string,
    channelId: activeChannel?.id || null
  })

  const {
    visibleChannels,
    setChannels,
    hideChannel,
    canDeleteChannel
  } = useChannelManagement({
    workspaceSlug: params.slug as string,
    currentUserId
  })

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
          
          // Check if general channel exists, if not create it
          let generalChannel = channelsData.find((channel: any) => channel.name === "general")
          
          if (!generalChannel && channelsData.length === 0) {
            generalChannel = await createDefaultChannel()
          }
          
          // Try to restore last selected channel from localStorage
          const lastChannelId = localStorage.getItem(`lastChannel_${params.slug}`)
          const lastChannel = channelsData.find((channel: any) => channel.id === lastChannelId)
          
          if (lastChannel) {
            setActiveChannel(lastChannel)
          } else if (generalChannel) {
            setActiveChannel(generalChannel)
          } else if (channelsData.length > 0) {
            setActiveChannel(channelsData[0])
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
        return channel
      }
    } catch (error) {
      console.error("Failed to create default channel:", error)
    }
    return null
  }

  const handleChannelSelect = (channel: any) => {
    setActiveChannel(channel)
    localStorage.setItem(`lastChannel_${params.slug}`, channel.id)
  }

  const handleChannelCreated = (newChannel: any) => {
    setChannels(prev => [...prev, newChannel])
    handleChannelSelect(newChannel)
  }

  const handleChannelDeleted = async (channelId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${params.slug}/channels/${channelId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setChannels(prev => prev.filter(channel => channel.id !== channelId))
        
        // If deleted channel was active, switch to general or first available
        if (activeChannel?.id === channelId) {
          const remainingChannels = visibleChannels.filter(channel => channel.id !== channelId)
          const generalChannel = remainingChannels.find(channel => channel.name === "general")
          setActiveChannel(generalChannel || remainingChannels[0] || null)
        }
      }
    } catch (error) {
      console.error('Failed to delete channel:', error)
    }
  }

  const handleChannelHide = (channelId: string) => {
    hideChannel(channelId)
    
    // If hidden channel was active, switch to general or first available
    if (activeChannel?.id === channelId) {
      const remainingChannels = visibleChannels.filter(channel => channel.id !== channelId)
      const generalChannel = remainingChannels.find(channel => channel.name === "general")
      setActiveChannel(generalChannel || remainingChannels[0] || null)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 overflow-x-hidden">
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
          {/* Enhanced Channels Sidebar */}
          <div className="lg:col-span-1">
            <EnhancedChannelSidebar
              channels={visibleChannels}
              activeChannel={activeChannel}
              currentUserId={currentUserId}
              userRole={userRole}
              onChannelSelect={handleChannelSelect}
              onChannelHide={handleChannelHide}
              onChannelDelete={handleChannelDeleted}
              onCreateChannel={() => setCreateChannelModalOpen(true)}
            />
          </div>

          {/* Modern Chat Interface */}
          <div className="lg:col-span-3">
            {activeChannel ? (
              <ModernChatInterface
                messages={messages}
                onSendMessage={sendMessage}
                sending={sending}
                channelName={activeChannel.name}
                channelDescription={activeChannel.description}
                currentUserEmail={session?.user?.email || ''}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg shadow-lg">
                <div className="text-center">
                  <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full mb-4 mx-auto w-fit">
                    <Hash className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No channels available
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    Create a channel to start chatting with your team.
                  </p>
                  <CreateChannelModal 
                    workspaceSlug={params.slug as string}
                    onChannelCreated={handleChannelCreated}
                  >
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Create First Channel
                    </button>
                  </CreateChannelModal>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Channel Modal */}
      <CreateChannelModal 
        workspaceSlug={params.slug as string}
        onChannelCreated={handleChannelCreated}
        open={createChannelModalOpen}
        onOpenChange={setCreateChannelModalOpen}
      />
    </div>
  )
}