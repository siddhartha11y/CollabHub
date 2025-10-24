"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { History, FileText, Trash2, Edit, Plus } from "lucide-react"

interface DocumentActivityLogProps {
  children: React.ReactNode
  workspaceSlug: string
}

export function DocumentActivityLog({ children, workspaceSlug }: DocumentActivityLogProps) {
  const [open, setOpen] = useState(false)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/document-activities`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error("Failed to fetch document activities:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchActivities()
    }
  }, [open, workspaceSlug])

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATED":
        return <Plus className="h-4 w-4 text-green-600" />
      case "DELETED":
        return <Trash2 className="h-4 w-4 text-red-600" />
      case "RENAMED":
        return <Edit className="h-4 w-4 text-blue-600" />
      case "UPDATED":
        return <FileText className="h-4 w-4 text-purple-600" />
      default:
        return <History className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "DELETED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "RENAMED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "UPDATED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Document Activity Log</span>
          </DialogTitle>
          <DialogDescription>
            Recent document activities in this workspace
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No document activities yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border bg-gray-50 dark:bg-gray-800">
                  <div className="shrink-0 mt-1">
                    {getActionIcon(activity.action)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={`text-xs ${getActionColor(activity.action)}`}>
                        {activity.action}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {activity.documentTitle}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-300">
                      <div className="flex items-center space-x-1">
                        <img 
                          src={activity.performedBy.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(activity.performedBy.name || "User") + "&background=3b82f6&color=fff"} 
                          alt={activity.performedBy.name} 
                          className="h-4 w-4 rounded-full"
                        />
                        <span>by {activity.performedBy.name}</span>
                      </div>
                      
                      {activity.originalAuthor && activity.originalAuthor.id !== activity.performedBy.id && (
                        <div className="flex items-center space-x-1">
                          <img 
                            src={activity.originalAuthor.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(activity.originalAuthor.name || "User") + "&background=3b82f6&color=fff"} 
                            alt={activity.originalAuthor.name} 
                            className="h-4 w-4 rounded-full"
                          />
                          <span>authored by {activity.originalAuthor.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}