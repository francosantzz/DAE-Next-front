"use client"

import { Button } from "@/components/ui/genericos/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import type { Equipo, Escuela, HorariosFormData } from "./types"
import type { WeeklyWorkload } from "./weeklyWorkload"
import { getWeeklyWorkloadStatus } from "./weeklyWorkload"

const EQUIPO_DAE_ID = 62

type DiaSemana = { value: string; label: string }

type Step4ResumenProps = {
  formData: HorariosFormData
  diasSemana: DiaSemana[]
  equipos: Equipo[]
  escuelasDisponibles: Map<number, Escuela[]>
  weeklyWorkloadMap: Record<number, WeeklyWorkload>
  getGeiHorasForEquipo: (id: number) => number
  isSubmitting?: boolean
  onSubmit?: () => void
}

export default function Step4Resumen({
  formData,
  diasSemana,
  equipos,
  escuelasDisponibles,
  weeklyWorkloadMap,
  getGeiHorasForEquipo,
  isSubmitting = false,
  onSubmit,
}: Step4ResumenProps) {
  const getDiaLabel = (value: string) =>
    diasSemana.find((d) => d.value === value)?.label ?? value ?? ""

  const getHoursFromSlot = (inicio: string, fin: string) => {
    if (!inicio || !fin) return null
    const [hIni, mIni] = inicio.split(":").map(Number)
    const [hFin, mFin] = fin.split(":").map(Number)
    if ([hIni, mIni, hFin, mFin].some((v) => Number.isNaN(v))) return null
    const ini = hIni * 60 + mIni
    const fi = hFin * 60 + mFin
    if (fi <= ini) return null
    const diff = fi - ini
    if (diff % 60 !== 0) return null
    return diff / 60
  }

  const getEscuelaNombre = (id: string, escuelasDelEquipo: Escuela[]) => {
    if (!id) return ""
    const match = escuelasDelEquipo.find((esc) => esc.id.toString() === id)
    if (!match) return `ID ${id}`
    return `${match.nombre}${match.Numero ? ` N° ${match.Numero}` : ""}`
  }

  const formatRotativoDetalle = (
    rotativo?: HorariosFormData["paquetes"][string]["escuelas"][number]["rotativo"],
  ) => {
    if (!rotativo?.esRotativo) return null

    if (rotativo.tipo === "porSemana") {
      const semanas = Array.isArray(rotativo.semanas) ? rotativo.semanas : []
      if (semanas.length === 0) return "Rotativo"
      return `Rotativo por semanas: ${semanas.map((semana) => `Semana ${semana}`).join(", ")}`
    }

    if (rotativo.tipo === "porCalendario") {
      const fechas = Array.isArray(rotativo.fechas) ? rotativo.fechas : []
      if (fechas.length === 0) return "Rotativo"
      return `Rotativo por fechas: ${fechas
        .map((fecha) => new Date(`${fecha}T00:00:00`).toLocaleDateString("es-AR"))
        .join(", ")}`
    }

    return "Rotativo"
  }

  const equiposSeleccionados = equipos.filter((eq) => formData.equiposIds.includes(eq.id))

  return (
    <div className="space-y-6">
      {/* Datos personales */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Nombre completo</div>
            <div className="font-medium text-slate-900">
              {formData.nombre} {formData.apellido}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Correo</div>
            <div className="font-medium text-slate-900">{formData.correo}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Teléfono</div>
            <div className="font-medium text-slate-900">{formData.telefono}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">DNI</div>
            <div className="font-medium text-slate-900">{formData.dni}</div>
          </div>
        </CardContent>
      </Card>

      {/* One summary card per equipo */}
      {equiposSeleccionados.map((equipo) => {
        const key = String(equipo.id)
        const paquetes = formData.paquetes[key]
        if (!paquetes) return null
        const isDAE = equipo.id === EQUIPO_DAE_ID
        const escuelasDelEquipo = escuelasDisponibles.get(equipo.id) ?? []
        const workload = weeklyWorkloadMap[equipo.id]
        const workloadStatus = workload ? getWeeklyWorkloadStatus(workload) : null
        const workloadStatusClass =
          workloadStatus?.tone === "error"
            ? "text-xs text-rose-600"
            : workloadStatus?.tone === "warn"
              ? "text-xs text-amber-700"
              : "text-xs text-slate-600"

        type ResumenItem = {
          tipo: string
          detalle?: string | null
          dia: string
          horaInicio: string
          horaFin: string
          horas: string
        }

        const items: ResumenItem[] = [
          ...(!isDAE
            ? [
                {
                  tipo: "Trabajo Interdisciplinario",
                  detalle: null,
                  dia: getDiaLabel(paquetes.interdisciplinario.diaSemana),
                  horaInicio: paquetes.interdisciplinario.horaInicio,
                  horaFin: paquetes.interdisciplinario.horaFin,
                  horas: "3",
                },
              ]
            : []),
          ...(!isDAE
            ? (Array.isArray(paquetes.gei) ? paquetes.gei : []).map((slot) => ({
                tipo: "Carga en GEI",
                detalle: null,
                dia: getDiaLabel(slot.diaSemana),
                horaInicio: slot.horaInicio,
                horaFin: slot.horaFin,
                horas: String(getHoursFromSlot(slot.horaInicio, slot.horaFin) ?? ""),
              }))
            : []),
          ...paquetes.escuelas.map((p) => ({
            tipo: `Escuela${p.escuelaId ? ` - ${getEscuelaNombre(p.escuelaId, escuelasDelEquipo)}` : ""}`,
            detalle: formatRotativoDetalle(p.rotativo),
            dia: getDiaLabel(p.diaSemana),
            horaInicio: p.horaInicio,
            horaFin: p.horaFin,
            horas: p.horas,
          })),
        ]

        return (
          <Card key={key} className="border-slate-200">
            <CardHeader>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <CardTitle className="text-base">{equipo.nombre}</CardTitle>
                {workloadStatus && (
                  <p className={workloadStatusClass}>{workloadStatus.text}</p>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase">
                <div className="col-span-4">Tipo</div>
                <div className="col-span-2">Día</div>
                <div className="col-span-2">Inicio</div>
                <div className="col-span-2">Fin</div>
                <div className="col-span-2">Horas</div>
              </div>
              <div className="space-y-2">
                {items.length === 0 && (
                  <p className="text-sm text-slate-500">Sin paquetes cargados.</p>
                )}
                {items.map((item, index) => (
                  <div
                    key={`${key}-item-${index}`}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 rounded-md border border-slate-200 p-3 text-sm text-slate-700"
                  >
                    <div className="sm:col-span-4">
                      <div className="font-medium text-slate-900">{item.tipo}</div>
                      {item.detalle && (
                        <div className="mt-1 text-xs text-blue-700">{item.detalle}</div>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <span className="sm:hidden text-xs text-slate-500 mr-2">Día:</span>
                      {item.dia || "-"}
                    </div>
                    <div className="sm:col-span-2">
                      <span className="sm:hidden text-xs text-slate-500 mr-2">Inicio:</span>
                      {item.horaInicio || "-"}
                    </div>
                    <div className="sm:col-span-2">
                      <span className="sm:hidden text-xs text-slate-500 mr-2">Fin:</span>
                      {item.horaFin || "-"}
                    </div>
                    <div className="sm:col-span-2">
                      <span className="sm:hidden text-xs text-slate-500 mr-2">Horas:</span>
                      {item.horas || "-"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      <div className="flex justify-end">
        <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Confirmar envío"}
        </Button>
      </div>
    </div>
  )
}
