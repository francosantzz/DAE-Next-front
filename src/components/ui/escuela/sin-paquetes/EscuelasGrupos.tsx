// components/ui/escuelas/EscuelasGrupos.tsx
"use client"

import { AlertTriangle, CheckCircle2, Loader2, Save, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/genericos/badge"
import { Button } from "@/components/ui/genericos/button"
import { Card, CardContent } from "@/components/ui/genericos/card"
import { Label } from "@/components/ui/genericos/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/genericos/table"
import { Textarea } from "@/components/ui/genericos/textarea"
import { cn } from "@/lib/utils"
import type { useEscuelasSinPaquetes } from "@/hooks/useEscuelasSinPaquetes"
import { borderForEquipo } from "@/hooks/useEscuelasSinPaquetes"

type Props = {
  state: ReturnType<typeof useEscuelasSinPaquetes>
}

export default function EscuelasGrupos({ state }: Props) {
  const {
    isLoading,
    grupos,
    equipoMetrics,
    soloEquiposBajo4,
    soloSinPaquetes,
    obsByEquipo,
    onChangeObs,
    saveObservacionEquipo,
    savingEquipo,
    savedEquipoOk,
    abrirDetalleDepto,
  } = state

  const labelEscuela = soloSinPaquetes ? "Escuela sin cubrir" : "Escuela del equipo"

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando…
        </CardContent>
      </Card>
    )
  }

  if (!grupos.length) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="py-16 text-center">
          No se encontraron escuelas con los filtros aplicados.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="divide-y">
          {grupos.map((dep) => (
            <section key={dep.departamentoNombre} className="p-4">
              <header className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-base font-semibold",
                      dep.colorClass,
                    )}
                  >
                    {dep.departamentoNombre}
                  </span>
                  <Badge className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                    {dep.total} sin cubrir
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => abrirDetalleDepto(dep)}
                >
                  Ver detalle
                </Button>
              </header>

              {/* Grupos por equipo */}
              <div className="space-y-3">
                {(soloEquiposBajo4
                  ? dep.grupos.filter((g) => {
                      if (g.equipoId == null) return true
                      const m = equipoMetrics[g.equipoId]
                      return m?.loaded ? m.promedio < 4 : true
                    })
                  : dep.grupos
                ).map((g) => {
                  const key = String(g.equipoId ?? "null")
                  const saving = !!savingEquipo[key]
                  const saved = savedEquipoOk[key]
                  const metric =
                    typeof g.equipoId === "number"
                      ? equipoMetrics[g.equipoId]
                      : undefined

                  return (
                    <div
                      key={key}
                      className={cn(
                        "overflow-hidden rounded-md border bg-card",
                        borderForEquipo(g.equipoNombre),
                      )}
                    >
                      {/* Header equipo */}
                      <div className="relative flex flex-col gap-2 border-b pl-3 pr-2 py-2 md:flex-row md:items-center md:justify-between">
                        <div className="absolute left-0 top-0 h-full w-1 bg-primary/60" />
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="rounded-md border-primary px-2 py-0.5 text-sm text-primary"
                          >
                            {g.equipoNombre}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="rounded-md px-2 py-0.5 text-sm"
                          >
                            {g.escuelas.length} escuelas
                          </Badge>

                          {typeof g.equipoId === "number" && (
                            <>
                              {!metric?.loaded ? (
                                <Badge
                                  variant="outline"
                                  className="rounded-md border-dashed px-2 py-0.5 text-xs"
                                >
                                  calc. promedio…
                                </Badge>
                              ) : (
                                (() => {
                                  const avg = metric.promedio
                                  const critico = avg < 4
                                  const cercano = avg >= 4 && avg < 5
                                  return (
                                    <div className="flex items-center gap-1">
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "rounded-md px-2 py-0.5 text-xs font-semibold",
                                          critico
                                            ? "border-rose-400 bg-rose-50 text-rose-700"
                                            : cercano
                                            ? "border-amber-400 bg-amber-50 text-amber-700"
                                            : "border-emerald-400 bg-emerald-50 text-emerald-700",
                                        )}
                                        title="Promedio de horas en escuelas (semana 1)"
                                      >
                                        Prom.: {avg.toFixed(1)}h/esc
                                      </Badge>
                                      {critico && (
                                        <Badge
                                          variant="destructive"
                                          className="rounded-md px-2 py-0.5 text-xs"
                                        >
                                          <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                                          Bajo 4h
                                        </Badge>
                                      )}
                                    </div>
                                  )
                                })()
                              )}
                            </>
                          )}
                        </div>

                        {/* Observación equipo */}
                        <div className="w-full md:w-[48%]">
                          <Label className="text-[11px]">
                            Observación de la sección
                          </Label>
                          <div className="mt-1 flex gap-1">
                            <Textarea
                              value={obsByEquipo[key] ?? g.observaciones ?? ""}
                              onChange={(e) =>
                                onChangeObs(g.equipoId, e.target.value)
                              }
                              className="min-h-[48px] py-2 text-sm"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-9 w-9 shrink-0 self-start"
                              onClick={() => saveObservacionEquipo(g.equipoId)}
                              disabled={saving}
                              title="Guardar observación"
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {saved === "ok" && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Guardado
                            </div>
                          )}
                          {saved === "err" && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-700">
                              <XCircle className="h-3 w-3" />
                              No se pudo guardar. Quedó local.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* MOBILE cards */}
                      <div className="p-2 md:hidden">
                        <ul className="space-y-2">
                          {g.escuelas.map((e) => {
                            const sinPaquete = !e.cubierta

                            return (
                              <li
                                key={e.id}
                                className="rounded-lg border p-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={cn(
                                      "shrink-0 rounded border px-2 py-0.5 text-[11px]",
                                      dep.colorClass,
                                    )}
                                  >
                                    {e.direccion?.departamento?.nombre || "-"}
                                  </span>
                                  <span className="truncate text-xs text-muted-foreground">
                                    {g.equipoNombre}
                                  </span>
                                </div>
                                <div className="mt-1 text-sm font-medium line-clamp-2">
                                  {e.nombre}
                                </div>
                                <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
                                  <span>
                                    Anexo: {e.Numero || "—"}
                                  </span>
                                  <span>
                                    {sinPaquete ? (
                                      <Badge
                                        variant="destructive"
                                        className="px-2 py-0.5 text-[11px]"
                                      >
                                        Sin cubrir
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="border-emerald-400 text-emerald-700 bg-emerald-50"
                                      >
                                        Cubierta
                                      </Badge>
                                    )}
                                  </span>
                                </div>
                                {e.observaciones && (
                                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                    {e.observaciones}
                                  </div>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </div>

                      {/* DESKTOP tabla */}
                      <div className="hidden p-2 md:block">
                        <Table className="[&_th]:py-2 [&_td]:py-1.5 [&_th]:text-xs [&_td]:text-sm [&_td]:align-middle">
                          <TableHeader>
                            <TableRow className="h-9">
                              <TableHead className="w-[160px]">
                                Departamento
                              </TableHead>
                              <TableHead className="w-[200px]">
                                Equipo
                              </TableHead>
                              <TableHead>{labelEscuela}</TableHead>
                              <TableHead className="w-[90px]">
                                Nº anexo
                              </TableHead>
                              <TableHead className="w-[120px]">
                                Estado
                              </TableHead>
                              <TableHead>Obs. (lectura)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {g.escuelas.map((e) => {
                              const sinPaquete = !e.cubierta

                              return (
                                <TableRow key={e.id} className="h-9">
                                  <TableCell className="whitespace-nowrap">
                                    <span
                                      className={cn(
                                        "rounded border px-2 py-0.5 text-[11px]",
                                        dep.colorClass,
                                      )}
                                    >
                                      {e.direccion?.departamento?.nombre || "-"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {g.equipoNombre}
                                  </TableCell>
                                  <TableCell className="truncate">
                                    {e.nombre}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {e.Numero || ""}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {sinPaquete ? (
                                      <Badge
                                        variant="destructive"
                                        className="px-2 py-0.5 text-[11px]"
                                      >
                                        Sin cubrir
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="border-emerald-400 text-emerald-700 bg-emerald-50"
                                      >
                                        Cubierta
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {e.observaciones || (
                                      <span className="text-xs italic">—</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
