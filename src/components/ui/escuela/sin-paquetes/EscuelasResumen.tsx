// components/ui/escuelas/EscuelasResumen.tsx
"use client"

import { Info } from "lucide-react"
import { Badge } from "@/components/ui/genericos/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import { Button } from "@/components/ui/genericos/button"
import { cn } from "@/lib/utils"
import type { useEscuelasSinPaquetes } from "@/hooks/useEscuelasSinPaquetes"

type Props = {
  state: ReturnType<typeof useEscuelasSinPaquetes>
}

export default function EscuelasResumen({ state }: Props) {
  const { isLoading, totalGlobal, grupos, abrirDetalleDepto } = state

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
          Resumen
          <Info className="h-5 w-5 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="rounded-full border-gray-400 px-3 py-1.5 text-base"
          >
            Total sin cubrir
          </Badge>
          <span className="text-3xl font-bold">
            {isLoading ? "…" : totalGlobal}
          </span>
        </div>

        <div className="max-h-[220px] overflow-auto pr-1 sm:max-h-[260px]">
          <div className="divide-y">
            {grupos.map((g) => (
              <div
                key={g.departamentoNombre}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm font-medium",
                      g.colorClass,
                    )}
                  >
                    {g.departamentoNombre}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-full px-3 py-1 text-sm"
                  >
                    {g.total}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => abrirDetalleDepto(g)}
                  >
                    Ver detalle
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
