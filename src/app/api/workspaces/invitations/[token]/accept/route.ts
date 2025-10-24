import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
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

    // Get invitation
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token: params.token },
      include: {
        workspace: true
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      )
    }

    // Check if invitation is valid
    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invitation has already been processed" },
        { status: 400 }
      )
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      // Mark as expired
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" }
      })
      
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        userId: user.id,
        workspaceId: invitation.workspaceId
      }
    })

    if (existingMember) {
      // Mark invitation as accepted
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" }
      })

      return NextResponse.json({
        message: "You're already a member of this workspace",
        workspace: invitation.workspace
      })
    }

    // Create workspace membership and update invitation
    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: invitation.workspaceId,
          role: invitation.role
        }
      }),
      prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" }
      })
    ])

    return NextResponse.json({
      message: "Successfully joined workspace",
      workspace: invitation.workspace
    })
  } catch (error) {
    console.error("Accept invitation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}