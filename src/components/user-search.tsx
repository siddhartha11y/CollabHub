"use client"

import { useState, useEffect, useRef } from "react"
import { Search, User, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

interface SearchResult {
  id: string
  name: string
  username: string | null
  email: string
  image: string | null
}

export function UserSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.users || [])
          setIsOpen(true)
        }
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleUserClick = (username: string | null, userId: string) => {
    // Use username if available, otherwise use user ID
    const identifier = username || userId
    router.push(`/users/${identifier}`)
    setQuery("")
    setIsOpen(false)
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        <Input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-10 bg-gray-100 dark:bg-gray-800 border-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("")
              setResults([])
              setIsOpen(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown - FIXED POSITION */}
      {isOpen && (
        <div className="fixed left-1/2 transform -translate-x-1/2 mt-2 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[500px] overflow-y-auto z-[9999]" style={{ top: 'calc(4rem + 0.5rem)' }}>
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user.username, user.id)}
                  className="w-full px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                >
                  <img
                    src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.username ? `@${user.username}` : user.email}</p>
                  </div>
                  <User className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              No users found
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
