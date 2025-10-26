"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  ArrowLeft, 
  Menu, 
  MoreVertical,
  File,
  MessageSquare,
  Calendar,
  CheckSquare,
  FileText,
  Users,
  Settings,
  Plus
} from "lucide-react"

interface MobileHeaderProps {
  workspaceSlug: string
  workspaceName?: string
  title: string
  subtitle?: string
  backHref?: string
  actions?: React.ReactNode[]
  dropdownActions?: Array<{
    label: string
    icon: React.ReactNode
    onClick: () => void
    variant?: "default" | "destructive"
  }>
}

export function MobileHeader({
  workspaceSlug,
  workspaceName,
  title,
  subtitle,
  backHref,
  actions = [],
  dropdownActions = []
}: MobileHeaderProps) {
  const pathname = usePathname()
  
  const navigationItems = [
    {
      label: "Dashboard",
      href: `/workspaces/${workspaceSlug}`,
      icon: <Settings className="h-4 w-4" />
    },
    {
      label: "Tasks",
      href: `/workspaces/${workspaceSlug}/tasks`,
      icon: <CheckSquare className="h-4 w-4" />
    },
    {
      label: "Files",
      href: `/workspaces/${workspaceSlug}/files`,
      icon: <File className="h-4 w-4" />
    },
    {
      label: "Documents",
      href: `/workspaces/${workspaceSlug}/documents`,
      icon: <FileText className="h-4 w-4" />
    },
    {
      label: "Chat",
      href: `/workspaces/${workspaceSlug}/chat`,
      icon: <MessageSquare className="h-4 w-4" />
    },
    {
      label: "Meetings",
      href: `/workspaces/${workspaceSlug}/meetings`,
      icon: <Calendar className="h-4 w-4" />
    }
  ]

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {backHref && (
              <Link href={backHref}>
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            )}
            
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Primary Action (if only one action) */}
            {actions.length === 1 && actions[0]}
            
            {/* Navigation Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {navigationItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link 
                      href={item.href}
                      className={`flex items-center space-x-2 ${
                        pathname === item.href ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Actions Menu (if multiple actions or dropdown actions) */}
            {(actions.length > 1 || dropdownActions.length > 0) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {actions.length > 1 && (
                    <>
                      {actions.map((action, index) => (
                        <DropdownMenuItem key={index} asChild>
                          <div className="w-full">
                            {action}
                          </div>
                        </DropdownMenuItem>
                      ))}
                      {dropdownActions.length > 0 && <DropdownMenuSeparator />}
                    </>
                  )}
                  
                  {dropdownActions.map((action, index) => (
                    <DropdownMenuItem 
                      key={index}
                      onClick={action.onClick}
                      className={action.variant === "destructive" ? "text-red-600" : ""}
                    >
                      <div className="flex items-center space-x-2">
                        {action.icon}
                        <span>{action.label}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="w-full max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {backHref && (
                <Link href={backHref} className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Workspace</span>
                </Link>
              )}
              {backHref && <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>}
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {actions.map((action, index) => (
                <div key={index}>{action}</div>
              ))}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}