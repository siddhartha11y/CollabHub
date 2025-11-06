"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, UserX } from "lucide-react"

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [showDeletedDialog, setShowDeletedDialog] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email && !isChecking) {
      checkUserExists()
    }
  }, [session, status])

  const checkUserExists = async () => {
    if (!session?.user?.email || isChecking) return
    
    setIsChecking(true)
    try {
      const response = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email
        })
      })

      const result = await response.json()

      if (!response.ok || !result.exists) {
        // User account has been deleted
        setShowDeletedDialog(true)
      }
    } catch (error) {
      console.error("Session check error:", error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleAccountDeleted = async () => {
    // Sign out the user
    await signOut({ redirect: false })
    
    // Redirect to registration page
    router.push("/auth/register")
    
    setShowDeletedDialog(false)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      {children}
      
      {/* Account Deleted Dialog */}
      <Dialog open={showDeletedDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <UserX className="h-5 w-5 mr-2" />
              Account No Longer Available
            </DialogTitle>
            <DialogDescription className="text-left space-y-3">
              <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 dark:text-red-200 font-medium text-sm">
                      Your account has been permanently deleted
                    </p>
                    <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                      You can no longer use this account. All your data has been removed from our servers.
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300">
                If you'd like to continue using CollabHub, you can create a new account.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={handleAccountDeleted}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Create New Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}