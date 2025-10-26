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

    // Parse FormData
    const formData = await req.formData()
    const file = formData.get('file') as File
    const taskId = formData.get('taskId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      )
    }

    // If taskId is provided, verify it belongs to the workspace
    if (taskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          workspaceId: workspace.id
        }
      })

      if (!task) {
        return NextResponse.json(
          { error: "Task not found in this workspace" },
          { status: 400 }
        )
      }
    }

    // Convert file to base64 for storage (temporary solution)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${base64}`

    // Create file record
    const savedFile = await prisma.file.create({
      data: {
        name: file.name,
        url: dataUrl,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        workspaceId: workspace.id,
        taskId: taskId || null,
        uploadedById: user.id
      },
      include: {
        task: {
          select: {
            id: true,
            title: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    // Log upload activity
    await prisma.fileActivity.create({
      data: {
        action: "UPLOADED",
        fileName: file.name,
        fileSize: file.size,
        fileMimeType: file.type || 'application/octet-stream',
        workspaceId: workspace.id,
        performedById: user.id,
        originalOwnerId: user.id
      }
    })

    return NextResponse.json(savedFile)
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Increase body size limit for this route
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds timeout