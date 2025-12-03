'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import { Badge } from "@/components/ui/genericos/badge"
import { determinarEstado, getIconAndColor } from "@/components/ui/escuela/estado-fisico-card"
import { ObservacionesEditor } from "@/components/ui/escuela/observaciones-editor"

type Props = {
  escuelaId: number
  observaciones?: string
  onObservacionesUpdated: (newObs: string) => void
}

export default function ObservacionesPanel({ escuelaId, observaciones, onObservacionesUpdated }: Props) {
  const { estado, label } = determinarEstado(observaciones)
  const { color, badgeColor } = getIconAndColor(estado)

  return (
    <Card>
      <CardHeader className="p-0">
      <div className="flex items-center justify-between p-6 border-b bg-white">
        <CardTitle className="flex items-center gap-2">
          <span>Observaciones</span>
        </CardTitle>
        <Badge className={badgeColor}>{label}</Badge>
        </div>
      </CardHeader >
      <CardContent className="p-4">
        <ObservacionesEditor
          escuelaId={escuelaId}
          observaciones={observaciones}
          onObservacionesUpdated={onObservacionesUpdated}
        />
      </CardContent>
    </Card>
  )
}
