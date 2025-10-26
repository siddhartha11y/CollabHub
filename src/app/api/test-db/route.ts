import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("Testing database connection...")
    
    // Test basic connection
    await prisma.$connect()
    console.log("Prisma connected successfully")
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log("Raw query successful:", result)
    
    // Try to count users (if table exists)
    let userCount = 0
    try {
      userCount = await prisma.user.count()
      console.log("User count query successful:", userCount)
    } catch (userError) {
      console.warn("User table might not exist:", userError)
    }
    
    return NextResponse.json({ 
      status: "success", 
      message: "Database connection successful",
      userCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Database connection error:", error)
    
    // More detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : "Unknown error",
      name: error instanceof Error ? error.name : "Unknown",
      stack: error instanceof Error ? error.stack : undefined
    }
    
    return NextResponse.json({ 
      status: "error", 
      message: "Database connection failed",
      error: errorDetails,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.warn("Error disconnecting:", disconnectError)
    }
  }
}