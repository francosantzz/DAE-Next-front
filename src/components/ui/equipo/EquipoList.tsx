// components/equipo/EquiposList.tsx
'use client'

import { Accordion } from "@/components/ui/accordion"
import EquipoCard from "./EquipoCard"
import { Equipo } from "@/types/equipos"

type Props = {
  isLoading: boolean
  equipos: Equipo[]
  onView: (equipo: Equipo) => void
  onEdit: (equipo: Equipo) => void
  onDelete: (id: number) => void
}

export default function EquiposList({ isLoading, equipos, onView, onEdit, onDelete }: Props) {
  if (isLoading) return <p className="text-center py-4">Cargando equipos...</p>
  if (!equipos.length) return <p className="text-center py-4 bg-white rounded-lg shadow">No se encontraron equipos.</p>

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <Accordion type="multiple" className="w-full">
        {equipos.map((equipo) => (
          <EquipoCard
            key={equipo.id}
            equipo={equipo}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </Accordion>
    </div>
  )
}
