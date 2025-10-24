import { prisma } from "@/lib/prisma"
import { createTaskAssignedNotification } from "@/lib/local-notifications"

export type TaskAction = "CREATED" | "ASSIGNED" | "UNASSIGNED" | "STATUS_CHANGED" | "DELETED"
export type NotificationType = "TASK_ASSIGNED" | "TASK_STATUS_CHANGED" | "TASK_COMPLETED"

interface LogTaskActivityParams {
  taskId: string
  action: TaskAction
  performedById: string
  workspaceId: string
  description: string
  previousValue?: string
  newValue?: string
}

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  taskId?: string
  workspaceId: string
}

/**
 * Log a task activity to the database
 */
export async function logTaskActivity(params: LogTaskActivityParams) {
  try {
    await prisma.taskActivity.create({
      data: {
        taskId: params.taskId,
        action: params.action,
        description: params.description,
        previousValue: params.previousValue,
        newValue: params.newValue,
        performedById: params.performedById,
        workspaceId: params.workspaceId
      }
    })
  } catch (error) {
    console.error("Error logging task activity:", error)
    // Don't throw error to avoid breaking main functionality
  }
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        taskId: params.taskId,
        workspaceId: params.workspaceId
      }
    })
  } catch (error) {
    console.error("Error creating notification:", error)
    // Don't throw error to avoid breaking main functionality
  }
}

/**
 * Log task creation activity
 */
export async function logTaskCreated(
  taskId: string,
  taskTitle: string,
  creatorId: string,
  workspaceId: string,
  assigneeId?: string
) {
  await logTaskActivity({
    taskId,
    action: "CREATED",
    performedById: creatorId,
    workspaceId,
    description: `Created task "${taskTitle}"`
  })

  // If task is assigned during creation, log assignment and create notification
  if (assigneeId && assigneeId !== creatorId) {
    await logTaskAssigned(taskId, taskTitle, creatorId, assigneeId, workspaceId)
  }
}

/**
 * Log task assignment activity and create notification
 */
export async function logTaskAssigned(
  taskId: string,
  taskTitle: string,
  assignerId: string,
  assigneeId: string,
  workspaceId: string
) {
  // Get assigner and assignee names for better descriptions
  const [assigner, assignee] = await Promise.all([
    prisma.user.findUnique({
      where: { id: assignerId },
      select: { name: true }
    }),
    prisma.user.findUnique({
      where: { id: assigneeId },
      select: { name: true }
    })
  ])

  const assignerName = assigner?.name || "Someone"
  const assigneeName = assignee?.name || "Unknown User"

  // Log activity
  await logTaskActivity({
    taskId,
    action: "ASSIGNED",
    performedById: assignerId,
    workspaceId,
    description: `Assigned task "${taskTitle}" to ${assigneeName}`,
    newValue: assigneeId
  })

  // Create notification for assignee (only if different from assigner)
  if (assigneeId !== assignerId) {
    // Try database notification first, fallback to localStorage
    try {
      await createNotification({
        userId: assigneeId,
        type: "TASK_ASSIGNED",
        title: "New Task Assigned",
        message: `${assignerName} assigned you the task "${taskTitle}"`,
        taskId,
        workspaceId
      })
    } catch (error) {
      console.log("Database notification failed, using localStorage fallback")
      
      // Get workspace info for localStorage notification
      try {
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { slug: true, name: true }
        })
        
        if (workspace) {
          createTaskAssignedNotification(
            assignerName,
            taskTitle,
            workspace.slug,
            workspace.name,
            taskId
          )
        }
      } catch (dbError) {
        console.error("Failed to get workspace info for notification:", dbError)
      }
    }
  }
}

/**
 * Log task status change activity
 */
export async function logTaskStatusChanged(
  taskId: string,
  taskTitle: string,
  performerId: string,
  workspaceId: string,
  previousStatus: string,
  newStatus: string
) {
  const performer = await prisma.user.findUnique({
    where: { id: performerId },
    select: { name: true }
  })

  const performerName = performer?.name || "Someone"

  await logTaskActivity({
    taskId,
    action: "STATUS_CHANGED",
    performedById: performerId,
    workspaceId,
    description: `Changed task "${taskTitle}" status from ${previousStatus} to ${newStatus}`,
    previousValue: previousStatus,
    newValue: newStatus
  })

  // Create notification if task is completed
  if (newStatus === "DONE") {
    // Get task creator to notify them
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { creatorId: true }
    })

    if (task && task.creatorId !== performerId) {
      await createNotification({
        userId: task.creatorId,
        type: "TASK_COMPLETED",
        title: "Task Completed",
        message: `${performerName} completed the task "${taskTitle}"`,
        taskId,
        workspaceId
      })
    }
  }
}

/**
 * Log task deletion activity
 */
export async function logTaskDeleted(
  taskId: string,
  taskTitle: string,
  deleterId: string,
  workspaceId: string
) {
  await logTaskActivity({
    taskId,
    action: "DELETED",
    performedById: deleterId,
    workspaceId,
    description: `Deleted task "${taskTitle}"`
  })
}