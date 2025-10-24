"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Users, 
  Plus, 
  ArrowLeft, 
  CheckSquare, 
  Clock,
  User,
  Calendar,
  MoreVertical,
  Filter,
  Paperclip
} from "lucide-react"
import Link from "next/link"
import { CreateTaskModal } from "@/components/create-task-modal"
import { FileUploadModal } from "@/components/file-upload-modal"
import { SimpleNotificationBell } from "@/components/simple-notification-bell"
import { TaskCard } from "@/components/task-card"

const statusColors = {
  TODO: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  DONE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
}

const priorityColors = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-600", 
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600"
}

export default function TasksPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [tasks, setTasks] = useState<any[]>([])
  const [workspace, setWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")

  useEffect(() => {
    if (!session || !params.slug) return

    const fetchData = async () => {
      try {
        // Fetch workspace and tasks in parallel
        const [workspaceRes, tasksRes] = await Promise.all([
          fetch(`/api/workspaces/${params.slug}`),
          fetch(`/api/workspaces/${params.slug}/tasks`)
        ])

        if (workspaceRes.ok) {
          const workspaceData = await workspaceRes.json()
          setWorkspace(workspaceData)
        }

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          setTasks(tasksData)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session, params.slug])

  const handleTaskCreated = (newTask: any) => {
    setTasks(prev => [newTask, ...prev])
  }

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ))
  }

  const handleTaskDeleted = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === "ALL") return true
    return task.status === filter
  })

  const tasksByStatus = {
    TODO: filteredTasks.filter(task => task.status === "TODO"),
    IN_PROGRESS: filteredTasks.filter(task => task.status === "IN_PROGRESS"),
    REVIEW: filteredTasks.filter(task => task.status === "REVIEW"),
    DONE: filteredTasks.filter(task => task.status === "DONE")
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
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href={`/workspaces/${params.slug}`} className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Workspace</span>
            </Link>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <CheckSquare className="h-5 w-5" />
                <span>Tasks</span>
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {workspace?.name} • {tasks.length} tasks
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <SimpleNotificationBell />
            <CreateTaskModal 
              workspaceSlug={params.slug as string}
              workspaceMembers={workspace?.members || []}
              onTaskCreated={handleTaskCreated}
            >
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </CreateTaskModal>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex space-x-2 mb-6">
          {["ALL", "TODO", "IN_PROGRESS", "REVIEW", "DONE"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === "ALL" ? "All Tasks" : status.replace("_", " ")}
              {status !== "ALL" && (
                <Badge variant="secondary" className="ml-2">
                  {tasksByStatus[status as keyof typeof tasksByStatus]?.length || 0}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {status.replace("_", " ")}
                </h3>
                <Badge variant="secondary">
                  {statusTasks.length}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {statusTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    workspaceSlug={params.slug as string}
                    onStatusChange={handleStatusChange}
                    onTaskDeleted={handleTaskDeleted}
                  />
                ))}
                
                {statusTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No {status.toLowerCase().replace("_", " ")} tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center py-16">
            <CheckSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No tasks yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Create your first task to get started with project management.
            </p>
            <CreateTaskModal 
              workspaceSlug={params.slug as string}
              workspaceMembers={workspace?.members || []}
              onTaskCreated={handleTaskCreated}
            >
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Task
              </Button>
            </CreateTaskModal>
          </div>
        )}
      </main>
    </div>
  )
}