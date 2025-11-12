'use client'

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/genericos/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/genericos/card'
import { Badge } from '@/components/ui/genericos/badge'
import { Button } from '@/components/ui/genericos/button'
import { Loader2, School, MapPin, Users, Clock, Plus, Pencil, Trash2 } from 'lucide-react'
import type { EscuelaDetallada } from '@/types/dto/EscuelaDetallada.interface'
import { ObservacionesEditor } from '@/components/ui/escuela/observaciones-editor'
import { EstadoFisicoCard } from '@/components/ui/escuela/estado-fisico-card'
import ObservacionesPanel from './ObservacionesPanel'
import { PermissionButton } from '../genericos/PermissionButton'

type Props = {
  escuela: EscuelaDetallada | null
  isOpen: boolean
  onClose: () => void
  isLoading?: boolean

  // handlers que vienen del VM (useEscuelas)
  onObservacionesUpdated: (newObs: string) => void
  onAddAnexo: () => void
  onEditAnexo: (anexo: { id: number; nombre: string; matricula: number | string }) => void
  onDeleteAnexo: (anexoId: number) => void
}

export function DetalleEscuelaDialog({
  escuela, isOpen, onClose, isLoading = false,
  onObservacionesUpdated, onAddAnexo, onEditAnexo, onDeleteAnexo
}: Props) {
  if (!escuela && !isLoading) return null

  const dir = escuela?.direccion
  const paquetes = escuela?.paquetesHoras ?? []
  const totalHoras = paquetes.reduce((a,p)=> a + Number(p.cantidad ?? 0), 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] h-[90vh] sm:max-w-[1000px] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <School className="h-6 w-6 text-indigo-600" />
            {isLoading ? 'Cargando escuela…' : escuela?.nombre}
          </DialogTitle>
          <DialogDescription>
            {isLoading ? 'Obteniendo información detallada…' : 'Información detallada de la escuela'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" />
            <p>Cargando…</p>
          </div>
        ) : escuela ? (
          <div className="space-y-6">
            {/* General */}
            <Card className="border-0 bg-gradient-to-r from-indigo-50 to-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">Información General</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p><strong>Número:</strong> {escuela.Numero ?? '—'}</p>
                <p><strong>CUE:</strong> {escuela.CUE ?? '—'}</p>
                <p><strong>Teléfono:</strong> {escuela.telefono ?? '—'}</p>
                <p><strong>Matrícula:</strong> {escuela.matricula ?? '—'}</p>
                <p><strong>Ámbito:</strong> {escuela.Ambito ?? '—'}</p>
                <p><strong>Equipo:</strong> {escuela.equipo?.nombre ?? 'No asignado'}</p>
                <p className="col-span-full flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span><strong>Dirección:</strong> {dir?.calle} {dir?.numero} — {dir?.departamento?.nombre ?? '—'}</span>
                </p>
                <div className="col-span-full">
                  <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                    Total horas: {totalHoras}h
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Observaciones: Estado + Editor */}
            <ObservacionesPanel
              escuelaId={escuela.id}
              observaciones={escuela.observaciones}
              onObservacionesUpdated={onObservacionesUpdated}
            />

            {/* Anexos con ABM */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Anexos</CardTitle>
                <PermissionButton 
                  requiredPermission={{entity: 'anexo', action: 'create'}}
                  onClick={onAddAnexo} size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Agregar
                </PermissionButton>
              </CardHeader>
              <CardContent>
                {(escuela.anexos?.length ?? 0) > 0 ? (
                  <ul className="divide-y">
                    {escuela.anexos!.map(a => (
                      <li key={a.id} className="py-2 flex items-center justify-between text-sm">
                        <div>
                          <div className="font-medium">{a.nombre}</div>
                          <div className="text-gray-600">Matrícula: {a.matricula}</div>
                        </div>
                        <div className="flex gap-2">
                          <PermissionButton 
                          requiredPermission={{entity: 'anexo', action: 'update'}}
                          variant="outline" size="sm" onClick={() => onEditAnexo(a)}>
                            <Pencil className="mr-1 h-4 w-4" /> Editar
                          </PermissionButton>
                          <PermissionButton
                          requiredPermission={{entity: 'anexo', action: 'delete'}}
                          variant="destructive" size="sm" onClick={() => onDeleteAnexo(a.id)}>
                            <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                          </PermissionButton>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">No hay anexos.</p>
                )}
              </CardContent>
            </Card>

            {/* Paquetes de horas (igual que antes) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> Paquetes de horas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paquetes.length ? (
                  <ul className="space-y-2 text-sm">
                    {paquetes.map((p) => {
                      const enLic = p.profesional?.licenciaActiva &&
                        p.profesional?.fechaFinLicencia &&
                        new Date(p.profesional.fechaFinLicencia) >= new Date()
                      const d = p.dias || {}
                      const hI = (d.horaInicio || '').slice(0, 5)
                      const hF = (d.horaFin || '').slice(0, 5)
                      const dia = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][Number(d.diaSemana)] || '—'

                      return (
                        <li key={p.id} className={enLic ? 'text-orange-600' : ''}>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{p.cantidad} h</span>
                            <span>— {p.profesional?.nombre} {p.profesional?.apellido}</span>
                            {enLic && (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                En licencia
                              </Badge>
                            )}
                          </div>
                          {(hI || hF) && (
                            <div className={`text-xs mt-0.5 flex items-center gap-1 ${enLic ? 'text-orange-600' : 'text-gray-600'}`}>
                              <Clock className="h-3 w-3" />
                              <span>{dia} {hI}–{hF}{d.rotativo ? ' (Rotativo)' : ''}</span>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">No hay paquetes de horas.</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
