// app/.../altas-bajas/components/AltasTable.tsx

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/genericos/table"
import { Avatar, AvatarFallback } from "@/components/ui/genericos/avatar"
import { Checkbox } from "@/components/ui/genericos/checkbox"
import { UserPlusIcon } from "lucide-react"
import type { MovimientoProfesional } from "@/types/MovimientoProfesional.interface"

interface Props {
  altas: MovimientoProfesional[]
  onToggleRegistrado: (mov: MovimientoProfesional) => void
}

// 👇 helper para fechas sin quilombo de timezone
const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "—"
  const [year, month, day] = dateStr.split("-")
  if (!year || !month || !day) return dateStr
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
}

export function AltasTable({ altas, onToggleRegistrado }: Props) {
  if (altas.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <UserPlusIcon className="w-12 h-12 mx-auto mb-4 text-green-300" />
        <p>No hay altas registradas</p>
      </div>
    )
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
          <TableHead className="text-center">Registrado</TableHead>
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
            <TableCell className="text-center">
              <Checkbox
                checked={alta.registrado}
                onCheckedChange={() => onToggleRegistrado(alta)}
                className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
