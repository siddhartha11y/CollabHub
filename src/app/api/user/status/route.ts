import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { isOnline } = await request.json()

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        isOnline: isOnline,
        lastSeen: new Date(),
      },
    })

    return NextResponse.json({ success: true, isOnline: user.isOnline })
  } catch (error) {
    console.error("Status update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
