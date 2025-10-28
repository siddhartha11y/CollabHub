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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        title: true,
        company: true,
        location: true,
        website: true,
        phone: true,
        timezone: true,
        theme: true,
        language: true,
        emailNotifications: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      // If user not found in database, create a basic profile from session
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
          bio: true,
          title: true,
          company: true,
          location: true,
          website: true,
          phone: true,
          timezone: true,
          theme: true,
          language: true,
          emailNotifications: true,
          createdAt: true,
          updatedAt: true,
        }
      })
      return NextResponse.json(newUser)
    }

    // Merge session data with database data (session data takes precedence for name and image if they exist)
    const profileData = {
      ...user,
      name: user.name || session.user.name || "",
      image: user.image || session.user.image || null,
    }

    return NextResponse.json(profileData)
  } catch (error) {
    console.error("Profile fetch error:", error)
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
    const {
      name,
      bio,
      title,
      company,
      location,
      website,
      phone,
      timezone,
      theme,
      language,
      emailNotifications,
      image
    } = body

    // Validate required fields
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name.trim(),
        bio: bio?.trim() || null,
        title: title?.trim() || null,
        company: company?.trim() || null,
        location: location?.trim() || null,
        website: website?.trim() || null,
        phone: phone?.trim() || null,
        timezone: timezone || null,
        theme: theme || "system",
        language: language || "en",
        emailNotifications: emailNotifications !== false,
        image: image || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        title: true,
        company: true,
        location: true,
        website: true,
        phone: true,
        timezone: true,
        theme: true,
        language: true,
        emailNotifications: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}