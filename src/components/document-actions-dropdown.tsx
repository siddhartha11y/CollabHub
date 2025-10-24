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
import { MoreVertical, Trash2, Edit, Eye } from "lucide-react"

interface DocumentActionsDropdownProps {
  document: {
    id: string
    title: string
    author: {
      id: string
      name: string
      email: string
    }
  }
  workspaceSlug: string
  userRole: "ADMIN" | "MEMBER" | "VIEWER"
  currentUserId: string
  onDocumentDeleted: (documentId: string) => void
  onDocumentRenamed: (updatedDocument: any) => void
}

export function DocumentActionsDropdown({ 
  document, 
  workspaceSlug, 
  userRole, 
  currentUserId,
  onDocumentDeleted,
  onDocumentRenamed
}: DocumentActionsDropdownProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState(document.title)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/documents/${document.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onDocumentDeleted(document.id)
        setDeleteDialogOpen(false)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete document")
      }
    } catch (error) {
      console.error("Failed to delete document:", error)
      alert("Failed to delete document")
    } finally {
      setDeleting(false)
    }
  }

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || newTitle.trim() === document.title) return

    setRenaming(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/documents/${document.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle.trim() }),
      })

      if (response.ok) {
        const updatedDocument = await response.json()
        onDocumentRenamed(updatedDocument)
        setRenameDialogOpen(false)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to rename document")
      }
    } catch (error) {
      console.error("Failed to rename document:", error)
      alert("Failed to rename document")
    } finally {
      setRenaming(false)
    }
  }

  // Permission logic:
  // - ADMIN can delete any document
  // - MEMBER can only delete their own documents
  // - VIEWER cannot delete any documents
  const canDelete = userRole === "ADMIN" || 
    (userRole === "MEMBER" && document.author.id === currentUserId)
  
  // Only document author can rename
  const canRename = document.author.id === currentUserId

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => window.location.href = `/workspaces/${workspaceSlug}/documents/${document.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View/Edit
          </DropdownMenuItem>
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
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{document.title}"? This action cannot be undone.
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
              {deleting ? "Deleting..." : "Delete"}
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
              <span>Rename Document</span>
            </DialogTitle>
            <DialogDescription>
              Enter a new title for the document
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleRename} className="space-y-4">
            <div>
              <label htmlFor="documentTitle" className="block text-sm font-medium mb-2">
                Document Title
              </label>
              <Input
                id="documentTitle"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter new document title..."
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
                disabled={renaming || !newTitle.trim() || newTitle.trim() === document.title}
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