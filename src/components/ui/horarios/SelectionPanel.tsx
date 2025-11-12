'use client'
import React from "react"
import { Label } from "../genericos/label"
import { Switch } from "../genericos/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../genericos/select"
import { PermissionButton } from "../genericos/PermissionButton"

export default function SelectionPanel({
  equipos, profesionales, equipoSeleccionado, profesionalSeleccionado,
  setEquipoSeleccionado, setProfesionalSeleccionado, verAnteriores, setVerAnteriores, onVerPaquetes
}: any) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {verAnteriores ? "Mostrando profesionales anteriores" : "Mostrando profesionales activos"}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="toggleAnteriores" className="text-xs sm:text-sm">Profesionales anteriores</Label>
          <Switch id="toggleAnteriores" checked={verAnteriores} onCheckedChange={setVerAnteriores} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <div className="space-y-2">
          <Label className="text-sm">Equipo</Label>
          <Select value={equipoSeleccionado} onValueChange={setEquipoSeleccionado}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un equipo" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-80 overflow-y-auto">
              {equipos.map((equipo: any) => (
                <SelectItem key={equipo.id} value={equipo.id.toString()}>
                  {equipo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Profesional</Label>
          <Select value={profesionalSeleccionado} onValueChange={setProfesionalSeleccionado} disabled={!equipoSeleccionado}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un profesional" />
            </SelectTrigger>
            <SelectContent position="popper">
              {profesionales.map((p: any) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.nombre} {p.apellido}
                  {p.fechaBaja && <span className="ml-2 text-xs text-red-600">(baja {new Date(p.fechaBaja).toLocaleDateString('es-AR')})</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {profesionalSeleccionado && (
        <div className="flex justify-end mt-3">
          <PermissionButton requiredPermission={{ entity: 'paquetehoras', action: 'read' }} onClick={onVerPaquetes} className="w-full sm:w-auto">
            Ver Paquetes
          </PermissionButton>
        </div>
      )}
    </div>
  )
}
