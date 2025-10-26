import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, url, size, mimeType, storagePath, taskId } = await request.json()

    // Validate required fields
    if (!name || !url || !size || !mimeType || !storagePath) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.slug },
      include: {
        members: {
          where: { user: { email: session.user.email } }
        }
      }
    })

    if (!workspace || workspace.members.length === 0) {
      return NextResponse.json({ error: "Workspace not found or access denied" }, { status: 404 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Validate task if provided
    if (taskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          workspaceId: workspace.id
        }
      })

      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 })
      }
    }

    // Create file record
    const file = await prisma.file.create({
      data: {
        name,
        url,
        size,
        mimeType,
        storagePath,
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

    // Create file activity
    await prisma.fileActivity.create({
      data: {
        action: "UPLOADED",
        fileName: name,
        fileSize: size,
        fileMimeType: mimeType,
        workspaceId: workspace.id,
        performedById: user.id,
        originalOwnerId: user.id,
      }
    })

    return NextResponse.json(file)

  } catch (error) {
    console.error("Large file upload error:", error)
    return NextResponse.json(
      { error: "Failed to save file metadata" },
      { status: 500 }
    )
  }
}