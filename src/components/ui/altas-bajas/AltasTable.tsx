// app/.../altas-bajas/components/AltasTable.tsx

import { useState } from "react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/genericos/table"
import { Avatar, AvatarFallback } from "@/components/ui/genericos/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/genericos/select"
import { Input } from "@/components/ui/genericos/input"
import { Button } from "@/components/ui/genericos/button"
import { UserPlusIcon, Save } from "lucide-react"
import type { MovimientoEstado, MovimientoProfesional } from "@/types/MovimientoProfesional.interface"

interface Props {
  altas: MovimientoProfesional[]
  onEstadoChange: (mov: MovimientoProfesional, estado: MovimientoEstado) => void
  isUpdating?: (mov: MovimientoProfesional) => boolean
  onSeccionSave: (mov: MovimientoProfesional, seccion: string | null) => void
  isSavingSeccion?: (mov: MovimientoProfesional) => boolean
}

// 👇 helper para fechas sin quilombo de timezone
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

export function AltasTable({ altas, onEstadoChange, isUpdating, onSeccionSave, isSavingSeccion }: Props) {
  const [seccionDrafts, setSeccionDrafts] = useState<Record<string, string>>({})

  if (altas.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <UserPlusIcon className="w-12 h-12 mx-auto mb-4 text-green-300" />
        <p>No hay altas registradas</p>
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Profesional</TableHead>
          <TableHead>Profesión</TableHead>
          <TableHead>DNI</TableHead>
          <TableHead>Tipos de origen</TableHead>
          <TableHead>Horas</TableHead>
          <TableHead>Fecha alta</TableHead>
          <TableHead>Sección</TableHead>
          <TableHead className="text-center">Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {altas.map((alta) => (
          <TableRow key={alta.id} className="hover:bg-green-50/50">
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 bg-green-100">
                  <AvatarFallback className="text-green-700 text-xs">
                    {alta.nombre?.charAt(0)}
                    {alta.apellido?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {alta.nombre} {alta.apellido}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {alta.matricula ? `Matrícula: ${alta.matricula}` : "Sin matrícula"}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>{alta.profesion || "—"}</TableCell>
            <TableCell className="font-mono text-sm">{alta.dni || "—"}</TableCell>
            <TableCell>{alta.tiposOrigen || alta.tipoHora || "—"}</TableCell>
            <TableCell className="font-mono text-sm">
              {alta.cantidadHoras ? `${alta.cantidadHoras} hs` : "—"}
            </TableCell>
            {/* 👇 acá usamos el helper */}
            <TableCell>{formatDate(alta.fecha)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Input
                  value={getSeccionValue(alta)}
                  onChange={(e) =>
                    setSeccionDrafts((prev) => ({ ...prev, [getKey(alta)]: e.target.value }))
                  }
                  placeholder="Sin sección"
                  className="h-9 w-[140px]"
                  disabled={isSavingSeccion?.(alta)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const value = getSeccionValue(alta).trim()
                    onSeccionSave(alta, value ? value : null)
                  }}
                  disabled={isSavingSeccion?.(alta) || !isSeccionDirty(alta)}
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
                  alta.estado as MovimientoEstado | "procesado" | null | undefined,
                  alta.registrado,
                )
                return (
                  <Select
                    value={estado}
                    onValueChange={(value) => onEstadoChange(alta, value as MovimientoEstado)}
                    disabled={isUpdating?.(alta)}
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
