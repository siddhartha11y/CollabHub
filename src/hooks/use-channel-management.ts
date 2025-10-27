import { useState, useEffect } from 'react'

interface Channel {
  id: string
  name: string
  description?: string
  createdAt: string
  createdById?: string
}

interface UseChannelManagementOptions {
  workspaceSlug: string
  currentUserId: string
}

export function useChannelManagement({ workspaceSlug, currentUserId }: UseChannelManagementOptions) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [hiddenChannels, setHiddenChannels] = useState<Set<string>>(new Set())

  // Load hidden channels from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`hiddenChannels_${workspaceSlug}_${currentUserId}`)
    if (stored) {
      setHiddenChannels(new Set(JSON.parse(stored)))
    }
  }, [workspaceSlug, currentUserId])

  // Save hidden channels to localStorage
  const saveHiddenChannels = (hidden: Set<string>) => {
    localStorage.setItem(
      `hiddenChannels_${workspaceSlug}_${currentUserId}`,
      JSON.stringify(Array.from(hidden))
    )
  }

  // Hide channel for current user only
  const hideChannel = (channelId: string) => {
    const newHidden = new Set(hiddenChannels)
    newHidden.add(channelId)
    setHiddenChannels(newHidden)
    saveHiddenChannels(newHidden)
  }

  // Show channel for current user
  const showChannel = (channelId: string) => {
    const newHidden = new Set(hiddenChannels)
    newHidden.delete(channelId)
    setHiddenChannels(newHidden)
    saveHiddenChannels(newHidden)
  }

  // Get visible channels (not hidden by current user)
  const visibleChannels = channels.filter(channel => !hiddenChannels.has(channel.id))

  // Check if user can delete channel (only if they created it)
  const canDeleteChannel = (channel: Channel) => {
    return channel.createdById === currentUserId
  }

  // Check if user can hide channel (any channel except general)
  const canHideChannel = (channel: Channel) => {
    return channel.name !== 'general'
  }

  return {
    channels,
    setChannels,
    visibleChannels,
    hiddenChannels,
    hideChannel,
    showChannel,
    canDeleteChannel,
    canHideChannel
  }
}