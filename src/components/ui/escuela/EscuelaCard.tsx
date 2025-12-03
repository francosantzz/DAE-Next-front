'use client'

import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/genericos/accordion'
import { Badge } from '@/components/ui/genericos/badge'
import { Eye, Edit, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/genericos/button'
import type { Escuela } from '@/hooks/useEscuelas'
import { determinarEstado, getIconAndColor } from './estado-fisico-card'
import PaquetesResumen from './PaquetesResumen'
import EscuelaActions from './EscuelaActions'

type Props = {
  escuela: Escuela
  onView: (e: Escuela) => void
  onEdit: (e: Escuela) => void
  onDelete: (id: number) => void
}

export function EscuelaCard({ escuela, onView, onEdit, onDelete }: Props) {
  const totalHoras = (escuela.paquetesHoras ?? []).reduce((a, p) => a + Number(p.cantidad ?? 0), 0)
  const horasLic = (escuela.paquetesHoras ?? []).filter(p => {
    const pr = p.profesional
    return pr?.licenciaActiva && pr?.fechaFinLicencia && new Date(pr.fechaFinLicencia) >= new Date()
  }).reduce((a,p) => a + Number(p.cantidad ?? 0), 0)
  const { estado, label } = determinarEstado(escuela.observaciones)
  const { badgeColor } = getIconAndColor(estado)

  return (
    <AccordionItem value={String(escuela.id)}>
      <AccordionTrigger className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-base font-medium">
              {escuela.nombre}{escuela.Numero ? ` - ${escuela.Numero}` : ''}
            </span>
            {estado !== 'sin-info' && (
              <Badge className={badgeColor}>{label}</Badge>
            )}
            {totalHoras === 0 ? (
              <Badge variant="destructive" className="w-fit flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Sin profesionales
              </Badge>
            ) : (
              <>
                <Badge variant="outline" className="w-fit border-green-500 text-green-700 bg-green-50">
                  {totalHoras - horasLic}h cubiertas
                </Badge>
                {horasLic > 0 && (
                  <Badge variant="outline" className="w-fit border-orange-500 text-orange-700 bg-orange-50">
                    {horasLic}h en licencia
                  </Badge>
                )}
              </>
            )}
          </div>

          <span className="text-xs sm:text-sm text-gray-500">
            {escuela.equipo ? `Equipo: ${escuela.equipo.nombre}` : 'Sin equipo asignado'}
          </span>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 sm:px-6 py-4">
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p><strong>Dirección:</strong> {escuela?.direccion?.calle} {escuela?.direccion?.numero}</p>
            <p><strong>Departamento:</strong> {escuela?.direccion?.departamento?.nombre ?? '—'}</p>
          </div>

          {!!escuela.observaciones && (
            <div>
              <strong>Observaciones:</strong>
              <p className="mt-1 text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                {escuela.observaciones.length > 150 ? `${escuela.observaciones.slice(0,150)}…` : escuela.observaciones}
              </p>
            </div>
          )}
          <div>
            <strong>Paquetes de Horas:</strong>
            <PaquetesResumen
              paquetes={escuela.paquetesHoras}
              onVerTodos={() => onView(escuela)}
              max={3}           // podés cambiar
              soloSemana1={false} // poné true si querés el criterio de semana 1
            />
          </div>
          <EscuelaActions
            escuela={escuela}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            compact={window.innerWidth < 640}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
