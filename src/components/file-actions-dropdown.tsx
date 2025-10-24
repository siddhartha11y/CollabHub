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
import { FileRenameModal } from "@/components/file-rename-modal"
import { MoreVertical, Trash2, Download, Eye, Edit } from "lucide-react"

interface FileActionsDropdownProps {
  file: {
    id: string
    name: string
    url: string
    size: number
    mimeType: string
    uploadedBy?: {
      id: string
      name: string
      email: string
    }
  }
  workspaceSlug: string
  userRole: "ADMIN" | "MEMBER" | "VIEWER"
  currentUserId: string
  onFileDeleted: (fileId: string) => void
  onFileRenamed: (updatedFile: any) => void
  onPreview: () => void
}

export function FileActionsDropdown({ 
  file, 
  workspaceSlug, 
  userRole, 
  currentUserId,
  onFileDeleted,
  onFileRenamed,
  onPreview 
}: FileActionsDropdownProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDownload = () => {
    if (file.url.startsWith('data:')) {
      // Handle base64 files
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      window.open(file.url, '_blank')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/files/${file.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onFileDeleted(file.id)
        setDeleteDialogOpen(false)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete file")
      }
    } catch (error) {
      console.error("Failed to delete file:", error)
      alert("Failed to delete file")
    } finally {
      setDeleting(false)
    }
  }

  // Permission logic:
  // - ADMIN can delete any file
  // - MEMBER can only delete their own files
  // - VIEWER cannot delete any files
  const canDelete = userRole === "ADMIN" || 
    (userRole === "MEMBER" && file.uploadedBy?.id === currentUserId)
  
  // Only file owner can rename
  const canRename = file.uploadedBy?.id === currentUserId

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
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
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{file.name}"? This action cannot be undone.
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

      {/* Rename Modal */}
      <FileRenameModal
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        file={file}
        workspaceSlug={workspaceSlug}
        onFileRenamed={onFileRenamed}
      />
    </>
  )
}