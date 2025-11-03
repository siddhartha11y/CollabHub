"use client"

import { CustomAvatar } from "./custom-avatar"
import { MessageSimple, useChatContext } from "stream-chat-react"

export function CustomMessage(props: any) {
  const { message } = props
  const { client } = useChatContext()
  
  // Debug logging
  console.log('CustomMessage rendered:', { message, hasText: !!message?.text, userId: message?.user?.id })
  
  // Safety checks - if no message or user, fall back to default
  if (!message || !message.user) {
    console.log('No message or user, falling back to MessageSimple')
    return <MessageSimple {...props} />
  }
  
  // If it's a text message, use our custom layout
  if (message.text) {
    const isOwn = message.user.id === client?.userID
    console.log('Rendering custom message:', { text: message.text, isOwn, userId: message.user.id })
    
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
  console.log('Non-text message, falling back to MessageSimple')
  return <MessageSimple {...props} />
}