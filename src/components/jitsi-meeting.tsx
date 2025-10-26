"use client"

import { useEffect, useRef } from 'react'

interface JitsiMeetingProps {
  roomName: string
  displayName: string
  isHost?: boolean
  onMeetingEnd?: () => void
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any
  }
}

export function JitsiMeeting({ roomName, displayName, isHost = false, onMeetingEnd }: JitsiMeetingProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<any>(null)

  useEffect(() => {
    if (!jitsiContainerRef.current) return

    // Load Jitsi Meet API
    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.async = true
    script.onload = initializeJitsi
    document.head.appendChild(script)

    function initializeJitsi() {
      if (!window.JitsiMeetExternalAPI || !jitsiContainerRef.current) return

      const options = {
        roomName: roomName,
        width: '100%',
        height: '600px',
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          startWithAudioMuted: !isHost,
          startWithVideoMuted: !isHost,
          enableWelcomePage: false,
          enableClosePage: false,
          prejoinPageEnabled: false,
          disableModeratorIndicator: false,
          toolbarButtons: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
          ]
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          SHOW_POWERED_BY: false,
          DISPLAY_WELCOME_PAGE_CONTENT: false,
          DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
          APP_NAME: 'CollabHub Meeting',
          NATIVE_APP_NAME: 'CollabHub Meeting',
          DEFAULT_BACKGROUND: '#1f2937',
          DISABLE_VIDEO_BACKGROUND: false,
          INITIAL_TOOLBAR_TIMEOUT: 20000,
          TOOLBAR_TIMEOUT: 4000,
          TOOLBAR_ALWAYS_VISIBLE: false,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
          DEFAULT_LOCAL_DISPLAY_NAME: displayName,
        },
        userInfo: {
          displayName: displayName,
          email: ''
        }
      }

      apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', options)

      // Event listeners
      apiRef.current.addEventListener('videoConferenceJoined', () => {
        console.log('User joined the meeting')
        if (isHost) {
          // Host-specific setup
          apiRef.current.executeCommand('displayName', `${displayName} (Host)`)
        }
      })

      apiRef.current.addEventListener('videoConferenceLeft', () => {
        console.log('User left the meeting')
        onMeetingEnd?.()
      })

      apiRef.current.addEventListener('participantJoined', (participant: any) => {
        console.log('Participant joined:', participant)
      })

      apiRef.current.addEventListener('participantLeft', (participant: any) => {
        console.log('Participant left:', participant)
      })
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose()
      }
      // Remove script
      const scripts = document.querySelectorAll('script[src="https://meet.jit.si/external_api.js"]')
      scripts.forEach(script => script.remove())
    }
  }, [roomName, displayName, isHost, onMeetingEnd])

  return (
    <div className="w-full">
      <div 
        ref={jitsiContainerRef} 
        className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
      />
    </div>
  )
}