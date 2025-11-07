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

    // STEP 2: Force manual deletion (skip Prisma cascading - it's not working)
    try {
      console.log(`🔄 Starting manual deletion process...`)
      
      await prisma.$transaction(async (tx) => {
        // Delete in specific order to avoid foreign key constraints
        console.log(`Deleting accounts for user ${user.id}...`)
        const deletedAccounts = await tx.account.deleteMany({ where: { userId: user.id } })
        console.log(`✅ Deleted ${deletedAccounts.count} accounts`)
        
        console.log(`Deleting sessions for user ${user.id}...`)
        const deletedSessions = await tx.session.deleteMany({ where: { userId: user.id } })
        console.log(`✅ Deleted ${deletedSessions.count} sessions`)
        
        console.log(`Deleting workspace memberships for user ${user.id}...`)
        const deletedMemberships = await tx.workspaceMember.deleteMany({ where: { userId: user.id } })
        console.log(`✅ Deleted ${deletedMemberships.count} workspace memberships`)
        
        console.log(`Deleting notifications for user ${user.id}...`)
        const deletedNotifications = await tx.notification.deleteMany({ where: { userId: user.id } })
        console.log(`✅ Deleted ${deletedNotifications.count} notifications`)
        
        console.log(`Deleting messages for user ${user.id}...`)
        const deletedMessages = await tx.message.deleteMany({ where: { senderId: user.id } })
        console.log(`✅ Deleted ${deletedMessages.count} messages`)
        
        console.log(`Updating tasks (removing assignee ${user.id})...`)
        const updatedTasks = await tx.task.updateMany({
          where: { assigneeId: user.id },
          data: { assigneeId: null }
        })
        console.log(`✅ Updated ${updatedTasks.count} tasks (removed assignee)`)
        
        console.log(`Deleting user-created tasks for user ${user.id}...`)
        const deletedTasks = await tx.task.deleteMany({ where: { creatorId: user.id } })
        console.log(`✅ Deleted ${deletedTasks.count} user-created tasks`)
        
        console.log(`Deleting documents for user ${user.id}...`)
        const deletedDocuments = await tx.document.deleteMany({ where: { authorId: user.id } })
        console.log(`✅ Deleted ${deletedDocuments.count} documents`)
        
        console.log(`Deleting files for user ${user.id}...`)
        const deletedFiles = await tx.file.deleteMany({ where: { uploadedById: user.id } })
        console.log(`✅ Deleted ${deletedFiles.count} files`)
        
        console.log(`Deleting meetings for user ${user.id}...`)
        const deletedMeetings = await tx.meeting.deleteMany({ where: { creatorId: user.id } })
        console.log(`✅ Deleted ${deletedMeetings.count} meetings`)
        
        console.log(`Deleting file activities for user ${user.id}...`)
        const deletedFileActivities = await tx.fileActivity.deleteMany({ 
          where: { 
            OR: [
              { performedById: user.id }, 
              { originalOwnerId: user.id }
            ]
          } 
        })
        console.log(`✅ Deleted ${deletedFileActivities.count} file activities`)
        
        console.log(`Deleting document activities for user ${user.id}...`)
        const deletedDocActivities = await tx.documentActivity.deleteMany({ 
          where: { 
            OR: [
              { performedById: user.id }, 
              { originalAuthorId: user.id }
            ]
          } 
        })
        console.log(`✅ Deleted ${deletedDocActivities.count} document activities`)
        
        console.log(`Deleting task activities for user ${user.id}...`)
        const deletedTaskActivities = await tx.taskActivity.deleteMany({ where: { performedById: user.id } })
        console.log(`✅ Deleted ${deletedTaskActivities.count} task activities`)
        
        console.log(`Deleting meeting activities for user ${user.id}...`)
        const deletedMeetingActivities = await tx.meetingActivity.deleteMany({ 
          where: { 
            OR: [
              { performedById: user.id }, 
              { originalCreatorId: user.id }
            ]
          } 
        })
        console.log(`✅ Deleted ${deletedMeetingActivities.count} meeting activities`)
        
        console.log(`Handling conversations for user ${user.id}...`)
        const userConversations = await tx.conversation.findMany({
          where: { participants: { some: { id: user.id } } }
        })
        console.log(`Found ${userConversations.length} conversations to handle`)
        
        for (const conv of userConversations) {
          await tx.conversation.update({
            where: { id: conv.id },
            data: { participants: { disconnect: { id: user.id } } }
          })
        }
        console.log(`✅ Disconnected user from ${userConversations.length} conversations`)
        
        console.log(`Deleting invitations for user ${user.id}...`)
        const deletedInvitations = await tx.workspaceInvitation.deleteMany({ where: { invitedById: user.id } })
        console.log(`✅ Deleted ${deletedInvitations.count} invitations`)
        
        console.log(`Deleting verification tokens for ${email}...`)
        const deletedTokens = await tx.verificationToken.deleteMany({
          where: {
            OR: [
              { identifier: email },
              { identifier: { contains: email } }
            ]
          }
        })
        console.log(`✅ Deleted ${deletedTokens.count} verification tokens`)
        
        console.log(`🗑️ FINALLY DELETING USER RECORD ${user.id}...`)
        const deletedUser = await tx.user.delete({ where: { email: user.email } })
        console.log(`✅ USER RECORD DELETED: ${deletedUser.id} (${deletedUser.email})`)
        
      }, { timeout: 60000 })
      
      console.log(`✅ TRANSACTION COMPLETED - USER FULLY DELETED`)
      
      // Verify deletion worked - check by both ID and email
      const checkUserById = await prisma.user.findUnique({ where: { id: user.id } })
      const checkUserByEmail = await prisma.user.findUnique({ where: { email: user.email } })
      
      if (checkUserById || checkUserByEmail) {
        console.error(`❌ VERIFICATION FAILED: User still exists after deletion!`)
        console.error(`- By ID: ${checkUserById ? 'EXISTS' : 'NOT FOUND'}`)
        console.error(`- By Email: ${checkUserByEmail ? 'EXISTS' : 'NOT FOUND'}`)
        return NextResponse.redirect(new URL("/auth/delete-failed?error=verification-failed", req.url))
      }
      
      console.log(`✅ VERIFICATION PASSED: User completely removed (checked by both ID and email)`)
      return NextResponse.redirect(new URL("/auth/delete-success", req.url))
      
    } catch (deleteError) {
      console.error(`❌ Manual deletion failed:`, deleteError)
      return NextResponse.redirect(new URL("/auth/delete-failed?error=deletion-failed", req.url))
    }

  } catch (error) {
    console.error("Deletion error:", error)
    return NextResponse.redirect(new URL("/auth/delete-failed?error=server-error", req.url))
  }
}