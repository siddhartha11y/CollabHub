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

    // STEP 1: Use Prisma's built-in cascading delete
    try {
      await prisma.user.delete({
        where: { id: user.id }
      })
      
      // Clean up the deletion token
      await prisma.verificationToken.delete({ where: { token } })
      
      console.log(`✅ USER DELETED SUCCESSFULLY`)
      return NextResponse.redirect(new URL("/auth/delete-success", req.url))
      
    } catch (deleteError) {
      console.error(`❌ Prisma delete failed:`, deleteError)
      
      // STEP 2: If Prisma fails, try manual cleanup
      try {
        console.log(`🔄 Trying manual cleanup...`)
        
        // Delete related records first
        await prisma.account.deleteMany({ where: { userId: user.id } })
        await prisma.session.deleteMany({ where: { userId: user.id } })
        await prisma.workspaceMember.deleteMany({ where: { userId: user.id } })
        await prisma.notification.deleteMany({ where: { userId: user.id } })
        await prisma.message.deleteMany({ where: { senderId: user.id } })
        
        // Update tasks to remove user references
        await prisma.task.updateMany({
          where: { assigneeId: user.id },
          data: { assigneeId: null }
        })
        
        // Delete user-created content
        await prisma.task.deleteMany({ where: { creatorId: user.id } })
        await prisma.document.deleteMany({ where: { authorId: user.id } })
        await prisma.file.deleteMany({ where: { uploadedById: user.id } })
        await prisma.meeting.deleteMany({ where: { creatorId: user.id } })
        
        // Delete activities
        await prisma.fileActivity.deleteMany({ 
          where: { 
            OR: [
              { performedById: user.id }, 
              { originalOwnerId: user.id }
            ]
          } 
        })
        await prisma.documentActivity.deleteMany({ 
          where: { 
            OR: [
              { performedById: user.id }, 
              { originalAuthorId: user.id }
            ]
          } 
        })
        await prisma.taskActivity.deleteMany({ where: { performedById: user.id } })
        await prisma.meetingActivity.deleteMany({ 
          where: { 
            OR: [
              { performedById: user.id }, 
              { originalCreatorId: user.id }
            ]
          } 
        })
        
        // Handle conversations - disconnect user from conversations
        const userConversations = await prisma.conversation.findMany({
          where: { participants: { some: { id: user.id } } }
        })
        
        for (const conv of userConversations) {
          await prisma.conversation.update({
            where: { id: conv.id },
            data: { participants: { disconnect: { id: user.id } } }
          })
        }
        
        // Delete invitations
        await prisma.workspaceInvitation.deleteMany({ where: { invitedById: user.id } })
        
        // Delete verification tokens
        await prisma.verificationToken.deleteMany({
          where: {
            OR: [
              { identifier: email },
              { identifier: { contains: email } }
            ]
          }
        })
        
        // Finally delete the user
        await prisma.user.delete({ where: { id: user.id } })
        
        console.log(`✅ MANUAL DELETION SUCCESSFUL`)
        return NextResponse.redirect(new URL("/auth/delete-success", req.url))
        
      } catch (manualError) {
        console.error(`❌ Manual deletion failed:`, manualError)
        return NextResponse.redirect(new URL("/auth/delete-failed?error=deletion-failed", req.url))
      }
    }

  } catch (error) {
    console.error("Deletion error:", error)
    return NextResponse.redirect(new URL("/auth/delete-failed?error=server-error", req.url))
  }
}