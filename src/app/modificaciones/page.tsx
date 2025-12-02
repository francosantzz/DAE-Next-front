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
import DetallesModificacion from "@/components/ui/DetallesModificacion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/genericos/dialog"

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
  detalles?: any   
  ipAddress?: string
}

const accionColors: Record<Modificacion["accion"], string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
}

const accionLabels: Record<Modificacion["accion"], string> = {
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
    if (!session?.user?.accessToken) return

    setIsLoading(true)
    try {
      const fechaFormateada = filtroFecha
        ? new Date(`${filtroFecha}T00:00:00Z`).toISOString().split("T")[0]
        : ""

      const queryParams = new URLSearchParams()
      queryParams.set("page", String(currentPage))
      queryParams.set("limit", String(itemsPerPage))
      if (busqueda) queryParams.set("search", busqueda)
      if (filtroAccion !== "todas") queryParams.set("accion", filtroAccion)
      if (fechaFormateada) queryParams.set("fecha", fechaFormateada)

      const [modificacionesRes, usuariosRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/modificaciones?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users`, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
        }),
      ])

      if (!modificacionesRes.ok || !usuariosRes.ok) {
        throw new Error("Error al obtener los datos")
      }

      const [modificacionesData, usuariosData] = await Promise.all([
        modificacionesRes.json(),
        usuariosRes.json(),
      ])

      setModificaciones(modificacionesData.data)
      setTotalPages(modificacionesData.meta.totalPages)
      setTotalItems(modificacionesData.meta.total)
      setUsuarios(usuariosData)

      const entidadesUnicas = Array.from(
        new Set(modificacionesData.data.map((mod: Modificacion) => mod.entidad)),
      ) as string[]
      setEntidades(entidadesUnicas)
    } catch (error) {
      console.error("Error al obtener datos:", error)

      
      const modificacionesEjemplo: Modificacion[] = [
        {
          id: 1,
          fecha: "2024-01-15T10:30:00Z",
          usuario: { id: 1, nombre: "Juan", apellido: "Pérez", email: "juan.perez@sistema.com" },
          accion: "CREATE",
          entidad: "Escuela",
          entidadId: 1,
          descripcion: "Creó la escuela 'Escuela Primaria N° 1'",
          detalles: null,
        },
      ]
      const usuariosEjemplo: Usuario[] = [
        { id: 1, nombre: "Juan", apellido: "Pérez", email: "juan.perez@sistema.com" },
      ]

      setModificaciones(modificacionesEjemplo)
      setUsuarios(usuariosEjemplo)
      setEntidades(["Escuela"])
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.accessToken, currentPage, busqueda, filtroAccion, filtroFecha])

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchData()
    }
  }, [fetchData, session?.user?.accessToken])

  useEffect(() => {
    setCurrentPage(1)
  }, [busqueda, filtroAccion, filtroFecha])

  const modificacionesFiltradas = modificaciones

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Argentina/Mendoza",
    })
  }

  const limpiarFiltros = () => {
    setFiltroAccion("todas")
    setFiltroFecha("")
    setBusquedaInput("")
    setCurrentPage(1)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-sm sm:text-base">Cargando modificaciones...</div>
  }

  return (
    <>
      {/* HEADER */}
      <div className="bg-gray-100 w-full">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Historial de Modificaciones
              </h1>
              <Button onClick={fetchData} variant="outline" size="sm" className="self-start sm:self-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </div>
        </header>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="min-h-screen bg-gray-100 px-2 py-4 sm:px-4 overflow-x-hidden">
        {/* Filtros */}
        <Card className="mb-4">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="busqueda" className="text-xs sm:text-sm">
                  Búsqueda
                </Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="busqueda"
                    placeholder="Buscar por entidad, descripción o email..."
                    className="pl-8 h-8 text-xs sm:text-sm"
                    value={busquedaInput}
                    onChange={(e) => setBusquedaInput(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="filtroAccion" className="text-xs sm:text-sm">
                  Acción
                </Label>
                <Select value={filtroAccion} onValueChange={setFiltroAccion}>
                  <SelectTrigger id="filtroAccion" className="h-8 text-xs sm:text-sm">
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
                <Label htmlFor="filtroFecha" className="text-xs sm:text-sm">
                  Fecha
                </Label>
                <Input
                  id="filtroFecha"
                  type="date"
                  className="h-8 text-xs sm:text-sm"
                  value={filtroFecha}
                  onChange={(e) => {
                    setFiltroFecha(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <Button variant="outline" size="sm" onClick={limpiarFiltros} className="text-xs sm:text-sm">
                Limpiar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                <div className="ml-3">
                  <p className="text-[11px] sm:text-xs font-medium text-gray-600">
                    Registros en esta página
                  </p>
                  <p className="text-base sm:text-lg font-bold">{modificacionesFiltradas.length}</p>
                  <p className="text-[10px] sm:text-[11px] text-gray-500">
                    Total filtrado: {totalItems}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center">
                <div className="h-5 w-5 sm:h-6 sm:w-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-xs sm:text-sm">+</span>
                </div>
                <div className="ml-3">
                  <p className="text-[11px] sm:text-xs font-medium text-gray-600">Creaciones</p>
                  <p className="text-base sm:text-lg font-bold">
                    {modificacionesFiltradas.filter((m) => m.accion === "CREATE").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center">
                <div className="h-5 w-5 sm:h-6 sm:w-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xs sm:text-sm">~</span>
                </div>
                <div className="ml-3">
                  <p className="text-[11px] sm:text-xs font-medium text-gray-600">Modificaciones</p>
                  <p className="text-base sm:text-lg font-bold">
                    {modificacionesFiltradas.filter((m) => m.accion === "UPDATE").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center">
                <div className="h-5 w-5 sm:h-6 sm:w-6 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold text-xs sm:text-sm">-</span>
                </div>
                <div className="ml-3">
                  <p className="text-[11px] sm:text-xs font-medium text-gray-600">Eliminaciones</p>
                  <p className="text-base sm:text-lg font-bold">
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
            <CardTitle className="text-base sm:text-lg">
              Registro de modificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {modificacionesFiltradas.length === 0 ? (
              <Alert>
                <AlertDescription className="text-sm">
                  No se encontraron modificaciones con los filtros aplicados.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[720px] sm:min-w-full text-xs sm:text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Fecha</TableHead>
                      <TableHead className="w-[200px]">Usuario</TableHead>
                      <TableHead className="w-[110px]">Acción</TableHead>
                      <TableHead className="w-[150px]">Entidad</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="w-[130px] text-center">Detalles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modificacionesFiltradas.map((modificacion) => (
                      <TableRow key={modificacion.id}>
                        <TableCell className="font-mono text-[11px] sm:text-sm whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                            {formatearFecha(modificacion.fecha)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-gray-500" />
                            <div>
                              <p className="font-medium text-xs sm:text-sm">
                                {modificacion.usuario.nombre} {modificacion.usuario.apellido}
                              </p>
                              <p className="text-[11px] text-gray-500 break-all sm:break-normal">
                                {modificacion.usuario.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${accionColors[modificacion.accion]} text-[10px] sm:text-xs`}>
                            {accionLabels[modificacion.accion]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <Badge variant="outline" className="text-[10px] sm:text-xs w-fit">
                              {modificacion.entidad}
                            </Badge>
                            <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                              ID entidad: {modificacion.entidadId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[260px]">
                          <p
                            className="truncate text-xs sm:text-sm"
                            title={modificacion.descripcion}
                          >
                            {modificacion.descripcion}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          {modificacion.detalles && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-[10px] sm:text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Ver detalles
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-[95vw] sm:max-w-2xl p-4 sm:p-6">
                                <DialogHeader className="mb-2">
                                  <DialogTitle className="text-sm sm:text-lg">
                                    Detalle de modificación
                                  </DialogTitle>
                                  <DialogDescription className="text-[11px] sm:text-sm">
                                    {accionLabels[modificacion.accion]} de{" "}
                                    <span className="font-semibold">{modificacion.entidad}</span>{" "}
                                    (ID {modificacion.entidadId}) realizada por{" "}
                                    <span className="font-semibold">
                                      {modificacion.usuario.email}
                                    </span>{" "}
                                    el {formatearFecha(modificacion.fecha)}.
                                  </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="max-h-[60vh] pr-2">
                                  <DetallesModificacion
                                    detalles={modificacion.detalles}
                                    entidad={modificacion.entidad}
                                  />
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
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

        {/* Paginación */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1 py-4">
          <div className="flex-1 text-xs sm:text-sm text-muted-foreground">
            Mostrando {modificaciones.length} de {totalItems} modificaciones
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="text-xs sm:text-sm"
            >
              Anterior
            </Button>
            <div className="text-xs sm:text-sm">
              Página {currentPage} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="text-xs sm:text-sm"
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
