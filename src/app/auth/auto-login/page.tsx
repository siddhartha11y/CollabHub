"use client"

import { useEffect, useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Loader2, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

function AutoLoginContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    const performAutoLogin = async () => {
      if (!token) {
        setStatus("error")
        setMessage("Invalid login token")
        return
      }

      try {
        // Verify the login token and get user email
        const response = await fetch(`/api/auth/auto-login?token=${token}`)
        const result = await response.json()

        if (!response.ok) {
          setStatus("error")
          setMessage(result.error || "Auto-login failed")
          return
        }

        // Sign in the user automatically
        const signInResult = await signIn("credentials", {
          email: result.email,
          autoLogin: "true", // Special flag for auto-login
          redirect: false,
        })

        if (signInResult?.ok) {
          setStatus("success")
          setMessage("Successfully signed in! Redirecting to dashboard...")
          
          // Redirect to dashboard after a brief delay
          setTimeout(() => {
            router.push("/dashboard")
          }, 1500)
        } else {
          setStatus("error")
          setMessage("Failed to sign in automatically")
        }
      } catch (error) {
        console.error("Auto-login error:", error)
        setStatus("error")
        setMessage("Something went wrong during auto-login")
      }
    }

    performAutoLogin()
  }, [token, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <Users className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">CollabHub</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <CardTitle>Signing you in...</CardTitle>
                <CardDescription>
                  Please wait while we complete your email verification and sign you in.
                </CardDescription>
              </>
            )}
            
            {status === "success" && (
              <>
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Welcome to CollabHub!</CardTitle>
                <CardDescription>
                  {message}
                </CardDescription>
              </>
            )}
            
            {status === "error" && (
              <>
                <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <CardTitle>Sign-in Failed</CardTitle>
                <CardDescription>
                  {message}
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          {status === "error" && (
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => router.push("/auth/signin")}
              >
                Go to Sign In
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function AutoLogin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <Link href="/" className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">CollabHub</span>
            </Link>
          </div>
          <Card>
            <CardHeader className="text-center">
              <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <CardTitle>Loading...</CardTitle>
              <CardDescription>
                Please wait while we prepare your sign-in.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <AutoLoginContent />
    </Suspense>
  )
}