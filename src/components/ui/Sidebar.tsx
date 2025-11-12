"use client"

import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/genericos/button"
import { Badge } from "@/components/ui/genericos/badge"
import { useSession, signOut } from "next-auth/react"
import { usePermissions } from "@/hooks/usePermissions"
import { 
  HomeIcon, 
  UsersIcon, 
  Building2Icon, 
  CalendarIcon,
  LogOutIcon,
  UserIcon,
  SchoolIcon,
  LayersIcon,
  ClockIcon,
  MenuIcon,
  XIcon,
  PencilIcon,
  Users,
  LayoutDashboard,
  BookOpen,
  History,
  TrendingUpIcon
} from 'lucide-react'
import { useState } from "react"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    icon: React.ElementType
    authRequired?: boolean
    requiredPermission?: {
      entity: string
      action: string
    }
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { canViewPage } = usePermissions()

  const filteredItems = items.filter(item => {
    // Si requiere autenticación y no hay sesión, filtrar
    if (item.authRequired && !session) return false
    
    // Si requiere un permiso específico, verificar
    if (item.requiredPermission) {
      const entity = item.requiredPermission.entity
      return canViewPage(entity)
    }
    
    return true
  })

  return (
    <nav className={cn("flex flex-col space-y-1", className)} {...props}>
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
  const [isOpen, setIsOpen] = useState(false)
  const { getRoleDisplayName } = usePermissions()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  const items = [
    {
      href: "/dashboard",
      title: "Home",
      icon: HomeIcon,
      authRequired: true,
      requiredPermission: { entity: "profesional", action: "read" }
    },
    {
      href: "/profesionales",
      title: "Profesionales",
      icon: UsersIcon,
      authRequired: true,
      requiredPermission: { entity: "profesional", action: "read" }
    },
    {
      href: "/equipos",
      title: "Equipos",
      icon: Building2Icon,
      authRequired: true,
      requiredPermission: { entity: "equipo", action: "read" }
    },
    {
      href: "/escuelas",
      title: "Escuelas",
      icon: SchoolIcon,
      authRequired: true,
      requiredPermission: { entity: "escuela", action: "read" }
    },
    {
      href: "/escuelas-sin-paquetes",
      title: "Escuelas sin paquetes",
      icon: LayersIcon,
      authRequired: true,
      requiredPermission: { entity: "escuela", action: "read" }
    },
    {
      href: "/horarios",
      title: "Horarios",
      icon: ClockIcon,
      authRequired: true,
      requiredPermission: { entity: "paquetehoras", action: "read" }
    },
    {
      title: "Altas y Bajas",
      href: "/altas-bajas",
      icon: TrendingUpIcon,
      authRequired: true,
      requiredPermission: { entity: "modificacion", action: "read"}
    },
    {
      href: "/modificaciones",
      title: "Modificaciones",
      icon: PencilIcon,
      authRequired: true,
      requiredPermission: { entity: "modificacion", action: "read" }
    },
    {
      href: "/usuarios",
      title: "Usuarios",
      icon: Users,
      authRequired: true,
      requiredPermission: { entity: "user", action: "read" }
    },
  ]

  const SidebarContent = () => (
    <>
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2 font-semibold">
          <Building2Icon className="h-6 w-6" />
          <span>DAE</span>
        </div>
        <button
          className="md:hidden p-2 hover:bg-accent rounded-md"
          onClick={() => setIsOpen(false)}
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <SidebarNav items={items} className="px-2" />
      </div>
      <div className="border-t bg-background p-4">
        {session ? (
          <>
            <div className="mb-4 flex items-center gap-2 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {session.user?.email?.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{session.user?.email}</span>
                <Badge variant="secondary" className="text-xs w-fit">
                  {getRoleDisplayName()}
                </Badge>
              </div>
            </div>
            <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </>
        ) : (
          <Link href="/login">
            <Button variant="outline" className="w-full justify-start">
              <UserIcon className="mr-2 h-4 w-4" />
              Iniciar Sesión
            </Button>
          </Link>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden">
        <button
          className="fixed top-4 left-4 z-50 bg-background p-2 rounded-md border"
          onClick={() => setIsOpen(!isOpen)}
          style={{ display: isOpen ? 'none' : 'block' }}
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-screen w-64 flex flex-col border-r bg-background z-40 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <SidebarContent />
      </div>
    </>
  )
} 