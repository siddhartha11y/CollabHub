"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const emojiCategories = {
  smileys: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴"],
  gestures: ["👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏"],
  hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"],
  objects: ["💼", "📁", "📂", "🗂", "📅", "📆", "🗒", "🗓", "📇", "📈", "📉", "📊", "📋", "📌", "📍", "📎", "🖇", "📏", "📐", "✂️", "🗃", "🗄", "🗑", "🔒", "🔓", "🔐", "🔑", "🗝", "🔨", "🪛", "⚙️", "🔧", "🔩", "⚡", "💡", "🔦", "🕯"],
  symbols: ["✅", "❌", "⭐", "🌟", "💫", "✨", "🔥", "💯", "🎯", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "⚠️", "🚨", "💬", "💭", "🗨", "🗯", "💤"],
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  return (
    <Card className="w-80 p-2">
      <Tabs defaultValue="smileys" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="smileys">😀</TabsTrigger>
          <TabsTrigger value="gestures">👋</TabsTrigger>
          <TabsTrigger value="hearts">❤️</TabsTrigger>
          <TabsTrigger value="objects">💼</TabsTrigger>
          <TabsTrigger value="symbols">✨</TabsTrigger>
        </TabsList>
        
        {Object.entries(emojiCategories).map(([category, emojis]) => (
          <TabsContent key={category} value={category}>
            <ScrollArea className="h-48">
              <div className="grid grid-cols-8 gap-1">
                {emojis.map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="h-10 w-10 p-0 text-xl hover:bg-accent"
                    onClick={() => onEmojiSelect(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  )
}
