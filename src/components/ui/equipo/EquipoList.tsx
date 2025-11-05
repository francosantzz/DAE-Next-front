'use client'

import { Accordion } from "@/components/ui/accordion"
import { Equipo } from "@/types/equipos"
import EquipoCard from "./EquipoCard"

type Props = {
  isLoading: boolean
  equipos: Equipo[]
}

export default function EquiposList({ isLoading, equipos }: Props) {
  if (isLoading) {
    return <p className="text-center py-4">Cargando equipos...</p>
  }
  if (!equipos.length) {
    return <p className="text-center py-4 bg-white rounded-lg shadow">No se encontraron equipos con los filtros aplicados.</p>
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <Accordion type="multiple" className="w-full">
        {equipos.map(equipo => (
          <EquipoCard key={equipo.id} equipo={equipo} />
        ))}
      </Accordion>
    </div>
  )
}
