import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createChannelSchema = z.object({
  name: z.string().min(1, "Channel name is required"),
  description: z.string().optional(),
})

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

    const body = await req.json()
    const { name, description } = createChannelSchema.parse(body)

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

    // Get workspace and check if user is a member (ADMIN or MEMBER can create channels)
    const workspace = await prisma.workspace.findFirst({
      where: {
        slug: params.slug,
        members: {
          some: {
            userId: user.id,
            role: {
              in: ["ADMIN", "MEMBER"]
            }
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

    // Check if channel with same name already exists
    const existingChannel = await prisma.chatChannel.findFirst({
      where: {
        name: name.toLowerCase(),
        workspaceId: workspace.id
      }
    })

    if (existingChannel) {
      return NextResponse.json(
        { error: `Channel "${name}" already exists` },
        { status: 400 }
      )
    }

    // Create channel
    const channel = await prisma.chatChannel.create({
      data: {
        name: name.toLowerCase(),
        description,
        workspaceId: workspace.id,
        // createdById: user.id // TODO: Add when database is updated
      },
      // TODO: Add createdBy when database is updated
      // include: {
      //   createdBy: {
      //     select: {
      //       id: true,
      //       name: true,
      //       email: true
      //     }
      //   }
      // }
    })

    return NextResponse.json(channel)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Create channel error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}