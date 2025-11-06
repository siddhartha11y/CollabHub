import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Find existing verification token
    const existingTokens = await prisma.verificationToken.findMany({
      where: {
        identifier: {
          contains: email
        }
      }
    })

    if (existingTokens.length === 0) {
      return NextResponse.json(
        { error: "No pending verification found for this email" },
        { status: 404 }
      )
    }

    const verificationToken = existingTokens[0]
    
    // Check if token is expired
    if (new Date() > verificationToken.expires) {
      return NextResponse.json(
        { error: "Verification token has expired. Please register again." },
        { status: 400 }
      )
    }

    // Extract name from identifier (format: email|name|password)
    const parts = verificationToken.identifier.split('|')
    const name = parts.length >= 2 ? parts[1] : 'User'

    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken.token}`

    // Create optimized transporter
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

    // Send email with timeout
    const emailPromise = transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Verify your email - CollabHub (Resent)",
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Verify Email</title></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#3b82f6">Verify Your Email</h2><p>Hi ${name},</p><p>Here's your verification link (resent):</p><div style="text-align:center;margin:30px 0"><a href="${verificationUrl}" style="background-color:#3b82f6;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Verify Email Address</a></div><p>Link expires in 24 hours.</p><p style="color:#666;font-size:14px">CollabHub Team</p></body></html>`,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    })

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email timeout')), 15000)
    })

    try {
      await Promise.race([emailPromise, timeoutPromise])
      return NextResponse.json({
        message: "Verification email resent successfully!"
      })
    } catch (emailError) {
      console.error("Resend email error:", emailError)
      return NextResponse.json(
        { error: "Failed to resend email. Please try again later." },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}