import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { sendFastEmail } from "@/lib/email-optimizer"

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

    const deletionUrl = `${process.env.NEXTAUTH_URL}/api/auth/confirm-delete?token=${deletionToken}`

    // ULTRA-FAST EMAIL using optimized system
    try {
      await sendFastEmail({
        to: email,
        subject: "⚠️ DELETE ACCOUNT - CollabHub",
        name: user.name,
        buttonText: "🗑️ DELETE ACCOUNT",
        buttonUrl: deletionUrl,
        description: "Click to permanently delete your CollabHub account:"
      })
      
      return NextResponse.json({
        message: "Deletion confirmation email sent successfully"
      })
    } catch (emailError) {
      console.error("❌ Delete confirmation email error:", emailError)
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