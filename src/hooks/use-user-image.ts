"use client"

import { useState, useEffect } from "react"

export function useUserImage(userId?: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return

    const fetchUserImage = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/users/${userId}`)
        if (response.ok) {
          const userData = await response.json()
          setImageUrl(userData.image)
        }
      } catch (error) {
        console.error("Failed to fetch user image:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserImage()
  }, [userId])

  return { imageUrl, loading }
}