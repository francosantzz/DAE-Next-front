// app/.../altas-bajas/components/StatsCardsAltasBajas.tsx

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/genericos/card"
import { UserPlusIcon, UserMinusIcon } from "lucide-react"
import type { MovimientoEstado, MovimientoProfesional } from "@/types/MovimientoProfesional.interface" 

interface Props {
  altas: MovimientoProfesional[]
  bajas: MovimientoProfesional[]
}

const normalizeEstado = (
  estado: MovimientoEstado | "procesado" | null | undefined,
  registrado?: boolean,
) => {
  if (estado === "procesado") return "confirmado"
  if (estado) return estado
  return registrado ? "confirmado" : "pendiente"
}

export function StatsCardsAltasBajas({ altas, bajas }: Props) {
  const altasPendientes = altas.filter((a) => normalizeEstado(a.estado, a.registrado) === "confirmado").length
  const bajasPendientes = bajas.filter((b) => normalizeEstado(b.estado, b.registrado) === "confirmado").length

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-green-700">Altas</CardTitle>
          <UserPlusIcon className="w-4 h-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{altas.length}</div>
          <p className="text-sm text-red-500">
            {altasPendientes} {altasPendientes === 1 ? "pendiente" : "pendientes"} de cargar
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-red-700">Bajas</CardTitle>
          <UserMinusIcon className="w-4 h-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{bajas.length}</div>
          <p className="text-sm text-red-500">
            {bajasPendientes} {bajasPendientes === 1 ? "pendiente" : "pendientes"} de cargar
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
