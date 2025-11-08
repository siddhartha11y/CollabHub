import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { email } = await req.json()

    // Verify the email matches the session
    if (email !== session.user.email) {
      return NextResponse.json(
        { error: "Email mismatch" },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // SKIP EMAIL CONFIRMATION - DIRECTLY DELETE USER USING FORCE DELETE LOGIC
    console.log(`🔥 DIRECTLY DELETING USER: ${email}`)

    // Method 1: Try direct SQL deletion
    try {
      console.log(`🗑️ Attempting direct SQL deletion for user ID: ${user.id}`)
      
      const result = await prisma.$executeRaw`DELETE FROM "User" WHERE id = ${user.id}`
      
      if (result > 0) {
        console.log(`✅ User ${email} successfully deleted via SQL`)
        return NextResponse.json({
          success: true,
          message: `Account successfully deleted`,
          method: "SQL"
        })
      }
    } catch (sqlError) {
      console.error(`❌ SQL deletion failed:`, sqlError)
    }

    // Method 2: Try updating to mark as deleted
    try {
      console.log(`🔄 Marking user as deleted: ${email}`)
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: `DELETED_${Date.now()}_${user.email}`,
          name: "DELETED_USER",
          emailVerified: null,
          password: null,
          image: null,
          bio: null,
          title: null,
          company: null,
          location: null,
          website: null,
          phone: null
        }
      })
      
      console.log(`✅ User ${email} marked as deleted`)
      return NextResponse.json({
        success: true,
        message: `Account successfully deleted (anonymized)`,
        method: "UPDATE"
      })
      
    } catch (updateError) {
      console.error(`❌ Update deletion failed:`, updateError)
    }

    // Method 3: Try manual cleanup
    try {
      console.log(`🧹 Manual cleanup for: ${email}`)
      
      await prisma.$transaction(async (tx) => {
        // Delete all user relationships manually
        await tx.account.deleteMany({ where: { userId: user.id } })
        await tx.session.deleteMany({ where: { userId: user.id } })
        await tx.workspaceMember.deleteMany({ where: { userId: user.id } })
        await tx.message.deleteMany({ where: { senderId: user.id } })
        await tx.notification.deleteMany({ where: { userId: user.id } })
        await tx.workspaceInvitation.deleteMany({ where: { invitedById: user.id } })
        
        // Update tasks to remove user references
        await tx.task.updateMany({
          where: { assigneeId: user.id },
          data: { assigneeId: null }
        })
        
        // Delete user's created content
        await tx.task.deleteMany({ where: { creatorId: user.id } })
        await tx.document.deleteMany({ where: { authorId: user.id } })
        await tx.file.deleteMany({ where: { uploadedById: user.id } })
        await tx.meeting.deleteMany({ where: { creatorId: user.id } })
        
        // Delete activity records
        await tx.fileActivity.deleteMany({ 
          where: { 
            OR: [{ performedById: user.id }, { originalOwnerId: user.id }]
          } 
        })
        await tx.documentActivity.deleteMany({ 
          where: { 
            OR: [{ performedById: user.id }, { originalAuthorId: user.id }]
          } 
        })
        await tx.taskActivity.deleteMany({ where: { performedById: user.id } })
        await tx.meetingActivity.deleteMany({ 
          where: { 
            OR: [{ performedById: user.id }, { originalCreatorId: user.id }]
          } 
        })
        
        // Delete verification tokens
        await tx.verificationToken.deleteMany({
          where: {
            OR: [
              { identifier: email },
              { identifier: { contains: email } }
            ]
          }
        })
        
        // Finally delete the user
        await tx.user.delete({ where: { id: user.id } })
      }, { timeout: 60000 })
      
      console.log(`✅ User ${email} manually cleaned up and deleted`)
      return NextResponse.json({
        success: true,
        message: `Account successfully deleted`,
        method: "MANUAL"
      })
      
    } catch (manualError) {
      console.error(`❌ Manual cleanup failed:`, manualError)
      
      return NextResponse.json({
        success: false,
        error: "All deletion methods failed",
        details: manualError.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Delete account request error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}