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
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('workspaceSlug', workspaceSlug)
    if (taskId) {
      formData.append('taskId', taskId)
    }

    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/files/simple-upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = 'Upload failed'
        try {
          const error = await response.json()
          errorMessage = error.error || 'Upload failed'
        } catch {
          if (response.status === 413) {
            errorMessage = 'File too large - maximum size is 5MB'
          } else if (response.status === 408) {
            errorMessage = 'Upload timeout - please try a smaller file'
          } else {
            errorMessage = `Upload failed (${response.status})`
          }
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      setUploadProgress(100)
      onFileUploaded(result)

    } catch (error) {
      console.error('Upload failed:', error)
      throw error
    }
  }

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return

    setUploading(true)
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Validate file size (max 5MB for reliable storage)
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 5MB. Please compress your file or use a file hosting service for larger files.`)
        continue
      }

      try {
        setUploadProgress(0)
        await uploadFile(file)
      } catch (error) {
        console.error("Failed to upload file:", error)
        alert(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    setUploading(false)
    setUploadProgress(0)
    setOpen(false)
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
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Files</span>
          </DialogTitle>
          <DialogDescription>
            Upload files to {taskId ? "this task" : "the workspace"}. 
            Maximum file size: 5MB per file.
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
                  Uploading files... {Math.round(uploadProgress)}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 flex items-center justify-center" 
                    style={{ width: `${uploadProgress}%` }}
                  >
                    {uploadProgress > 10 && (
                      <span className="text-xs text-white font-medium">
                        {Math.round(uploadProgress)}%
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Large files are uploaded in chunks for reliability
                </p>
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