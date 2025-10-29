"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Users, Plus, Settings, LogOut, MessageCircle } from "lucide-react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { SimpleNotificationBell } from "@/components/simple-notification-bell"
import { TestNotificationButton } from "@/components/test-notification-button"
import { UserSearch } from "@/components/user-search"

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return // Still loading
    if (!session) redirect("/auth/signin")
    
    // Fetch user's workspaces
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch("/api/workspaces")
        if (response.ok) {
          const data = await response.json()
          setWorkspaces(data)
        }
      } catch (error) {
        console.error("Failed to fetch workspaces:", error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchWorkspaces()
    }
  }, [session, status])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b sticky top-0 z-[100]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 relative">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CollabHub</h1>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-4">
              <UserSearch />
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/messages">
                <Button variant="ghost" size="icon" title="Messages">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </Link>
              <TestNotificationButton />
              <SimpleNotificationBell />
              <ThemeToggle />
              <Link href="/profile" className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-2 py-1 transition-colors">
                <img 
                  src={session.user?.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(session.user?.name || "User") + "&background=3b82f6&color=fff"} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full"
                />
                <span className="text-sm font-medium">{session.user?.name}</span>
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {session.user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Here are your workspaces and recent activity.
          </p>
        </div>

        {/* Workspaces Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Create New Workspace Card */}
          <Link href="/workspaces/create">
            <Card className="border-dashed border-2 hover:border-blue-500 transition-colors cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6 h-48">
                <Plus className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Create Workspace
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                  Start collaborating with your team
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* User's Workspaces */}
          {loading ? (
            <div className="col-span-full flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            workspaces.map((workspace: any) => (
              <Link key={workspace.id} href={`/workspaces/${workspace.slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{workspace.name}</span>
                      <Settings className="h-4 w-4 text-gray-400" />
                    </CardTitle>
                    <CardDescription>
                      {workspace._count.members} members • {workspace._count.tasks} tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="flex -space-x-2">
                        {workspace.members.slice(0, 3).map((member: any) => (
                          <img 
                            key={member.id}
                            className="h-6 w-6 rounded-full border-2 border-white" 
                            src={member.user.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(member.user.name || "User") + "&background=3b82f6&color=fff"} 
                            alt={member.user.name || "Member"} 
                          />
                        ))}
                        {workspace._count.members > 3 && (
                          <div className="h-6 w-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-xs text-white font-medium">
                            +{workspace._count.members - 3}
                          </div>
                        )}
                      </div>
                    </div>
                    {workspace.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {workspace.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))
          )}

          {/* Empty state */}
          {!loading && workspaces.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No workspaces yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create your first workspace to start collaborating with your team.
              </p>
              <Link href="/workspaces/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workspace
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Plus className="h-6 w-6" />
              <span>New Task</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>Invite Members</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Settings className="h-6 w-6" />
              <span>Settings</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <LogOut className="h-6 w-6" />
              <span>Help</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}