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
      return NextResponse.json({ 
        error: "Stream API credentials not configured. Please add NEXT_PUBLIC_STREAM_API_KEY and STREAM_API_SECRET to .env.local" 
      }, { status: 500 })
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret)

    // Use email as user ID (unique and consistent)
    const userId = session.user.email.replace(/[^a-zA-Z0-9_-]/g, '_')
    
    // Create token with minimal user data (Stream has 5KB limit)
    const token = serverClient.createToken(userId)

    // Generate avatar URL
    const userName = session.user.name || session.user.email.split('@')[0]
    const userImage = session.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff&size=128`

    return NextResponse.json({ 
      token,
      userId,
      apiKey,
      userName,
      userImage,
    })
  } catch (error) {
    console.error("Stream token error:", error)
    return NextResponse.json({ 
      error: "Failed to generate Stream token",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
