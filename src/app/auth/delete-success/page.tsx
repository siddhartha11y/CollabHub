"use client"

import { useEffect } from "react"
import { signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Home, Users } from "lucide-react"
import Link from "next/link"

export default function DeleteSuccess() {
  useEffect(() => {
    // Sign out the user since their account is deleted
    signOut({ redirect: false })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <Users className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">CollabHub</span>
          </div>
        </div>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-green-800 dark:text-green-200">Account Successfully Deleted</CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              Your CollabHub account has been permanently deleted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">✅ What was deleted:</h3>
              <ul className="text-green-700 dark:text-green-300 text-sm space-y-1">
                <li>• Your profile and personal information</li>
                <li>• All workspaces you created</li>
                <li>• Your tasks, documents, and files</li>
                <li>• Chat messages and conversations</li>
                <li>• All account data and settings</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                📧 <strong>Confirmation email sent:</strong> You should receive a confirmation email shortly with details about your account deletion.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                💡 <strong>Want to come back?</strong> You can always create a new account at any time. We'd love to have you back!
              </p>
            </div>

            <div className="text-center space-y-3">
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Thank you for being part of the CollabHub community. We're sorry to see you go! 👋
              </p>
              
              <Link href="/">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Home className="h-4 w-4 mr-2" />
                  Return to Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Need help? Contact us at{" "}
            <a 
              href="mailto:support@collabhub.com" 
              className="text-blue-600 hover:underline"
            >
              support@collabhub.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}