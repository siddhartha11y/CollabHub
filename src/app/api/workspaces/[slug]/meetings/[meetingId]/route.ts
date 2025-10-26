import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; meetingId: string } }
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

    // Get the meeting and check if user is the creator
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: params.meetingId,
        workspaceId: workspace.id
      },
      include: {
        creator: true
      }
    })

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      )
    }

    // Check if user is the creator or has admin role
    const userMembership = await prisma.workspaceMember.findFirst({
      where: {
        userId: user.id,
        workspaceId: workspace.id
      }
    })

    const canDelete = meeting.creatorId === user.id || userMembership?.role === 'ADMIN'

    if (!canDelete) {
      return NextResponse.json(
        { error: "You can only delete meetings you created" },
        { status: 403 }
      )
    }

    // Delete the meeting
    await prisma.meeting.delete({
      where: {
        id: params.meetingId
      }
    })

    // TODO: Log the activity once MeetingActivity model is available in production
    // This is temporarily disabled to prevent deployment issues

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete meeting error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}