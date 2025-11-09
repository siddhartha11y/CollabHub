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
        workspace: true,
        invitedBy: true
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      )
    }

    // Check if invitation is for this user
    if (invitation.email !== user.email) {
      return NextResponse.json(
        { error: "This invitation is not for you" },
        { status: 403 }
      )
    }

    // Check if invitation is still valid
    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "This invitation is no longer valid" },
        { status: 400 }
      )
    }

    // Check if invitation has expired
    if (new Date(invitation.expiresAt) < new Date()) {
      // Mark as expired
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" }
      })
      
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      )
    }

    // Mark invitation as declined
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: "DECLINED" }
    })

    return NextResponse.json({
      message: "Invitation declined successfully",
      workspace: invitation.workspace
    })
  } catch (error) {
    console.error("Decline invitation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}