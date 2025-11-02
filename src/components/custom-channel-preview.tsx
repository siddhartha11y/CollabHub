"use client"

import { ChannelPreviewMessenger, ChannelPreviewMessengerProps } from "stream-chat-react"
import { CustomAvatar } from "./custom-avatar"
import { useChatContext } from "stream-chat-react"

export function CustomChannelPreview(props: ChannelPreviewMessengerProps) {
  const { channel } = props
  const { client } = useChatContext()
  
  // Get the other user in the channel
  const members = Object.values(channel.state.members || {})
  const otherMember = members.find((member: any) => member.user_id !== client?.userID)
  
  return (
    <div className="relative">
      {/* Custom Avatar */}
      {otherMember && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <CustomAvatar 
            userId={otherMember.user_id} 
            userName={otherMember.user?.name || otherMember.user_id} 
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