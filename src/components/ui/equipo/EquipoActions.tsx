// ===============================
// components/ui/equipo/EquipoActions.tsx
// Acciones reusables (Ver, Editar, Eliminar) para un Equipo
// Usa shadcn/ui + PermissionButton + AlertDialog para confirmar borrado
// ===============================

'use client'

import { Eye, Edit, Trash2 } from 'lucide-react'
import { PermissionButton } from '@/components/ui/genericos/PermissionButton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/genericos/alert-dialog'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import type { Equipo } from '@/types/equipos'

export type EquipoActionsProps = {
  equipo: Equipo
  onView: (equipo: Equipo) => void
  onEdit: (equipo: Equipo) => void
  onDelete: (id: number) => Promise<void> | void
  className?: string
  /** Si true, usa botones chicos y apila en mobile */
  compact?: boolean
}

export default function EquipoActions({ equipo, onView, onEdit, onDelete, className, compact }: EquipoActionsProps) {
  const [openConfirm, setOpenConfirm] = useState(false)

  const stackClasses = compact
    ? 'flex flex-col sm:flex-row justify-end gap-2'
    : 'flex flex-col sm:flex-row justify-end gap-2'

  return (
    <div className={cn(stackClasses, className)}>
      <PermissionButton
        requiredPermission={{ entity: 'equipo', action: 'read' }}
        variant="outline"
        size={compact ? 'sm' : 'default'}
        onClick={() => onView(equipo)}
        className="hover:bg-green-50 hover:border-green-300 text-green-600"
      >
        <Eye className="mr-1 h-3 w-3" /> Ver Detalles
      </PermissionButton>

      <PermissionButton
        requiredPermission={{ entity: 'equipo', action: 'update' }}
        variant="outline"
        size={compact ? 'sm' : 'default'}
        onClick={() => onEdit(equipo)}
      >
        <Edit className="mr-2 h-4 w-4" /> Editar
      </PermissionButton>

      {/* Confirmación destructiva usando AlertDialog */}
      <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <AlertDialogTrigger asChild>
          <PermissionButton
            requiredPermission={{ entity: 'equipo', action: 'delete' }}
            variant="destructive"
            size={compact ? 'sm' : 'default'}
            onClick={() => setOpenConfirm(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
          </PermissionButton>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {equipo.nombre}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente. Se borrará el equipo y sus relaciones (no los profesionales/escuelas).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                await onDelete(Number(equipo.id))
                setOpenConfirm(false)
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

