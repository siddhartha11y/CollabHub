import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const verifyTokenSchema = z.object({
  token: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token } = verifyTokenSchema.parse(body)

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token hasn't expired
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      )
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 400 }
    )
  }
}