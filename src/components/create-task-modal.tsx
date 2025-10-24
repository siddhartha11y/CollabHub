"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CheckSquare, Calendar, User } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional(),
})

type CreateTaskForm = z.infer<typeof createTaskSchema>

interface CreateTaskModalProps {
  workspaceSlug: string
  workspaceMembers: any[]
  onTaskCreated: (task: any) => void
  children: React.ReactNode
}

export function CreateTaskModal({ 
  workspaceSlug, 
  workspaceMembers, 
  onTaskCreated, 
  children 
}: CreateTaskModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
    setValue,
    watch
  } = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      priority: "MEDIUM"
    }
  })

  const priority = watch("priority")
  const assigneeId = watch("assigneeId")

  const onSubmit = async (data: CreateTaskForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/tasks`, {
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

      onTaskCreated(result)
      setIsOpen(false)
      reset()
    } catch (error) {
      setError("root", { message: "Something went wrong. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckSquare className="h-5 w-5" />
            <span>Create New Task</span>
          </DialogTitle>
          <DialogDescription>
            Add a new task to your workspace. Assign it to team members and set priorities.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Title *
            </label>
            <Input
              {...register("title")}
              id="title"
              placeholder="What needs to be done?"
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <Textarea
              {...register("description")}
              id="description"
              placeholder="Add more details about this task..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <Select value={priority} onValueChange={(value) => setValue("priority", value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span>Low</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>Medium</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="HIGH">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span>High</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="URGENT">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span>Urgent</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assignee
              </label>
              <Select value={assigneeId || "unassigned"} onValueChange={(value) => setValue("assigneeId", value === "unassigned" ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <span className="text-gray-500">Unassigned</span>
                  </SelectItem>
                  {workspaceMembers.map((member) => (
                    <SelectItem key={member.user.id} value={member.user.id}>
                      <div className="flex items-center space-x-2">
                        <img 
                          src={member.user.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(member.user.name || "User") + "&background=3b82f6&color=fff"} 
                          alt={member.user.name} 
                          className="h-4 w-4 rounded-full"
                        />
                        <span>{member.user.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Due Date (Optional)
            </label>
            <Input
              {...register("dueDate")}
              id="dueDate"
              type="date"
              disabled={isLoading}
            />
          </div>

          {errors.root && (
            <p className="text-sm text-red-600">{errors.root.message}</p>
          )}

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}