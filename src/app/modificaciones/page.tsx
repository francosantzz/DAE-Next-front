"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/genericos/input"
import { Label } from "@/components/ui/genericos/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/genericos/select"
import { Button } from "@/components/ui/genericos/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/genericos/table"
import { Badge } from "@/components/ui/genericos/badge"
import { ScrollArea } from "@/components/ui/genericos/scroll-area"
import { Calendar, User, FileText, Search, Filter, RefreshCw, Eye } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/genericos/alert"
import { useSession } from "next-auth/react"
import { useDebounce } from "@/hooks/useDebounce"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@radix-ui/react-accordion"
import DetallesModificacion from "@/components/ui/DetallesModificacion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/genericos/popover"

interface Usuario {
  id: number
  nombre: string
  apellido: string
  email: string
}

interface Modificacion {
  id: number
  fecha: string
  usuario: Usuario
  accion: "CREATE" | "UPDATE" | "DELETE"
  entidad: string
  entidadId: number
  descripcion: string
  detalles?: string
  ipAddress?: string
}

const accionColors = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
}

const accionLabels = {
  CREATE: "Creación",
  UPDATE: "Modificación",
  DELETE: "Eliminación",
}

export default function ListaModificaciones() {
    const { data: session } = useSession()
  const [modificaciones, setModificaciones] = useState<Modificacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroAccion, setFiltroAccion] = useState("todas")
  const [filtroFecha, setFiltroFecha] = useState("")
  const [busquedaInput, setBusquedaInput] = useState("")
  const busqueda = useDebounce(busquedaInput, 500)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [entidades, setEntidades] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Formatear fecha para evitar problemas de zona horaria
      const fechaFormateada = filtroFecha 
      ? new Date(`${filtroFecha}T00:00:00Z`).toISOString().split('T')[0]
      : '';
      console.log("Fecha seleccionada:", filtroFecha);
      console.log("Fecha formateada:", fechaFormateada);
      const [modificacionesRes, usuariosRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/modificaciones?page=${currentPage}&limit=${itemsPerPage}&search=${busqueda}${filtroAccion !== 'todas' ? `&accion=${filtroAccion}` : ''}${filtroFecha ? `&fecha=${fechaFormateada}` : ''}`, {
          headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users`, {
          headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
        }),
      ])

      if (!modificacionesRes.ok || !usuariosRes.ok) {
        throw new Error("Error al obtener los datos")
      }

      const [modificacionesData, usuariosData] = await Promise.all([
        modificacionesRes.json(),
        usuariosRes.json()
      ])

      setModificaciones(modificacionesData.data)
      setTotalPages(modificacionesData.meta.totalPages)
      setTotalItems(modificacionesData.meta.total)
      setUsuarios(usuariosData)

      // Extraer entidades únicas
      const entidadesUnicas = Array.from(new Set(modificacionesData.data.map((mod: Modificacion) => mod.entidad))) as string[]
      setEntidades(entidadesUnicas)
    } catch (error) {
      console.error("Error al obtener datos:", error)
      // Datos de ejemplo para desarrollo
      const modificacionesEjemplo: Modificacion[] = [
        {
          id: 1,
          fecha: "2024-01-15T10:30:00Z",
          usuario: { id: 1, nombre: "Juan", apellido: "Pérez", email: "juan.perez@sistema.com" },
          accion: "CREATE",
          entidad: "Escuela",
          entidadId: 1,
          descripcion: "Creó la escuela 'Escuela Primaria N° 1'",
          detalles: "Nueva escuela agregada al sistema",
          ipAddress: "192.168.1.100",
        },
        {
          id: 2,
          fecha: "2024-01-15T11:45:00Z",
          usuario: { id: 2, nombre: "María", apellido: "González", email: "maria.gonzalez@sistema.com" },
          accion: "UPDATE",
          entidad: "Profesional",
          entidadId: 5,
          descripcion: "Modificó los datos del profesional 'Carlos Rodríguez'",
          detalles: "Actualizó teléfono y dirección",
          ipAddress: "192.168.1.101",
        },
        {
          id: 3,
          fecha: "2024-01-15T14:20:00Z",
          usuario: { id: 1, nombre: "Juan", apellido: "Pérez", email: "juan.perez@sistema.com" },
          accion: "DELETE",
          entidad: "PaqueteHoras",
          entidadId: 12,
          descripcion: "Eliminó paquete de horas de 20 horas",
          detalles: "Paquete de horas administrativas eliminado",
          ipAddress: "192.168.1.100",
        },
        {
          id: 4,
          fecha: "2024-01-16T09:15:00Z",
          usuario: { id: 3, nombre: "Ana", apellido: "Martínez", email: "ana.martinez@sistema.com" },
          accion: "CREATE",
          entidad: "Horario",
          entidadId: 8,
          descripcion: "Creó nuevo horario semanal para profesional",
          detalles: "Horario asignado para Escuela Secundaria N° 5",
          ipAddress: "192.168.1.102",
        },
        {
          id: 5,
          fecha: "2024-01-16T16:30:00Z",
          usuario: { id: 2, nombre: "María", apellido: "González", email: "maria.gonzalez@sistema.com" },
          accion: "UPDATE",
          entidad: "Escuela",
          entidadId: 3,
          descripcion: "Actualizó observaciones del espacio físico",
          detalles: "Agregó observaciones sobre reparaciones necesarias",
          ipAddress: "192.168.1.101",
        },
      ]

      const usuariosEjemplo: Usuario[] = [
        { id: 1, nombre: "Juan", apellido: "Pérez", email: "juan.perez@sistema.com" },
        { id: 2, nombre: "María", apellido: "González", email: "maria.gonzalez@sistema.com" },
        { id: 3, nombre: "Ana", apellido: "Martínez", email: "ana.martinez@sistema.com" },
      ]

      setModificaciones(modificacionesEjemplo)
      setUsuarios(usuariosEjemplo)
      setEntidades(["Escuela", "Profesional", "PaqueteHoras", "Horario"])
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.accessToken, currentPage, busqueda, filtroAccion, filtroFecha])

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchData()
    }
  }, [fetchData, session?.user?.accessToken])

  // Resetear página cuando cambie la búsqueda
  useEffect(() => {
    setCurrentPage(1)
  }, [busqueda, filtroAccion, filtroFecha])

  const modificacionesFiltradas = modificaciones

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const limpiarFiltros = () => {
    setFiltroAccion("todas")
    setFiltroFecha("")
    setBusquedaInput("")
    setCurrentPage(1) // Resetear la página al limpiar filtros
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando modificaciones...</div>
  }

  return (
    <>
      <div className="bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Historial de Modificaciones</h1>
              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </div>
        </header>
      </div>

      <div className="min-h-screen bg-gray-100 p-4">
        {/* Filtros */}
        <Card className="mb-4">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center text-lg">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="busqueda" className="text-sm">Búsqueda</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="busqueda"
                    placeholder="Buscar..."
                    className="pl-8 h-8 text-sm"
                    value={busquedaInput}
                    onChange={(e) => setBusquedaInput(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="filtroAccion" className="text-sm">Acción</Label>
                <Select value={filtroAccion} onValueChange={setFiltroAccion}>
                  <SelectTrigger id="filtroAccion" className="h-8 text-sm">
                    <SelectValue placeholder="Todas las acciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las acciones</SelectItem>
                    <SelectItem value="CREATE">Creación</SelectItem>
                    <SelectItem value="UPDATE">Modificación</SelectItem>
                    <SelectItem value="DELETE">Eliminación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filtroFecha" className="text-sm">Fecha</Label>
                <Input
                  id="filtroFecha"
                  type="date"
                  className="h-8 text-sm"
                  value={filtroFecha}
                  onChange={(e) => {
                    setFiltroFecha(e.target.value)
                    setCurrentPage(1) // Resetear la página al cambiar la fecha
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-blue-600" />
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Total</p>
                  <p className="text-lg font-bold">{modificacionesFiltradas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center">
                <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">+</span>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Creaciones</p>
                  <p className="text-lg font-bold">
                    {modificacionesFiltradas.filter((m) => m.accion === "CREATE").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center">
                <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">~</span>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Modificaciones</p>
                  <p className="text-lg font-bold">
                    {modificacionesFiltradas.filter((m) => m.accion === "UPDATE").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center">
                <div className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">-</span>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Eliminaciones</p>
                  <p className="text-lg font-bold">
                    {modificacionesFiltradas.filter((m) => m.accion === "DELETE").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de modificaciones */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-lg">Registro de Modificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {modificacionesFiltradas.length === 0 ? (
              <Alert>
                <AlertDescription>No se encontraron modificaciones con los filtros aplicados.</AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Fecha</TableHead>
                      <TableHead className="w-[180px]">Usuario</TableHead>
                      <TableHead className="w-[100px]">Acción</TableHead>
                      <TableHead className="w-[120px]">Entidad</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Detalles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modificacionesFiltradas.map((modificacion) => (
                      <TableRow key={modificacion.id}>
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                            {formatearFecha(modificacion.fecha)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-gray-500" />
                            <div>
                              <p className="font-medium text-sm">
                                {modificacion.usuario.nombre} {modificacion.usuario.apellido}
                              </p>
                              <p className="text-xs text-gray-500">{modificacion.usuario.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${accionColors[modificacion.accion]} text-xs`}>
                            {accionLabels[modificacion.accion]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{modificacion.entidad}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="truncate text-sm" title={modificacion.descripcion}>
                            {modificacion.descripcion}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          {modificacion.detalles && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-auto p-1 text-xs">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver detalles
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <DetallesModificacion 
                                  detalles={modificacion.detalles} 
                                  entidad={modificacion.entidad} 
                                />
                              </PopoverContent>
                            </Popover>
                        )}
                      </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Mostrando {modificaciones.length} de {totalItems} modificaciones
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <div className="text-sm">
              Página {currentPage} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
