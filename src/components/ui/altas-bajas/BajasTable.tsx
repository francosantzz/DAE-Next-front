// app/.../altas-bajas/components/BajasTable.tsx

import { useState } from "react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/genericos/table"
import { Avatar, AvatarFallback } from "@/components/ui/genericos/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/genericos/select"
import { Input } from "@/components/ui/genericos/input"
import { Button } from "@/components/ui/genericos/button"
import { UserMinusIcon, Save } from "lucide-react"
import type { MovimientoEstado, MovimientoProfesional } from "@/types/MovimientoProfesional.interface"

interface Props {
  bajas: MovimientoProfesional[]
  onEstadoChange: (mov: MovimientoProfesional, estado: MovimientoEstado) => void
  isUpdating?: (mov: MovimientoProfesional) => boolean
  onSeccionSave: (mov: MovimientoProfesional, seccion: string | null) => void
  isSavingSeccion?: (mov: MovimientoProfesional) => boolean
}

// mismo helper que en AltasTable (podrías extraerlo a un util si querés)
const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "—"
  const [year, month, day] = dateStr.split("-")
  if (!year || !month || !day) return dateStr
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
}

const resolveEstado = (
  estado: MovimientoEstado | "procesado" | null | undefined,
  registrado?: boolean,
): MovimientoEstado => {
  if (estado === "procesado") return "confirmado"
  if (estado) return estado
  return registrado ? "confirmado" : "pendiente"
}

const estadoClasses: Record<MovimientoEstado, string> = {
  pendiente: "border-yellow-300 bg-yellow-50 text-yellow-800",
  confirmado: "border-green-300 bg-green-50 text-green-800",
  cargado: "border-blue-300 bg-blue-50 text-blue-800",
  rechazado: "border-red-300 bg-red-50 text-red-800",
}

export function BajasTable({ bajas, onEstadoChange, isUpdating, onSeccionSave, isSavingSeccion }: Props) {
  const [seccionDrafts, setSeccionDrafts] = useState<Record<string, string>>({})

  if (bajas.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <UserMinusIcon className="w-12 h-12 mx-auto mb-4 text-red-300" />
        <p>No hay bajas registradas</p>
      </div>
    )
  }

  const getKey = (mov: MovimientoProfesional) => `${mov.tipo}-${mov.id}`
  const getSeccionValue = (mov: MovimientoProfesional) => {
    const key = getKey(mov)
    return seccionDrafts[key] ?? mov.seccion ?? ""
  }
  const isSeccionDirty = (mov: MovimientoProfesional) => {
    const current = getSeccionValue(mov).trim()
    const original = (mov.seccion ?? "").trim()
    return current !== original
  }

  return (
    <Table className="min-w-max table-auto [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
      <TableHeader>
        <TableRow>
          <TableHead>Profesional</TableHead>
          <TableHead>Profesión</TableHead>
          <TableHead>DNI</TableHead>
          <TableHead>Tipo de hora</TableHead>
          <TableHead>Horas</TableHead>
          <TableHead>Fecha baja</TableHead>
          <TableHead>Sección</TableHead>
          <TableHead className="text-center whitespace-nowrap">Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bajas.map((baja) => (
          <TableRow key={baja.id} className="hover:bg-red-50/50">
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 bg-red-100">
                  <AvatarFallback className="text-red-700 text-xs">
                    {baja.nombre?.charAt(0)}
                    {baja.apellido?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {baja.nombre} {baja.apellido}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {baja.matricula ? `Matrícula: ${baja.matricula}` : "Sin matrícula"}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>{baja.profesion || "—"}</TableCell>
            <TableCell className="font-mono text-sm">{baja.dni || "—"}</TableCell>
            <TableCell>{baja.tipoHora || "—"}</TableCell>
            <TableCell className="font-mono text-sm">
              {baja.cantidadHoras ? `${baja.cantidadHoras} hs` : "—"}
            </TableCell>
            {/* 👇 también usamos el helper */}
            <TableCell>{formatDate(baja.fecha)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Input
                  value={getSeccionValue(baja)}
                  onChange={(e) =>
                    setSeccionDrafts((prev) => ({ ...prev, [getKey(baja)]: e.target.value }))
                  }
                  placeholder="Sin sección"
                  className="h-9 w-[140px]"
                  disabled={isSavingSeccion?.(baja)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const value = getSeccionValue(baja).trim()
                    onSeccionSave(baja, value ? value : null)
                  }}
                  disabled={isSavingSeccion?.(baja) || !isSeccionDirty(baja)}
                  className="px-2"
                  aria-label="Guardar sección"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
            <TableCell className="text-center">
              {(() => {
                const estado = resolveEstado(
                  baja.estado as MovimientoEstado | "procesado" | null | undefined,
                  baja.registrado,
                )
                return (
                  <Select
                    value={estado}
                    onValueChange={(value) => onEstadoChange(baja, value as MovimientoEstado)}
                    disabled={isUpdating?.(baja)}
                  >
                    <SelectTrigger className={`h-9 w-[140px] capitalize ${estadoClasses[estado]}`}>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente" className="text-yellow-700">Pendiente</SelectItem>
                      <SelectItem value="confirmado" className="text-green-700">Confirmado</SelectItem>
                      <SelectItem value="cargado" className="text-blue-700">Cargado</SelectItem>
                      <SelectItem value="rechazado" className="text-red-700">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                )
              })()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
