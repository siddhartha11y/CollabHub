import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// In-memory storage for chunks (in production, use Redis or database)
const chunkStorage = new Map<string, { chunks: Buffer[], metadata: any }>()

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
    const chunk = formData.get('chunk') as File
    const chunkIndex = parseInt(formData.get('chunkIndex') as string)
    const totalChunks = parseInt(formData.get('totalChunks') as string)
    const uploadId = formData.get('uploadId') as string
    const fileName = formData.get('fileName') as string
    const fileSize = parseInt(formData.get('fileSize') as string)
    const mimeType = formData.get('mimeType') as string
    const taskId = formData.get('taskId') as string | null

    if (!chunk || !uploadId || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Convert chunk to buffer
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer())

    // Store chunk
    if (!chunkStorage.has(uploadId)) {
      chunkStorage.set(uploadId, {
        chunks: new Array(totalChunks),
        metadata: { fileName, fileSize, mimeType, taskId, workspaceId: workspace.id, userId: user.id }
      })
    }

    const uploadData = chunkStorage.get(uploadId)!
    uploadData.chunks[chunkIndex] = chunkBuffer

    // Check if all chunks are received
    const allChunksReceived = uploadData.chunks.every(chunk => chunk !== undefined)

    if (allChunksReceived) {
      // Combine all chunks
      const completeFile = Buffer.concat(uploadData.chunks)
      const base64 = completeFile.toString('base64')
      const dataUrl = `data:${mimeType};base64,${base64}`

      // If taskId is provided, verify it belongs to the workspace
      if (taskId) {
        const task = await prisma.task.findFirst({
          where: {
            id: taskId,
            workspaceId: workspace.id
          }
        })

        if (!task) {
          chunkStorage.delete(uploadId)
          return NextResponse.json(
            { error: "Task not found in this workspace" },
            { status: 400 }
          )
        }
      }

      // Create file record
      const savedFile = await prisma.file.create({
        data: {
          name: fileName,
          url: dataUrl,
          size: fileSize,
          mimeType: mimeType,
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
          fileName: fileName,
          fileSize: fileSize,
          fileMimeType: mimeType,
          workspaceId: workspace.id,
          performedById: user.id,
          originalOwnerId: user.id
        }
      })

      // Clean up chunk storage
      chunkStorage.delete(uploadId)

      return NextResponse.json({
        fileComplete: true,
        file: savedFile
      })
    }

    // Return chunk received confirmation
    return NextResponse.json({
      fileComplete: false,
      chunkIndex,
      totalChunks,
      chunksReceived: uploadData.chunks.filter(chunk => chunk !== undefined).length
    })

  } catch (error) {
    console.error("Chunk upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Set runtime configuration
export const runtime = 'nodejs'
export const maxDuration = 60