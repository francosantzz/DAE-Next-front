"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  Building,
  Clock,
  MapPin,
  Calendar,
  UserCheck,
  GraduationCap,
  Globe,
  CheckCircle,
  XCircle,
} from "lucide-react"

interface Profesional {
  id: number
  nombre: string
  apellido: string
}

interface Region {
  id: number
  nombre: string
}

interface Departamento {
  id: number
  nombre: string
  region?: Region
}

interface Escuela {
  id: number
  nombre: string
}

interface Dias {
  lunes: boolean | null
  martes: boolean | null
  miercoles: boolean | null
  jueves: boolean | null
  viernes: boolean | null
}

interface PaqueteHoras {
  id: number
  tipo: string
  cantidad: number
  profesional: Profesional
  escuela: Escuela
  dias: Dias
}

interface Equipo {
  id: number
  nombre: string
  profesionales: Profesional[]
  departamento: Departamento
  escuelas: Escuela[]
  paquetesHoras: PaqueteHoras[]
  totalHoras: number
}

interface DetalleEquipoDialogProps {
  equipo: Equipo | null
  isOpen: boolean
  onClose: () => void
}

const diasSemana = [
  { key: "lunes", label: "Lun" },
  { key: "martes", label: "Mar" },
  { key: "miercoles", label: "Mié" },
  { key: "jueves", label: "Jue" },
  { key: "viernes", label: "Vie" },
]

export function DetalleEquipoDialog({ equipo, isOpen, onClose }: DetalleEquipoDialogProps) {
  if (!equipo) return null

  // Verificaciones defensivas para propiedades anidadas
  const departamento = equipo.departamento || { nombre: "Sin departamento", region: undefined }
  const profesionales = equipo.profesionales || []
  const escuelas = equipo.escuelas || []
  const paquetesHoras = equipo.paquetesHoras || []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center">
            <Users className="mr-3 h-6 w-6 text-blue-600" />
            {equipo.nombre}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Información detallada del equipo y sus asignaciones
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información General */}
          <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-gray-800">
                <Globe className="mr-2 h-5 w-5 text-blue-600" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">ID del Equipo</p>
                    <p className="text-lg font-bold text-gray-900">#{equipo.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total de Horas</p>
                    <p className="text-lg font-bold text-orange-600">{equipo.totalHoras}h</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-gray-800">
                <MapPin className="mr-2 h-5 w-5 text-green-600" />
                Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Departamento</p>
                    <p className="text-xl font-bold text-gray-900">{departamento.nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">Región</p>
                    <Badge className="bg-green-100 text-green-800 text-sm">
                      {departamento.region?.nombre || "Sin región"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profesionales */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between text-gray-800">
                <div className="flex items-center">
                  <UserCheck className="mr-2 h-5 w-5 text-purple-600" />
                  Profesionales Asignados
                </div>
                <Badge variant="outline" className="text-purple-600">
                  {profesionales.length} profesional{profesionales.length !== 1 ? "es" : ""}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profesionales.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profesionales.map((profesional) => (
                    <div
                      key={profesional.id}
                      className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-purple-100 text-purple-600 font-semibold">
                          {profesional.nombre.charAt(0)}
                          {profesional.apellido.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {profesional.nombre} {profesional.apellido}
                        </p>
                        <p className="text-sm text-gray-600">ID: {profesional.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay profesionales asignados</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Escuelas */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between text-gray-800">
                <div className="flex items-center">
                  <GraduationCap className="mr-2 h-5 w-5 text-indigo-600" />
                  Escuelas Asignadas
                </div>
                <Badge variant="outline" className="text-indigo-600">
                  {escuelas.length} escuela{escuelas.length !== 1 ? "s" : ""}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {escuelas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {escuelas.map((escuela) => (
                    <div
                      key={escuela.id}
                      className="flex items-center space-x-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100"
                    >
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <Building className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{escuela.nombre}</p>
                        <p className="text-sm text-gray-600">ID: {escuela.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay escuelas asignadas</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Paquetes de Horas */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between text-gray-800">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-orange-600" />
                  Paquetes de Horas
                </div>
                <Badge variant="outline" className="text-orange-600">
                  {paquetesHoras.length} paquete{paquetesHoras.length !== 1 ? "s" : ""}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paquetesHoras.length > 0 ? (
                <div className="space-y-4">
                  {paquetesHoras.map((paquete) => (
                    <div
                    key={paquete.id}
                    className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border-2 border-orange-300 "
                    >                  
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{paquete.tipo}</h4>
                          <p className="text-sm text-gray-600">ID: {paquete.id}</p>
                          <p className="text-sm text-gray-600">Escuela: {paquete.escuela?.nombre || "Sin escuela"}</p>
                          <p className="text-sm text-gray-600">Profesional: {paquete.profesional?.nombre} {paquete.profesional?.apellido}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600">{paquete.cantidad}h</p>
                          <p className="text-sm text-gray-600">horas</p>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Días y horarios:</p>
                            {Object.values(paquete.dias).some(horario => horario && horario !== "") ? (
                                <ul className="list-disc pl-5">
                                {Object.entries(paquete.dias).map(([dia, horario]) =>
                                    horario && horario !== "" ? (
                                    <li key={dia}>
                                        {(() => {
                                        // Capitaliza y traduce el día si quieres
                                        const diasTrad = {
                                            lunes: "Lunes",
                                            martes: "Martes",
                                            miercoles: "Miércoles",
                                            jueves: "Jueves",
                                            viernes: "Viernes"
                                        };
                                        return diasTrad[dia as keyof typeof diasTrad] || dia.charAt(0).toUpperCase() + dia.slice(1);
                                        })()}: {horario}
                                    </li>
                                    ) : null
                                )}
                                </ul>
                            ) : (
                                <p className="text-gray-500 italic">No hay días asignados.</p>
                            )}
                        </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay paquetes de horas asignados</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumen */}
          <Card className="border-0 bg-gradient-to-r from-gray-50 to-blue-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-gray-800">
                <Clock className="mr-2 h-5 w-5 text-blue-600" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{profesionales.length}</p>
                  <p className="text-sm text-gray-600">Profesionales</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{escuelas.length}</p>
                  <p className="text-sm text-gray-600">Escuelas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{paquetesHoras.length}</p>
                  <p className="text-sm text-gray-600">Paquetes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{equipo.totalHoras}h</p>
                  <p className="text-sm text-gray-600">Total Horas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
