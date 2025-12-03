// components/ui/escuelas/DeptoDetalleDialog.tsx
"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/genericos/dialog"
import { Badge } from "@/components/ui/genericos/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import { cn } from "@/lib/utils"
import type { useEscuelasSinPaquetes } from "@/hooks/useEscuelasSinPaquetes"
import { borderForEquipo } from "@/hooks/useEscuelasSinPaquetes"

type Props = {
  state: ReturnType<typeof useEscuelasSinPaquetes>
}

export default function DeptoDetalleDialog({ state }: Props) {
  const { deptDetalleAbierto, setDeptDetalleAbierto, deptDetalle } = state 

  // pequeño truco: el hook no expone directamente setDeptDetalleAbierto,
  // así que lo podés exponer en el hook si preferís algo más typed:
  //   const [deptDetalleAbierto, setDeptDetalleAbierto] = useState(false)
  //   return { ..., deptDetalleAbierto, setDeptDetalleAbierto, ... }

  return (
    <Dialog
      open={deptDetalleAbierto}
      onOpenChange={setDeptDetalleAbierto}
    >
      <DialogContent className="h-[90vh] w-[95vw] overflow-y-auto sm:h-auto sm:max-h-[85vh] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {deptDetalle ? (
              <>
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm font-semibold",
                    deptDetalle.colorClass,
                  )}
                >
                  {deptDetalle.departamentoNombre}
                </span>
                <Badge className="rounded-full px-3 py-1 text-base">
                  {deptDetalle.total} sin cubrir
                </Badge>
              </>
            ) : (
              "Detalle"
            )}
          </DialogTitle>
        </DialogHeader>

        {deptDetalle && (
          <div className="space-y-4">
            {deptDetalle.grupos.map((g) => (
              <Card
                key={g.equipoId ?? "null"}
                className={cn("border", borderForEquipo(g.equipoNombre))}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                    <Badge
                      variant="outline"
                      className="rounded-md border-primary px-2 py-0.5 text-xs sm:text-sm text-primary"
                    >
                      {g.equipoNombre}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="rounded-md px-2 py-0.5 text-xs sm:text-sm"
                    >
                      {g.escuelas.length} escuelas
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 pl-5">
                    {g.escuelas.map((e) => (
                      <li key={e.id} className="list-disc text-base">
                        {e.nombre}
                        {e.Numero ? ` — Anexo ${e.Numero}` : ""}
                        {e.observaciones && (
                          <span className="text-sm text-muted-foreground">
                            {" "}
                            — {e.observaciones}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
