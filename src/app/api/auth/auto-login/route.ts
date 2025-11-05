import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { error: "Login token is required" },
        { status: 400 }
      )
    }

    // Find the login token
    const loginToken = await prisma.verificationToken.findUnique({
      where: { token }
    })

    if (!loginToken) {
      return NextResponse.json(
        { error: "Invalid or expired login token" },
        { status: 400 }
      )
    }

    // Check if token is expired (5 minutes)
    const now = new Date()
    if (now > loginToken.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token }
      })
      
      return NextResponse.json(
        { error: "Login token has expired. Please sign in manually." },
        { status: 400 }
      )
    }

    // Extract email from identifier (format: "login:email@example.com")
    const email = loginToken.identifier.replace("login:", "")

    // Verify user exists and is verified
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.emailVerified) {
      return NextResponse.json(
        { error: "User not found or not verified" },
        { status: 404 }
      )
    }

    // Delete the login token (one-time use)
    await prisma.verificationToken.delete({
      where: { token }
    })

    return NextResponse.json({
      email: user.email,
      message: "Auto-login token verified successfully"
    })
  } catch (error) {
    console.error("Auto-login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}