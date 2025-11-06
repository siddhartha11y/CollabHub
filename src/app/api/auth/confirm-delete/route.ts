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

    // Perform complete account deletion in a transaction
    try {
      await prisma.$transaction(async (tx) => {
        // Delete user's workspaces and all related data
        const userWorkspaces = await tx.workspace.findMany({
          where: { creatorId: user.id },
          select: { id: true }
        })

        for (const workspace of userWorkspaces) {
          // Delete workspace-related data
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
        }

        // Delete user's conversations and messages
        const userConversations = await tx.conversation.findMany({
          where: {
            participants: {
              some: { id: user.id }
            }
          },
          select: { id: true }
        })

        for (const conversation of userConversations) {
          await tx.message.deleteMany({ where: { conversationId: conversation.id } })
          await tx.call.deleteMany({ where: { conversationId: conversation.id } })
          await tx.conversation.delete({ where: { id: conversation.id } })
        }

        // Delete user's accounts and sessions
        await tx.account.deleteMany({ where: { userId: user.id } })
        await tx.session.deleteMany({ where: { userId: user.id } })

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
      })

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
                  <h3 style="color:#059669;margin:0 0 15px 0;font-size:16px">✅ What was deleted:</h3>
                  <ul style="color:#065f46;margin:0;padding-left:20px;line-height:1.8">
                    <li>Your profile and personal information</li>
                    <li>All workspaces you created</li>
                    <li>Your tasks, documents, and files</li>
                    <li>Chat messages and conversations</li>
                    <li>All account data and settings</li>
                  </ul>
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
      console.error("Account deletion error:", deletionError)
      return NextResponse.redirect(new URL("/auth/delete-failed?error=deletion-failed", req.url))
    }

  } catch (error) {
    console.error("Confirm delete error:", error)
    return NextResponse.redirect(new URL("/auth/delete-failed?error=server-error", req.url))
  }
}