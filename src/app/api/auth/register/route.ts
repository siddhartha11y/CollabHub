import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import crypto from "crypto"
import nodemailer from "nodemailer"

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

    // FIRST: Test email configuration by sending the email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    // Verify email configuration
    try {
      await transporter.verify()
    } catch (emailError) {
      console.error("Email configuration error:", emailError)
      return NextResponse.json(
        { error: "Email service is currently unavailable. Please try again later." },
        { status: 500 }
      )
    }

    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`

    // SECOND: Send the verification email BEFORE creating user
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Verify your email - CollabHub",
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #3b82f6;">Welcome to CollabHub!</h2>
            <p>Hi ${name},</p>
            <p>Thank you for registering with CollabHub. To complete your registration and secure your account, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
            
            <p><strong>Important:</strong> You cannot sign in to your account until you verify your email address.</p>
            
            <p>This verification link will expire in 24 hours.</p>
            
            <p>If you didn't create an account with CollabHub, please ignore this email.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              The CollabHub Team
            </p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error("Email sending error:", emailError)
      return NextResponse.json(
        { error: "Failed to send verification email. Please check your email address and try again." },
        { status: 500 }
      )
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