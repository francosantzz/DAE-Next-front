"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/genericos/badge"
import { Button } from "@/components/ui/genericos/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import { Input } from "@/components/ui/genericos/input"
import { Label } from "@/components/ui/genericos/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/genericos/select"
import { X } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"
import type { Equipo, HorariosFormData } from "./types"

type Step2DatosPersonalesProps = {
  formData: HorariosFormData
  setFormData: Dispatch<SetStateAction<HorariosFormData>>
  equipos: Equipo[]
  isEquiposLoading?: boolean
  equiposErrorMsg?: string | null
}

export default function Step2DatosPersonales({
  formData,
  setFormData,
  equipos,
  isEquiposLoading = false,
  equiposErrorMsg = null,
}: Step2DatosPersonalesProps) {
  const [equipoQuery, setEquipoQuery] = useState("")
  const equiposFiltrados = equipos
    .filter((eq) => !formData.equiposIds.includes(eq.id))
    .filter((eq) => eq.nombre.toLowerCase().includes(equipoQuery.trim().toLowerCase()))
  const equiposSeleccionados = equipos.filter((eq) => formData.equiposIds.includes(eq.id))

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">Cargos y secciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">Secciones</h3>
          <Select
            value=""
            onValueChange={(value) => {
              const id = Number(value)
              if (!id) return
              setFormData((p) => {
                if (p.equiposIds.includes(id)) return p
                return { ...p, equiposIds: [...p.equiposIds, id] }
              })
              setEquipoQuery("")
            }}
          >
            <SelectTrigger id="equiposIds" disabled={isEquiposLoading}>
              <SelectValue placeholder="Agregar sección" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              <div className="px-2 py-1.5">
                <Input
                  placeholder="Buscar sección..."
                  value={equipoQuery}
                  onChange={(e) => setEquipoQuery(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="h-8"
                />
              </div>
              {isEquiposLoading ? (
                <div className="px-2 py-2 text-xs text-slate-500">Cargando secciones...</div>
              ) : equiposErrorMsg ? (
                <div className="px-2 py-2 text-xs text-rose-600">{equiposErrorMsg}</div>
              ) : equiposFiltrados.length === 0 ? (
                <div className="px-2 py-2 text-xs text-slate-500">Sin resultados.</div>
              ) : (
                equiposFiltrados.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id.toString()}>
                    {eq.nombre}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {formData.equiposIds.length === 0 && (
              <span className="text-xs text-slate-500">No hay secciones seleccionadas.</span>
            )}
            {formData.equiposIds.map((id) => {
              const eq = equipos.find((e) => e.id === id)
              return (
                <Badge key={id} variant="secondary" className="flex items-center gap-1">
                  <span>{eq?.nombre ?? `ID ${id}`}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        equiposIds: p.equiposIds.filter((eid) => eid !== id),
                        cargos: p.cargos.map((cargo) =>
                          cargo.equipoId === id.toString() ? { ...cargo, equipoId: "" } : cargo,
                        ),
                      }))
                    }
                    className="ml-1 rounded hover:bg-slate-200 p-0.5"
                    aria-label="Quitar sección"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
          </div>
          {equiposErrorMsg && <p className="text-xs text-rose-600">{equiposErrorMsg}</p>}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800">Cargos horarios</h3>
        </div>
        <div className="space-y-3">
          {formData.cargos.map((cargo, index) => (
            <div key={`cargo-${index}`} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`cargo-tipo-${index}`}>Cargo</Label>
                <Select
                  value={cargo.tipo}
                  onValueChange={(value) =>
                    setFormData((p) => {
                      const next = [...p.cargos]
                      next[index] = { ...next[index], tipo: value }
                      return { ...p, cargos: next }
                    })
                  }
                >
                  <SelectTrigger id={`cargo-tipo-${index}`}>
                    <SelectValue placeholder="Seleccione un cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investigacion">Investigación</SelectItem>
                    <SelectItem value="mision-especial-primaria">Misión especial Primaria</SelectItem>
                    <SelectItem value="mision-especial-secundaria">Misión especial Secundaria</SelectItem>
                    <SelectItem value="mision-especial">Misión especial</SelectItem>
                    <SelectItem value="regimen-27">Régimen 27</SelectItem>
                    <SelectItem value="regimen-5">Régimen 5</SelectItem>
                    <SelectItem value="horas-comunes">Horas comunes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`cargo-cantidad-${index}`}>Cantidad</Label>
                <Input
                  id={`cargo-cantidad-${index}`}
                  type="number"
                  min="0"
                  value={cargo.cantidad}
                  onChange={(e) =>
                    setFormData((p) => {
                      const next = [...p.cargos]
                      next[index] = { ...next[index], cantidad: e.target.value }
                      return { ...p, cargos: next }
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor={`cargo-equipo-${index}`}>Sección</Label>
                <Select
                  value={cargo.equipoId}
                  onValueChange={(value) =>
                    setFormData((p) => {
                      const next = [...p.cargos]
                      next[index] = { ...next[index], equipoId: value }
                      return { ...p, cargos: next }
                    })
                  }
                >
                  <SelectTrigger
                    id={`cargo-equipo-${index}`}
                    key={`trigger-${index}-${equiposSeleccionados.length}`}
                    disabled={equiposSeleccionados.length === 0}
                  >
                    <SelectValue placeholder="Seleccione una sección" />
                  </SelectTrigger>
                  <SelectContent>
                    {equiposSeleccionados.length === 0 ? (
                      <div className="px-2 py-2 text-xs text-slate-500">
                        Primero agregá una sección.
                      </div>
                    ) : (
                      equiposSeleccionados.map((eq) => (
                        <SelectItem key={`cargo-equipo-${index}-${eq.id}`} value={eq.id.toString()}>
                          {eq.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setFormData((p) => ({
                  ...p,
                  cargos: [...p.cargos, { tipo: "", cantidad: "", equipoId: "" }],
                }))
              }
            >
              Agregar cargo horario
            </Button>
            {formData.cargos.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData((p) => ({ ...p, cargos: p.cargos.slice(0, -1) }))}
              >
                Quitar último
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
