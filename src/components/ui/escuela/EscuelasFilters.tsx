
// ==============================================================
// components/ui/escuela/EscuelasFilters.tsx
// ==============================================================
'use client'

import { Input } from "@/components/ui/genericos/input"
import { Label } from "@/components/ui/genericos/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/genericos/select"
import { EquipoMuyShortResponseDto } from "@/types/dto/EquipoShort.dto"
import * as React from "react"

export function EscuelasFilters({
  busqueda,
  setBusqueda,
  equipos,
  filtroEquipo,
  setFiltroEquipo,
  filtroSinPaquetes,
  setFiltroSinPaquetes,
}: {
  busqueda: string
  setBusqueda: (v: string) => void
  equipos: EquipoMuyShortResponseDto[]
  filtroEquipo: string
  setFiltroEquipo: (v: string) => void
  filtroSinPaquetes: boolean
  setFiltroSinPaquetes: (v: boolean) => void
}) {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <Label htmlFor="busqueda">Filtrar por nombre o número de escuela</Label>
          <Input
            id="busqueda"
            placeholder="Nombre/Número de la escuela"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-10"
          />
        </div>

        <div>
          <Label htmlFor="filtroEquipo">Filtrar por equipo</Label>
          <Select onValueChange={setFiltroEquipo} value={filtroEquipo}>
            <SelectTrigger id="filtroEquipo" className="h-10">
              <SelectValue placeholder="Selecciona un equipo" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              <SelectItem value="todos">Todos los equipos</SelectItem>
              {equipos.map((equipo) => (
                <SelectItem key={equipo.id} value={equipo.id.toString()}>
                  {equipo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 sm:justify-start pt-6 sm:pt-7">
          <input
            type="checkbox"
            id="filtroSinPaquetes"
            checked={filtroSinPaquetes}
            onChange={(e) => setFiltroSinPaquetes(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <Label htmlFor="filtroSinPaquetes" className="text-sm font-medium text-gray-700">
            Mostrar sólo escuelas SIN profesionales
          </Label>
        </div>
      </div>
    </div>
  )
}
