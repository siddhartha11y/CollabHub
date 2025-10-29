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

    // Create simple user ID from email (hash to keep it short)
    const emailHash = Buffer.from(session.user.email).toString('base64').substring(0, 20).replace(/[^a-zA-Z0-9]/g, '')
    const userId = `user_${emailHash}`
    
    // Create token with NO extra user data (Stream has 5KB limit)
    const token = serverClient.createToken(userId)

    // Minimal user info
    const userName = session.user.name?.substring(0, 30) || session.user.email.split('@')[0]
    const userImage = session.user.image || null

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
