import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only use basic fields that definitely exist
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      // Create basic user if not found
      const newUser = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || "",
          image: session.user.image || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        }
      })
      return NextResponse.json(newUser)
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Basic profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, image } = body

    // Only update basic fields
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name?.trim() || session.user.name || "",
        image: image || session.user.image || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Basic profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}