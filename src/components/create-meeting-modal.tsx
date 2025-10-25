"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Video } from "lucide-react"
import { parseInputDateTime } from "@/lib/date-utils"

interface CreateMeetingModalProps {
  children: React.ReactNode
  workspaceSlug: string
  onMeetingCreated: (meeting: any) => void
}

export function CreateMeetingModal({ 
  children, 
  workspaceSlug, 
  onMeetingCreated 
}: CreateMeetingModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Parse the datetime inputs properly to maintain local timezone
      const meetingData = {
        ...formData,
        startTime: formData.startTime ? parseInputDateTime(formData.startTime).toISOString() : "",
        endTime: formData.endTime ? parseInputDateTime(formData.endTime).toISOString() : undefined,
      }

      const response = await fetch(`/api/workspaces/${workspaceSlug}/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(meetingData),
      })

      if (response.ok) {
        const meeting = await response.json()
        onMeetingCreated(meeting)
        setFormData({ title: "", description: "", startTime: "", endTime: "" })
        setOpen(false)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create meeting")
      }
    } catch (error) {
      console.error("Failed to create meeting:", error)
      alert("Failed to create meeting")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Video className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Schedule Meeting</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Schedule a video meeting for your team.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Meeting Title
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter meeting title..."
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description (Optional)
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Meeting agenda or description..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium mb-2">
                Start Time
              </label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
                className="text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium mb-2">
                End Time (Optional)
              </label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}