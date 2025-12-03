
// ==============================================================
// components/ui/escuela/AnexoDialog.tsx
// ==============================================================
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/genericos/dialog"
import { Input } from "@/components/ui/genericos/input"
import { Label } from "@/components/ui/genericos/label"
import { Button } from "@/components/ui/genericos/button"
import * as React from "react"

export function AnexoDialog({
  open,
  onOpenChange,
  isEditing,
  formData,
  setFormData,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  isEditing: boolean
  formData: { id?: number; nombre: string; matricula: string }
  setFormData: (f: { id?: number; nombre: string; matricula: string }) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] h-[90vh] sm:max-w-[1000px] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar' : 'Agregar'} Anexo</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="anexoNombre">Nombre del Anexo</Label>
            <Input id="anexoNombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="anexoMatricula">Matrícula</Label>
            <Input id="anexoMatricula" type="number" value={formData.matricula} onChange={(e) => setFormData({ ...formData, matricula: e.target.value })} required />
          </div>
          <Button type="submit">{isEditing ? 'Actualizar' : 'Guardar'} Anexo</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}