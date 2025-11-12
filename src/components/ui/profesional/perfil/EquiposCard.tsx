'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import { Badge } from "@/components/ui/genericos/badge"
import { MapPinIcon, UsersIcon } from "lucide-react"
import type { EquipoProfesionalDTO } from "@/types/dto/EquipoProfesional.dto"

export default function EquiposCard({ equipos }: { equipos: EquipoProfesionalDTO[] }) {
  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-purple-50 rounded-full p-2">
            <UsersIcon className="w-5 h-5 text-purple-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-800">Equipos</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {equipos?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equipos.map(e => (
              <div key={e.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-base text-gray-800">{e.nombre}</h4>
                    <div className="flex items-center mt-2 gap-2">
                      <div className="bg-gray-100 p-1 rounded-full">
                        <MapPinIcon className="w-3 h-3 text-gray-600" />
                      </div>
                      <p className="text-base text-gray-600">{e.departamento?.nombre}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Miembro</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-6">No hay equipos asignados</p>
        )}
      </CardContent>
    </Card>
  )
}
