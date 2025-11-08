import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

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

    console.log(`🔥 DELETE ACCOUNT REQUEST: ${email}`)
    console.log(`📞 Calling force-delete-user API internally...`)

    // Call the working force-delete-user API internally
    try {
      const forceDeleteResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/force-delete-user`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const result = await forceDeleteResponse.json()
      
      if (result.success) {
        console.log(`✅ Force delete successful:`, result)
        return NextResponse.json({
          success: true,
          message: "Account successfully deleted"
        })
      } else {
        console.error(`❌ Force delete failed:`, result)
        return NextResponse.json({
          success: false,
          error: result.error || "Deletion failed"
        }, { status: 500 })
      }
      
    } catch (fetchError) {
      console.error(`❌ Failed to call force-delete API:`, fetchError)
      return NextResponse.json({
        success: false,
        error: "Internal deletion service failed"
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Delete account request error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}