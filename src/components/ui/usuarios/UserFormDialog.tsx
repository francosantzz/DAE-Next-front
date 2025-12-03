// components/ui/usuarios/UserFormDialog.tsx
"use client"

import { AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/genericos/dialog"
import { Alert, AlertDescription } from "@/components/ui/genericos/alert"
import { Label } from "@/components/ui/genericos/label"
import { Input } from "@/components/ui/genericos/input"
import { Button } from "@/components/ui/genericos/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/genericos/select"
import { Role, Usuario, roleLabels } from "@/types/roles"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUsuario: Usuario | null
  formData: {
    name: string
    email: string
    password: string
    role: Role
  }
  formError: string | null
  isSubmitting: boolean
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRoleChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export default function UserFormDialog({
  open,
  onOpenChange,
  currentUsuario,
  formData,
  formError,
  isSubmitting,
  onInputChange,
  onRoleChange,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            {currentUsuario ? "Editar usuario" : "Agregar usuario"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {formError}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Username *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={onInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Contraseña{" "}
              {currentUsuario
                ? "(dejar vacío para mantener actual)"
                : "*"}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={onInputChange}
              required={!currentUsuario}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol *</Label>
            <Select
              name="role"
              value={formData.role}
              onValueChange={onRoleChange}
              required
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Seleccione un rol" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Role).map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
