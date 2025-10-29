import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { conversationId } = params
    const { type } = await request.json()

    if (!type || !["VOICE", "VIDEO"].includes(type)) {
      return NextResponse.json({ error: "Invalid call type" }, { status: 400 })
    }

    // Verify user is participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            id: user.id,
          },
        },
      },
      include: {
        participants: true,
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Create call
    const call = await prisma.call.create({
      data: {
        type,
        conversationId,
        participants: {
          connect: conversation.participants.map(p => ({ id: p.id })),
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(call, { status: 201 })
  } catch (error) {
    console.error("Call creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { conversationId } = params

    // Verify user is participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            id: user.id,
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Get call history
    const calls = await prisma.call.findMany({
      where: {
        conversationId,
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    })

    return NextResponse.json(calls)
  } catch (error) {
    console.error("Calls fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
