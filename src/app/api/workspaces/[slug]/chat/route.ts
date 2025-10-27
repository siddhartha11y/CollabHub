import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  channelId: z.string().min(1, "Channel ID is required"),
})

export async function GET(
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

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')
    const afterMessageId = searchParams.get('after')

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

    if (channelId) {
      // Build where clause
      const whereClause: any = {
        channelId: channelId,
        channel: {
          workspaceId: workspace.id
        }
      }

      // If polling for new messages after a specific message
      if (afterMessageId) {
        whereClause.createdAt = {
          gt: (await prisma.chatMessage.findUnique({
            where: { id: afterMessageId },
            select: { createdAt: true }
          }))?.createdAt || new Date(0)
        }
      }

      // Get messages for specific channel
      const messages = await prisma.chatMessage.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        },
        take: afterMessageId ? 10 : 50 // Limit new messages to 10
      })

      return NextResponse.json(messages)
    } else {
      // Get channels for workspace
      const channels = await prisma.chatChannel.findMany({
        where: {
          workspaceId: workspace.id
        },
        include: {
          // TODO: Add createdBy when database is updated
          // createdBy: {
          //   select: {
          //     id: true,
          //     name: true,
          //     email: true
          //   }
          // },
          messages: {
            take: 1,
            orderBy: {
              createdAt: "desc"
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      })

      return NextResponse.json(channels)
    }
  } catch (error) {
    console.error("Get chat error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

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
    const { content, channelId } = createMessageSchema.parse(body)

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

    // Verify channel belongs to workspace
    const channel = await prisma.chatChannel.findFirst({
      where: {
        id: channelId,
        workspaceId: workspace.id
      }
    })

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      )
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        content,
        channelId,
        authorId: user.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Create message error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}