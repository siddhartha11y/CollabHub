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
import { createClientComponentClient } from "@/lib/supabase"

interface LargeFileUploadModalProps {
  children: React.ReactNode
  workspaceSlug: string
  taskId?: string
  onFileUploaded: (file: any) => void
}

export function LargeFileUploadModal({ 
  children, 
  workspaceSlug, 
  taskId,
  onFileUploaded 
}: LargeFileUploadModalProps) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()

  const uploadLargeFile = async (file: File): Promise<void> => {
    setCurrentFile(file.name)
    
    // Generate unique file path
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${workspaceSlug}/${fileName}`

    try {
      // Upload to Supabase Storage with progress tracking
      const { data, error } = await supabase.storage
        .from('files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100
            setUploadProgress(Math.round(percent))
          }
        })

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(filePath)

      // Save file metadata to database
      const response = await fetch(`/api/workspaces/${workspaceSlug}/files/large-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: file.name,
          url: urlData.publicUrl,
          size: file.size,
          mimeType: file.type,
          storagePath: filePath,
          taskId: taskId || null,
        }),
      })

      if (!response.ok) {
        // If database save fails, clean up the uploaded file
        await supabase.storage.from('files').remove([filePath])
        throw new Error('Failed to save file metadata')
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
      
      // Validate file size (max 5GB for Supabase Storage)
      if (file.size > 5 * 1024 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 5GB.`)
        continue
      }

      try {
        setUploadProgress(0)
        await uploadLargeFile(file)
      } catch (error) {
        console.error("Failed to upload file:", error)
        alert(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    setUploading(false)
    setUploadProgress(0)
    setCurrentFile("")
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CloudUpload className="h-5 w-5" />
            <span>Upload Large Files</span>
          </DialogTitle>
          <DialogDescription>
            Upload files up to 5GB to {taskId ? "this task" : "the workspace"} using Supabase Storage.
            Perfect for videos, large documents, and datasets.
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
            />
            
            <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            
            {uploading ? (
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Uploading {currentFile}... {uploadProgress}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all duration-300 flex items-center justify-center" 
                    style={{ width: `${uploadProgress}%` }}
                  >
                    {uploadProgress > 10 && (
                      <span className="text-xs text-white font-medium">
                        {uploadProgress}%
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Using Supabase Storage for reliable large file uploads
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Drop large files here or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports files up to 5GB - videos, datasets, large documents
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="bg-green-50 border-green-200 hover:bg-green-100"
                >
                  <CloudUpload className="h-4 w-4 mr-2" />
                  Choose Large Files
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