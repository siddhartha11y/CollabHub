import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return new NextResponse("Channel ID required", { status: 400 })
    }

    // Verify user has access to workspace
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        slug: params.slug,
        members: {
          some: { userId: user.id }
        }
      }
    })

    if (!workspace) {
      return new NextResponse("Access denied", { status: 403 })
    }

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        
        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
        )

        // Poll for new messages every 2 seconds (much faster than before)
        const interval = setInterval(async () => {
          try {
            const messages = await prisma.chatMessage.findMany({
              where: {
                channelId: channelId,
                channel: { workspaceId: workspace.id },
                createdAt: {
                  gte: new Date(Date.now() - 5000) // Last 5 seconds
                }
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
              },
              orderBy: { createdAt: 'desc' },
              take: 10
            })

            if (messages.length > 0) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'messages', 
                  data: messages.reverse() 
                })}\n\n`)
              )
            }
          } catch (error) {
            console.error('SSE polling error:', error)
          }
        }, 2000)

        // Cleanup on close
        req.signal.addEventListener('abort', () => {
          clearInterval(interval)
          controller.close()
        })
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })
  } catch (error) {
    console.error("SSE stream error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}