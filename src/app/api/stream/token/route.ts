import { NextRequest, NextResponse } from "next/server"
import { StreamChat } from "stream-chat"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Get user email from request body (not from session to avoid 5KB limit)
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY
    const apiSecret = process.env.STREAM_API_SECRET

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ 
        error: "Stream API credentials not configured" 
      }, { status: 500 })
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret)

    // Use database ID as Stream user ID (guaranteed unique and short)
    const userId = user.id
    
    // Create token with ZERO extra data
    const token = serverClient.createToken(userId)

    // Return minimal data
    return NextResponse.json({ 
      token,
      userId,
      apiKey,
      userName: user.name || user.email.split('@')[0],
      userImage: user.image,
    })
  } catch (error) {
    console.error("Stream token error:", error)
    return NextResponse.json({ 
      error: "Failed to generate Stream token",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
