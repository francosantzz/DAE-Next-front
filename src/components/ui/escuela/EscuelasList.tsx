'use client'

import { Accordion } from '@/components/ui/genericos/accordion'
import { EscuelaCard } from './EscuelaCard'
import type { Escuela } from '@/hooks/useEscuelas'

type Props = {
  isLoading: boolean
  escuelas: Escuela[]
  onView: (e: Escuela) => void
  onEdit: (e: Escuela) => void
  onDelete: (id: number) => void
}

export function EscuelasList({ isLoading, escuelas, onView, onEdit, onDelete }: Props) {
  if (isLoading) return <p className="text-center py-4">Cargando escuelas...</p>
  if (!escuelas.length) return <p className="text-center py-4 bg-white rounded-lg shadow">No se encontraron escuelas.</p>

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <Accordion type="multiple" className="w-full">
        {escuelas.map((esc) => (
          <EscuelaCard
            key={esc.id}
            escuela={esc}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </Accordion>
    </div>
  )
}
