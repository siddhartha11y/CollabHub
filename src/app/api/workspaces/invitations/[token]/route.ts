import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token: params.token },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            description: true,
            slug: true
          }
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(invitation)
  } catch (error) {
    console.error("Get invitation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}