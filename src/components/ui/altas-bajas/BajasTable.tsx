// app/.../altas-bajas/components/BajasTable.tsx

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/genericos/table"
import { Avatar, AvatarFallback } from "@/components/ui/genericos/avatar"
import { Checkbox } from "@/components/ui/genericos/checkbox"
import { UserMinusIcon } from "lucide-react"
import type { MovimientoProfesional } from "@/types/MovimientoProfesional.interface"

interface Props {
  bajas: MovimientoProfesional[]
  onToggleRegistrado: (mov: MovimientoProfesional) => void
}

// mismo helper que en AltasTable (podrías extraerlo a un util si querés)
const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "—"
  const [year, month, day] = dateStr.split("-")
  if (!year || !month || !day) return dateStr
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
}

export function BajasTable({ bajas, onToggleRegistrado }: Props) {
  if (bajas.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <UserMinusIcon className="w-12 h-12 mx-auto mb-4 text-red-300" />
        <p>No hay bajas registradas</p>
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
          <TableHead>Tipo de hora</TableHead>
          <TableHead>Horas</TableHead>
          <TableHead>Fecha baja</TableHead>
          <TableHead className="text-center">Registrado</TableHead>
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
            <TableCell className="text-center">
              <Checkbox
                checked={baja.registrado}
                onCheckedChange={() => onToggleRegistrado(baja)}
                className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
