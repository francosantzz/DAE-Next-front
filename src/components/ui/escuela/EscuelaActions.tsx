'use client'

import { useState } from 'react'
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
import type { Escuela } from '@/hooks/useEscuelas'
import { PermissionGate } from '../genericos/PermissionGate'

export type EscuelaActionsProps = {
  escuela: Escuela
  onView: (e: Escuela) => void
  onEdit: (e: Escuela) => void
  onDelete: (id: number) => Promise<void> | void
  className?: string
  /** Si true, usa botones chicos y apila en mobile */
  compact?: boolean
}

export default function EscuelaActions({
  escuela,
  onView,
  onEdit,
  onDelete,
  className,
  compact,
}: EscuelaActionsProps) {
  const [openConfirm, setOpenConfirm] = useState(false)

  const stackClasses = compact
    ? 'flex flex-col sm:flex-row justify-end gap-2'
    : 'flex flex-col sm:flex-row justify-end gap-2'

  const nombreVisible = `${escuela.nombre}${escuela.Numero ? ` - ${escuela.Numero}` : ''}`
 
  return (
    <div className={cn(stackClasses, className)}>
      <PermissionButton
        requiredPermission={{ entity: 'escuela', action: 'read' }}
        variant="outline"
        size={compact ? 'sm' : 'default'}
        onClick={() => onView(escuela)}
        className="hover:bg-green-50 hover:border-green-300 text-green-600"
      >
        <Eye className="mr-1 h-3 w-3" /> Ver Detalles
      </PermissionButton>

      <PermissionGate
        requiredPermission={{ entity: "escuela", action: "update" }}
        visibleIf={({ role }) => role !== "equipo"}
      >
        <PermissionButton
          requiredPermission={{ entity: "escuela", action: "update" }}
          variant="outline"
          size={compact ? "sm" : "default"}
          onClick={() => onEdit(escuela)}
        >
          <Edit className="mr-2 h-4 w-4" /> Editar
        </PermissionButton>
      </PermissionGate>

      {/* Confirmación destructiva usando AlertDialog */}
      <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <AlertDialogTrigger asChild>
          <PermissionButton
            requiredPermission={{ entity: 'escuela', action: 'delete' }}
            variant="destructive"
            size={compact ? 'sm' : 'default'}
            onClick={() => setOpenConfirm(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
          </PermissionButton>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {nombreVisible}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente. Se borrará la escuela y sus relaciones (no las personas/profesionales).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                await onDelete(Number(escuela.id))
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
