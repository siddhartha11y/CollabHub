import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import nodemailer from "nodemailer"

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

    // Generate deletion token
    const deletionToken = crypto.randomBytes(32).toString("hex")
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store deletion token
    await prisma.verificationToken.create({
      data: {
        identifier: `delete:${email}`,
        token: deletionToken,
        expires: tokenExpiry,
      }
    })

    // Create optimized email transporter
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

    const deletionUrl = `${process.env.NEXTAUTH_URL}/api/auth/confirm-delete?token=${deletionToken}`

    // Send deletion confirmation email
    const emailPromise = transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "⚠️ Confirm Account Deletion - CollabHub",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Confirm Account Deletion</title>
        </head>
        <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background-color:#f9fafb">
          <div style="background-color:white;padding:30px;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
            <div style="text-align:center;margin-bottom:30px">
              <div style="width:80px;height:80px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center">
                <span style="color:white;font-size:32px">⚠️</span>
              </div>
              <h1 style="color:#dc2626;margin:0;font-size:24px">Account Deletion Request</h1>
            </div>
            
            <p style="color:#374151;line-height:1.6;margin-bottom:20px">Hi ${user.name || 'User'},</p>
            
            <p style="color:#374151;line-height:1.6;margin-bottom:20px">
              We received a request to permanently delete your CollabHub account. This action will:
            </p>
            
            <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin:20px 0">
              <h3 style="color:#dc2626;margin:0 0 15px 0;font-size:16px">⚠️ This will permanently delete:</h3>
              <ul style="color:#991b1b;margin:0;padding-left:20px;line-height:1.8">
                <li>Your profile and personal information</li>
                <li>All workspaces you created</li>
                <li>Your tasks, documents, and files</li>
                <li>Chat messages and conversations</li>
                <li>All account data and settings</li>
              </ul>
            </div>
            
            <p style="color:#374151;line-height:1.6;margin-bottom:30px">
              <strong>If you're sure you want to delete your account, click the button below:</strong>
            </p>
            
            <div style="text-align:center;margin:30px 0">
              <a href="${deletionUrl}" 
                 style="background-color:#dc2626;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;font-size:16px">
                🗑️ DELETE MY ACCOUNT
              </a>
            </div>
            
            <div style="background-color:#f3f4f6;border-radius:8px;padding:15px;margin:20px 0">
              <p style="color:#6b7280;margin:0;font-size:14px;text-align:center">
                Or copy and paste this link: <br>
                <span style="word-break:break-all;color:#4b5563">${deletionUrl}</span>
              </p>
            </div>
            
            <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:15px;margin:20px 0">
              <p style="color:#92400e;margin:0;font-size:14px">
                ⏰ <strong>Important:</strong> This deletion link will expire in 24 hours for security reasons.
              </p>
            </div>
            
            <p style="color:#374151;line-height:1.6;margin-bottom:20px">
              If you didn't request this deletion or changed your mind, simply ignore this email. Your account will remain active.
            </p>
            
            <hr style="margin:30px 0;border:none;border-top:1px solid #e5e7eb">
            
            <div style="text-align:center">
              <p style="color:#6b7280;font-size:14px;margin:0">
                We're sad to see you go! 😢<br>
                <strong>The CollabHub Team</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    })

    // Set timeout for email
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email timeout')), 15000)
    })

    try {
      await Promise.race([emailPromise, timeoutPromise])
      
      return NextResponse.json({
        message: "Deletion confirmation email sent successfully"
      })
    } catch (emailError) {
      console.error("Delete confirmation email error:", emailError)
      return NextResponse.json(
        { error: "Failed to send deletion confirmation email. Please try again." },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Delete account request error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}