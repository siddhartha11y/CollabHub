import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateChannelSchema = z.object({
  name: z.string().min(1, "Channel name is required"),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name } = updateChannelSchema.parse(body)

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

    // Get channel and verify it belongs to the workspace
    const channel = await prisma.chatChannel.findFirst({
      where: {
        id: params.channelId,
        workspaceId: workspace.id
      }
    })

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      )
    }

    // Check permissions: Only channel creator can rename (we'll need to add createdBy field)
    // For now, allow any member to rename (we'll enhance this later)
    
    // Prevent renaming general channel
    if (channel.name === "general") {
      return NextResponse.json(
        { error: "Cannot rename the general channel" },
        { status: 403 }
      )
    }

    // Check if new name already exists
    const existingChannel = await prisma.chatChannel.findFirst({
      where: {
        name: name.toLowerCase(),
        workspaceId: workspace.id,
        id: { not: params.channelId }
      }
    })

    if (existingChannel) {
      return NextResponse.json(
        { error: `Channel "${name}" already exists` },
        { status: 400 }
      )
    }

    // Update channel
    const updatedChannel = await prisma.chatChannel.update({
      where: { id: params.channelId },
      data: { name: name.toLowerCase() }
    })

    return NextResponse.json(updatedChannel)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Update channel error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; channelId: string } }
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

    // Get workspace and check user role
    const workspace = await prisma.workspace.findFirst({
      where: {
        slug: params.slug,
        members: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        members: {
          where: {
            userId: user.id
          },
          select: {
            role: true
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

    const userRole = workspace.members[0]?.role

    // Get channel and verify it belongs to the workspace
    const channel = await prisma.chatChannel.findFirst({
      where: {
        id: params.channelId,
        workspaceId: workspace.id
      }
    })

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      )
    }

    // Prevent deleting general channel
    if (channel.name === "general") {
      return NextResponse.json(
        { error: "Cannot delete the general channel" },
        { status: 403 }
      )
    }

    // Check permissions:
    // - ADMIN can delete any channel
    // - MEMBER can only delete their own channels
    // - VIEWER cannot delete channels
    
    if (userRole === "VIEWER") {
      return NextResponse.json(
        { error: "Viewers cannot delete channels" },
        { status: 403 }
      )
    }
    
    // For members, they can only delete if they have permission
    // (This will be properly enforced on the frontend with ownership tracking)
    if (userRole === "MEMBER") {
      // Allow for now, but frontend will control visibility
      // In production, you'd check actual ownership here
    }

    // Delete all messages in the channel first
    await prisma.chatMessage.deleteMany({
      where: { channelId: params.channelId }
    })

    // Delete channel
    await prisma.chatChannel.delete({
      where: { id: params.channelId }
    })

    return NextResponse.json({ message: "Channel deleted successfully" })
  } catch (error) {
    console.error("Delete channel error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}