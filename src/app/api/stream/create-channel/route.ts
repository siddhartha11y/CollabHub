import { NextRequest, NextResponse } from "next/server"
import { StreamChat } from "stream-chat"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { currentUserEmail, targetUserId } = await request.json()
    
    if (!currentUserEmail || !targetUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: currentUserEmail },
      select: { id: true, name: true, email: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Current user not found" }, { status: 404 })
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 })
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY
    const apiSecret = process.env.STREAM_API_SECRET

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: "Stream not configured" }, { status: 500 })
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret)

    // IMPORTANT: Register both users in Stream first (upsert = create or update)
    await serverClient.upsertUsers([
      {
        id: currentUser.id,
        name: (currentUser.name || currentUser.email.split('@')[0]).substring(0, 20),
      },
      {
        id: targetUser.id,
        name: (targetUser.name || targetUser.email.split('@')[0]).substring(0, 20),
      },
    ])

    // Create channel ID from sorted user IDs (ensures same channel for both users)
    const channelId = [currentUser.id, targetUser.id].sort().join('_')

    // Create or get channel (this is your one-to-one conversation, like Instagram DM)
    const channel = serverClient.channel('messaging', channelId, {
      members: [currentUser.id, targetUser.id],
      created_by_id: currentUser.id,
    })

    await channel.create()

    return NextResponse.json({ 
      success: true,
      channelId,
    })
  } catch (error) {
    console.error("Channel creation error:", error)
    return NextResponse.json({ 
      error: "Failed to create channel",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
