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
        { error: "Unauthorized - Please log in" },
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

    // Validate file size (5MB max for reliable storage)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: `File "${file.name}" is too large. Maximum size is 5MB. Please compress your file or use a file hosting service for larger files.` },
        { status: 413 }
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

    try {
      // Convert file to base64 for storage
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
      try {
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
      } catch (activityError) {
        console.warn("Failed to log file activity:", activityError)
        // Don't fail the upload if activity logging fails
      }

      return NextResponse.json(savedFile)
    } catch (fileError) {
      console.error("File processing error:", fileError)
      if (fileError instanceof Error && fileError.message.includes('too large')) {
        return NextResponse.json(
          { error: "File too large for database storage. Please use a smaller file (under 5MB)." },
          { status: 413 }
        )
      }
      return NextResponse.json(
        { error: "Failed to process file. Please try a smaller file." },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Simple upload error:", error)
    
    if (error instanceof Error) {
      if (error.message.includes('too large') || error.message.includes('413')) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 5MB." },
          { status: 413 }
        )
      }
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: "Upload failed. Please try again with a smaller file." },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const maxDuration = 30