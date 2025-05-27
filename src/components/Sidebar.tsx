"use client"

import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import { 
  HomeIcon, 
  UsersIcon, 
  Building2Icon, 
  CalendarIcon,
  LogOutIcon,
  UserIcon,
  SchoolIcon,
  LayersIcon,
  ClockIcon
} from 'lucide-react'

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    icon: React.ElementType
    authRequired?: boolean
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const filteredItems = items.filter(item => !item.authRequired || session)

  return (
    <nav className={cn("flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1", className)} {...props}>
      {filteredItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  const items = [
    {
      href: "/",
      title: "Dashboard",
      icon: HomeIcon,
      authRequired: true,
    },
    {
      href: "/profesionales",
      title: "Profesionales",
      icon: UsersIcon,
      authRequired: true,
    },
    {
      href: "/equipos",
      title: "Equipos",
      icon: Building2Icon,
      authRequired: true,
    },
    {
      href: "/secciones",
      title: "Secciones",
      icon: LayersIcon,
      authRequired: true,
    },
    {
      href: "/escuelas",
      title: "Escuelas",
      icon: SchoolIcon,
      authRequired: true,
    },
    {
      href: "/horarios",
      title: "Horarios",
      icon: ClockIcon,
      authRequired: true,
    },
  ]

  if (!session) {
    return (
      <div className="fixed top-0 left-0 h-screen w-64 flex flex-col border-r bg-background">
        <div className="flex h-14 items-center border-b px-4 gap-2 font-semibold">
          <Building2Icon className="h-6 w-6" />
          <span>DAE</span>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <SidebarNav items={items} className="px-2" />
        </div>
        <div className="border-t bg-background p-4">
          <Link href="/login">
            <Button variant="outline" className="w-full justify-start">
              <UserIcon className="mr-2 h-4 w-4" />
              Iniciar Sesión
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed top-0 left-0 h-screen w-64 flex flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4 gap-2 font-semibold">
        <Building2Icon className="h-6 w-6" />
        <span>DAE</span>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <SidebarNav items={items} className="px-2" />
      </div>
      <div className="border-t bg-background p-4">
        <div className="mb-4 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {session.user?.email?.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{session.user?.email}</span>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
          <LogOutIcon className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
} 