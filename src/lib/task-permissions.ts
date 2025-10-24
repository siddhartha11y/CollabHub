import { prisma } from "@/lib/prisma"

export interface TaskPermissions {
  canUpdateStatus: boolean
  canDelete: boolean
  canAssign: boolean
  canView: boolean
}

export interface TaskPermissionContext {
  taskId: string
  userId: string
  workspaceId: string
}

/**
 * Check if user can update task status
 * Only the assigned user can update status, or any member if unassigned
 */
export async function canUpdateTaskStatus(
  taskId: string, 
  userId: string
): Promise<boolean> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        assigneeId: true,
        workspaceId: true
      }
    })

    if (!task) return false

    // If task is assigned, only assignee can update status
    if (task.assigneeId) {
      return task.assigneeId === userId
    }

    // If unassigned, check if user is workspace member
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId: task.workspaceId
      }
    })

    return !!membership
  } catch (error) {
    console.error("Error checking task status permission:", error)
    return false
  }
}

/**
 * Check if user can delete a task
 * Only the task creator can delete the task
 */
export async function canDeleteTask(
  taskId: string, 
  userId: string
): Promise<boolean> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        creatorId: true
      }
    })

    return task?.creatorId === userId
  } catch (error) {
    console.error("Error checking task delete permission:", error)
    return false
  }
}

/**
 * Check if user can assign/reassign a task
 * Task creator and workspace admins can assign tasks
 */
export async function canAssignTask(
  taskId: string, 
  userId: string
): Promise<boolean> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        creatorId: true,
        workspaceId: true
      }
    })

    if (!task) return false

    // Task creator can always assign
    if (task.creatorId === userId) return true

    // Check if user is workspace admin
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId: task.workspaceId,
        role: "ADMIN"
      }
    })

    return !!membership
  } catch (error) {
    console.error("Error checking task assign permission:", error)
    return false
  }
}

/**
 * Check if user can view a task
 * All workspace members can view tasks
 */
export async function canViewTask(
  taskId: string, 
  userId: string
): Promise<boolean> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        workspaceId: true
      }
    })

    if (!task) return false

    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId: task.workspaceId
      }
    })

    return !!membership
  } catch (error) {
    console.error("Error checking task view permission:", error)
    return false
  }
}

/**
 * Get all permissions for a user on a specific task
 */
export async function getTaskPermissions(
  taskId: string, 
  userId: string
): Promise<TaskPermissions> {
  const [canUpdateStatus, canDelete, canAssign, canView] = await Promise.all([
    canUpdateTaskStatus(taskId, userId),
    canDeleteTask(taskId, userId),
    canAssignTask(taskId, userId),
    canViewTask(taskId, userId)
  ])

  return {
    canUpdateStatus,
    canDelete,
    canAssign,
    canView
  }
}

/**
 * Validate if user is a member of the workspace
 */
export async function isWorkspaceMember(
  workspaceId: string, 
  userId: string
): Promise<boolean> {
  try {
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId
      }
    })

    return !!membership
  } catch (error) {
    console.error("Error checking workspace membership:", error)
    return false
  }
}