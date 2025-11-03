"use client"

import { CustomAvatar } from "./custom-avatar"
import { useChatContext } from "stream-chat-react"

export function CustomMessage(props: any) {
  const { message } = props
  const { client } = useChatContext()
  
  // Safety checks
  if (!message || !message.user || !message.text) {
    return null
  }
  
  const isOwn = message.user.id === client?.userID
  
  return (
    <div className={`custom-message-container ${isOwn ? 'own-message' : 'other-message'}`}>
      {/* Avatar for other users only */}
      {!isOwn && (
        <div className="custom-message-avatar flex-shrink-0">
          <CustomAvatar 
            userId={message.user.id} 
            userName={message.user.name || message.user.id || 'Unknown'} 
            size="sm"
          />
        </div>
      )}
      
      {/* Message content */}
      <div className="custom-message-content">
        <div className={`custom-message-bubble ${isOwn ? 'own' : 'other'}`}>
          {message.text}
        </div>
      </div>
    </div>
  )
}