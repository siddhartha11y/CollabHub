import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateDocumentSchema = z.object({
  title: z.string().min(1, "Document title is required").optional(),
  content: z.string().optional(),
})

const renameDocumentSchema = z.object({
  title: z.string().min(1, "Document title is required"),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; documentId: string } }
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

    // Get document
    const document = await prisma.document.findFirst({
      where: {
        id: params.documentId,
        workspaceId: workspace.id
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

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error("Get document error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; documentId: string } }
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
    
    // Check if this is a rename operation (only title provided)
    const isRename = body.title && !body.hasOwnProperty('content')
    
    const schema = isRename ? renameDocumentSchema : updateDocumentSchema
    const updateData = schema.parse(body)

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

    // Get document and verify it belongs to the workspace
    const existingDocument = await prisma.document.findFirst({
      where: {
        id: params.documentId,
        workspaceId: workspace.id
      }
    })

    if (!existingDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Check permissions:
    // - ADMIN can edit any document in the workspace
    // - MEMBER can only edit their own documents
    // - VIEWER cannot edit any documents
    
    if (userRole === "VIEWER") {
      return NextResponse.json(
        { error: "Viewers cannot edit documents" },
        { status: 403 }
      )
    }
    
    // For rename operations: Only document author can rename (even admins)
    if (isRename && existingDocument.authorId !== user.id) {
      return NextResponse.json(
        { error: "Only document author can rename the document" },
        { status: 403 }
      )
    }
    
    // For content editing: Admin can edit any document, Member can only edit their own
    if (!isRename && userRole === "MEMBER" && existingDocument.authorId !== user.id) {
      return NextResponse.json(
        { error: "Members can only edit their own documents" },
        { status: 403 }
      )
    }

    const oldTitle = existingDocument.title

    // Update document
    const document = await prisma.document.update({
      where: { id: params.documentId },
      data: updateData,
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

    // Log rename activity if this was a rename operation
    if (isRename && updateData.title && updateData.title !== oldTitle) {
      await prisma.documentActivity.create({
        data: {
          action: "RENAMED",
          documentTitle: `${oldTitle} → ${updateData.title}`,
          workspaceId: workspace.id,
          performedById: user.id,
          originalAuthorId: existingDocument.authorId
        }
      })
    }

    return NextResponse.json(document)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Update document error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; documentId: string } }
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

    // Get document and verify it belongs to the workspace
    const document = await prisma.document.findFirst({
      where: {
        id: params.documentId,
        workspaceId: workspace.id
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Check permissions:
    // - ADMIN can delete any document in the workspace
    // - MEMBER can only delete their own documents
    // - VIEWER cannot delete any documents
    
    if (userRole === "VIEWER") {
      return NextResponse.json(
        { error: "Viewers cannot delete documents" },
        { status: 403 }
      )
    }
    
    if (userRole === "MEMBER" && document.authorId !== user.id) {
      return NextResponse.json(
        { error: "Members can only delete their own documents" },
        { status: 403 }
      )
    }

    // Log document deletion activity
    await prisma.documentActivity.create({
      data: {
        action: "DELETED",
        documentTitle: document.title,
        workspaceId: workspace.id,
        performedById: user.id,
        originalAuthorId: document.authorId
      }
    })

    // Delete document
    await prisma.document.delete({
      where: { id: params.documentId }
    })

    return NextResponse.json({ message: "Document deleted successfully" })
  } catch (error) {
    console.error("Delete document error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}