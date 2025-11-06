import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { error: "Deletion token is required" },
        { status: 400 }
      )
    }

    // Find the deletion token
    const deletionToken = await prisma.verificationToken.findUnique({
      where: { token }
    })

    if (!deletionToken) {
      return NextResponse.redirect(new URL("/auth/delete-failed?error=invalid-token", req.url))
    }

    // Check if token is expired
    const now = new Date()
    if (now > deletionToken.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token }
      })
      
      return NextResponse.redirect(new URL("/auth/delete-failed?error=expired-token", req.url))
    }

    // Extract email from identifier (format: "delete:email@example.com")
    const email = deletionToken.identifier.replace("delete:", "")

    // Get user data before deletion for confirmation email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { 
        id: true, 
        name: true, 
        email: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.redirect(new URL("/auth/delete-failed?error=user-not-found", req.url))
    }

    // Perform COMPLETE account deletion with CASCADE approach
    try {
      console.log(`🗑️ Starting COMPLETE deletion for user: ${user.email}`)
      
      // STEP 1: Delete in multiple smaller transactions to avoid timeout
      // First, get all user-related IDs
      const userWorkspaces = await prisma.workspace.findMany({
        where: { creatorId: user.id },
        select: { id: true, name: true }
      })
      
      const userConversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: { id: user.id }
          }
        },
        select: { id: true }
      })

      console.log(`📊 Found: ${userWorkspaces.length} workspaces, ${userConversations.length} conversations`)

      // STEP 2: Delete workspaces one by one (safer approach)
      for (const workspace of userWorkspaces) {
        try {
          await prisma.$transaction(async (tx) => {
            console.log(`🗑️ Deleting workspace: ${workspace.name}`)
            
            // Delete workspace data in correct order
            await tx.meetingActivity.deleteMany({ where: { workspaceId: workspace.id } })
            await tx.taskActivity.deleteMany({ where: { workspaceId: workspace.id } })
            await tx.notification.deleteMany({ where: { workspaceId: workspace.id } })
            await tx.documentActivity.deleteMany({ where: { workspaceId: workspace.id } })
            await tx.fileActivity.deleteMany({ where: { workspaceId: workspace.id } })
            await tx.workspaceInvitation.deleteMany({ where: { workspaceId: workspace.id } })
            await tx.file.deleteMany({ where: { workspaceId: workspace.id } })
            await tx.meeting.deleteMany({ where: { workspaceId: workspace.id } })
            await tx.document.deleteMany({ where: { workspaceId: workspace.id } })
            await tx.task.deleteMany({ where: { workspaceId: workspace.id } })
            await tx.workspaceMember.deleteMany({ where: { workspaceId: workspace.id } })
            await tx.workspace.delete({ where: { id: workspace.id } })
          }, { timeout: 30000 })
          
          console.log(`✅ Deleted workspace: ${workspace.name}`)
        } catch (workspaceError) {
          console.error(`❌ Failed to delete workspace ${workspace.name}:`, workspaceError)
          throw workspaceError
        }
      }

      // STEP 3: Delete conversations one by one
      for (const conversation of userConversations) {
        try {
          await prisma.$transaction(async (tx) => {
            await tx.message.deleteMany({ where: { conversationId: conversation.id } })
            await tx.call.deleteMany({ where: { conversationId: conversation.id } })
            
            // Disconnect user from conversation
            await tx.conversation.update({
              where: { id: conversation.id },
              data: {
                participants: {
                  disconnect: { id: user.id }
                }
              }
            })
            
            // Check if conversation has other participants
            const remainingParticipants = await tx.conversation.findUnique({
              where: { id: conversation.id },
              include: { participants: true }
            })
            
            // If no other participants, delete the conversation
            if (!remainingParticipants?.participants.length) {
              await tx.conversation.delete({ where: { id: conversation.id } })
            }
          }, { timeout: 15000 })
        } catch (conversationError) {
          console.error(`❌ Failed to delete conversation ${conversation.id}:`, conversationError)
          // Continue with other conversations
        }
      }

      // STEP 4: Final user cleanup in one transaction
      await prisma.$transaction(async (tx) => {
        console.log(`🧹 Final cleanup for user: ${user.email}`)

        // Delete remaining user data
        const membershipCount = await tx.workspaceMember.count({ where: { userId: user.id } })
        await tx.workspaceMember.deleteMany({ where: { userId: user.id } })
        console.log(`👥 Removed from ${membershipCount} workspace memberships`)

        // Delete individual messages (as sender)
        const messageCount = await tx.message.count({ where: { senderId: user.id } })
        await tx.message.deleteMany({ where: { senderId: user.id } })
        console.log(`📝 Deleted ${messageCount} messages`)

        // Handle tasks (remove as assignee, delete created tasks)
        const assignedTasksCount = await tx.task.count({ where: { assigneeId: user.id } })
        await tx.task.updateMany({
          where: { assigneeId: user.id },
          data: { assigneeId: null }
        })
        
        const createdTasksCount = await tx.task.count({ where: { creatorId: user.id } })
        await tx.task.deleteMany({ where: { creatorId: user.id } })
        console.log(`📋 Handled ${createdTasksCount} created tasks and ${assignedTasksCount} assigned tasks`)

        // Delete documents, files, meetings
        const documentCount = await tx.document.count({ where: { authorId: user.id } })
        await tx.document.deleteMany({ where: { authorId: user.id } })
        
        const fileCount = await tx.file.count({ where: { uploadedById: user.id } })
        await tx.file.deleteMany({ where: { uploadedById: user.id } })
        
        const meetingCount = await tx.meeting.count({ where: { creatorId: user.id } })
        await tx.meeting.deleteMany({ where: { creatorId: user.id } })
        
        console.log(`📄 Deleted ${documentCount} documents, ${fileCount} files, ${meetingCount} meetings`)

        // Delete notifications and invitations
        const notificationCount = await tx.notification.count({ where: { userId: user.id } })
        await tx.notification.deleteMany({ where: { userId: user.id } })
        
        const invitationCount = await tx.workspaceInvitation.count({ where: { invitedById: user.id } })
        await tx.workspaceInvitation.deleteMany({ where: { invitedById: user.id } })
        
        console.log(`🔔 Deleted ${notificationCount} notifications, ${invitationCount} invitations`)

        // Delete activity records
        await tx.fileActivity.deleteMany({ 
          where: { 
            OR: [
              { performedById: user.id },
              { originalOwnerId: user.id }
            ]
          } 
        })
        
        await tx.documentActivity.deleteMany({ 
          where: { 
            OR: [
              { performedById: user.id },
              { originalAuthorId: user.id }
            ]
          } 
        })
        
        await tx.taskActivity.deleteMany({ where: { performedById: user.id } })
        
        await tx.meetingActivity.deleteMany({ 
          where: { 
            OR: [
              { performedById: user.id },
              { originalCreatorId: user.id }
            ]
          } 
        })

        // Delete OAuth accounts and sessions
        const accountCount = await tx.account.count({ where: { userId: user.id } })
        const sessionCount = await tx.session.count({ where: { userId: user.id } })
        
        await tx.account.deleteMany({ where: { userId: user.id } })
        await tx.session.deleteMany({ where: { userId: user.id } })
        console.log(`🔐 Deleted ${accountCount} OAuth accounts and ${sessionCount} sessions`)

        // Delete verification tokens
        await tx.verificationToken.deleteMany({ 
          where: { 
            OR: [
              { identifier: email },
              { identifier: { contains: email } },
              { identifier: { startsWith: `delete:${email}` } },
              { identifier: { startsWith: `login:${email}` } }
            ]
          } 
        })

        // FINALLY DELETE THE USER RECORD
        console.log(`🗑️ DELETING USER RECORD: ${user.email}`)
        await tx.user.delete({ where: { id: user.id } })
        console.log(`✅ USER DELETED: ${user.email}`)
        
      }, { timeout: 30000 })

      // 15. VERIFICATION: Double-check that user is completely removed
      console.log(`🔍 Verifying deletion for ${email}...`)
      const verifyDeletion = await prisma.user.findUnique({
        where: { email }
      })
      
      if (verifyDeletion) {
        console.error(`❌ DELETION VERIFICATION FAILED: User still exists`, verifyDeletion)
        throw new Error("User deletion verification failed - user still exists")
      }
      
      console.log(`✅ VERIFICATION PASSED: User ${email} completely removed from database`)

      // 16. INVALIDATE ALL SESSIONS FOR THIS USER (force logout)
      // This will be handled by the client-side session check
      
      // Send account deletion confirmation email
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_SERVER_HOST,
          port: Number(process.env.EMAIL_SERVER_PORT),
          secure: false,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
          pool: true,
          maxConnections: 5,
          rateLimit: 14,
          connectionTimeout: 10000,
        })

        const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })

        // Get deletion statistics for email
        const deletionStats = {
          workspaces: userWorkspaces.length,
          conversations: userConversations.length,
          totalDataPoints: userWorkspaces.length + userConversations.length + messageCount + createdTasksCount + documentCount + fileCount + meetingCount + notificationCount
        }

        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: "✅ Account Successfully Deleted - CollabHub",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Account Deleted</title>
            </head>
            <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background-color:#f9fafb">
              <div style="background-color:white;padding:30px;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
                <div style="text-align:center;margin-bottom:30px">
                  <div style="width:80px;height:80px;background:linear-gradient(135deg,#10b981,#059669);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center">
                    <span style="color:white;font-size:32px">✅</span>
                  </div>
                  <h1 style="color:#059669;margin:0;font-size:24px">Account Successfully Deleted</h1>
                </div>
                
                <p style="color:#374151;line-height:1.6;margin-bottom:20px">Hi ${user.name || 'User'},</p>
                
                <p style="color:#374151;line-height:1.6;margin-bottom:20px">
                  Your CollabHub account has been permanently deleted as requested. All your data has been removed from our servers.
                </p>
                
                <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0">
                  <h3 style="color:#059669;margin:0 0 15px 0;font-size:16px">✅ Complete Data Deletion Summary:</h3>
                  <div style="color:#065f46;margin:0;line-height:1.8">
                    <p style="margin:5px 0">📁 <strong>${deletionStats.workspaces}</strong> workspaces and all their content</p>
                    <p style="margin:5px 0">💬 <strong>${deletionStats.conversations}</strong> conversations and messages</p>
                    <p style="margin:5px 0">📋 <strong>${createdTasksCount}</strong> tasks created by you</p>
                    <p style="margin:5px 0">📄 <strong>${documentCount}</strong> documents authored</p>
                    <p style="margin:5px 0">📎 <strong>${fileCount}</strong> files uploaded</p>
                    <p style="margin:5px 0">🎥 <strong>${meetingCount}</strong> meetings organized</p>
                    <p style="margin:5px 0">🔔 <strong>${notificationCount}</strong> notifications</p>
                    <p style="margin:5px 0">🔐 All OAuth accounts and sessions</p>
                    <p style="margin:5px 0">🎫 All verification and security tokens</p>
                    <hr style="margin:10px 0;border:none;border-top:1px solid #bbf7d0">
                    <p style="margin:5px 0;font-weight:bold">📊 Total: <strong>${deletionStats.totalDataPoints}+</strong> data points permanently removed</p>
                  </div>
                </div>
                
                <div style="background-color:#f3f4f6;border-radius:8px;padding:20px;margin:20px 0;text-align:center">
                  <p style="color:#6b7280;margin:0 0 10px 0;font-size:14px">Account Summary</p>
                  <p style="color:#374151;margin:0;font-size:16px">
                    <strong>Member since:</strong> ${memberSince}<br>
                    <strong>Deleted on:</strong> ${new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <p style="color:#374151;line-height:1.6;margin-bottom:20px">
                  Thank you for being part of the CollabHub community. We're sorry to see you go, but we understand that your needs may have changed.
                </p>
                
                <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:15px;margin:20px 0">
                  <p style="color:#92400e;margin:0;font-size:14px">
                    💡 <strong>Want to come back?</strong> You can always create a new account at any time by visiting our website.
                  </p>
                </div>
                
                <hr style="margin:30px 0;border:none;border-top:1px solid #e5e7eb">
                
                <div style="text-align:center">
                  <p style="color:#6b7280;font-size:14px;margin:0">
                    We hope our paths cross again in the future! 👋<br>
                    <strong>The CollabHub Team</strong>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        })
      } catch (emailError) {
        console.error("Deletion confirmation email error:", emailError)
        // Don't fail the deletion if email fails
      }

      // Redirect to success page
      return NextResponse.redirect(new URL("/auth/delete-success", req.url))

    } catch (deletionError) {
      console.error("❌ Account deletion error:", deletionError)
      
      // FALLBACK: Try force deletion with raw SQL if transaction fails
      try {
        console.log("🔄 Attempting force deletion with raw SQL...")
        
        // Use raw SQL to delete user and cascade
        await prisma.$executeRaw`
          DELETE FROM "User" WHERE id = ${user.id}
        `
        
        console.log("✅ Force deletion successful")
      } catch (forceError) {
        console.error("❌ Force deletion also failed:", forceError)
        return NextResponse.redirect(new URL("/auth/delete-failed?error=deletion-failed", req.url))
      }
    }

  } catch (error) {
    console.error("Confirm delete error:", error)
    return NextResponse.redirect(new URL("/auth/delete-failed?error=server-error", req.url))
  }
}