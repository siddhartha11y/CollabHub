"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  ArrowLeft, 
  FileText,
  Save,
  User,
  Calendar,
  MoreVertical,
  Trash2
} from "lucide-react"
import Link from "next/link"

export default function DocumentPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [document, setDocument] = useState<any>(null)
  const [workspace, setWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: ""
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [userRole, setUserRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER")
  const [canEdit, setCanEdit] = useState(false)
  const [canRename, setCanRename] = useState(false)

  useEffect(() => {
    if (!session || !params.slug || !params.documentId) return

    const fetchData = async () => {
      try {
        // Fetch workspace and document in parallel
        const [workspaceRes, documentRes] = await Promise.all([
          fetch(`/api/workspaces/${params.slug}`),
          fetch(`/api/workspaces/${params.slug}/documents/${params.documentId}`)
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
          }
        }

        if (documentRes.ok) {
          const documentData = await documentRes.json()
          setDocument(documentData)
          setFormData({
            title: documentData.title,
            content: documentData.content
          })
          
          // Set permissions based on user role and document ownership
          const currentUserMember = workspace?.members?.find(
            (member: any) => member.user.email === session?.user?.email
          )
          const currentUserRole = currentUserMember?.role
          const isDocumentAuthor = documentData.author.email === session?.user?.email
          
          // Permission logic:
          // - ADMIN can edit any document content, but only author can rename
          // - MEMBER can only edit their own documents
          // - VIEWER cannot edit any documents
          const canEditDocument = currentUserRole === "ADMIN" || 
            (currentUserRole === "MEMBER" && isDocumentAuthor)
          const canRenameDocument = isDocumentAuthor
          
          setCanEdit(canEditDocument)
          setCanRename(canRenameDocument)
        } else if (documentRes.status === 404) {
          router.push(`/workspaces/${params.slug}/documents`)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session, params.slug, params.documentId, router])

  // Auto-save functionality
  const saveDocument = useCallback(async () => {
    if (!hasChanges || saving) return

    setSaving(true)
    try {
      const response = await fetch(`/api/workspaces/${params.slug}/documents/${params.documentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedDocument = await response.json()
        setDocument(updatedDocument)
        setHasChanges(false)
      }
    } catch (error) {
      console.error("Failed to save document:", error)
    } finally {
      setSaving(false)
    }
  }, [formData, hasChanges, saving, params.slug, params.documentId])

  // Auto-save every 3 seconds when there are changes
  useEffect(() => {
    if (!hasChanges) return

    const timer = setTimeout(() => {
      saveDocument()
    }, 3000)

    return () => clearTimeout(timer)
  }, [formData, hasChanges, saveDocument])

  const handleInputChange = (field: string, value: string) => {
    if (!canEdit && field === 'content') return // Prevent content editing if no permission
    if (!canRename && field === 'title') return // Prevent title editing if no permission
    
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/workspaces/${params.slug}/documents/${params.documentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push(`/workspaces/${params.slug}/documents`)
      }
    } catch (error) {
      console.error("Failed to delete document:", error)
      alert("Failed to delete document")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Document not found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The document you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href={`/workspaces/${params.slug}/documents`}>
            <Button>Back to Documents</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href={`/workspaces/${params.slug}/documents`} className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Documents</span>
            </Link>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>{canEdit ? 'Edit Document' : 'View Document'}</span>
                {!canEdit && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                    Read Only
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {workspace?.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              {canEdit && saving && <span>Saving...</span>}
              {canEdit && hasChanges && !saving && <span>Unsaved changes</span>}
              {canEdit && !hasChanges && !saving && <span>All changes saved</span>}
              {!canEdit && <span>Read-only mode</span>}
            </div>
            {canEdit && (
              <Button onClick={saveDocument} disabled={!hasChanges || saving} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
            <Button onClick={handleDelete} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Document Meta */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img 
                  src={document.author.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(document.author.name || "User") + "&background=3b82f6&color=fff"} 
                  alt={document.author.name} 
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {document.author.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Created {new Date(document.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Last updated {new Date(document.updatedAt).toLocaleDateString()}
              </div>
            </div>
            
            {/* Title Editor */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Document Title
                {!canRename && (
                  <span className="text-xs text-gray-500 ml-2">(Only author can rename)</span>
                )}
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="text-lg font-semibold"
                placeholder="Enter document title..."
                readOnly={!canRename}
                disabled={!canRename}
              />
            </div>
          </div>

          {/* Content Editor */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Content
              {!canEdit && (
                <span className="text-xs text-gray-500 ml-2">
                  ({userRole === "MEMBER" ? "Only author can edit" : "Read-only access"})
                </span>
              )}
            </label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              placeholder={canEdit ? "Start writing your document..." : "Document content (read-only)"}
              rows={20}
              className="resize-none font-mono text-sm"
              readOnly={!canEdit}
              disabled={!canEdit}
            />
            <div className="mt-2 text-xs text-gray-500">
              {formData.content.length} characters • Supports Markdown formatting
              {!canEdit && " • Read-only mode"}
            </div>
          </div>

          {/* Preview Section */}
          {formData.content && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 mt-6">
              <h3 className="text-sm font-medium mb-4">Preview</h3>
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                  {formData.content}
                </pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}