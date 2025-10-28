"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Briefcase, 
  Building, 
  Edit3,
  Calendar,
  Clock,
  Settings,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    title: "",
    company: "",
    location: "",
    website: "",
    phone: "",
    timezone: "",
    theme: "system",
    language: "en",
    emailNotifications: true,
    image: "",
    createdAt: "",
    updatedAt: ""
  })

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin")
      return
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile")
        if (response.ok) {
          const data = await response.json()
          setProfile({
            name: data.name || session.user?.name || "",
            email: data.email || session.user?.email || "",
            bio: data.bio || "",
            title: data.title || "",
            company: data.company || "",
            location: data.location || "",
            website: data.website || "",
            phone: data.phone || "",
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            theme: data.theme || "system",
            language: data.language || "en",
            emailNotifications: data.emailNotifications !== false,
            image: data.image || session.user?.image || "",
            createdAt: data.createdAt || "",
            updatedAt: data.updatedAt || ""
          })
        } else {
          // If API fails, use session data as fallback
          setProfile({
            name: session.user?.name || "",
            email: session.user?.email || "",
            bio: "",
            title: "",
            company: "",
            location: "",
            website: "",
            phone: "",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            theme: "system",
            language: "en",
            emailNotifications: true,
            image: session.user?.image || "",
            createdAt: "",
            updatedAt: ""
          })
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error)
        // Use session data as fallback on error
        setProfile({
          name: session.user?.name || "",
          email: session.user?.email || "",
          bio: "",
          title: "",
          company: "",
          location: "",
          website: "",
          phone: "",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          theme: "system",
          language: "en",
          emailNotifications: true,
          image: session.user?.image || "",
          createdAt: "",
          updatedAt: ""
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [session, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
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
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Profile</h1>
                <p className="text-sm text-gray-500">Your personal space ✨</p>
              </div>
            </div>
            <Link href="/profile/edit">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Header - Instagram/Social Media Style */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            {/* Cover Photo Area */}
            <div className="h-48 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 relative">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute bottom-4 left-6 text-white">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Online</span>
                </div>
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="px-6 pb-6 -mt-16 relative">
              <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative">
                  <img
                    src={profile.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=3b82f6&color=fff&size=160`}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-2xl ring-4 ring-blue-100 dark:ring-gray-700"
                  />
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                
                <div className="flex-1 text-center sm:text-left mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start">
                        {profile.name || "User"} 
                        <span className="ml-2 text-blue-500">✓</span>
                      </h1>
                      {profile.title ? (
                        <p className="text-lg text-gray-600 dark:text-gray-300 mt-1 flex items-center justify-center sm:justify-start">
                          <Briefcase className="h-4 w-4 mr-2" />
                          {profile.title}
                          {profile.company && ` at ${profile.company}`}
                        </p>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Add your job title 💼</p>
                      )}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex space-x-6 mt-4 sm:mt-0">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">12</div>
                        <div className="text-sm text-gray-500">Projects</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">48</div>
                        <div className="text-sm text-gray-500">Tasks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">156</div>
                        <div className="text-sm text-gray-500">Collaborations</div>
                      </div>
                    </div>
                  </div>
                  
                  {profile.bio ? (
                    <p className="text-gray-600 dark:text-gray-300 mt-4 max-w-2xl leading-relaxed">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 mt-4 italic">
                      Share something about yourself... 📝
                    </p>
                  )}
                  
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                    <Badge variant="secondary" className="flex items-center bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      <Mail className="h-3 w-3 mr-1" />
                      {profile.email}
                    </Badge>
                    {profile.location && (
                      <Badge variant="outline" className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {profile.location}
                      </Badge>
                    )}
                    {profile.website && (
                      <Badge variant="outline" className="flex items-center">
                        <Globe className="h-3 w-3 mr-1" />
                        Website
                      </Badge>
                    )}
                    <Badge variant="outline" className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {profile.timezone}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">Contact Info 📞</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900 dark:text-white">{profile.email}</p>
                  </div>
                </div>
                
                {profile.phone ? (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                    <Phone className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-gray-900 dark:text-white">{profile.phone}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50/30 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Add your phone number 📱</p>
                    </div>
                  </div>
                )}
                
                {profile.location ? (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                    <MapPin className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p className="text-gray-900 dark:text-white">{profile.location}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50/30 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Add your location 🌍</p>
                    </div>
                  </div>
                )}
                
                {profile.website ? (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                    <Globe className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Website</p>
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                      >
                        {profile.website}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50/30 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Add your website 🌐</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">Work Info 💼</h3>
              </div>
              
              <div className="space-y-4">
                {profile.title ? (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                    <Briefcase className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Job Title</p>
                      <p className="text-gray-900 dark:text-white">{profile.title}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50/30 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Add your job title 👔</p>
                    </div>
                  </div>
                )}
                
                {profile.company ? (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                    <Building className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Company</p>
                      <p className="text-gray-900 dark:text-white">{profile.company}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50/30 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <Building className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Add your company 🏢</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preferences & Settings */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">Preferences ⚙️</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Timezone 🕐</p>
                  <p className="text-gray-900 dark:text-white text-sm">{profile.timezone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                <Globe className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Language 🌍</p>
                  <p className="text-gray-900 dark:text-white text-sm">
                    {profile.language === 'en' ? 'English 🇺🇸' : profile.language}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                <Settings className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Theme 🎨</p>
                  <p className="text-gray-900 dark:text-white text-sm capitalize">
                    {profile.theme} {profile.theme === 'dark' ? '🌙' : profile.theme === 'light' ? '☀️' : '🔄'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          {(profile.createdAt || profile.updatedAt) && (
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">Account Info 📊</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.createdAt && (
                  <div className="flex items-center space-x-3 p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Member Since 🎉</p>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(profile.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {profile.updatedAt && (
                  <div className="flex items-center space-x-3 p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                    <Clock className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Updated ⏰</p>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(profile.updatedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
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