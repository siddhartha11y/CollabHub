"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Briefcase, 
  Building, 
  ArrowLeft,
  MessageCircle,
  Clock,
  Calendar
} from "lucide-react"
import Link from "next/link"

export default function UserProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const username = params.username as string
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin")
      return
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${username}`)
        if (response.ok) {
          const data = await response.json()
          setUser(data)
        } else {
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Failed to fetch user:", error)
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [session, username, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-gray-700">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  @{user.username}
                </h1>
                <p className="text-sm text-gray-500">User Profile</p>
              </div>
            </div>
            <Button 
              onClick={async () => {
                try {
                  // Create Stream channel
                  const res = await fetch("/api/stream/create-channel", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                      currentUserEmail: session?.user?.email,
                      targetUserId: user.id 
                    }),
                  })
                  if (res.ok) {
                    router.push("/messages")
                  } else {
                    alert("Failed to create conversation")
                  }
                } catch (error) {
                  console.error("Failed to create conversation:", error)
                  alert("Failed to create conversation")
                }
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 relative">
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            
            <div className="px-6 pb-6 -mt-16 relative">
              <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative">
                  <img
                    src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff&size=160`}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-2xl ring-4 ring-blue-100 dark:ring-gray-700"
                  />
                </div>
                
                <div className="flex-1 text-center sm:text-left mt-4">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start">
                    {user.name}
                    <span className="ml-2 text-blue-500">✓</span>
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">@{user.username}</p>
                  
                  {user.title && (
                    <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 flex items-center justify-center sm:justify-start">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {user.title}
                      {user.company && ` at ${user.company}`}
                    </p>
                  )}
                  
                  {user.bio && (
                    <p className="text-gray-600 dark:text-gray-300 mt-4 max-w-2xl leading-relaxed">
                      {user.bio}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                    {user.location && (
                      <Badge variant="outline" className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {user.location}
                      </Badge>
                    )}
                    {user.website && (
                      <Badge variant="outline" className="flex items-center">
                        <Globe className="h-3 w-3 mr-1" />
                        Website
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          {(user.phone || user.location || user.website) && (
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">Contact Info 📞</h3>
              </div>
              
              <div className="space-y-4">
                {user.phone && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                    <Phone className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-gray-900 dark:text-white">{user.phone}</p>
                    </div>
                  </div>
                )}
                
                {user.location && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                    <MapPin className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p className="text-gray-900 dark:text-white">{user.location}</p>
                    </div>
                  </div>
                )}
                
                {user.website && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                    <Globe className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Website</p>
                      <a 
                        href={user.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                      >
                        {user.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Professional Information */}
          {(user.title || user.company) && (
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">Work Info 💼</h3>
              </div>
              
              <div className="space-y-4">
                {user.title && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                    <Briefcase className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Job Title</p>
                      <p className="text-gray-900 dark:text-white">{user.title}</p>
                    </div>
                  </div>
                )}
                
                {user.company && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                    <Building className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Company</p>
                      <p className="text-gray-900 dark:text-white">{user.company}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
