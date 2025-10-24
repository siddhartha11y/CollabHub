// Temporary channel ownership tracking until database is updated
// This uses localStorage and channel metadata to track ownership

export interface ChannelOwnership {
  channelId: string
  createdBy: string
  createdAt: string
}

export class ChannelPermissions {
  private static getStorageKey(workspaceSlug: string): string {
    return `channelOwnership_${workspaceSlug}`
  }

  static setChannelOwner(workspaceSlug: string, channelId: string, userId: string): void {
    try {
      const key = this.getStorageKey(workspaceSlug)
      const existing = localStorage.getItem(key)
      const ownership: ChannelOwnership[] = existing ? JSON.parse(existing) : []
      
      // Remove existing entry for this channel
      const filtered = ownership.filter(o => o.channelId !== channelId)
      
      // Add new ownership record
      filtered.push({
        channelId,
        createdBy: userId,
        createdAt: new Date().toISOString()
      })
      
      localStorage.setItem(key, JSON.stringify(filtered))
    } catch (error) {
      console.error('Failed to set channel owner:', error)
    }
  }

  static getChannelOwner(workspaceSlug: string, channelId: string): string | null {
    try {
      const key = this.getStorageKey(workspaceSlug)
      const existing = localStorage.getItem(key)
      if (!existing) return null
      
      const ownership: ChannelOwnership[] = JSON.parse(existing)
      const record = ownership.find(o => o.channelId === channelId)
      return record?.createdBy || null
    } catch (error) {
      console.error('Failed to get channel owner:', error)
      return null
    }
  }

  static canUserManageChannel(
    channelName: string,
    channelId: string,
    workspaceSlug: string,
    currentUserId: string,
    userRole: "ADMIN" | "MEMBER" | "VIEWER"
  ): { canRename: boolean; canDelete: boolean } {
    // General channel is protected
    if (channelName === "general") {
      return { canRename: false, canDelete: false }
    }

    // Viewers can't manage any channels
    if (userRole === "VIEWER") {
      return { canRename: false, canDelete: false }
    }

    // Get channel owner
    const channelOwner = this.getChannelOwner(workspaceSlug, channelId)
    const isOwner = channelOwner === currentUserId

    // Permission logic:
    // - Channel owner can rename and delete their own channel
    // - Admin can delete any channel (but not rename others' channels)
    return {
      canRename: isOwner,
      canDelete: isOwner || userRole === "ADMIN"
    }
  }
}