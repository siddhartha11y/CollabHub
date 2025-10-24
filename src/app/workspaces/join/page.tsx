"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Users, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"

function JoinWorkspaceContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [invitation, setInvitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link")
      setLoading(false)
      return
    }

    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/workspaces/invitations/${token}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Invalid invitation")
          return
        }

        setInvitation(data)
      } catch (error) {
        setError("Failed to load invitation")
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [token])

  const handleAcceptInvitation = async () => {
    if (!session) {
      // Redirect to sign in with callback to this page
      signIn(undefined, { callbackUrl: window.location.href })
      return
    }

    setAccepting(true)
    
    try {
      const response = await fetch(`/api/workspaces/invitations/${token}/accept`, {
        method: "POST",
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error)
        return
      }

      // Redirect to workspace
      router.push(`/workspaces/${result.workspace.slug}`)
    } catch (error) {
      setError("Failed to accept invitation")
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) {
    return null
  }

  const isExpired = new Date(invitation.expiresAt) < new Date()
  const isAlreadyAccepted = invitation.status === "ACCEPTED"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <Users className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">CollabHub</span>
          </Link>
          <ThemeToggle />
        </div>

        <Card>
          <CardHeader className="text-center">
            {isExpired ? (
              <>
                <Clock className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>Invitation Expired</CardTitle>
                <CardDescription>
                  This invitation has expired. Please ask for a new invitation.
                </CardDescription>
              </>
            ) : isAlreadyAccepted ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Already Accepted</CardTitle>
                <CardDescription>
                  You've already accepted this invitation.
                </CardDescription>
              </>
            ) : (
              <>
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>You're Invited!</CardTitle>
                <CardDescription>
                  Join "{invitation.workspace.name}" and start collaborating
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          {!isExpired && !isAlreadyAccepted && (
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {invitation.workspace.name}
                </h3>
                {invitation.workspace.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {invitation.workspace.description}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  <strong>Role:</strong> {invitation.role.toLowerCase()}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Invited by:</strong> {invitation.invitedBy.name}
                </p>
              </div>

              {!session ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                    Sign in to accept this invitation
                  </p>
                  <Button 
                    onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
                    className="w-full"
                  >
                    Sign In to Join
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleAcceptInvitation}
                  disabled={accepting}
                  className="w-full"
                >
                  {accepting ? "Joining..." : "Accept Invitation"}
                </Button>
              )}

              <p className="text-xs text-center text-gray-500">
                Expires on {new Date(invitation.expiresAt).toLocaleDateString()}
              </p>
            </CardContent>
          )}

          {(isExpired || isAlreadyAccepted) && (
            <CardContent>
              <Link href="/dashboard">
                <Button className="w-full">
                  {session ? "Go to Dashboard" : "Sign In"}
                </Button>
              </Link>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function JoinWorkspace() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <JoinWorkspaceContent />
    </Suspense>
  )
}