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
import { Input } from "@/components/ui/input"
import { Edit } from "lucide-react"

interface FileRenameModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: {
    id: string
    name: string
  }
  workspaceSlug: string
  onFileRenamed: (updatedFile: any) => void
}

export function FileRenameModal({ 
  open, 
  onOpenChange, 
  file, 
  workspaceSlug, 
  onFileRenamed 
}: FileRenameModalProps) {
  const [newName, setNewName] = useState(file.name)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || newName.trim() === file.name) return

    setLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/files/${file.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName.trim() }),
      })

      if (response.ok) {
        const updatedFile = await response.json()
        onFileRenamed(updatedFile)
        onOpenChange(false)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to rename file")
      }
    } catch (error) {
      console.error("Failed to rename file:", error)
      alert("Failed to rename file")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Rename File</span>
          </DialogTitle>
          <DialogDescription>
            Enter a new name for the file
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fileName" className="block text-sm font-medium mb-2">
              File Name
            </label>
            <Input
              id="fileName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new file name..."
              required
              autoFocus
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !newName.trim() || newName.trim() === file.name}
            >
              {loading ? "Renaming..." : "Rename"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}