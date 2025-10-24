"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UserPlus, Mail, CheckCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
})

type InviteForm = z.infer<typeof inviteSchema>

interface InviteMembersModalProps {
  workspaceSlug: string
  children: React.ReactNode
}

export function InviteMembersModal({ workspaceSlug, children }: InviteMembersModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
    setValue,
    watch
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: "MEMBER"
    }
  })

  const role = watch("role")

  const onSubmit = async (data: InviteForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError("root", { message: result.error })
        return
      }

      setInviteSent(true)
      reset()
    } catch (error) {
      setError("root", { message: "Something went wrong. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setInviteSent(false)
    reset()
  }

  if (inviteSent) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <DialogTitle>Invitation Sent!</DialogTitle>
            <DialogDescription>
              We've sent an invitation email. They'll receive a link to join the workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <Button onClick={handleClose}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Invite Team Members</span>
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join this workspace. They'll receive an email with a link to join.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="colleague@company.com"
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <Select value={role} onValueChange={(value) => setValue("role", value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWER">
                  <div>
                    <div className="font-medium">Viewer</div>
                    <div className="text-sm text-gray-500">Can view workspace content</div>
                  </div>
                </SelectItem>
                <SelectItem value="MEMBER">
                  <div>
                    <div className="font-medium">Member</div>
                    <div className="text-sm text-gray-500">Can create and edit content</div>
                  </div>
                </SelectItem>
                <SelectItem value="ADMIN">
                  <div>
                    <div className="font-medium">Admin</div>
                    <div className="text-sm text-gray-500">Full workspace access</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {errors.root && (
            <p className="text-sm text-red-600">{errors.root.message}</p>
          )}

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}