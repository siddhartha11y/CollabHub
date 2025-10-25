import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    // Get all activities for this workspace
    const [meetingActivities, taskActivities, fileActivities, documentActivities] = await Promise.all([
      prisma.meetingActivity.findMany({
        where: { workspaceId: workspace.id },
        include: {
          performedBy: {
            select: { id: true, name: true, email: true }
          },
          originalCreator: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.taskActivity.findMany({
        where: { workspaceId: workspace.id },
        include: {
          performedBy: {
            select: { id: true, name: true, email: true }
          },
          task: {
            select: { id: true, title: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.fileActivity.findMany({
        where: { workspaceId: workspace.id },
        include: {
          performedBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.documentActivity.findMany({
        where: { workspaceId: workspace.id },
        include: {
          performedBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    // Combine and format all activities
    const allActivities = [
      ...meetingActivities.map(activity => ({
        id: activity.id,
        type: 'meeting',
        action: activity.action,
        title: activity.meetingTitle,
        performedBy: activity.performedBy,
        createdAt: activity.createdAt,
        description: `${activity.action.toLowerCase()} meeting "${activity.meetingTitle}"`
      })),
      ...taskActivities.map(activity => ({
        id: activity.id,
        type: 'task',
        action: activity.action,
        title: activity.task.title,
        performedBy: activity.performedBy,
        createdAt: activity.createdAt,
        description: activity.description
      })),
      ...fileActivities.map(activity => ({
        id: activity.id,
        type: 'file',
        action: activity.action,
        title: activity.fileName,
        performedBy: activity.performedBy,
        createdAt: activity.createdAt,
        description: `${activity.action.toLowerCase()} file "${activity.fileName}"`
      })),
      ...documentActivities.map(activity => ({
        id: activity.id,
        type: 'document',
        action: activity.action,
        title: activity.documentTitle,
        performedBy: activity.performedBy,
        createdAt: activity.createdAt,
        description: `${activity.action.toLowerCase()} document "${activity.documentTitle}"`
      }))
    ]

    // Sort by creation date (newest first)
    allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(allActivities)
  } catch (error) {
    console.error("Get activities error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}