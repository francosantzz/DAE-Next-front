'use client'
import React from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../genericos/dialog"
import { Label } from "../genericos/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../genericos/select"
import { Input } from "../genericos/input"
import { Button } from "../genericos/button"

export default function PaqueteModal({
  open, setOpen, currentPaquete, formData, setFormData, tiposPaquete,
  escuelasDelEquipo, equipoSeleccionado, handleInputChange, handleSelectChange,
  handleSubmit, isLoading, toggleSemana
}: any) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{currentPaquete ? "Editar" : "Agregar"} Paquete de Horas</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1">
          <form id="paqueteForm" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-sm sm:text-base">Tipo de Paquete</Label>
              <Select name="tipo" value={formData.tipo} onValueChange={(value)=>handleSelectChange("tipo", value)} required>
                <SelectTrigger id="tipo" className="text-sm sm:text-base"><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger>
                <SelectContent position="popper">{tiposPaquete.map((tipo:any)=> <SelectItem key={tipo} value={tipo} className="text-sm sm:text-base">{tipo}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="escuelaId" className="text-sm sm:text-base">Escuela</Label>
              <Select name="escuelaId" value={formData.escuelaId} onValueChange={(value)=>handleSelectChange("escuelaId", value)} disabled={formData.tipo !== "Escuela"}>
                <SelectTrigger id="escuelaId" className="text-sm sm:text-base"><SelectValue placeholder="Seleccione una escuela" /></SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="none" className="text-sm sm:text-base">Ninguna</SelectItem>
                  {escuelasDelEquipo?.map((escuela: any) => <SelectItem key={escuela.id} value={escuela.id.toString()} className="text-sm sm:text-base">{escuela.nombre} {escuela.Numero}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diaSemana" className="text-sm sm:text-base">Día de la semana</Label>
              <Select name="diaSemana" value={formData.diaSemana} onValueChange={(value)=>handleSelectChange("diaSemana", value)} required>
                <SelectTrigger id="diaSemana" className="text-sm sm:text-base"><SelectValue placeholder="Seleccione un día" /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="1">Lunes</SelectItem>
                  <SelectItem value="2">Martes</SelectItem>
                  <SelectItem value="3">Miércoles</SelectItem>
                  <SelectItem value="4">Jueves</SelectItem>
                  <SelectItem value="5">Viernes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horaInicio" className="text-sm sm:text-base">Hora inicio</Label>
                <Input id="horaInicio" name="horaInicio" type="time" value={formData.horaInicio} onChange={handleInputChange} required className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horaFin" className="text-sm sm:text-base">Hora fin</Label>
                <Input id="horaFin" name="horaFin" type="time" value={formData.horaFin} onChange={handleInputChange} required className="text-sm sm:text-base" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input id="rotativo" name="rotativo" type="checkbox" checked={formData.rotativo} onChange={handleInputChange} />
                <Label htmlFor="rotativo" className="text-sm sm:text-base">Horario rotativo</Label>
              </div>
              {formData.rotativo && (
                <div>
                  <Label className="text-sm sm:text-base">Semanas del ciclo (1-4)</Label>
                  <div className="flex gap-3 mt-1">
                    {[1,2,3,4].map((s)=>(
                      <label key={s} className="flex items-center gap-1 text-sm sm:text-base">
                        <input type="checkbox" checked={formData.semanas.includes(s)} onChange={()=>toggleSemana(s)} />
                        <span>{s}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        <DialogFooter className="pt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={()=>setOpen(false)} className="text-sm sm:text-base">Cancelar</Button>
          <Button type="submit" form="paqueteForm" className="text-sm sm:text-base" disabled={isLoading}>{isLoading ? "Guardando..." : (currentPaquete ? "Actualizar" : "Guardar")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
