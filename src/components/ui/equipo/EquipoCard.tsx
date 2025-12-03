// components/equipo/EquipoCard.tsx
'use client'

import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/genericos/accordion"
import { Badge } from "@/components/ui/genericos/badge"
import { Edit, Trash2, Eye } from "lucide-react"
import { Equipo } from "@/types/equipos"
import { PermissionButton } from "../genericos/PermissionButton"
import EquipoActions from "./EquipoActions"

type Props = {
  equipo: Equipo
  onView: (equipo: Equipo) => void
  onEdit: (equipo: Equipo) => void
  onDelete: (id: number) => void
}

export default function EquipoCard({ equipo, onView, onEdit, onDelete }: Props) {
  return (
    <AccordionItem value={String(equipo.id)}>
      <AccordionTrigger className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
          <span className="text-sm sm:text-base font-medium">{equipo.nombre}</span>
          <span className="text-xs sm:text-sm text-gray-500">
            {equipo.departamento?.nombre ? `Departamento: ${equipo.departamento.nombre}` : 'Sin departamento asignado'}
          </span>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 sm:px-6 py-4">
        <div className="space-y-4">
          <p className="text-sm">
            <strong>Departamento:</strong> {equipo.departamento?.nombre ?? 'Sin departamento asignado'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <strong>Profesionales:</strong>
              {(equipo.profesionales?.length ?? 0) > 0 ? (
                <ul className="list-disc pl-5 mt-2 space-y-2 text-sm">
                  {(equipo.profesionales ?? []).map((p) => (
                    <li key={p.id} className="flex items-center gap-2">
                      <span>{p.nombre} {p.apellido}</span>
                      {!p.disponible && (
                        <Badge variant="outline" className="text-[11px] bg-orange-50 text-orange-700 border-orange-200">
                          En Licencia
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-600 mt-1">No hay profesionales asignados</p>}
            </div>

            <div>
              <strong>Escuelas:</strong>
              {(equipo.escuelas?.length ?? 0) > 0 ? (
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                  {(equipo.escuelas ?? []).map((e) => (
                    <li key={e.id}>{e.nombre} Nº {e.Numero}</li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-600 mt-1">No hay escuelas asignadas</p>}
            </div>
          </div>

          <p className="text-sm"><strong>Horas totales del Equipo:</strong> {equipo.totalHoras ?? 0}</p>
           <EquipoActions
           equipo={equipo}
           onDelete={() => onDelete(equipo.id)}
           onEdit={() => onEdit(equipo)}
           onView={() => onView(equipo)}
           />
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
