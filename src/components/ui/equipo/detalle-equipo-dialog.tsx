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
  AlertTriangle,
  Loader2
} from "lucide-react"
import type { Equipo, Profesional, PaqueteHoras, Escuela} from "@/types/equipos";



interface DetalleEquipoDialogProps {
  equipo: Equipo | null
  isOpen: boolean
  onClose: () => void
  isLoading?: boolean
}

const diasSemana = [
  { key: "lunes", label: "Lun" },
  { key: "martes", label: "Mar" },
  { key: "miercoles", label: "Mié" },
  { key: "jueves", label: "Jue" },
  { key: "viernes", label: "Vie" },
]

export function DetalleEquipoDialog({ equipo, isOpen, onClose, isLoading = false }: DetalleEquipoDialogProps) {
  if (!equipo && !isLoading) return null

  // Verificaciones defensivas para propiedades anidadas
  const departamento = equipo?.departamento ?? { nombre: "Sin departamento", region: undefined }
  const profesionales = equipo?.profesionales ?? []
  const escuelas = equipo?.escuelas ?? []
  const paquetesHoras = equipo?.paquetesHoras ?? []
  const paquetesConEscuela = paquetesHoras.filter(p => p.tipo === "Escuela")

  const toNumber = (v: unknown): number => {
    if (typeof v === "number") return v;
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
  };
  
  // “Semana 1” según tu regla: si no es rotativo o no tiene semanas definidas, cuenta igual.
  // Si es rotativo, solo cuenta si incluye el 1.
  const perteneceASemana1 = (paquete: PaqueteHoras): boolean => {
    const d = paquete?.dias
    if (!d) return true; // si no hay 'dias', contalo (compatibilidad)
    if (!d.rotativo) return true;
    if (!Array.isArray(d.semanas) || d.semanas.length === 0) return true;
    return d.semanas.includes(1);
  };
  
  

  const escuelasOrdenadas = [...escuelas].sort((a, b) => {
    return (a.Numero || '').localeCompare(b.Numero || '', 'es', { 
      numeric: true,
      sensitivity: 'base'
    });
  });
  // Paquetes “Escuela” de la semana 1
const paquetesEscuelaSemana1 = paquetesHoras.filter(
  (p) => p.tipo === "Escuela" && perteneceASemana1(p)
);

// Total horas en escuelas (semana 1) — idéntico criterio al back
const horasEnEscuelas = paquetesEscuelaSemana1.reduce(
  (sum, p) => sum + toNumber(p.cantidad),
  0
);

// Si querés también sumar los “no escuela” pero con el mismo criterio de semana:
const paquetesOtrosSemana1 = paquetesHoras.filter(
  (p) => p.tipo !== "Escuela" && perteneceASemana1(p)
);
const horasEnOtrosTrabajos = paquetesOtrosSemana1.reduce(
  (sum, p) => sum + toNumber(p.cantidad),
  0
);

// Total calculado local (semana 1) — solo para chequeo visual
const totalCalculado = horasEnEscuelas + horasEnOtrosTrabajos;

// Promedio por escuela SOLO contando las que efectivamente tienen horas en semana 1
const escuelasConHorasSemana1 = new Set(
  paquetesEscuelaSemana1
    .map((p) => p.escuela?.id)
    .filter((id): id is number => typeof id === "number")
);

const promedioHorasPorEscuela =
  escuelasConHorasSemana1.size > 0
    ? horasEnEscuelas / escuelasOrdenadas.length
    : 0;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] h-[90vh] sm:max-w-[900px] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center">
            <Users className="mr-3 h-6 w-6 text-blue-600" />
            {isLoading ? "Cargando equipo..." : equipo?.nombre}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isLoading ? "Obteniendo información detallada..." : "Información detallada del equipo y sus asignaciones"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          // Mostrar loader mientras carga
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Cargando detalles del equipo...</p>
            </div>
          </div>
        ) : equipo ? (
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
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <GraduationCap className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Horas en Escuelas</p>
                    <p className="text-lg font-bold text-green-600">{horasEnEscuelas}h</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Building className="h-4 w-4 text-purple-600" />
                  </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Promedio x Escuela</p>
                      <p className="text-lg font-bold text-purple-600">{promedioHorasPorEscuela > 0 ? promedioHorasPorEscuela.toFixed(1) : '0'}h</p>
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
                  {profesionales.map((profesional) => {
                    const tieneLicenciaActiva = profesional.licenciaActiva && 
                      profesional.fechaFinLicencia && 
                      new Date(profesional.fechaFinLicencia) >= new Date();
                    
                    return (
                      <div
                        key={profesional.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg ${
                          tieneLicenciaActiva 
                            ? "bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200" 
                            : "bg-gradient-to-r from-purple-50 to-blue-50"
                        }`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={
                            tieneLicenciaActiva 
                              ? "bg-orange-100 text-orange-600 font-semibold" 
                              : "bg-purple-100 text-purple-600 font-semibold"
                          }>
                            {profesional.nombre.charAt(0)}
                            {profesional.apellido.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">
                            {profesional.nombre} {profesional.apellido}
                            {profesional.profesion ? ` - ${profesional.profesion}` : ''}
                            </p>
                            {tieneLicenciaActiva && (
                              <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                                En Licencia
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-900">Cargos:</span>
                            {(profesional.cargosHoras ?? []).map((cargo) => (
                              <p key={cargo.id}>
                                {cargo.tipo}: {cargo.cantidadHoras} horas
                              </p>
                            ))}
                          </div>
                          {tieneLicenciaActiva && profesional.tipoLicencia && (
                            <div className="mt-1 text-xs text-orange-600">
                              <span className="font-medium">Licencia: </span>
                              {profesional.tipoLicencia}
                              {profesional.fechaFinLicencia && (
                                <span> (hasta {new Date(profesional.fechaFinLicencia).toLocaleDateString('es-ES')})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay profesionales asignados</p>
                </div>
              )}
            </CardContent>
          </Card>

            {/* Escuelas con paquetes */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between text-gray-800">
                  <div className="flex items-center">
                    <GraduationCap className="mr-2 h-5 w-5 text-indigo-600" />
                    Escuelas y Paquetes de Horas
                  </div>
                  <Badge variant="outline" className="text-indigo-600">
                    {escuelasOrdenadas.length} escuela{escuelasOrdenadas.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {escuelasOrdenadas.length > 0 ? (
                  <div className="space-y-4">
                    {escuelasOrdenadas.map((escuela) => {
                      // Paquetes de esta escuela
                      const paquetesDeEstaEscuela = paquetesHoras.filter(
                        (p) => p.escuela?.id === escuela.id
                      )
                      const tienePaquete = paquetesDeEstaEscuela.length > 0
                      
                      // Verificar si algún paquete tiene profesional en licencia
                      const tieneProfesionalEnLicencia = paquetesDeEstaEscuela.some(paquete => {
                        const profesional = paquete.profesional;
                        return profesional.licenciaActiva && 
                              profesional.fechaFinLicencia && 
                              new Date(profesional.fechaFinLicencia) >= new Date();
                      });

                      return (
                        <div
                          key={escuela.id}
                          className={`p-4 rounded-lg border ${
                              tienePaquete
                              ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100"
                              : "border-yellow-300"
                          }`}
                        >
                          {/* Encabezado escuela */}
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">
                                  {escuela.nombre} Nº {escuela.Numero}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-600">
                                Matrícula: {escuela.matricula}
                              </p>
                              {tienePaquete ? (
                                <p className="text-sm text-indigo-600">
                                  {paquetesDeEstaEscuela.length} paquete{paquetesDeEstaEscuela.length !== 1 ? "s" : ""} asignado
                                </p>
                              ) : (
                                <div className="flex items-center text-red-600">
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  <span className="text-sm font-medium">Sin profesionales asignados</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Listado de paquetes */}
                          {tienePaquete && (
                            <div className="space-y-3 mt-3">
                              {paquetesDeEstaEscuela.map((paquete) => {
                                const profesionalEnLicencia = paquete.profesional.licenciaActiva && 
                                  paquete.profesional.fechaFinLicencia && 
                                  new Date(paquete.profesional.fechaFinLicencia) >= new Date();
                                
                                return (
                                  <div
                                    key={paquete.id}
                                    className={`p-3 border rounded-lg ${
                                      profesionalEnLicencia
                                        ? "bg-orange-50 border-orange-200"
                                        : "bg-white border-gray-200"
                                    }`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-800">
                                          {paquete.profesional.nombre} {paquete.profesional.apellido}
                                        </p>
                                        {profesionalEnLicencia && (
                                          <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                                            En Licencia
                                          </Badge>
                                        )}
                                      </div>
                                      <span className={`px-2 py-1 rounded text-sm font-bold ${
                                        profesionalEnLicencia
                                          ? "bg-orange-100 text-orange-800"
                                          : "bg-green-100 text-green-800"
                                      }`}>
                                        {paquete.cantidad}h
                                      </span>
                                    </div>
                                    
                                    {/* Información de licencia si está en licencia */}
                                    {profesionalEnLicencia && (
                                      <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-800">
                                        <div className="font-medium">⚠️ Profesional en licencia</div>
                                        {paquete.profesional.tipoLicencia && (
                                          <div>Tipo: {paquete.profesional.tipoLicencia}</div>
                                        )}
                                        {paquete.profesional.fechaFinLicencia && (
                                          <div>Hasta: {new Date(paquete.profesional.fechaFinLicencia).toLocaleDateString('es-ES')}</div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Horario formateado */}
                                    {(() => {
                                      const d: any = (paquete as any).dias || {}
                                      const dia = d.diaSemana
                                      const hI = (d.horaInicio ?? '').toString().slice(0,5) || '-'
                                      const hF = (d.horaFin ?? '').toString().slice(0,5) || '-'
                                      const rot = !!d.rotativo
                                      const sem = d.semanas as number[] | undefined
                                      const diaLabel = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][Number(dia)] || "-"
                                      if (!dia && !hI && !hF) {
                                        return (
                                          <p className="text-gray-500 text-sm italic mt-2">Sin horario asignado</p>
                                        )
                                      }
                                      return (
                                        <div className={`text-sm mt-2 ${
                                          profesionalEnLicencia ? "text-orange-700" : "text-gray-600"
                                        }`}>
                                          <span className="font-medium">Horario:</span> {diaLabel} {hI} - {hF}
                                          {rot ? (
                                            <span> (Rotativo{sem && sem.length ? `, semanas: ${sem.join(', ')}` : ''})</span>
                                          ) : null}
                                        </div>
                                      )
                                    })()}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No hay escuelas asignadas</p>
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
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{profesionales.length}</p>
                    <p className="text-sm text-gray-600">Profesionales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">{escuelasOrdenadas.length}</p>
                    <p className="text-sm text-gray-600">Escuelas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{paquetesConEscuela.length}</p>
                    <p className="text-sm text-gray-600">Paquetes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{equipo.totalHoras ?? 0}h</p>
                    <p className="text-sm text-gray-600">Total Horas</p>
                  </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-teal-600">{horasEnEscuelas}h</p>
                      <p className="text-sm text-gray-600">En Escuelas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-cyan-600">
                        {promedioHorasPorEscuela > 0 ? promedioHorasPorEscuela.toFixed(1) : '0'}h
                      </p>
                      <p className="text-sm text-gray-600">Promedio x Escuela</p>
                    </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {profesionales.filter(p => 
                        p.licenciaActiva && p.fechaFinLicencia && new Date(p.fechaFinLicencia) >= new Date()
                      ).length}
                    </p>
                    <p className="text-sm text-gray-600">En Licencia</p>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
