import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Find user with this email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Only delete if email is not verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "User email is already verified" },
        { status: 400 }
      )
    }

    // Delete user and associated verification tokens
    await prisma.$transaction(async (tx) => {
      // Delete verification tokens
      await tx.verificationToken.deleteMany({
        where: { identifier: email }
      })

      // Delete user
      await tx.user.delete({
        where: { email }
      })
    })

    return NextResponse.json({
      message: "Unverified user account deleted successfully"
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}