// components/ui/usuarios/UserPermissionsDialog.tsx
"use client"

import { Eye, Plus, Pencil, Trash, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/genericos/dialog"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/genericos/card"
import { Badge } from "@/components/ui/genericos/badge"
import { Button } from "@/components/ui/genericos/button"
import type { Usuario, Permission } from "@/types/roles"
import { roleLabels } from "@/types/roles"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUsuario: Usuario | null
  permisos: Permission | null
}

function getActionIcon(action: string) {
  switch (action) {
    case "read":
      return <Eye className="h-3 w-3" />
    case "create":
      return <Plus className="h-3 w-3" />
    case "update":
      return <Pencil className="h-3 w-3" />
    case "delete":
      return <Trash className="h-3 w-3" />
    default:
      return null
  }
}

function getActionColor(action: string) {
  switch (action) {
    case "read":
      return "bg-blue-100 text-blue-800"
    case "create":
      return "bg-green-100 text-green-800"
    case "update":
      return "bg-yellow-100 text-yellow-800"
    case "delete":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function UserPermissionsDialog({
  open,
  onOpenChange,
  currentUsuario,
  permisos,
}: Props) {
  const role = currentUsuario?.role

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            Permisos de {currentUsuario?.name}{" "}
            {role && (
              <span className="mt-1 block text-xs font-normal text-slate-500 sm:inline sm:ml-1">
                — {roleLabels[role]}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {role && permisos && permisos[role]?.map((permiso) => {
            let permisosArray: string[]
            if (Array.isArray(permiso.permissions)) {
              permisosArray = permiso.permissions
            } else {
              try {
                permisosArray = JSON.parse(permiso.permissions)
              } catch {
                permisosArray = String(permiso.permissions).split(",")
              }
            }

            return (
              <Card key={permiso.entity} className="border-slate-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-800">
                    {permiso.entity}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {permisosArray.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {permisosArray.map((action: string) => (
                        <Badge
                          key={action}
                          className={`${getActionColor(action)} flex items-center gap-1 text-[11px]`}
                        >
                          {getActionIcon(action)}
                          {action}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center text-xs text-gray-500">
                      <X className="mr-1 h-4 w-4" />
                      Sin permisos para esta entidad
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
