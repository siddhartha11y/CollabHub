"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { 
  Plus, 
  Hash, 
  MoreVertical, 
  EyeOff, 
  Trash2, 
  Users,
  Lock,
  Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Channel {
  id: string
  name: string
  description?: string
  createdAt: string
  createdById?: string
  _count?: {
    messages: number
  }
}

interface EnhancedChannelSidebarProps {
  channels: Channel[]
  activeChannel: Channel | null
  currentUserId: string
  userRole: 'ADMIN' | 'MEMBER' | 'VIEWER'
  onChannelSelect: (channel: Channel) => void
  onChannelHide: (channelId: string) => void
  onChannelDelete: (channelId: string) => void
  onCreateChannel: () => void
}

export function EnhancedChannelSidebar({
  channels,
  activeChannel,
  currentUserId,
  userRole,
  onChannelSelect,
  onChannelHide,
  onChannelDelete,
  onCreateChannel
}: EnhancedChannelSidebarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null)

  const canDeleteChannel = (channel: Channel) => {
    return channel.createdById === currentUserId || userRole === 'ADMIN'
  }

  const canHideChannel = (channel: Channel) => {
    return channel.name !== 'general'
  }

  const handleDeleteClick = (channel: Channel) => {
    setChannelToDelete(channel)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (channelToDelete) {
      onChannelDelete(channelToDelete.id)
      setDeleteDialogOpen(false)
      setChannelToDelete(null)
    }
  }

  const getChannelIcon = (channel: Channel) => {
    if (channel.name === 'general') return <Globe className="h-4 w-4" />
    if (channel.createdById === currentUserId) return <Lock className="h-4 w-4" />
    return <Hash className="h-4 w-4" />
  }

  const getChannelBadge = (channel: Channel) => {
    if (channel.name === 'general') return null
    if (channel.createdById === currentUserId) {
      return <Badge variant="secondary" className="text-xs">Owner</Badge>
    }
    return null
  }

  return (
    <>
      <Card className="h-full shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Channels</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCreateChannel}
              className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-1">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className={cn(
                "group relative rounded-lg transition-all duration-200 hover:shadow-sm",
                activeChannel?.id === channel.id
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 shadow-sm"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <button
                onClick={() => onChannelSelect(channel)}
                className="w-full text-left p-3 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={cn(
                    "flex-shrink-0",
                    activeChannel?.id === channel.id 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-slate-500"
                  )}>
                    {getChannelIcon(channel)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium truncate">{channel.name}</span>
                      {getChannelBadge(channel)}
                    </div>
                    
                    {channel.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                        {channel.description}
                      </p>
                    )}
                    
                    {channel._count?.messages && (
                      <p className="text-xs text-slate-400 mt-1">
                        {channel._count.messages} messages
                      </p>
                    )}
                  </div>
                </div>
              </button>
              
              {/* Channel Actions */}
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="end" className="w-48">
                    {canHideChannel(channel) && (
                      <DropdownMenuItem
                        onClick={() => onChannelHide(channel.id)}
                        className="text-slate-600 dark:text-slate-300"
                      >
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide for me
                      </DropdownMenuItem>
                    )}
                    
                    {canDeleteChannel(channel) && (
                      <>
                        {canHideChannel(channel) && <DropdownMenuSeparator />}
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(channel)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {channel.createdById === currentUserId ? 'Delete channel' : 'Delete (Admin)'}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
          
          {channels.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No channels yet</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCreateChannel}
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                Create first channel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "#{channelToDelete?.name}"? 
              {channelToDelete?.createdById === currentUserId 
                ? " This will permanently delete the channel and all its messages for everyone."
                : " This will only hide the channel for you - others can still see it."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {channelToDelete?.createdById === currentUserId ? 'Delete' : 'Hide'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}