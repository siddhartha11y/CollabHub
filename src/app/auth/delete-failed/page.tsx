"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, Home, Users, RefreshCw, Mail } from "lucide-react"
import Link from "next/link"

function DeleteFailedContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = () => {
    switch (error) {
      case "invalid-token":
        return {
          title: "Invalid Deletion Link",
          message: "The deletion link is invalid or has already been used.",
          suggestion: "Please request a new deletion link from your profile page."
        }
      case "expired-token":
        return {
          title: "Deletion Link Expired",
          message: "The deletion link has expired for security reasons.",
          suggestion: "Deletion links expire after 24 hours. Please request a new one from your profile page."
        }
      case "user-not-found":
        return {
          title: "Account Not Found",
          message: "The account associated with this deletion request could not be found.",
          suggestion: "The account may have already been deleted or the link is invalid."
        }
      case "deletion-failed":
        return {
          title: "Deletion Failed",
          message: "An error occurred while deleting your account.",
          suggestion: "Please try again or contact support if the problem persists."
        }
      case "server-error":
        return {
          title: "Server Error",
          message: "A server error occurred while processing your request.",
          suggestion: "Please try again later or contact support."
        }
      default:
        return {
          title: "Deletion Failed",
          message: "An unknown error occurred during account deletion.",
          suggestion: "Please try again or contact support for assistance."
        }
    }
  }

  const errorInfo = getErrorMessage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <Users className="h-8 w-8 text-red-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">CollabHub</span>
          </div>
        </div>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-red-800 dark:text-red-200">{errorInfo.title}</CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400">
              {errorInfo.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">
                💡 <strong>What to do next:</strong> {errorInfo.suggestion}
              </p>
            </div>

            {(error === "invalid-token" || error === "expired-token") && (
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  🔒 <strong>Security Note:</strong> Deletion links expire after 24 hours and can only be used once for your security.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {(error === "invalid-token" || error === "expired-token" || error === "deletion-failed") && (
                <Link href="/profile">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again from Profile
                  </Button>
                </Link>
              )}
              
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Return to Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 space-y-2">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Still having trouble?
          </p>
          <a 
            href="mailto:support@collabhub.com" 
            className="inline-flex items-center text-blue-600 hover:underline text-sm"
          >
            <Mail className="h-4 w-4 mr-1" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}

export default function DeleteFailed() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              </div>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <DeleteFailedContent />
    </Suspense>
  )
}