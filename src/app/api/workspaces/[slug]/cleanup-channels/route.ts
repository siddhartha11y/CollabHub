import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
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

    // Get workspace and check if user is admin
    const workspace = await prisma.workspace.findFirst({
      where: {
        slug: params.slug,
        members: {
          some: {
            userId: user.id,
            role: "ADMIN"
          }
        }
      }
    })

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or insufficient permissions" },
        { status: 404 }
      )
    }

    // Find duplicate general channels
    const generalChannels = await prisma.chatChannel.findMany({
      where: {
        name: "general",
        workspaceId: workspace.id
      },
      include: {
        messages: true
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    if (generalChannels.length <= 1) {
      return NextResponse.json({ 
        message: "No duplicate channels found",
        channelsFound: generalChannels.length 
      })
    }

    // Keep the first general channel (oldest) and delete the rest
    const channelsToDelete = generalChannels.slice(1)
    let deletedCount = 0

    for (const channel of channelsToDelete) {
      // Delete messages first
      await prisma.chatMessage.deleteMany({
        where: { channelId: channel.id }
      })
      
      // Delete channel
      await prisma.chatChannel.delete({
        where: { id: channel.id }
      })
      
      deletedCount++
    }

    return NextResponse.json({ 
      message: `Cleaned up ${deletedCount} duplicate general channels`,
      keptChannel: generalChannels[0].id,
      deletedChannels: channelsToDelete.map(c => c.id)
    })
  } catch (error) {
    console.error("Cleanup channels error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}