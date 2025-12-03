// components/ui/usuarios/UserDeleteDialog.tsx
"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/genericos/dialog"
import { Button } from "@/components/ui/genericos/button"
import { Usuario, roleLabels } from "@/types/roles"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuarioToDelete: Usuario | null
  onConfirm: () => void
}

export default function UserDeleteDialog({
  open,
  onOpenChange,
  usuarioToDelete,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirmar eliminación</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4 text-sm">
          <p>¿Está seguro de que desea eliminar este usuario?</p>
          {usuarioToDelete && (
            <div className="rounded-md bg-slate-50 p-3 text-xs sm:text-sm">
              <p>
                <strong>Username:</strong> {usuarioToDelete.name}
              </p>
              <p>
                <strong>Email:</strong> {usuarioToDelete.email}
              </p>
              <p>
                <strong>Rol:</strong> {roleLabels[usuarioToDelete.role]}
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
