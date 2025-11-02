"use client"

import { CustomAvatar } from "./custom-avatar"
import { MessageSimple, useChatContext } from "stream-chat-react"

export function CustomMessage(props: any) {
  const { message } = props
  const { client } = useChatContext()
  
  // Safety checks
  if (!message || !message.user) {
    return <MessageSimple {...props} />
  }
  
  const isOwn = message.user.id === client?.userID
  
  return (
    <div className="relative">
      {/* Custom Avatar - only show for other users' messages */}
      {!isOwn && message.user.id && (
        <div className="custom-message-avatar">
          <CustomAvatar 
            userId={message.user.id} 
            userName={message.user.name || message.user.id || 'Unknown'} 
            size="sm"
          />
        </div>
      )}
      
      {/* Default Stream Message Component */}
      <MessageSimple {...props} />
    </div>
  )
}