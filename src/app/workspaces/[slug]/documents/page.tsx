"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/mobile-header"
import { 
  Plus, 
  FileText,
  User,
  Calendar,
  MoreVertical,
  Search,
  History
} from "lucide-react"
import { CreateDocumentModal } from "@/components/create-document-modal"
import { DocumentActivityLog } from "@/components/document-activity-log"
import { DocumentActionsDropdown } from "@/components/document-actions-dropdown"
import { Input } from "@/components/ui/input"

export default function DocumentsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [documents, setDocuments] = useState<any[]>([])
  const [workspace, setWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [userRole, setUserRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER")
  const [currentUserId, setCurrentUserId] = useState<string>("")

  useEffect(() => {
    if (!session || !params.slug) return

    const fetchData = async () => {
      try {
        // Fetch workspace and documents in parallel
        const [workspaceRes, documentsRes] = await Promise.all([
          fetch(`/api/workspaces/${params.slug}`),
          fetch(`/api/workspaces/${params.slug}/documents`)
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

        if (documentsRes.ok) {
          const documentsData = await documentsRes.json()
          setDocuments(documentsData)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session, params.slug])

  const handleDocumentCreated = (newDocument: any) => {
    setDocuments(prev => [newDocument, ...prev])
  }

  const handleDocumentDeleted = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
  }

  const handleDocumentRenamed = (updatedDocument: any) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === updatedDocument.id ? updatedDocument : doc
    ))
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.author.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <MobileHeader
        workspaceSlug={params.slug as string}
        workspaceName={workspace?.name}
        title="Documents"
        subtitle={`${workspace?.name} • ${documents.length} documents`}
        backHref={`/workspaces/${params.slug}`}
        actions={[
          <CreateDocumentModal 
            key="create-document"
            workspaceSlug={params.slug as string}
            onDocumentCreated={handleDocumentCreated}
          >
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Doc
            </Button>
          </CreateDocumentModal>
        ]}
        dropdownActions={[
          {
            label: "Activity Log",
            icon: <History className="h-4 w-4" />,
            onClick: () => {
              document.querySelector('[data-document-activity]')?.click()
            }
          }
        ]}
      />

      {/* Hidden trigger buttons for mobile dropdown actions */}
      <div className="hidden">
        <DocumentActivityLog workspaceSlug={params.slug as string}>
          <button data-document-activity>Activity Log</button>
        </DocumentActivityLog>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 py-4 lg:py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1 group-hover:text-blue-600 transition-colors">
                      <Link href={`/workspaces/${params.slug}/documents/${document.id}`}>
                        {document.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <img 
                        src={document.author.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(document.author.name || "User") + "&background=3b82f6&color=fff"} 
                        alt={document.author.name} 
                        className="h-4 w-4 rounded-full"
                      />
                      <span>by {document.author.name}</span>
                    </CardDescription>
                  </div>
                  <DocumentActionsDropdown
                    document={document}
                    workspaceSlug={params.slug as string}
                    userRole={userRole}
                    currentUserId={currentUserId}
                    onDocumentDeleted={handleDocumentDeleted}
                    onDocumentRenamed={handleDocumentRenamed}
                  />
                </div>
              </CardHeader>
              
              <CardContent>
                {document.content && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                    {document.content.substring(0, 150)}
                    {document.content.length > 150 && "..."}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Updated {new Date(document.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="h-3 w-3" />
                    <span>{document.content.length} chars</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {documents.length === 0 && (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No documents yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Create your first document to start building your team's knowledge base.
            </p>
            <CreateDocumentModal 
              workspaceSlug={params.slug as string}
              onDocumentCreated={handleDocumentCreated}
            >
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Document
              </Button>
            </CreateDocumentModal>
          </div>
        )}

        {/* No Search Results */}
        {documents.length > 0 && filteredDocuments.length === 0 && (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No documents found
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