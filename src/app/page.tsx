import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Users, MessageSquare, FileText, Video, CheckSquare } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CollabHub</h1>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Link href="/auth/signin">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link href="/auth/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Team Collaboration
          <span className="text-blue-600"> Reimagined</span>
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Bring your team together with workspaces, real-time chat, task management, 
          document collaboration, and video meetings - all in one platform.
        </p>
        
        <div className="flex justify-center space-x-4 mb-16">
          <Link href="/auth/register">
            <Button size="lg" className="px-8 py-3">
              Start Collaborating
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="px-8 py-3">
            Watch Demo
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <CheckSquare className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Task Management</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Organize work with Kanban boards, assign tasks, and track progress.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <MessageSquare className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real-time Chat</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Instant messaging with your team members across all workspaces.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Document Collaboration</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create and edit documents together with real-time collaboration.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <Video className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Video Meetings</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Host video calls with screen sharing and recording capabilities.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
