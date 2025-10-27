import { NextApiRequest } from 'next'
import { Server as ServerIO } from 'socket.io'
import { Server as NetServer } from 'http'

export type NextApiResponseServerIO = {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
} & any

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const path = '/api/socket/io'
    const httpServer: NetServer = res.socket.server as any
    const io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    res.socket.server.io = io

    io.on('connection', (socket) => {
      console.log('🔌 Socket connected:', socket.id)

      // Join workspace room
      socket.on('join-workspace', (workspaceSlug: string) => {
        socket.join(`workspace-${workspaceSlug}`)
        console.log(`👥 User ${socket.id} joined workspace-${workspaceSlug}`)
      })

      // Join channel room
      socket.on('join-channel', (data: { channelId: string; user: any }) => {
        socket.join(`channel-${data.channelId}`)
        console.log(`📢 User ${socket.id} joined channel-${data.channelId}`)
        
        // Notify others that user joined
        socket.to(`channel-${data.channelId}`).emit('user-joined-channel', {
          userId: data.user.id,
          userName: data.user.name,
          userImage: data.user.image
        })
      })

      // Leave channel room
      socket.on('leave-channel', (data: { channelId: string; user: any }) => {
        socket.leave(`channel-${data.channelId}`)
        console.log(`👋 User ${socket.id} left channel-${data.channelId}`)
        
        // Notify others that user left
        socket.to(`channel-${data.channelId}`).emit('user-left-channel', {
          userId: data.user.id
        })
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

      // Handle new messages - instant broadcast
      socket.on('send-message', (data: { 
        channelId: string
        message: any
        workspaceSlug: string 
      }) => {
        console.log('💬 Broadcasting message to channel:', data.channelId)
        
        // Broadcast to all users in the channel (including sender for confirmation)
        io.to(`channel-${data.channelId}`).emit('message-received', data.message)
      })

      // Handle message reactions
      socket.on('message-reaction', (data: {
        channelId: string
        messageId: string
        reaction: string
        user: any
      }) => {
        socket.to(`channel-${data.channelId}`).emit('reaction-added', data)
      })

      socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected:', socket.id)
      })
    })
  }
  
  res.end()
}

export default ioHandler