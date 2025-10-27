import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get workspace and check if user is a member
    const workspace = await prisma.workspace.findFirst({
      where: {
        slug: params.slug,
        members: {
          some: {
            userId: user.id
          }
        }
      }
    })

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      )
    }

    // Get the message and verify ownership
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: params.messageId,
        authorId: user.id, // Only author can delete
        channel: {
          workspaceId: workspace.id
        }
      }
    })

    if (!message) {
      return NextResponse.json(
        { error: "Message not found or you don't have permission to delete it" },
        { status: 404 }
      )
    }

    // Check if message is within 5 minutes
    const now = new Date()
    const messageTime = new Date(message.createdAt)
    const timeDifference = now.getTime() - messageTime.getTime()
    const fiveMinutesInMs = 5 * 60 * 1000

    if (timeDifference > fiveMinutesInMs) {
      return NextResponse.json(
        { error: "Cannot delete message after 5 minutes" },
        { status: 400 }
      )
    }

    // Delete the message
    await prisma.chatMessage.delete({
      where: {
        id: params.messageId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete message error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}