import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Simple connection test without raw queries
    const userCount = await prisma.user.count()
    const workspaceCount = await prisma.workspace.count()
    const meetingCount = await prisma.meeting.count()
    
    return NextResponse.json({ 
      status: "success", 
      message: "Database connection successful! 🎉",
      stats: {
        users: userCount,
        workspaces: workspaceCount,
        meetings: meetingCount
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Database connection error:", error)
    
    return NextResponse.json({ 
      status: "error", 
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}