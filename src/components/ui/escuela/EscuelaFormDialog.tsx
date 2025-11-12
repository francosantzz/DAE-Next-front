
// ==============================================================
// components/ui/escuela/EscuelaFormDialog.tsx
// ==============================================================
'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/genericos/dialog"
import { Button } from "@/components/ui/genericos/button"
import { Input } from "@/components/ui/genericos/input"
import { Label } from "@/components/ui/genericos/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/genericos/select"
import { Textarea } from "@/components/ui/genericos/textarea"
import * as React from "react"

export type Departamento = { id: number; nombre: string }
export type Equipo = { id: number; nombre: string }

export function EscuelaFormDialog({
  open,
  onOpenChange,
  departamentos,
  equipos,
  formData,
  setFormData,
  onSubmit,
  isEditing,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  departamentos: Departamento[]
  equipos: Equipo[]
  formData: any
  setFormData: (f: any) => void
  onSubmit: (e: React.FormEvent) => void
  isEditing: boolean
}) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] h-[90vh] sm:max-w-[1000px] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar" : "Agregar"} Escuela</DialogTitle>
          <DialogDescription>Complete los detalles de la escuela aquí. Haga clic en guardar cuando termine.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="CUE">CUE</Label>
              <Input id="CUE" name="CUE" value={formData.CUE} onChange={handleInputChange} type="number" />
            </div>
            <div>
              <Label htmlFor="Numero">Número Anexo</Label>
              <Input id="Numero" name="Numero" value={formData.Numero} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="matricula">Matrícula</Label>
              <Input id="matricula" name="matricula" value={formData.matricula} onChange={handleInputChange} type="number" />
            </div>
            <div>
              <Label htmlFor="IVE">IVE</Label>
              <Select name="IVE" onValueChange={(v) => handleSelectChange("IVE", v)} value={formData.IVE}>
                <SelectTrigger id="IVE">
                  <SelectValue placeholder="Selecciona el IVE" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="medio">Medio</SelectItem>
                  <SelectItem value="bajo">Bajo</SelectItem>
                  <SelectItem value="sin ive">Sin IVE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="Ambito">Ámbito</Label>
              <Input id="Ambito" name="Ambito" value={formData.Ambito} onChange={handleInputChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="direccion.calle">Calle</Label>
              <Input id="direccion.calle" name="direccion.calle" value={formData["direccion.calle"]} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="direccion.numero">Número</Label>
              <Input id="direccion.numero" name="direccion.numero" value={formData["direccion.numero"]} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departamentoId">Departamento</Label>
              <Select name="departamentoId" onValueChange={(v) => handleSelectChange("departamentoId", v)} value={formData.departamentoId}>
                <SelectTrigger id="departamentoId">
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {departamentos.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="equipoId">Equipo</Label>
              <Select name="equipoId" onValueChange={(v) => handleSelectChange("equipoId", v)} value={formData.equipoId}>
                <SelectTrigger id="equipoId">
                  <SelectValue placeholder="Selecciona un equipo" />
                </SelectTrigger>
                <SelectContent>
                  {equipos.map((e) => (
                    <SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones (opcional)</Label>
            <Textarea
              id="observaciones"
              name="observaciones"
              placeholder="Registre problemas edilicios, disponibilidad de espacio, mobiliario, etc."
              className="min-h-[100px]"
              value={formData.observaciones}
              onChange={handleTextareaChange}
            />
          </div>

          <Button type="submit">Guardar</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}