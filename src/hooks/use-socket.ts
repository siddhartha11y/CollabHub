"use client"

import { useEffect, useState } from 'react'
import { io as ClientIO, Socket } from 'socket.io-client'

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = ClientIO(process.env.NODE_ENV === 'production' 
      ? 'https://collabhub-amber.vercel.app' 
      : 'http://localhost:3000', {
      path: '/api/socket/io',
      addTrailingSlash: false,
    })

    socketInstance.on('connect', () => {
      console.log('🔌 Connected to socket server')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('🔌 Disconnected from socket server')
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return { socket, isConnected }
}