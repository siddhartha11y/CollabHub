import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    console.log("Verification attempt with token:", token)

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      )
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    })

    console.log("Found verification token:", verificationToken)

    if (!verificationToken) {
      // Check if token exists in database at all
      const allTokens = await prisma.verificationToken.findMany({
        select: { token: true, identifier: true, expires: true }
      })
      console.log("All tokens in database:", allTokens)
      
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      )
    }

    // Check if token is expired (24 hours)
    const now = new Date()
    if (now > verificationToken.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token }
      })
      
      return NextResponse.json(
        { error: "Verification token has expired. Please register again." },
        { status: 400 }
      )
    }

    // Parse registration data from token identifier
    const registrationData = verificationToken.identifier.split('|')
    
    if (registrationData.length !== 3) {
      return NextResponse.json(
        { error: "Invalid verification token format" },
        { status: 400 }
      )
    }
    
    const [email, name, hashedPassword] = registrationData
    
    // Check if user already exists (shouldn't happen, but safety check)
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      // User already exists, just verify them
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { emailVerified: new Date() }
      })
    } else {
      // Create the user now that email is verified
      const { generateUsernameFromEmail } = await import("@/lib/username")
      const username = await generateUsernameFromEmail(email)
      
      await prisma.user.create({
        data: {
          name,
          email,
          username,
          password: hashedPassword,
          emailVerified: new Date(), // Verified immediately
        }
      })
    }

    // Delete the verification token
    await prisma.verificationToken.delete({
      where: { token }
    })

    // Redirect to success page
    return NextResponse.redirect(new URL("/auth/signin?verified=true", req.url))
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}