"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserImage } from "@/hooks/use-user-image"

interface CustomAvatarProps {
  userId?: string
  userName?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function CustomAvatar({ userId, userName, size = "md", className = "" }: CustomAvatarProps) {
  const { imageUrl } = useUserImage(userId)
  
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-12 h-12"
  }
  
  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={imageUrl || undefined} />
      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
        {userName?.[0]?.toUpperCase() || "U"}
      </AvatarFallback>
    </Avatar>
  )
}