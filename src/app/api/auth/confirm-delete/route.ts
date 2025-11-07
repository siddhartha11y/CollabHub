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

    // USE THE PROVEN WORKING DELETION METHOD FROM FORCE-DELETE API
    try {
      console.log(`🔥 FORCE DELETING USER: ${user.email} (ID: ${user.id})`)

      // Method 1: Try direct SQL deletion (this works!)
      try {
        console.log(`🗑️ Attempting direct SQL deletion for user ID: ${user.id}`)
        
        const result = await prisma.$executeRaw`DELETE FROM "User" WHERE id = ${user.id}`
        
        if (result > 0) {
          console.log(`✅ User ${user.email} successfully deleted via SQL`)
        } else {
          throw new Error("SQL deletion returned 0 rows affected")
        }
        
      } catch (sqlError) {
        console.error(`❌ SQL deletion failed:`, sqlError)
        
        // Method 2: Try manual cleanup (fallback)
        console.log(`🔄 Falling back to manual cleanup for: ${user.email}`)
        
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
          
          // Handle conversations (disconnect user)
          const conversations = await tx.conversation.findMany({
            where: { participants: { some: { id: user.id } } },
            include: { participants: true }
          })
          
          for (const conv of conversations) {
            await tx.conversation.update({
              where: { id: conv.id },
              data: { participants: { disconnect: { id: user.id } } }
            })
            
            // If no other participants, delete conversation
            if (conv.participants.length <= 1) {
              await tx.message.deleteMany({ where: { conversationId: conv.id } })
              await tx.call.deleteMany({ where: { conversationId: conv.id } })
              await tx.conversation.delete({ where: { id: conv.id } })
            }
          }
          
          // Finally delete the user
          await tx.user.delete({ where: { id: user.id } })
        }, { timeout: 60000 })
        
        console.log(`✅ User ${user.email} manually cleaned up and deleted`)
      }

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

        // Simplified deletion confirmation

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
                  <h3 style="color:#059669;margin:0 0 15px 0;font-size:16px">✅ Account Successfully Deleted</h3>
                  <div style="color:#065f46;margin:0;line-height:1.8">
                    <p style="margin:5px 0">📁 All workspaces and their content</p>
                    <p style="margin:5px 0">💬 All conversations and messages</p>
                    <p style="margin:5px 0">📋 All tasks, documents, and files</p>
                    <p style="margin:5px 0">🔔 All notifications and settings</p>
                    <p style="margin:5px 0">🔐 All OAuth accounts and sessions</p>
                    <p style="margin:5px 0">🎫 All verification and security tokens</p>
                    <hr style="margin:10px 0;border:none;border-top:1px solid #bbf7d0">
                    <p style="margin:5px 0;font-weight:bold">📊 Your account and all associated data has been permanently removed</p>
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
      console.error("❌ DELETION FAILED:", deletionError)
      return NextResponse.redirect(new URL("/auth/delete-failed?error=deletion-failed", req.url))
    }

  } catch (error) {
    console.error("Confirm delete error:", error)
    return NextResponse.redirect(new URL("/auth/delete-failed?error=server-error", req.url))
  }
}