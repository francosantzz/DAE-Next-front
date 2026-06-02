"use client"

import { Badge } from "@/components/ui/genericos/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/genericos/dialog"

export type EscuelaCobertura = {
  id: number
  nombre: string
  cobertura: number
}

type ModalCoberturaEscuelasProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipoNombre?: string
  coberturaTotal?: number
  cargaGeiHoras?: number | null
  trabajoInterdisciplinarioHoras?: number | null
  escuelas?: EscuelaCobertura[]
  isLoading?: boolean
  errorMsg?: string | null
}

export function ModalCoberturaEscuelas({
  open,
  onOpenChange,
  equipoNombre = "",
  coberturaTotal = 0,
  cargaGeiHoras = null,
  trabajoInterdisciplinarioHoras = null,
  escuelas = [],
  isLoading = false,
  errorMsg = null,
}: ModalCoberturaEscuelasProps) {
  const conCobertura = escuelas.filter((e) => e.cobertura > 0).length
  const sinCobertura = escuelas.filter((e) => e.cobertura <= 0).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-xl flex-col gap-0 p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-5">
          <DialogTitle className="text-lg text-slate-900">
            Cobertura por escuela
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {equipoNombre
              ? `Equipo: ${equipoNombre}`
              : "Resumen del equipo seleccionado."}
          </DialogDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge
              variant="outline"
              className="border-sky-200 bg-sky-50 text-sky-700"
            >
              {escuelas.length} escuelas
            </Badge>
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              {conCobertura} con cobertura
            </Badge>
            <Badge
              variant="outline"
              className="border-rose-200 bg-rose-50 text-rose-700"
            >
              {sinCobertura} sin cobertura
            </Badge>
            <Badge
              variant="outline"
              className="border-violet-200 bg-violet-50 text-violet-700"
            >
              Cobertura total: {coberturaTotal}
            </Badge>
            <Badge
              variant="outline"
              className="border-indigo-200 bg-indigo-50 text-indigo-700"
            >
              Carga en GEI: {cargaGeiHoras ?? 0} hs
            </Badge>
            <Badge
              variant="outline"
              className="border-cyan-200 bg-cyan-50 text-cyan-700"
            >
              Trabajo Interdisciplinario: {trabajoInterdisciplinarioHoras ?? 0} hs
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {isLoading ? (
            <p className="text-sm text-slate-500">Cargando cobertura...</p>
          ) : errorMsg ? (
            <p className="text-sm text-rose-700">{errorMsg}</p>
          ) : escuelas.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay escuelas para mostrar cobertura.
            </p>
          ) : (
            escuelas.map((escuela) => (
              <div
                key={escuela.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {escuela.nombre}
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      escuela.cobertura > 0
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }
                  >
                    Cobertura: {escuela.cobertura}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
