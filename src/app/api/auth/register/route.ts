import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import crypto from "crypto"
import { sendFastEmail } from "@/lib/email-optimizer"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // If user exists but email is not verified, allow re-registration by cleaning up
      if (!existingUser.emailVerified) {
        try {
          // Clean up the unverified user and their tokens
          await prisma.$transaction(async (tx) => {
            await tx.verificationToken.deleteMany({
              where: { identifier: email }
            })
            await tx.user.delete({
              where: { email }
            })
          })
          // Continue with registration process
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError)
          return NextResponse.json(
            { error: "Failed to clean up previous registration. Please contact support." },
            { status: 500 }
          )
        }
      } else {
        // User exists and is verified
        return NextResponse.json(
          { error: "User with this email already exists and is verified. Please sign in instead." },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    console.log("Generated verification token:", verificationToken)
    console.log("Token expiry:", tokenExpiry)

    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`

    // ULTRA-FAST EMAIL using optimized system
    try {
      await sendFastEmail({
        to: email,
        subject: "✅ VERIFY EMAIL - CollabHub",
        name: name,
        buttonText: "✅ VERIFY EMAIL",
        buttonUrl: verificationUrl,
        description: "Click to verify and activate your account:"
      })
      console.log("✅ Verification email sent successfully")
    } catch (emailError) {
      console.error("❌ Email sending error:", emailError)
      
      // Don't fail registration if email fails - store token anyway
      // User can request resend later
      console.log("⚠️ Continuing registration despite email error...")
    }

    // THIRD: Only create verification token AFTER email is successfully sent
    // DO NOT create user yet - user will be created when they verify their email
    try {
      const createdToken = await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: verificationToken,
          expires: tokenExpiry,
        }
      })
      
      console.log("Created verification token in DB:", createdToken)
      
      // Store the registration data temporarily in the token identifier
      // We'll use a special format: email|name|hashedPassword
      const registrationData = `${email}|${name}|${hashedPassword}`
      
      // Update the token to include registration data
      await prisma.verificationToken.update({
        where: { token: verificationToken },
        data: {
          identifier: registrationData
        }
      })
      
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Registration successful! Please check your email for verification. You must verify your email before you can sign in.",
      requiresVerification: true,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}