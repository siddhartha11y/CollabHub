import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new ServerIO(res.socket.server)
    res.socket.server.io = io

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id)

      // Join workspace room
      socket.on('join-workspace', (workspaceSlug: string) => {
        socket.join(`workspace-${workspaceSlug}`)
        console.log(`User ${socket.id} joined workspace-${workspaceSlug}`)
      })

      // Join channel room
      socket.on('join-channel', (channelId: string) => {
        socket.join(`channel-${channelId}`)
        console.log(`User ${socket.id} joined channel-${channelId}`)
      })

      // Leave channel room
      socket.on('leave-channel', (channelId: string) => {
        socket.leave(`channel-${channelId}`)
        console.log(`User ${socket.id} left channel-${channelId}`)
      })

      // Handle typing indicators
      socket.on('typing-start', (data: { channelId: string; user: any }) => {
        socket.to(`channel-${data.channelId}`).emit('user-typing', {
          userId: data.user.id,
          userName: data.user.name,
          userImage: data.user.image
        })
      })

      socket.on('typing-stop', (data: { channelId: string; user: any }) => {
        socket.to(`channel-${data.channelId}`).emit('user-stopped-typing', {
          userId: data.user.id
        })
      })

      // Handle new messages
      socket.on('new-message', (data: { 
        channelId: string
        message: any
        workspaceSlug: string 
      }) => {
        // Broadcast to all users in the channel
        io.to(`channel-${data.channelId}`).emit('message-received', data.message)
        
        // Also broadcast to workspace for notifications
        socket.to(`workspace-${data.workspaceSlug}`).emit('new-channel-message', {
          channelId: data.channelId,
          message: data.message
        })
      })

      // Handle user presence
      socket.on('user-online', (data: { workspaceSlug: string; user: any }) => {
        socket.to(`workspace-${data.workspaceSlug}`).emit('user-status-change', {
          userId: data.user.id,
          status: 'online'
        })
      })

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
      })
    })
  }
  res.end()
}

export default SocketHandler