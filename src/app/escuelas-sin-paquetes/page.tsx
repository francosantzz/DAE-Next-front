// app/.../EscuelasSinPaquetesPage.tsx (o donde tengas la page)
"use client"

import DeptoDetalleDialog from "@/components/ui/escuela/sin-paquetes/DptoDetalleDialog"
import EscuelasFilters from "@/components/ui/escuela/sin-paquetes/EscuelasFilters"
import EscuelasGrupos from "@/components/ui/escuela/sin-paquetes/EscuelasGrupos"
import EscuelasResumen from "@/components/ui/escuela/sin-paquetes/EscuelasResumen"
import { ProtectedRoute } from "@/components/ui/genericos/ProtectedRoute"
import { Button } from "@/components/ui/genericos/button"
import { useEscuelasSinPaquetes } from "@/hooks/useEscuelasSinPaquetes"

export default function EscuelasSinPaquetes() {
  const s = useEscuelasSinPaquetes()

  return (
    <ProtectedRoute requiredPermission={{ entity: "escuela", action: "read" }}>
      <div className="space-y-4 p-4 md:p-8">
        {/* FILTROS + RESUMEN */}
        <div className="space-y-4">
          <EscuelasFilters state={s} />
          <EscuelasResumen state={s} />
        </div>

        {/* LISTA AGRUPADA */}
        <EscuelasGrupos state={s} />

        {/* PAGINACIÓN GLOBAL */}
        {(s.totalPages ?? 1) > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => s.setPage((p) => Math.max(1, p - 1))}
              disabled={s.page === 1}
            >
              Anterior
            </Button>
            <div className="text-sm text-muted-foreground md:text-base">
              Página <strong>{s.page}</strong> de{" "}
              <strong>{s.totalPages ?? "…"}</strong>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                s.setPage((p) =>
                  s.totalPages ? Math.min(s.totalPages, p + 1) : p + 1,
                )
              }
              disabled={!!s.totalPages && s.page >= s.totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}

        {/* DIALOGO DETALLE DEPTO */}
        <DeptoDetalleDialog state={s} />
      </div>
    </ProtectedRoute>
  )
}
