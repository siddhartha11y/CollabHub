import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createFileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  url: z.string().url("Valid URL is required"),
  size: z.number().positive("File size must be positive"),
  mimeType: z.string().min(1, "MIME type is required"),
  taskId: z.string().optional(),
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

    // Get files
    const files = await prisma.file.findMany({
      where: {
        workspaceId: workspace.id
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
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(files)
  } catch (error) {
    console.error("Get files error:", error)
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
    const { name, url, size, mimeType, taskId } = createFileSchema.parse(body)

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

    // Create file record
    const file = await prisma.file.create({
      data: {
        name,
        url,
        size,
        mimeType,
        workspaceId: workspace.id,
        taskId: taskId || null,
        uploadedById: user.id // Track who uploaded the file
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
        fileName: name,
        fileSize: size,
        fileMimeType: mimeType,
        workspaceId: workspace.id,
        performedById: user.id,
        originalOwnerId: user.id
      }
    })

    return NextResponse.json(file)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Create file error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}