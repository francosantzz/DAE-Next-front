// components/ui/profesional/perfil/PaquetesCard.tsx
'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import { PermissionButton } from "@/components/ui/genericos/PermissionButton"
import { Badge } from "@/components/ui/genericos/badge"
import { ClockIcon, Edit, Trash2, BriefcaseIcon, UsersIcon, CalendarIcon, PlusCircle } from "lucide-react"
import type { Profesional } from "@/types/Profesional.interface"
import type { PaqueteHorasPerfil } from "@/types/dto/PaqueteHorasPerfil.dto"

const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]

function fmtHora(h?: string) {
  if (!h) return "-"
  // admite "HH:mm" o "HH:mm:ss"
  return h.slice(0,5)
}
function pickHorario(pk: PaqueteHorasPerfil) {
  // prioriza `dias` si viene; si no, usa los campos sueltos
  const d = pk.dias
  const diaSemana = d?.diaSemana ?? pk.diaSemana
  const horaInicio = d?.horaInicio ?? pk.horaInicio
  const horaFin = d?.horaFin ?? pk.horaFin
  const rotativo = d?.rotativo ?? pk.rotativo
  const semanas = (d?.semanas ?? pk.semanas) ?? undefined
  return { diaSemana, horaInicio, horaFin, rotativo, semanas }
}

export default function PaquetesCard({
  profesional,
  onAgregar,
  onEditar,
  onEliminar,
}: {
  profesional: Profesional
  onAgregar: () => void
  onEditar: (p: PaqueteHorasPerfil) => void
  onEliminar: (id: number) => void
}) {
  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 rounded-full p-2">
              <ClockIcon className="w-5 h-5 text-green-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-800">Paquetes de Horas</CardTitle>
          </div>
          <PermissionButton
            requiredPermission={{ entity: "paquetehoras", action: "create" }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onAgregar}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Agregar Paquete
          </PermissionButton>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {profesional.paquetesHoras?.length ? (
          <div className="space-y-4">
            {profesional.paquetesHoras.map((pk) => {
              const { diaSemana, horaInicio, horaFin, rotativo, semanas } = pickHorario(pk)
              const semanasTxt = semanas?.length ? (semanas.length === 1 ? ` (Semana ${semanas[0]})` : ` (Semanas: ${semanas.join(", ")})`) : ""
              return (
                <div key={pk.id}
                  className={`border-2 rounded-lg p-4 hover:shadow-lg transition-shadow
                    ${pk.tipo === "Escuela" ? "border-green-300 ring-1 ring-green-300"
                      : pk.tipo === "Trabajo Interdisciplinario" ? "border-purple-300 ring-1 ring-purple-300"
                      : "border-orange-300 ring-1 ring-orange-300"}`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={pk.tipo === "Escuela"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : pk.tipo === "Trabajo Interdisciplinario"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-orange-50 text-orange-700 border-orange-200"}
                        >
                          {pk.tipo}
                        </Badge>
                        <div className="bg-blue-50 rounded-lg px-3 py-1">
                          <div className="font-bold text-blue-700">
                            {Number(pk.cantidad ?? 0).toFixed(2)}<span className="ml-1">horas</span>
                          </div>
                        </div>
                      </div>

                      <Row icon={<UsersIcon className="w-3 h-3 text-gray-600" />} text={pk.equipo?.nombre} />
                      {pk.tipo === "Escuela" && pk.escuela && (
                        <Row icon={<BriefcaseIcon className="w-3 h-3 text-gray-600" />} text={`${pk.escuela?.nombre}${pk.escuela?.Numero ? ` (${pk.escuela.Numero})` : ""}`} />
                      )}

                      {(diaSemana !== undefined || horaInicio || horaFin) && (
                        <div className="mt-2 text-gray-700">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="bg-gray-100 p-1 rounded-full">
                              <CalendarIcon className="w-3 h-3 text-gray-600" />
                            </div>
                            <span>
                              {diaSemana !== undefined ? DIAS[diaSemana] : "-"} {fmtHora(horaInicio)} - {fmtHora(horaFin)}
                              {rotativo ? semanasTxt : ""}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <PermissionButton
                        requiredPermission={{ entity: "paquetehoras", action: "update" }}
                        variant="outline" size="sm"
                        className="hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => onEditar(pk)}
                      >
                        <Edit className="h-4 w-4" />
                      </PermissionButton>
                      <PermissionButton
                        requiredPermission={{ entity: "paquetehoras", action: "delete" }}
                        variant="outline" size="sm"
                        className="hover:bg-red-50 hover:border-red-300 text-red-600"
                        onClick={() => onEliminar(pk.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </PermissionButton>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-6">No hay paquetes de horas asignados</p>
        )}
      </CardContent>
    </Card>
  )
}

function Row({ icon, text }: { icon: React.ReactNode; text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-gray-100 p-1 rounded-full">{icon}</div>
      <p className="text-sm text-gray-700">{text ?? "—"}</p>
    </div>
  )
}
