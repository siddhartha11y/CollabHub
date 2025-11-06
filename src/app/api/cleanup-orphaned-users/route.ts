import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    // Find and delete users with NULL emailVerified (orphaned users)
    const orphanedUsers = await prisma.user.findMany({
      where: {
        emailVerified: null,
        // Only delete users created more than 1 hour ago to avoid deleting legitimate pending registrations
        createdAt: {
          lt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        }
      },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    })

    console.log(`🧹 Found ${orphanedUsers.length} orphaned users to clean up`)

    let deletedCount = 0
    for (const user of orphanedUsers) {
      try {
        // Delete the orphaned user
        await prisma.user.delete({
          where: { id: user.id }
        })
        
        console.log(`🗑️ Deleted orphaned user: ${user.email}`)
        deletedCount++
      } catch (error) {
        console.error(`❌ Failed to delete orphaned user ${user.email}:`, error)
      }
    }

    return NextResponse.json({
      message: `Cleanup completed. Deleted ${deletedCount} orphaned users.`,
      deletedCount,
      totalFound: orphanedUsers.length
    })

  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json(
      { error: "Failed to cleanup orphaned users" },
      { status: 500 }
    )
  }
}