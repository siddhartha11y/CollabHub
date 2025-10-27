"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  Send, 
  Smile, 
  Paperclip, 
  MoreHorizontal,
  Hash,
  Users,
  Settings
} from 'lucide-react'

import { cn } from '@/lib/utils'

interface Message {
  id: string
  content: string
  createdAt: string
  displayName: string
  author: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface ModernChatInterfaceProps {
  messages: Message[]
  onSendMessage: (content: string) => Promise<boolean>
  sending: boolean
  channelName: string
  channelDescription?: string
  currentUserEmail: string
}

// Popular emojis for quick access
const QUICK_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
  '🙌', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
  '✨', '🎉', '🎊', '🔥', '💯', '⚡', '💥', '💫', '⭐', '🌟'
]

export function ModernChatInterface({
  messages,
  onSendMessage,
  sending,
  channelName,
  channelDescription,
  currentUserEmail
}: ModernChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    const success = await onSendMessage(newMessage)
    if (success) {
      setNewMessage('')
      inputRef.current?.focus()
    }
  }

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const isCurrentUser = (message: Message) => {
    return message.author.email === currentUserEmail
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Channel Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Hash className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {channelName}
                </h2>
                {channelDescription && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {channelDescription}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
              <Users className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <Hash className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Welcome to #{channelName}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md">
              This is the beginning of your conversation in #{channelName}. 
              Send a message to get started!
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = isCurrentUser(message)
            const showAvatar = index === 0 || messages[index - 1].author.id !== message.author.id
            const isLastFromUser = index === messages.length - 1 || 
              messages[index + 1].author.id !== message.author.id

            return (
              <div
                key={message.id}
                className={cn(
                  "flex items-end space-x-3 group animate-in slide-in-from-bottom-2 duration-300",
                  isOwn && "flex-row-reverse space-x-reverse"
                )}
              >
                {/* Avatar */}
                <div className={cn("flex-shrink-0", !showAvatar && "invisible")}>
                  <img
                    src={message.author.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.author.name || 'User')}&background=3b82f6&color=fff`}
                    alt={message.author.name}
                    className="h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm"
                  />
                </div>

                {/* Message Content */}
                <div className={cn("flex flex-col max-w-xs lg:max-w-md", isOwn && "items-end")}>
                  {showAvatar && (
                    <div className={cn("flex items-center space-x-2 mb-1", isOwn && "flex-row-reverse space-x-reverse")}>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {message.displayName}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md",
                      isOwn
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md border border-slate-200 dark:border-slate-700"
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <div className="flex items-center space-x-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${channelName}...`}
                disabled={sending}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-900 dark:text-white placeholder:text-slate-500"
              />
              
              <div className="flex items-center space-x-1">
                {/* Emoji Picker */}
                <div className="relative" ref={emojiPickerRef}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                  
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 w-80 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                      <div className="grid grid-cols-10 gap-2 max-h-64 overflow-y-auto">
                        {QUICK_EMOJIS.map((emoji, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => addEmoji(emoji)}
                            className="p-2 text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors duration-150"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Attachment Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Send Button */}
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}