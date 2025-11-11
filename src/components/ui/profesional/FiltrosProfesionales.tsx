// components/profesionales/ProfesionalesFilters.tsx
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { Button } from '@/components/ui/button'

type VM = ReturnType<typeof import('@/hooks/useProfesional').useProfesional>

type Props = { vm: VM }

export default function FiltrosProfesionales({ vm }: Props) {
  const {
    filtroNombre, setFiltroNombre,
    filtroEquipo, setFiltroEquipo,
    filtroDepartamento, setFiltroDepartamento,
    equipos, departamentos,
    setIsDialogOpen,     // 👈 agregamos este método del hook
    setCurrentProfesional // 👈 para asegurarnos que se abra vacío
  } = vm

  const handleAgregarProfesional = () => {
    setCurrentProfesional(null) // limpiamos cualquier profesional seleccionado
    setIsDialogOpen(true)       // abrimos el modal del form
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div>
          <Label htmlFor="filtroNombre">Filtrar por nombre</Label>
          <Input
            id="filtroNombre"
            placeholder="Nombre del profesional"
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
            className="h-10"
          />
        </div>

        <div>
          <Label htmlFor="filtroEquipo">Filtrar por equipo</Label>
          <Select onValueChange={(v) => setFiltroEquipo(v as any)} value={filtroEquipo}>
            <SelectTrigger id="filtroEquipo" className="h-10">
              <SelectValue placeholder="Selecciona un equipo" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              <ScrollArea className="h-[200px]">
                <SelectItem value="todos">Todos los equipos</SelectItem>
                {equipos.map((eq) => (
                  <SelectItem key={eq.id} value={String(eq.id)}>
                    {eq.nombre}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="filtroDepartamento">Filtrar por departamento</Label>
          <Select onValueChange={(v) => setFiltroDepartamento(v as any)} value={filtroDepartamento}>
            <SelectTrigger id="filtroDepartamento" className="h-10">
              <SelectValue placeholder="Selecciona un departamento" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              <ScrollArea className="h-[200px]">
                <SelectItem value="todos">Todos los departamentos</SelectItem>
                {departamentos.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        {/* Botón de crear profesional */}
        <div className="flex items-end">
          <Button onClick={handleAgregarProfesional} className="w-full">
            Agregar Profesional
          </Button>
        </div>
      </div>
    </div>
  )
}
