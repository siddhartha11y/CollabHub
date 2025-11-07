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

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      return NextResponse.redirect(new URL("/auth/delete-failed?error=user-not-found", req.url))
    }

    console.log(`🔥 STARTING DELETION: ${user.email} (ID: ${user.id})`)

    // STEP 1: Check if user actually exists first
    const userExists = await prisma.user.findUnique({ where: { id: user.id } })
    if (!userExists) {
      console.log(`❌ User ${user.id} not found in database`)
      return NextResponse.redirect(new URL("/auth/delete-failed?error=user-not-found", req.url))
    }

    // STEP 2: Force manual deletion (skip Prisma cascading - it's not working)
    try {
      console.log(`🔄 Starting manual deletion process...`)
      
      await prisma.$transaction(async (tx) => {
        // Delete in specific order to avoid foreign key constraints
        console.log(`Deleting accounts...`)
        await tx.account.deleteMany({ where: { userId: user.id } })
        
        console.log(`Deleting sessions...`)
        await tx.session.deleteMany({ where: { userId: user.id } })
        
        console.log(`Deleting workspace memberships...`)
        await tx.workspaceMember.deleteMany({ where: { userId: user.id } })
        
        console.log(`Deleting notifications...`)
        await tx.notification.deleteMany({ where: { userId: user.id } })
        
        console.log(`Deleting messages...`)
        await tx.message.deleteMany({ where: { senderId: user.id } })
        
        console.log(`Updating tasks (removing assignee)...`)
        await tx.task.updateMany({
          where: { assigneeId: user.id },
          data: { assigneeId: null }
        })
        
        console.log(`Deleting user-created tasks...`)
        await tx.task.deleteMany({ where: { creatorId: user.id } })
        
        console.log(`Deleting documents...`)
        await tx.document.deleteMany({ where: { authorId: user.id } })
        
        console.log(`Deleting files...`)
        await tx.file.deleteMany({ where: { uploadedById: user.id } })
        
        console.log(`Deleting meetings...`)
        await tx.meeting.deleteMany({ where: { creatorId: user.id } })
        
        console.log(`Deleting file activities...`)
        await tx.fileActivity.deleteMany({ 
          where: { 
            OR: [
              { performedById: user.id }, 
              { originalOwnerId: user.id }
            ]
          } 
        })
        
        console.log(`Deleting document activities...`)
        await tx.documentActivity.deleteMany({ 
          where: { 
            OR: [
              { performedById: user.id }, 
              { originalAuthorId: user.id }
            ]
          } 
        })
        
        console.log(`Deleting task activities...`)
        await tx.taskActivity.deleteMany({ where: { performedById: user.id } })
        
        console.log(`Deleting meeting activities...`)
        await tx.meetingActivity.deleteMany({ 
          where: { 
            OR: [
              { performedById: user.id }, 
              { originalCreatorId: user.id }
            ]
          } 
        })
        
        console.log(`Handling conversations...`)
        const userConversations = await tx.conversation.findMany({
          where: { participants: { some: { id: user.id } } }
        })
        
        for (const conv of userConversations) {
          await tx.conversation.update({
            where: { id: conv.id },
            data: { participants: { disconnect: { id: user.id } } }
          })
        }
        
        console.log(`Deleting invitations...`)
        await tx.workspaceInvitation.deleteMany({ where: { invitedById: user.id } })
        
        console.log(`Deleting verification tokens...`)
        await tx.verificationToken.deleteMany({
          where: {
            OR: [
              { identifier: email },
              { identifier: { contains: email } }
            ]
          }
        })
        
        console.log(`🗑️ FINALLY DELETING USER RECORD...`)
        const deletedUser = await tx.user.delete({ where: { id: user.id } })
        console.log(`✅ USER RECORD DELETED:`, deletedUser.id)
        
      }, { timeout: 60000 })
      
      console.log(`✅ TRANSACTION COMPLETED - USER FULLY DELETED`)
      
      // Verify deletion worked
      const checkUser = await prisma.user.findUnique({ where: { id: user.id } })
      if (checkUser) {
        console.error(`❌ VERIFICATION FAILED: User still exists after deletion!`)
        return NextResponse.redirect(new URL("/auth/delete-failed?error=verification-failed", req.url))
      }
      
      console.log(`✅ VERIFICATION PASSED: User completely removed`)
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