"use client"

import { CustomAvatar } from "./custom-avatar"
import { MessageSimple, MessageSimpleProps } from "stream-chat-react"

export function CustomMessage(props: MessageSimpleProps) {
  const { message } = props
  const isOwn = message.user?.id === props.client?.userID
  
  return (
    <div className="relative">
      {/* Custom Avatar - only show for other users' messages */}
      {!isOwn && (
        <div className="custom-message-avatar">
          <CustomAvatar 
            userId={message.user?.id} 
            userName={message.user?.name || message.user?.id} 
            size="sm"
          />
        </div>
      )}
      
      {/* Default Stream Message Component */}
      <MessageSimple {...props} />
    </div>
  )
}