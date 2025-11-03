"use client"

import { CustomAvatar } from "./custom-avatar"
import { MessageSimple, useChatContext } from "stream-chat-react"

export function CustomMessage(props: any) {
  const { message } = props
  const { client } = useChatContext()
  
  // Safety checks - if no message or user, fall back to default
  if (!message || !message.user) {
    return <MessageSimple {...props} />
  }
  
  // If it's a text message, use our custom layout
  if (message.text) {
    const isOwn = message.user.id === client?.userID
    
    return (
      <div className={`custom-message-container ${isOwn ? 'own-message' : 'other-message'}`}>
        {/* Avatar for other users only */}
        {!isOwn && (
          <div className="custom-message-avatar shrink-0">
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
  
  // For non-text messages (attachments, etc.), fall back to default Stream component
  return <MessageSimple {...props} />
}