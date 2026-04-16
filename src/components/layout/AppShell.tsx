"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/ui/Sidebar"

type Props = {
  children: React.ReactNode
}

export function AppShell({ children }: Props) {
  const pathname = usePathname()
  const isPublicForm = pathname?.startsWith("/horarios-form")

  if (isPublicForm) {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
