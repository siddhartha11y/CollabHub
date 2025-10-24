"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Users, 
  Plus, 
  Settings, 
  LogOut, 
  ArrowLeft, 
  CheckSquare, 
  MessageSquare, 
  FileText,
  UserPlus,
  MoreVertical,
  File,
  Video
} from "lucide-react"
import Link from "next/link"
import { InviteMembersModal } from "@/components/invite-members-modal"
import { SimpleNotificationBell } from "@/components/simple-notification-bell"

export default function WorkspacePage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [workspace, setWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session || !params.slug) return

    const fetchWorkspace = async () => {
      try {
        const response = await fetch(`/api/workspaces/${params.slug}`)
        if (response.ok) {
          const data = await response.json()
          setWorkspace(data)
        } else if (response.status === 404) {
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Failed to fetch workspace:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspace()
  }, [session, params.slug, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Workspace not found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The workspace you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {workspace.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {workspace.members.length} members
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <SimpleNotificationBell />
            <InviteMembersModal workspaceSlug={params.slug as string}>
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
            </InviteMembersModal>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <ThemeToggle />
            <div className="flex items-center space-x-2">
              <img 
                src={session?.user?.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(session?.user?.name || "User") + "&background=3b82f6&color=fff"} 
                alt="Profile" 
                className="h-8 w-8 rounded-full"
              />
              <span className="text-sm font-medium">{session?.user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Workspace Description */}
        {workspace.description && (
          <div className="mb-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-700 dark:text-gray-300">{workspace.description}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Link href={`/workspaces/${params.slug}/tasks`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <CheckSquare className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Tasks</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                  Manage your team's work
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/workspaces/${params.slug}/chat`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <MessageSquare className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Chat</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                  Team communication
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/workspaces/${params.slug}/documents`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <FileText className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Documents</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                  Shared knowledge base
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/workspaces/${params.slug}/files`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <File className="h-8 w-8 text-orange-600 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Files</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                  Shared resources
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/workspaces/${params.slug}/meetings`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Video className="h-8 w-8 text-red-600 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Meetings</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                  Video conferences
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity & Team Members */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates in this workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        Workspace created by {workspace.creator.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(workspace.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-center py-8 text-gray-500">
                    <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                    <p className="text-sm">Start by creating some tasks or inviting team members!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Members */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Team Members</span>
                  <InviteMembersModal workspaceSlug={params.slug as string}>
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </InviteMembersModal>
                </CardTitle>
                <CardDescription>
                  {workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workspace.members.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={member.user.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(member.user.name || "User") + "&background=3b82f6&color=fff"} 
                          alt={member.user.name || "Member"} 
                          className="h-8 w-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.role.toLowerCase()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}