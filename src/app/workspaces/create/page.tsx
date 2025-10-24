"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Users, ArrowLeft, Building2 } from "lucide-react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name must be at least 2 characters"),
  description: z.string().optional(),
})

type CreateWorkspaceForm = z.infer<typeof createWorkspaceSchema>

export default function CreateWorkspace() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<CreateWorkspaceForm>({
    resolver: zodResolver(createWorkspaceSchema)
  })

  const onSubmit = async (data: CreateWorkspaceForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError("root", { message: result.error })
        return
      }

      // Redirect to the new workspace
      router.push(`/workspaces/${result.slug}`)
    } catch (error) {
      setError("root", { message: "Something went wrong. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
              <span>Back to Dashboard</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="flex items-center space-x-2">
              <img 
                src={session.user?.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(session.user?.name || "User") + "&background=3b82f6&color=fff"} 
                alt="Profile" 
                className="h-8 w-8 rounded-full"
              />
              <span className="text-sm font-medium">{session.user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Create New Workspace
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Set up a new workspace to collaborate with your team
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Workspace Details</CardTitle>
              <CardDescription>
                Choose a name and description for your workspace. You can always change these later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Workspace Name *
                  </label>
                  <Input
                    {...register("name")}
                    id="name"
                    placeholder="e.g., Team Alpha, Marketing Department, Project Phoenix"
                    disabled={isLoading}
                    className="w-full"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <Textarea
                    {...register("description")}
                    id="description"
                    placeholder="What's this workspace for? Describe your team or project..."
                    disabled={isLoading}
                    className="w-full"
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                  )}
                </div>

                {errors.root && (
                  <p className="text-sm text-red-600">{errors.root.message}</p>
                )}

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.back()}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating..." : "Create Workspace"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Features Preview */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Team Collaboration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Invite members and work together</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Task Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Organize work with tasks and boards</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Real-time Chat</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Communicate instantly with your team</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}