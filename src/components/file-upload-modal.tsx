"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, File, X, CloudUpload, CheckCircle, AlertCircle } from "lucide-react"
import { useUploadThing } from "@/lib/uploadthing"

interface FileUploadModalProps {
  children: React.ReactNode
  workspaceSlug: string
  taskId?: string
  onFileUploaded: (file: any) => void
}

export function FileUploadModal({ 
  children, 
  workspaceSlug, 
  taskId,
  onFileUploaded 
}: FileUploadModalProps) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'uploading' | 'success' | 'error' }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use UploadThing for reliable file uploads
  const { startUpload, isUploading } = useUploadThing(
    taskId ? "taskFileUploader" : "workspaceFileUploader",
    {
      onClientUploadComplete: (res) => {
        console.log("Files uploaded successfully:", res)
        // Save file records to database
        res?.forEach(async (file) => {
          await saveFileRecord(file)
        })
        setUploading(false)
        setOpen(false)
      },
      onUploadError: (error: Error) => {
        console.error("Upload error:", error)
        alert(`Upload failed: ${error.message}`)
        setUploading(false)
      },
      onUploadProgress: (progress) => {
        console.log("Upload progress:", progress)
        // Update progress for UI
      },
    }
  )

  const saveFileRecord = async (uploadedFile: any) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: uploadedFile.name,
          url: uploadedFile.url,
          size: uploadedFile.size,
          mimeType: uploadedFile.type || "application/octet-stream",
          taskId: taskId || undefined
        }),
      })

      if (response.ok) {
        const savedFile = await response.json()
        onFileUploaded(savedFile)
      } else {
        const error = await response.json()
        console.error(`Failed to save file record: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to save file record:", error)
    }
  }

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return

    // Validate file sizes
    const maxSize = taskId ? 16 * 1024 * 1024 : 32 * 1024 * 1024 // 16MB for tasks, 32MB for workspace
    const oversizedFiles = Array.from(files).filter(file => file.size > maxSize)
    
    if (oversizedFiles.length > 0) {
      const maxSizeMB = maxSize / (1024 * 1024)
      alert(`The following files are too large (max ${maxSizeMB}MB): ${oversizedFiles.map(f => f.name).join(', ')}`)
      return
    }

    setUploading(true)
    
    try {
      // Use UploadThing to upload files
      await startUpload(Array.from(files))
    } catch (error) {
      console.error("Upload failed:", error)
      setUploading(false)
    }
  }



  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Files</span>
          </DialogTitle>
          <DialogDescription>
            Upload files to {taskId ? "this task" : "the workspace"}. 
            Maximum file size: {taskId ? "16MB" : "32MB"} per file.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                : "border-gray-300 dark:border-gray-600"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md,.zip,.rar,.csv,.xlsx,.pptx"
            />
            
            <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            
            {uploading ? (
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Uploading files...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse w-1/2"></div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports images, PDFs, documents, and text files
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  <File className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}