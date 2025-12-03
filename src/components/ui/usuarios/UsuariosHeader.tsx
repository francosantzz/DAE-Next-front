"use client"

import { PlusCircle } from "lucide-react"
import { PermissionButton } from "@/components/ui/genericos/PermissionButton"

type Props = {
  onAddUser: () => void
}

export default function UsuariosHeader({ onAddUser }: Props) {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-4 sm:px-6 lg:px-8">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Gestión de Usuarios
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Administre cuentas, roles y permisos del sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PermissionButton
            requiredPermission={{ entity: "user", action: "create" }}
            onClick={onAddUser}
            className="hidden items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 sm:flex"
          >
            <PlusCircle className="h-4 w-4" />
            Nuevo usuario
          </PermissionButton>

          <PermissionButton
            requiredPermission={{ entity: "user", action: "create" }}
            size="icon"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm sm:hidden"
            onClick={onAddUser}
          >
            <PlusCircle className="h-4 w-4" />
          </PermissionButton>
        </div>
      </div>
    </header>
  )
}
