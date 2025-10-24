import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; fileId: string } }
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
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Valid file name is required" },
        { status: 400 }
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

    // Get file and verify it belongs to the workspace
    const file = await prisma.file.findFirst({
      where: {
        id: params.fileId,
        workspaceId: workspace.id
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      )
    }

    // Check permissions: Only file owner can rename
    if (file.uploadedById !== user.id) {
      return NextResponse.json(
        { error: "Only file owner can rename the file" },
        { status: 403 }
      )
    }

    const oldName = file.name
    const newName = name.trim()

    // Update file name
    const updatedFile = await prisma.file.update({
      where: { id: params.fileId },
      data: { name: newName },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Log rename activity
    await prisma.fileActivity.create({
      data: {
        action: "RENAMED",
        fileName: `${oldName} → ${newName}`,
        workspaceId: workspace.id,
        performedById: user.id,
        originalOwnerId: user.id
      }
    })

    return NextResponse.json(updatedFile)
  } catch (error) {
    console.error("Rename file error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; fileId: string } }
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
      },
      include: {
        members: {
          where: {
            userId: user.id
          },
          select: {
            role: true
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

    const userRole = workspace.members[0]?.role

    // Get file and verify it belongs to the workspace
    const file = await prisma.file.findFirst({
      where: {
        id: params.fileId,
        workspaceId: workspace.id
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      )
    }

    // Check permissions:
    // - ADMIN can delete any file in the workspace
    // - MEMBER can only delete their own files
    // - VIEWER cannot delete any files
    
    if (userRole === "VIEWER") {
      return NextResponse.json(
        { error: "Viewers cannot delete files" },
        { status: 403 }
      )
    }
    
    // Check permissions:
    // - ADMIN can delete any file in the workspace
    // - MEMBER can only delete their own files
    // - VIEWER cannot delete any files
    
    if (userRole === "VIEWER") {
      return NextResponse.json(
        { error: "Viewers cannot delete files" },
        { status: 403 }
      )
    }
    
    if (userRole === "MEMBER" && file.uploadedById !== user.id) {
      return NextResponse.json(
        { error: "Members can only delete their own files" },
        { status: 403 }
      )
    }
    
    // ADMIN can delete any file, MEMBER can delete their own files

    // Log file deletion activity
    await prisma.fileActivity.create({
      data: {
        action: "DELETED",
        fileName: file.name,
        fileSize: file.size,
        fileMimeType: file.mimeType,
        workspaceId: workspace.id,
        performedById: user.id,
        originalOwnerId: file.uploadedById
      }
    })

    // Delete file
    await prisma.file.delete({
      where: { id: params.fileId }
    })

    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("Delete file error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}