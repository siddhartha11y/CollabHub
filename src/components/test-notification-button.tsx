"use client"

import { Button } from "@/components/ui/button"
import { createTaskAssignedNotification } from "@/lib/local-notifications"
import { Bell } from "lucide-react"

export function TestNotificationButton() {
  const createTestNotification = () => {
    createTaskAssignedNotification(
      "Admin",
      "Test Task - Building a production level project",
      "my-team",
      "My Team",
      "test-task-id"
    )
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={createTestNotification}
      className="text-xs"
    >
      <Bell className="h-3 w-3 mr-1" />
      Test Notification
    </Button>
  )
}