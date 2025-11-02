"use client"

import { ChannelPreviewMessenger, useChatContext } from "stream-chat-react"
import { CustomAvatar } from "./custom-avatar"

export function CustomChannelPreview(props: any) {
  const { channel } = props
  const { client } = useChatContext()
  
  // Safety checks
  if (!channel || !channel.state || !client) {
    return <ChannelPreviewMessenger {...props} />
  }
  
  // Get the other user in the channel
  const members = Object.values(channel.state.members || {})
  const otherMember = members.find((member: any) => member.user_id !== client.userID)
  
  return (
    <div className="relative">
      {/* Custom Avatar */}
      {otherMember && otherMember.user_id && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <CustomAvatar 
            userId={otherMember.user_id} 
            userName={otherMember.user?.name || otherMember.user_id || 'Unknown'} 
            size="md"
          />
        </div>
      )}
      
      {/* Default Channel Preview with custom styling */}
      <div className="pl-16">
        <ChannelPreviewMessenger {...props} />
      </div>
    </div>
  )
}