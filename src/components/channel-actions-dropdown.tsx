"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { MoreVertical, Trash2, Edit } from "lucide-react"
import { ChannelPermissions } from "@/lib/channel-permissions"

interface ChannelActionsDropdownProps {
  channel: {
    id: string
    name: string
    description?: string
    createdBy?: {
      id: string
      name: string
      email: string
    }
  }
  workspaceSlug: string
  userRole: "ADMIN" | "MEMBER" | "VIEWER"
  currentUserId: string
  onChannelDeleted: (channelId: string) => void
  onChannelRenamed: (updatedChannel: any) => void
}

export function ChannelActionsDropdown({ 
  channel, 
  workspaceSlug, 
  userRole, 
  currentUserId,
  onChannelDeleted,
  onChannelRenamed
}: ChannelActionsDropdownProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(channel.name)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/channels/${channel.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onChannelDeleted(channel.id)
        setDeleteDialogOpen(false)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete channel")
      }
    } catch (error) {
      console.error("Failed to delete channel:", error)
      alert("Failed to delete channel")
    } finally {
      setDeleting(false)
    }
  }

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || newName.trim() === channel.name) return

    setRenaming(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/channels/${channel.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName.trim() }),
      })

      if (response.ok) {
        const updatedChannel = await response.json()
        onChannelRenamed(updatedChannel)
        setRenameDialogOpen(false)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to rename channel")
      }
    } catch (error) {
      console.error("Failed to rename channel:", error)
      alert("Failed to rename channel")
    } finally {
      setRenaming(false)
    }
  }

  // Get proper permissions using channel ownership tracking
  const permissions = ChannelPermissions.canUserManageChannel(
    channel.name,
    channel.id,
    workspaceSlug,
    currentUserId,
    userRole
  )
  
  const canRename = permissions.canRename
  const canDelete = permissions.canDelete

  // Don't show dropdown if no actions available
  if (!canRename && !canDelete) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canRename && (
            <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem 
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Channel</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "#{channel.name}"? This will permanently delete all messages in this channel. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Channel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>Rename Channel</span>
            </DialogTitle>
            <DialogDescription>
              Enter a new name for the channel
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleRename} className="space-y-4">
            <div>
              <label htmlFor="channelName" className="block text-sm font-medium mb-2">
                Channel Name
              </label>
              <Input
                id="channelName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new channel name..."
                required
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameDialogOpen(false)}
                disabled={renaming}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={renaming || !newName.trim() || newName.trim() === channel.name}
              >
                {renaming ? "Renaming..." : "Rename"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}