import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canUpdateTaskStatus, canDeleteTask, canAssignTask } from "@/lib/task-permissions"
import { isValidStatusTransition, validateStatusTransition } from "@/lib/task-status-progression"
import { logTaskStatusChanged, logTaskAssigned, logTaskDeleted } from "@/lib/activity-logger"
import { z } from "zod"

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; taskId: string } }
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
    const updateData = updateTaskSchema.parse(body)

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

    // Check if task exists and belongs to workspace
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.taskId,
        workspaceId: workspace.id
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      )
    }

    // Check permissions for status updates
    if (updateData.status && updateData.status !== existingTask.status) {
      const canUpdate = await canUpdateTaskStatus(params.taskId, user.id)
      if (!canUpdate) {
        return NextResponse.json(
          { error: "You don't have permission to update this task's status" },
          { status: 403 }
        )
      }

      // Validate status progression (forward-only)
      const validation = validateStatusTransition(existingTask.status, updateData.status)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }
    }

    // Check permissions for assignment changes
    if (updateData.assigneeId !== undefined && updateData.assigneeId !== existingTask.assigneeId) {
      const canAssign = await canAssignTask(params.taskId, user.id)
      if (!canAssign) {
        return NextResponse.json(
          { error: "You don't have permission to assign this task" },
          { status: 403 }
        )
      }
    }

    // If assigneeId is provided, verify they're a member of the workspace
    if (updateData.assigneeId) {
      const assigneeMember = await prisma.workspaceMember.findFirst({
        where: {
          userId: updateData.assigneeId,
          workspaceId: workspace.id
        }
      })

      if (!assigneeMember) {
        return NextResponse.json(
          { error: "Assignee is not a member of this workspace" },
          { status: 400 }
        )
      }
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: {
        id: params.taskId
      },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    // Log activities for changes
    if (updateData.status && updateData.status !== existingTask.status) {
      await logTaskStatusChanged(
        params.taskId,
        existingTask.title,
        user.id,
        workspace.id,
        existingTask.status,
        updateData.status
      )
    }

    if (updateData.assigneeId !== undefined && updateData.assigneeId !== existingTask.assigneeId) {
      if (updateData.assigneeId) {
        await logTaskAssigned(
          params.taskId,
          existingTask.title,
          user.id,
          updateData.assigneeId,
          workspace.id
        )
      }
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Update task error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; taskId: string } }
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

    // Check if task exists and belongs to workspace
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.taskId,
        workspaceId: workspace.id
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      )
    }

    // Check if user has permission to delete this task (only creator can delete)
    const canDelete = await canDeleteTask(params.taskId, user.id)
    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete this task. Only the task creator can delete it." },
        { status: 403 }
      )
    }

    // Log task deletion before deleting
    await logTaskDeleted(
      params.taskId,
      existingTask.title,
      user.id,
      workspace.id
    )

    // Delete task
    await prisma.task.delete({
      where: {
        id: params.taskId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}