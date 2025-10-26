"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Plus, 
  ArrowLeft, 
  File,
  Download,
  Calendar,
  MoreVertical,
  Search,
  FileText,
  Image,
  FileIcon,
  History
} from "lucide-react"
import Link from "next/link"
import { FileUploadModal } from "@/components/file-upload-modal"
import { LargeFileUploadModal } from "@/components/large-file-upload-modal"
import { FilePreviewModal } from "@/components/file-preview-modal"
import { FileActionsDropdown } from "@/components/file-actions-dropdown"
import { FileActivityLog } from "@/components/file-activity-log"
import { Input } from "@/components/ui/input"

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return Image
  if (mimeType === "application/pdf") return FileText
  return FileIcon
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export default function FilesPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [files, setFiles] = useState<any[]>([])
  const [workspace, setWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [userRole, setUserRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER")
  const [currentUserId, setCurrentUserId] = useState<string>("")

  useEffect(() => {
    if (!session || !params.slug) return

    const fetchData = async () => {
      try {
        // Fetch workspace and files in parallel
        const [workspaceRes, filesRes] = await Promise.all([
          fetch(`/api/workspaces/${params.slug}`),
          fetch(`/api/workspaces/${params.slug}/files`)
        ])

        if (workspaceRes.ok) {
          const workspaceData = await workspaceRes.json()
          setWorkspace(workspaceData)
          
          // Get current user's role in workspace
          const currentUserMember = workspaceData.members?.find(
            (member: any) => member.user.email === session?.user?.email
          )
          if (currentUserMember) {
            setUserRole(currentUserMember.role)
            setCurrentUserId(currentUserMember.user.id)
          }
        }

        if (filesRes.ok) {
          const filesData = await filesRes.json()
          setFiles(filesData)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session, params.slug])

  const handleFileUploaded = (newFile: any) => {
    setFiles(prev => [newFile, ...prev])
  }

  const handleFileDeleted = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const handleFileRenamed = (updatedFile: any) => {
    setFiles(prev => prev.map(file => 
      file.id === updatedFile.id ? updatedFile : file
    ))
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.task?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          {/* Mobile Header */}
          <div className="flex flex-col space-y-4 md:hidden">
            <div className="flex items-center justify-between">
              <Link href={`/workspaces/${params.slug}`} className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm">Back</span>
              </Link>
              <ThemeToggle />
            </div>
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <File className="h-5 w-5" />
                <span>Files</span>
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {workspace?.name} • {files.length} files
              </p>
            </div>
            
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-2">
                <FileUploadModal 
                  workspaceSlug={params.slug as string}
                  onFileUploaded={handleFileUploaded}
                >
                  <Button variant="outline" size="sm" className="flex-1">
                    <Plus className="h-4 w-4 mr-1" />
                    Small (5MB)
                  </Button>
                </FileUploadModal>
                
                <LargeFileUploadModal 
                  workspaceSlug={params.slug as string}
                  onFileUploaded={handleFileUploaded}
                >
                  <Button size="sm" className="flex-1">
                    <Plus className="h-4 w-4 mr-1" />
                    Large (50MB)
                  </Button>
                </LargeFileUploadModal>
              </div>
              
              <FileActivityLog workspaceSlug={params.slug as string}>
                <Button variant="outline" size="sm" className="w-full">
                  <History className="h-4 w-4 mr-2" />
                  Activity Log
                </Button>
              </FileActivityLog>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href={`/workspaces/${params.slug}`} className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Workspace</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <File className="h-5 w-5" />
                  <span>Files</span>
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {workspace?.name} • {files.length} files
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <FileActivityLog workspaceSlug={params.slug as string}>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  Activity Log
                </Button>
              </FileActivityLog>
              <div className="flex space-x-2">
                <FileUploadModal 
                  workspaceSlug={params.slug as string}
                  onFileUploaded={handleFileUploaded}
                >
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Small Files (5MB)
                  </Button>
                </FileUploadModal>
                
                <LargeFileUploadModal 
                  workspaceSlug={params.slug as string}
                  onFileUploaded={handleFileUploaded}
                >
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Large Files (50MB)
                  </Button>
                </LargeFileUploadModal>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* Search */}
        <div className="mb-4 md:mb-6">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Files Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFiles.map((file) => {
            const FileIconComponent = getFileIcon(file.mimeType)
            return (
              <Card key={file.id} className="hover:shadow-lg transition-shadow group">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start justify-between mb-3">
                    <FilePreviewModal file={file}>
                    <div 
                      data-file-id={file.id}
                      className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-1 md:p-2 -m-1 md:-m-2"
                    >
                      <FileIconComponent className="h-6 w-6 md:h-8 md:w-8 text-blue-600 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-xs md:text-sm truncate">
                          {file.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center space-x-1 mt-1 hidden md:flex">
                          {file.uploadedBy ? (
                            <>
                              <img 
                                src={file.uploadedBy.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(file.uploadedBy.name || "User") + "&background=3b82f6&color=fff"} 
                                alt={file.uploadedBy.name} 
                                className="h-3 w-3 rounded-full"
                              />
                              <span>by {file.uploadedBy.name}</span>
                            </>
                          ) : (
                            <span>by Unknown User</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </FilePreviewModal>
                    <FileActionsDropdown
                      file={file}
                      workspaceSlug={params.slug as string}
                      userRole={userRole}
                      currentUserId={currentUserId}
                      onFileDeleted={handleFileDeleted}
                      onFileRenamed={handleFileRenamed}
                      onPreview={() => {
                        // Trigger preview by clicking the file card
                        const previewButton = document.querySelector(`[data-file-id="${file.id}"]`) as HTMLElement
                        previewButton?.click()
                      }}
                    />
                  </div>
                  
                  {file.task && (
                    <div className="mb-2 md:mb-3">
                      <Badge variant="secondary" className="text-xs">
                        Task: {file.task.title}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">{new Date(file.createdAt).toLocaleDateString()}</span>
                      <span className="sm:hidden">{new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    
                    <FilePreviewModal file={file}>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-xs px-2"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Preview</span>
                        <span className="sm:hidden">View</span>
                      </Button>
                    </FilePreviewModal>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {files.length === 0 && (
          <div className="text-center py-16">
            <File className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No files yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Upload your first file to start sharing resources with your team.
            </p>
            <FileUploadModal 
              workspaceSlug={params.slug as string}
              onFileUploaded={handleFileUploaded}
            >
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload First File
              </Button>
            </FileUploadModal>
          </div>
        )}

        {/* No Search Results */}
        {files.length > 0 && filteredFiles.length === 0 && (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No files found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Try adjusting your search query.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}