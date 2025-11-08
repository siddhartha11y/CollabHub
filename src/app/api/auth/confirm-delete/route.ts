import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Deletion token is required" }, { status: 400 })
    }

    // Find the deletion token
    const deletionToken = await prisma.verificationToken.findUnique({
      where: { token }
    })

    if (!deletionToken) {
      return NextResponse.redirect(new URL("/auth/delete-failed?error=invalid-token", req.url))
    }

    // Check if token is expired
    if (new Date() > deletionToken.expires) {
      await prisma.verificationToken.delete({ where: { token } })
      return NextResponse.redirect(new URL("/auth/delete-failed?error=expired-token", req.url))
    }

    // Extract email from identifier
    const email = deletionToken.identifier.replace("delete:", "")

    // Find user and get ALL their data for debugging
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log(`❌ No user found with email: ${email}`)
      return NextResponse.redirect(new URL("/auth/delete-failed?error=user-not-found", req.url))
    }

    console.log(`🔥 FOUND USER TO DELETE:`)
    console.log(`- Email: ${user.email}`)
    console.log(`- ID: ${user.id}`)
    console.log(`- Name: ${user.name}`)
    console.log(`- EmailVerified: ${user.emailVerified}`)

    // Check if there are multiple users with this email (shouldn't happen but let's verify)
    const allUsersWithEmail = await prisma.user.findMany({
      where: { email },
      select: { id: true, email: true, name: true, emailVerified: true }
    })
    
    console.log(`📊 Total users with email ${email}:`, allUsersWithEmail.length)
    if (allUsersWithEmail.length > 1) {
      console.log(`⚠️ MULTIPLE USERS FOUND:`, allUsersWithEmail)
    }

    // USE THE EXACT SAME LOGIC AS THE WORKING FORCE DELETE API
    
    // Method 1: Try direct SQL deletion
    try {
      console.log(`🗑️ Attempting direct SQL deletion for user ID: ${user.id}`)
      
      const result = await prisma.$executeRaw`DELETE FROM "User" WHERE id = ${user.id}`
      
      if (result > 0) {
        console.log(`✅ User ${email} successfully deleted via SQL`)
        // Clean up the deletion token
        await prisma.verificationToken.delete({ where: { token } })
        return NextResponse.redirect(new URL("/auth/delete-success", req.url))
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
      // Clean up the deletion token
      await prisma.verificationToken.delete({ where: { token } })
      return NextResponse.redirect(new URL("/auth/delete-success", req.url))
      
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
      return NextResponse.redirect(new URL("/auth/delete-success", req.url))
      
    } catch (manualError) {
      console.error(`❌ Manual cleanup failed:`, manualError)
      return NextResponse.redirect(new URL("/auth/delete-failed?error=deletion-failed", req.url))
    }

  } catch (error) {
    console.error("Deletion error:", error)
    return NextResponse.redirect(new URL("/auth/delete-failed?error=server-error", req.url))
  }
}