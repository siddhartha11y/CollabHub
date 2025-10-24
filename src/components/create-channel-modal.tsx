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
import { Hash } from "lucide-react"

interface CreateChannelModalProps {
  children: React.ReactNode
  workspaceSlug: string
  onChannelCreated: (channel: any) => void
}

export function CreateChannelModal({ 
  children, 
  workspaceSlug, 
  onChannelCreated 
}: CreateChannelModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setLoading(true)

    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim()
        }),
      })

      if (response.ok) {
        const channel = await response.json()
        onChannelCreated(channel)
        setFormData({ name: "", description: "" })
        setOpen(false)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create channel")
      }
    } catch (error) {
      console.error("Failed to create channel:", error)
      alert("Failed to create channel")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Hash className="h-5 w-5" />
            <span>Create Channel</span>
          </DialogTitle>
          <DialogDescription>
            Create a new chat channel for your team.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="channelName" className="block text-sm font-medium mb-2">
              Channel Name
            </label>
            <Input
              id="channelName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. marketing, development"
              required
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Channel names are automatically converted to lowercase
            </p>
          </div>
          
          <div>
            <label htmlFor="channelDescription" className="block text-sm font-medium mb-2">
              Description (Optional)
            </label>
            <Textarea
              id="channelDescription"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What's this channel about?"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? "Creating..." : "Create Channel"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}