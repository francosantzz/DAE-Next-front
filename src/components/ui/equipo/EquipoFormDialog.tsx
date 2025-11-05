'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserCheck, Building, X } from "lucide-react"
import { useEquipos } from "@/hooks/useEquipo"

export default function EquipoFormDialog() {
  const {
    isDialogOpen, setIsDialogOpen, isEditing,
    departamentos, errorMessage,
    formData, setFormData,
    profesionalesSeleccionados, setProfesionalesSeleccionados,
    escuelasSeleccionadas, setEscuelasSeleccionadas,
    profesionalSearch, setProfesionalSearch,
    escuelaSearch, setEscuelaSearch,
    profesionalesFiltrados, escuelasFiltradas,
    handleSubmit, resetForm
  } = useEquipos()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: Number(value) })
  }
  const handleProfesionalSelect = (p: any) => {
    setProfesionalesSeleccionados(prev => [...prev, p])
    setFormData(prev => ({ ...prev, profesionalesIds: [...prev.profesionalesIds, p.id] }))
    setProfesionalSearch('')
  }
  const handleProfesionalRemove = (id: number) => {
    setProfesionalesSeleccionados(prev => prev.filter(x => x.id !== id))
    setFormData(prev => ({ ...prev, profesionalesIds: prev.profesionalesIds.filter(pid => pid !== id) }))
  }
  const handleEscuelaSelect = (e: any) => {
    setEscuelasSeleccionadas(prev => [...prev, e])
    setFormData(prev => ({ ...prev, escuelasIds: [...prev.escuelasIds, e.id] }))
    setEscuelaSearch('')
  }
  const handleEscuelaRemove = (id: number) => {
    setEscuelasSeleccionadas(prev => prev.filter(x => x.id !== id))
    setFormData(prev => ({ ...prev, escuelasIds: prev.escuelasIds.filter(eid => eid !== id) }))
  }

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) resetForm()
      }}
    >
      <DialogContent className="w-[95vw] h-[90vh] sm:max-w-[1000px] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar' : 'Agregar'} Equipo</DialogTitle>
          <DialogDescription>Complete los detalles del equipo y guarde los cambios.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
            </div>

            <div>
              <Label htmlFor="departamento">Departamento</Label>
              <Select onValueChange={(v) => handleSelectChange('departamentoId', v)} value={formData.departamentoId.toString()}>
                <SelectTrigger id="departamento"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {departamentos.map((d) => <SelectItem key={d.id} value={d.id.toString()}>{d.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profesionales */}
            <div>
              <Label htmlFor="profesionalSearch">Buscar profesionales</Label>
              <Input
                id="profesionalSearch"
                value={profesionalSearch}
                onChange={(e)=>setProfesionalSearch(e.target.value)}
                placeholder="Buscar..."
              />
              {profesionalSearch && profesionalesFiltrados.length > 0 && (
                <ScrollArea className="mt-2 max-h-40 border rounded-md">
                  <div className="p-2">
                    {profesionalesFiltrados.map(p => (
                      <button
                        type="button"
                        key={p.id}
                        className="w-full text-left p-2 rounded hover:bg-gray-100"
                        onClick={() => handleProfesionalSelect(p)}
                      >
                        {p.nombre} {p.apellido}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <Label className="mt-3 block">Profesionales seleccionados</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {profesionalesSeleccionados.map(p => (
                  <Badge key={p.id} variant="secondary" className="px-3 py-1">
                    <UserCheck className="h-3 w-3 mr-1" />
                    {p.nombre} {p.apellido}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-2"
                      onClick={() => handleProfesionalRemove(p.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Escuelas */}
            <div>
              <Label htmlFor="escuelaSearch">Buscar escuelas</Label>
              <Input
                id="escuelaSearch"
                value={escuelaSearch}
                onChange={(e)=>setEscuelaSearch(e.target.value)}
                placeholder="Buscar..."
              />
              {escuelaSearch && escuelasFiltradas.length > 0 && (
                <ScrollArea className="mt-2 max-h-40 border rounded-md">
                  <div className="p-2">
                    {escuelasFiltradas.map(e => (
                      <button
                        type="button"
                        key={e.id}
                        className="w-full text-left p-2 rounded hover:bg-gray-100"
                        onClick={() => handleEscuelaSelect(e)}
                      >
                        {e.nombre} {e.Numero}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <Label className="mt-3 block">Escuelas seleccionadas</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {escuelasSeleccionadas.map(e => (
                  <Badge key={e.id} variant="secondary" className="px-3 py-1">
                    <Building className="h-3 w-3 mr-1" />
                    {e.nombre} {e.Numero}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-2"
                      onClick={() => handleEscuelaRemove(e.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button type="submit" className="w-full sm:w-auto">Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
