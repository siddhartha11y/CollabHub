import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { StreamChat } from "stream-chat"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY
    const apiSecret = process.env.STREAM_API_SECRET

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ unreadCount: 0 })
    }

    try {
      // Get user from database to get their Stream user ID
      const { prisma } = await import("@/lib/prisma")
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })

      if (!user) {
        return NextResponse.json({ unreadCount: 0 })
      }

      const serverClient = StreamChat.getInstance(apiKey, apiSecret)
      
      // Query channels where user is a member
      const channels = await serverClient.queryChannels({
        type: 'messaging',
        members: { $in: [user.id] }
      })

      // Calculate total unread count
      let totalUnreadCount = 0
      
      for (const channel of channels) {
        const channelState = await channel.query()
        const unreadCount = channelState.channel.state.unreadCount || 0
        totalUnreadCount += unreadCount
      }

      return NextResponse.json({ 
        unreadCount: totalUnreadCount,
        channelCount: channels.length 
      })
    } catch (streamError) {
      console.error("Stream API error:", streamError)
      // Return 0 if Stream is not configured or has issues
      return NextResponse.json({ unreadCount: 0 })
    }
  } catch (error) {
    console.error("Unread messages API error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch unread count",
      unreadCount: 0 
    }, { status: 500 })
  }
}