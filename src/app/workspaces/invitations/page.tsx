"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Check, X, Clock, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface WorkspaceInvitation {
  id: string
  email: string
  role: "ADMIN" | "MEMBER" | "VIEWER"
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED"
  token: string
  expiresAt: string
  createdAt: string
  workspace: {
    id: string
    name: string
    slug: string
    description?: string
  }
  invitedBy: {
    id: string
    name: string
    email: string
  }
}

export default function InvitationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.email) {
      fetchInvitations()
    }
  }, [session])

  const fetchInvitations = async () => {
    try {
      const response = await fetch("/api/workspaces/invitations/my-invitations")
      if (response.ok) {
        const data = await response.json()
        setInvitations(data)
      }
    } catch (error) {
      console.error("Failed to fetch invitations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async (token: string) => {
    try {
      const response = await fetch(`/api/workspaces/invitations/${token}/accept`, {
        method: "POST"
      })
      
      if (response.ok) {
        const result = await response.json()
        // Refresh invitations
        fetchInvitations()
        // Redirect to the workspace
        router.push(`/workspaces/${result.workspace.slug}`)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to accept invitation")
      }
    } catch (error) {
      console.error("Failed to accept invitation:", error)
      alert("Failed to accept invitation")
    }
  }

  const handleDeclineInvitation = async (token: string) => {
    try {
      const response = await fetch(`/api/workspaces/invitations/${token}/decline`, {
        method: "POST"
      })
      
      if (response.ok) {
        // Refresh invitations
        fetchInvitations()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to decline invitation")
      }
    } catch (error) {
      console.error("Failed to decline invitation:", error)
      alert("Failed to decline invitation")
    }
  }

  const getStatusBadge = (status: WorkspaceInvitation["status"]) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>
      case "ACCEPTED":
        return <Badge variant="outline" className="text-green-600 border-green-600">Accepted</Badge>
      case "DECLINED":
        return <Badge variant="outline" className="text-red-600 border-red-600">Declined</Badge>
      case "EXPIRED":
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleColor = (role: WorkspaceInvitation["role"]) => {
    switch (role) {
      case "ADMIN":
        return "text-purple-600"
      case "MEMBER":
        return "text-blue-600"
      case "VIEWER":
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Workspace Invitations
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your workspace invitations
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {invitations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserPlus className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No invitations
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                You don't have any workspace invitations at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {invitations.map((invitation) => (
              <Card key={invitation.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {invitation.workspace.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Invited by {invitation.invitedBy.name} ({invitation.invitedBy.email})
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(invitation.status)}
                      <Badge variant="secondary" className={getRoleColor(invitation.role)}>
                        {invitation.role}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {invitation.workspace.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {invitation.workspace.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          Invited {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {invitation.status === "PENDING" && (
                        <div className="flex items-center space-x-1">
                          <span>
                            Expires {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {invitation.status === "PENDING" && new Date(invitation.expiresAt) > new Date() && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeclineInvitation(invitation.token)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvitation(invitation.token)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                      </div>
                    )}
                    
                    {invitation.status === "ACCEPTED" && (
                      <Link href={`/workspaces/${invitation.workspace.slug}`}>
                        <Button size="sm">
                          Go to Workspace
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}