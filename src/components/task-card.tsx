"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Calendar, MoreVertical, Trash2, User } from "lucide-react"
import { getAllowedNextStatuses, getStatusInfo } from "@/lib/task-status-progression"

interface Task {
  id: string
  title: string
  description?: string
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate?: string
  creator: {
    id: string
    name: string
    image?: string
  }
  assignee?: {
    id: string
    name: string
    image?: string
  }
}

interface TaskCardProps {
  task: Task
  workspaceSlug: string
  onStatusChange: (taskId: string, newStatus: string) => void
  onTaskDeleted: (taskId: string) => void
}

const priorityColors = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-600", 
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600"
}

export function TaskCard({ task, workspaceSlug, onStatusChange, onTaskDeleted }: TaskCardProps) {
  const { data: session } = useSession()
  const [isDeleting, setIsDeleting] = useState(false)
  
  const currentUserId = session?.user?.id
  const isAssignee = task.assignee?.id === currentUserId
  const isCreator = task.creator.id === currentUserId
  const isUnassigned = !task.assignee
  
  // User can change status if they are the assignee, or if task is unassigned
  const canChangeStatus = isAssignee || isUnassigned
  
  // Only creator can delete the task
  const canDelete = isCreator
  
  // Get allowed next statuses for forward-only progression
  const allowedNextStatuses = getAllowedNextStatuses(task.status)
  
  const handleDelete = async () => {
    if (!canDelete || isDeleting) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/tasks/${task.id}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        onTaskDeleted(task.id)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete task")
      }
    } catch (error) {
      console.error("Failed to delete task:", error)
      alert("Failed to delete task")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!canChangeStatus) return
    
    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        onStatusChange(task.id, newStatus)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update task status")
      }
    } catch (error) {
      console.error("Failed to update task:", error)
      alert("Failed to update task")
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
            {task.title}
          </h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canDelete && (
                <>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete Task"}
                  </DropdownMenuItem>
                </>
              )}
              {!canDelete && (
                <DropdownMenuItem disabled>
                  <span className="text-xs text-gray-500">Only creator can delete</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Creator and Assignee Info */}
        <div className="mb-3 space-y-1">
          <div className="flex items-center text-xs text-gray-500">
            <User className="h-3 w-3 mr-1" />
            <span>Created by {task.creator.name}</span>
          </div>
          {task.assignee ? (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <img 
                src={task.assignee.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(task.assignee.name || "User") + "&background=3b82f6&color=fff"} 
                alt={task.assignee.name} 
                className="h-3 w-3 rounded-full mr-1"
              />
              <span>Assigned to {task.assignee.name}</span>
            </div>
          ) : (
            <div className="text-xs text-gray-400">
              <span>Unassigned</span>
            </div>
          )}
        </div>
        
        {task.description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Badge className={`text-xs ${priorityColors[task.priority]}`}>
              {task.priority}
            </Badge>
          </div>
          
          {task.dueDate && (
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>
        
        {/* Status Change Buttons - Only show if user can change status */}
        {canChangeStatus && allowedNextStatuses.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allowedNextStatuses.map((status) => {
              const statusInfo = getStatusInfo(status)
              return (
                <Button 
                  key={status}
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-6"
                  onClick={() => handleStatusChange(status)}
                >
                  {statusInfo.label}
                </Button>
              )
            })}
          </div>
        )}
        
        {/* Show message if user can't change status */}
        {!canChangeStatus && task.assignee && (
          <div className="text-xs text-gray-400 italic">
            Only {task.assignee.name} can update this task's status
          </div>
        )}
      </CardContent>
    </Card>
  )
}