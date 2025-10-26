import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    console.log("Large file upload API called")
    
    const session = await getServerSession(authOptions)
    console.log("Session:", session?.user?.email)
    
    if (!session?.user?.email) {
      console.log("No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Request body:", body)
    
    const { name, url, size, mimeType, storagePath, taskId } = body

    // Validate required fields
    if (!name || !url || !size || !mimeType || !storagePath) {
      console.log("Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get workspace
    console.log("Finding workspace:", params.slug)
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.slug },
      include: {
        members: {
          where: { user: { email: session.user.email } }
        }
      }
    })

    if (!workspace || workspace.members.length === 0) {
      console.log("Workspace not found or no access")
      return NextResponse.json({ error: "Workspace not found or access denied" }, { status: 404 })
    }

    console.log("Workspace found:", workspace.id)

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      console.log("User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("User found:", user.id)

    // Validate task if provided
    if (taskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          workspaceId: workspace.id
        }
      })

      if (!task) {
        console.log("Task not found")
        return NextResponse.json({ error: "Task not found" }, { status: 404 })
      }
    }

    // Create file record
    console.log("Creating file record...")
    const file = await prisma.file.create({
      data: {
        name,
        url,
        size: parseInt(size.toString()),
        mimeType,
        workspaceId: workspace.id,
        taskId: taskId || null,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        task: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    })

    console.log("File created:", file.id)

    // Create file activity
    try {
      await prisma.fileActivity.create({
        data: {
          action: "UPLOADED",
          fileName: name,
          fileSize: parseInt(size.toString()),
          fileMimeType: mimeType,
          workspaceId: workspace.id,
          performedById: user.id,
          originalOwnerId: user.id,
        }
      })
      console.log("File activity created")
    } catch (activityError) {
      console.log("File activity creation failed, but file was saved:", activityError)
      // Don't fail the whole request if activity logging fails
    }

    return NextResponse.json(file)

  } catch (error) {
    console.error("Large file upload error:", error)
    return NextResponse.json(
      { error: `Failed to save file metadata: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}