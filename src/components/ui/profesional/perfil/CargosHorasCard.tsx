'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import { Badge } from "@/components/ui/genericos/badge"
import { ClockIcon } from "lucide-react"

type Cargo = { tipo: string; cantidadHoras: number }

export default function CargosHorasCard({ cargos }: { cargos: Cargo[] }) {
  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 rounded-full p-2">
            <ClockIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-800">Cargos de Horas</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {cargos?.length ? (
          <div className="space-y-3">
            {cargos.map((c, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 capitalize">
                    {c.tipo.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-gray-700 font-medium">{c.cantidadHoras} horas</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-6">No hay cargos de horas</p>
        )}
      </CardContent>
    </Card>
  )
}
