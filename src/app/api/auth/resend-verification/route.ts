import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendFastEmail } from "@/lib/email-optimizer"

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

    // ULTRA-FAST EMAIL using optimized system
    try {
      await sendFastEmail({
        to: email,
        subject: "🔄 VERIFY EMAIL (RESENT) - CollabHub",
        name: name,
        buttonText: "✅ VERIFY EMAIL",
        buttonUrl: verificationUrl,
        description: "Click to verify your account:"
      })
      
      return NextResponse.json({
        message: "Verification email resent successfully!"
      })
    } catch (emailError) {
      console.error("❌ Resend email error:", emailError)
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