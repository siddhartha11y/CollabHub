"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Plus, 
  ArrowLeft, 
  Video,
  Calendar,
  Clock,
  ExternalLink,
  User,
  Trash2,
  MoreVertical
} from "lucide-react"
import Link from "next/link"
import { CreateMeetingModal } from "@/components/create-meeting-modal"
import { formatDisplayTime, formatDisplayDateTime, isUpcoming, isPast } from "@/lib/date-utils"

export default function MeetingsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [meetings, setMeetings] = useState<any[]>([])
  const [workspace, setWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [meetingToDelete, setMeetingToDelete] = useState<any>(null)

  useEffect(() => {
    if (!session || !params.slug) return

    const fetchData = async () => {
      try {
        // Fetch workspace and meetings in parallel
        const [workspaceRes, meetingsRes] = await Promise.all([
          fetch(`/api/workspaces/${params.slug}`),
          fetch(`/api/workspaces/${params.slug}/meetings`)
        ])

        if (workspaceRes.ok) {
          const workspaceData = await workspaceRes.json()
          setWorkspace(workspaceData)
        }

        if (meetingsRes.ok) {
          const meetingsData = await meetingsRes.json()
          setMeetings(meetingsData)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session, params.slug])

  const handleMeetingCreated = (newMeeting: any) => {
    setMeetings(prev => [newMeeting, ...prev].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    ))
  }

  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${params.slug}/meetings/${meetingId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMeetings(prev => prev.filter(meeting => meeting.id !== meetingId))
        setDeleteDialogOpen(false)
        setMeetingToDelete(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete meeting')
      }
    } catch (error) {
      console.error('Failed to delete meeting:', error)
      alert('Failed to delete meeting')
    }
  }

  const canDeleteMeeting = (meeting: any) => {
    return meeting.creator && meeting.creator.email === session?.user?.email
  }



  const upcomingMeetings = meetings.filter(meeting => isUpcoming(meeting.startTime))
  const pastMeetings = meetings.filter(meeting => isPast(meeting.startTime))

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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href={`/workspaces/${params.slug}`} className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Workspace</span>
            </Link>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Video className="h-5 w-5" />
                <span>Meetings</span>
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {workspace?.name} • {meetings.length} meetings
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <CreateMeetingModal 
              workspaceSlug={params.slug as string}
              onMeetingCreated={handleMeetingCreated}
            >
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </CreateMeetingModal>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Upcoming Meetings */}
        {upcomingMeetings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upcoming Meetings
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingMeetings.map((meeting) => (
                <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">
                          {meeting.title}
                        </CardTitle>
                        <Badge variant="secondary" className="mb-2">
                          Upcoming
                        </Badge>
                      </div>
                      {canDeleteMeeting(meeting) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setMeetingToDelete(meeting)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Meeting
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {meeting.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {meeting.description}
                      </p>
                    )}
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(meeting.startTime).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatDisplayTime(meeting.startTime)} 
                        {meeting.endTime && ` - ${formatDisplayTime(meeting.endTime)}`}
                      </div>
                      {meeting.creator && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <User className="h-4 w-4 mr-2" />
                          Created by {meeting.creator.name || meeting.creator.email}
                        </div>
                      )}
                    </div>
                    
                    {meeting.meetingUrl && (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => window.open(meeting.meetingUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Join Meeting
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Past Meetings */}
        {pastMeetings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Past Meetings
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastMeetings.slice(0, 6).map((meeting) => (
                <Card key={meeting.id} className="opacity-75">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">
                          {meeting.title}
                        </CardTitle>
                        <Badge variant="outline" className="mb-2">
                          Completed
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {meeting.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {meeting.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(meeting.startTime).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatDisplayTime(meeting.startTime)}
                        {meeting.endTime && ` - ${formatDisplayTime(meeting.endTime)}`}
                      </div>
                      {meeting.creator && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <User className="h-4 w-4 mr-2" />
                          Created by {meeting.creator.name || meeting.creator.email}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {meetings.length === 0 && (
          <div className="text-center py-16">
            <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No meetings scheduled
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Schedule your first team meeting to get started.
            </p>
            <CreateMeetingModal 
              workspaceSlug={params.slug as string}
              onMeetingCreated={handleMeetingCreated}
            >
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule First Meeting
              </Button>
            </CreateMeetingModal>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{meetingToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => meetingToDelete && handleDeleteMeeting(meetingToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}