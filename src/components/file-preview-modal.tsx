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
import { Download, Eye, FileText, Image as ImageIcon } from "lucide-react"

interface FilePreviewModalProps {
  children: React.ReactNode
  file: {
    id: string
    name: string
    url: string
    size: number
    mimeType: string
  }
}

export function FilePreviewModal({ children, file }: FilePreviewModalProps) {
  const [open, setOpen] = useState(false)

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

  const renderPreview = () => {
    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="flex justify-center">
          <img 
            src={file.url} 
            alt={file.name}
            className="max-w-full max-h-96 object-contain rounded-lg"
          />
        </div>
      )
    } else if (file.mimeType === 'application/pdf') {
      return (
        <div className="text-center py-8">
          <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            PDF preview not available. Click download to view the file.
          </p>
        </div>
      )
    } else if (file.mimeType.startsWith('text/')) {
      return (
        <div className="text-center py-8">
          <FileText className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            Text file preview not available. Click download to view the file.
          </p>
        </div>
      )
    } else {
      return (
        <div className="text-center py-8">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            Preview not available for this file type.
          </p>
        </div>
      )
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>{file.name}</span>
          </DialogTitle>
          <DialogDescription>
            {file.mimeType} • {formatFileSize(file.size)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {renderPreview()}
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}