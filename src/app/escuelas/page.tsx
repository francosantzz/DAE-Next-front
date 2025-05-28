"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Edit, Trash2, Eye, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { ObservacionesEditor } from "@/components/escuela/observaciones-editor"
import { EstadoFisicoCard } from "@/components/escuela/estado-fisico-card"
import ErrorBoundary from "@/components/ErrorBoundary"

interface Profesional {
  id: number
  nombre: string
  apellido: string
}

interface Anexo {
  id: number
  nombre: string
  matricula: number
  escuela: {
    id: number
    nombre: string
  }
}

interface Direccion {
  id: number
  calle: string
  numero: number
  departamento: {
    id: number
    nombre: string
    region?: {
      id: number
      nombre: string
    }
  }
}

interface PaqueteHoras {
  id: number
  cantidad: number
  profesional: Profesional
}

interface Seccion {
  id: number
  nombre: string
}

interface Departamento {
  id: number
  nombre: string
}

interface Equipo {
  id: number
  nombre: string
  departamento: Departamento
}

interface Escuela {
  id: number
  nombre: string
  direccion: Direccion
  equipo: Equipo
  anexos: Anexo[]
  paquetesHoras: PaqueteHoras[]
  observaciones?: string
}

// Simulación de roles de usuario - En un entorno real, esto vendría de un sistema de autenticación
const userRoles = {
  isAdmin: true, // Cambiar a false para probar restricciones
  isAuthorized: true,
}

export default function ListaEscuelas() {
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroEquipo, setFiltroEquipo] = useState("todos")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentEscuela, setCurrentEscuela] = useState<Escuela | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    "direccion.calle": "",
    "direccion.numero": "",
    departamentoId: "",
    equipoId: "",
    observaciones: "",
  })
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false)
  const [selectedEscuela, setSelectedEscuela] = useState<Escuela | null>(null)
  const [isAnexoDialogOpen, setIsAnexoDialogOpen] = useState(false)
  const [anexoFormData, setAnexoFormData] = useState<{ id: number | undefined; nombre: string; matricula: string }>({
    id: undefined,
    nombre: "",
    matricula: "",
  })
  const [isEditingAnexo, setIsEditingAnexo] = useState(false)
  const [isObservacionesDialogOpen, setIsObservacionesDialogOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [escuelasRes, equiposRes, departamentosRes, anexosRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/anexos`),
      ])

      if (!escuelasRes.ok || !equiposRes.ok || !departamentosRes.ok || !anexosRes.ok)
        throw new Error("Error al obtener los datos")

      const [escuelasData, equiposData, departamentosData, anexosData] = await Promise.all([
        escuelasRes.json(),
        equiposRes.json(),
        departamentosRes.json(),
        anexosRes.json(),
      ])

      setEscuelas(escuelasData)
      setEquipos(equiposData)
      setDepartamentos(departamentosData)
      setAnexos(anexosData)
    } catch (error) {
      console.error("Error al obtener datos:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const escuelasFiltradas = escuelas.filter(
    (escuela) =>
      escuela.nombre.toLowerCase().includes(filtroNombre.toLowerCase()) &&
      (filtroEquipo === "todos" || escuela.equipo?.id?.toString() === filtroEquipo),
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = currentEscuela
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${currentEscuela.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas`
      const method = currentEscuela ? "PATCH" : "POST"
  
      const payload = {
        nombre: formData.nombre,
        direccion: {
          calle: formData["direccion.calle"],
          numero: Number(formData["direccion.numero"]),
          departamentoId: Number(formData.departamentoId)
        },
        equipoId: Number(formData.equipoId),
        observaciones: formData.observaciones,
        // Si necesitas enviar anexos o paquetes de horas:
        anexos: currentEscuela?.anexos || [],
        paquetesHorasIds: currentEscuela?.paquetesHoras?.map(p => p.id) || []
      }
  
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
  
      if (!response.ok) throw new Error("Error al guardar la escuela")
  
      const updatedEscuela = await response.json()
      
      // Actualizar el estado
      setEscuelas(prev => 
        currentEscuela 
          ? prev.map(e => e.id === updatedEscuela.id ? updatedEscuela : e) 
          : [...prev, updatedEscuela]
      )
  
      if (selectedEscuela?.id === updatedEscuela.id) {
        setSelectedEscuela(updatedEscuela)
      }
  
      setIsDialogOpen(false)
      setCurrentEscuela(null)
      resetForm()
    } catch (error) {
      console.error("Error al guardar la escuela:", error)
      // Aquí podrías agregar un toast o alerta de error
    }
  }
  
  const resetForm = () => {
    setFormData({
      nombre: "",
      "direccion.calle": "",
      "direccion.numero": "",
      departamentoId: "",
      equipoId: "",
      observaciones: "",
    })
  }

  const handleEdit = useCallback((escuela: Escuela) => {
    setCurrentEscuela(escuela)
    setFormData({
      nombre: escuela.nombre,
      "direccion.calle": escuela.direccion.calle,
      "direccion.numero": escuela.direccion.numero.toString(),
      departamentoId: escuela.direccion.departamento.id.toString(),
      equipoId: escuela.equipo?.id?.toString() || '',
      observaciones: escuela.observaciones || ""
    })
    setIsDialogOpen(true)
  }, [])

  const handleDelete = useCallback(
    async (id: number) => {
      if (window.confirm("¿Estás seguro de que quieres eliminar esta escuela?")) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${id}`, {
            method: "DELETE",
          })

          if (!response.ok) throw new Error("Error al eliminar la escuela")

          setEscuelas((prev) => prev.filter((e) => e.id !== id))
          if (selectedEscuela && selectedEscuela.id === id) {
            setSelectedEscuela(null)
            setIsDetailViewOpen(false)
          }
        } catch (error) {
          console.error("Error al eliminar la escuela:", error)
        }
      }
    },
    [selectedEscuela],
  )

  const handleViewDetails = useCallback(
    (escuela: Escuela) => {
      const updatedEscuela = escuelas.find((e) => e.id === escuela.id) || escuela
      setSelectedEscuela(updatedEscuela)
      setIsDetailViewOpen(true)
    },
    [escuelas],
  )

  const getAnexosForEscuela = useCallback(
    (escuelaId: number) => {
      return anexos.filter((anexo) => anexo?.escuela && anexo.escuela.id === escuelaId)
    },
    [anexos],
  )

  const handleAnexoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEscuela) return
  
    try {
      const url = isEditingAnexo
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${selectedEscuela.id}/anexos/${anexoFormData.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${selectedEscuela.id}/anexos`
      
      const method = isEditingAnexo ? "PATCH" : "POST"
      
      const payload = {
        nombre: anexoFormData.nombre,
        matricula: Number(anexoFormData.matricula)
      }
  
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
  
      if (!response.ok) throw new Error(`Error al ${isEditingAnexo ? "editar" : "agregar"} anexo`)
  
      // Actualizar la lista de anexos
      const updatedAnexos = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${selectedEscuela.id}/anexos`)
      if (!updatedAnexos.ok) throw new Error("Error al obtener anexos actualizados")
      
      const anexosData = await updatedAnexos.json()
      setAnexos(anexosData)
  
      // Cerrar diálogo y resetear formulario
      setIsAnexoDialogOpen(false)
      setAnexoFormData({ id: undefined, nombre: "", matricula: "" })
      setIsEditingAnexo(false)
      
      // Actualizar la escuela en el estado si es necesario
      setEscuelas(prev => prev.map(e => 
        e.id === selectedEscuela.id 
          ? { ...e, anexos: anexosData } 
          : e
      ))
  
    } catch (error) {
      console.error(`Error al ${isEditingAnexo ? "editar" : "agregar"} anexo:`, error)
    }
  }

  const handleEditAnexo = useCallback((anexo: Anexo) => {
    setAnexoFormData({
      id: anexo.id,
      nombre: anexo.nombre,
      matricula: anexo.matricula.toString(),
    })
    setIsEditingAnexo(true)
    setIsAnexoDialogOpen(true)
  }, [])

  const handleDeleteAnexo = useCallback(async (escuelaId: number, anexoId: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este anexo?")) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${escuelaId}/anexos/${anexoId}`, {
          method: "DELETE",
        })

        if (!response.ok) throw new Error("Error al eliminar el anexo")

        setAnexos((prev) => prev.filter((a) => a.id !== anexoId))
      } catch (error) {
        console.error("Error al eliminar el anexo:", error)
      }
    }
  }, [])

  const handleEditObservaciones = useCallback((escuela: Escuela) => {
    setCurrentEscuela(escuela)
    setFormData((prev) => ({
      ...prev,
      observaciones: escuela.observaciones || "",
    }))
    setIsObservacionesDialogOpen(true)
  }, [])

  const handleObservacionesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentEscuela) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${currentEscuela.id}/observaciones`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            observaciones: formData.observaciones,
          }),
        },
      )

      if (!response.ok) throw new Error("Error al guardar las observaciones")

      // Actualizar la escuela en el estado
      const updatedEscuela = { ...currentEscuela, observaciones: formData.observaciones }
      setEscuelas((prev) => prev.map((e) => (e.id === currentEscuela.id ? updatedEscuela : e)))

      if (selectedEscuela && selectedEscuela.id === currentEscuela.id) {
        setSelectedEscuela(updatedEscuela)
      }

      setIsObservacionesDialogOpen(false)
    } catch (error) {
      console.error("Error al guardar las observaciones:", error)
    }
  }

  const handleObservacionesUpdated = useCallback(
    (escuelaId: number, newObservaciones: string) => {
      setEscuelas((prev) =>
        prev.map((escuela) => (escuela.id === escuelaId ? { ...escuela, observaciones: newObservaciones } : escuela)),
      )

      if (selectedEscuela && selectedEscuela.id === escuelaId) {
        setSelectedEscuela((prev) => (prev ? { ...prev, observaciones: newObservaciones } : null))
      }
    },
    [selectedEscuela],
  )

  // Función para determinar el estado del espacio físico basado en las observaciones
  const determinarEstadoEspacio = (observaciones?: string) => {
    if (!observaciones) return { estado: "sin-info", label: "Sin información", icon: Info, color: "text-gray-500" }

    const texto = observaciones.toLowerCase()

    if (texto.includes("urgente") || texto.includes("peligro") || texto.includes("grave")) {
      return {
        estado: "critico",
        label: "Estado crítico",
        icon: AlertTriangle,
        color: "text-red-500",
      }
    }

    if (texto.includes("problema") || texto.includes("reparación") || texto.includes("falta")) {
      return {
        estado: "requiere-atencion",
        label: "Requiere atención",
        icon: Info,
        color: "text-amber-500",
      }
    }

    if (texto.includes("buen") || texto.includes("óptimo") || texto.includes("adecuado")) {
      return {
        estado: "optimo",
        label: "Estado óptimo",
        icon: CheckCircle,
        color: "text-green-500",
      }
    }

    return {
      estado: "normal",
      label: "Estado normal",
      icon: Info,
      color: "text-blue-500",
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <ErrorBoundary>
      <div className="bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Escuelas</h1>
          </div>
        </header>
      </div>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="filtroNombre">Filtrar por nombre</Label>
              <Input
                id="filtroNombre"
                placeholder="Nombre de la escuela"
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filtroEquipo">Filtrar por equipo</Label>
              <Select onValueChange={setFiltroEquipo} value={filtroEquipo}>
                <SelectTrigger id="filtroEquipo">
                  <SelectValue placeholder="Selecciona un equipo" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="todos">Todos los equipos</SelectItem>
                  {equipos.map((equipo) => (
                    <SelectItem key={equipo.id} value={equipo.id.toString()}>
                      {equipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setCurrentEscuela(null)
                      setFormData({
                        nombre: "",
                        "direccion.calle": "",
                        "direccion.numero": "",
                        departamentoId: "",
                        equipoId: "",
                        observaciones: "",
                      })
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar Escuela
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{currentEscuela ? "Editar" : "Agregar"} Escuela</DialogTitle>
                    <DialogDescription>
                      Complete los detalles de la escuela aquí. Haga clic en guardar cuando termine.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
                    </div>
                    <div>
                      <Label htmlFor="direccion.calle">Calle</Label>
                      <Input
                        id="direccion.calle"
                        name="direccion.calle"
                        value={formData["direccion.calle"]}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="direccion.numero">Número</Label>
                      <Input
                        id="direccion.numero"
                        name="direccion.numero"
                        value={formData["direccion.numero"]}
                        onChange={handleInputChange}
                        required
                        type="number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="departamentoId">Departamento</Label>
                      <Select
                        name="departamentoId"
                        onValueChange={(value) => handleSelectChange("departamentoId", value)}
                        value={formData.departamentoId}
                      >
                        <SelectTrigger id="departamentoId">
                          <SelectValue placeholder="Selecciona un departamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {departamentos.map((departamento) => (
                            <SelectItem key={departamento.id} value={departamento.id.toString()}>
                              {departamento.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="equipoId">Equipo</Label>
                      <Select
                        name="equipoId"
                        onValueChange={(value) => handleSelectChange("equipoId", value)}
                        value={formData.equipoId}
                      >
                        <SelectTrigger id="equipoId">
                          <SelectValue placeholder="Selecciona un equipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipos.map((equipo) => (
                            <SelectItem key={equipo.id} value={equipo.id.toString()}>
                              {equipo.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="observaciones">Observaciones sobre el espacio físico (opcional)</Label>
                      <Textarea
                        id="observaciones"
                        name="observaciones"
                        placeholder="Registre problemas edilicios, disponibilidad de espacio, mobiliario, etc."
                        className="min-h-[100px]"
                        value={formData.observaciones}
                        onChange={handleTextareaChange}
                      />
                    </div>
                    <Button type="submit">Guardar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {isLoading ? (
            <p className="text-center py-4">Cargando escuelas...</p>
          ) : escuelasFiltradas.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {escuelasFiltradas.map((escuela) => {
                const estadoEspacio = determinarEstadoEspacio(escuela.observaciones)
                const EstadoIcon = estadoEspacio.icon

                return (
                  <AccordionItem key={escuela.id} value={String(escuela.id)}>
                    <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex justify-between w-full">
                        <div className="flex items-center">
                          <span>{escuela.nombre}</span>
                          {escuela.observaciones && (
                            <Badge variant="outline" className={`ml-2 ${estadoEspacio.color} border-current`}>
                              <EstadoIcon className="w-3 h-3 mr-1" />
                              {estadoEspacio.label}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {escuela.equipo ? `Equipo: ${escuela.equipo.nombre}` : "Sin equipo asignado"}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-4">
                      <div className="space-y-4">
                        <p>
                          <strong>Dirección:</strong> {escuela.direccion.calle} {escuela.direccion.numero}
                        </p>

                        {escuela.observaciones && (
                          <div>
                            <strong>Estado del espacio físico:</strong>
                            <p className="mt-1 text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                              {escuela.observaciones.length > 150
                                ? `${escuela.observaciones.substring(0, 150)}...`
                                : escuela.observaciones}
                            </p>
                          </div>
                        )}

                        <div>
                          <strong>Anexos:</strong>
                          {getAnexosForEscuela(escuela.id).length > 0 ? (
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                              {getAnexosForEscuela(escuela.id).map((anexo) => (
                                <li key={anexo.id}>
                                  {anexo.nombre} - Matrícula: {anexo.matricula}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>Sin anexos.</p>
                          )}
                        </div>
                        <div>
                          <strong>Paquetes de Horas:</strong>
                          {escuela.paquetesHoras && escuela.paquetesHoras.length > 0 ? (
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                              {escuela.paquetesHoras.map((paquete) => (
                                <li key={paquete.id}>
                                  {paquete.cantidad} horas - {paquete.profesional.nombre} {paquete.profesional.apellido}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>No hay paquetes de horas asignados.</p>
                          )}
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => handleViewDetails(escuela)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                          </Button>
                          <Button variant="outline" onClick={() => handleEdit(escuela)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </Button>
                          <Button variant="destructive" onClick={() => handleDelete(escuela.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          ) : (
            <p className="text-center py-4 bg-white rounded-lg shadow">
              No se encontraron escuelas con los filtros aplicados.
            </p>
          )}
        </div>
      </div>

      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Escuela</DialogTitle>
          </DialogHeader>
          {selectedEscuela && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedEscuela.nombre}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    <strong>Dirección:</strong> {selectedEscuela.direccion.calle} {selectedEscuela.direccion.numero}
                  </p>
                  <p>
                    <strong>Departamento:</strong> {selectedEscuela.direccion.departamento.nombre}
                  </p>
                  <p>
                    <strong>Equipo:</strong> {selectedEscuela.equipo.nombre}
                  </p>
                </CardContent>
              </Card>

              <ObservacionesEditor
                escuelaId={selectedEscuela.id}
                observaciones={selectedEscuela.observaciones}
                isAdmin={userRoles.isAdmin || userRoles.isAuthorized}
                onObservacionesUpdated={(newObservaciones) =>
                  handleObservacionesUpdated(selectedEscuela.id, newObservaciones)
                }
              />

              <EstadoFisicoCard observaciones={selectedEscuela.observaciones} />

              <Card>
                <CardHeader>
                  <CardTitle>Anexos</CardTitle>
                </CardHeader>
                <CardContent>
                  {getAnexosForEscuela(selectedEscuela.id).length > 0 ? (
                    <ul className="space-y-2">
                      {getAnexosForEscuela(selectedEscuela.id).map((anexo) => (
                        <li key={anexo.id} className="flex justify-between items-center">
                          <span>
                            {anexo.nombre} - Matrícula: {anexo.matricula}
                          </span>
                          <div>
                            <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditAnexo(anexo)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteAnexo(selectedEscuela.id, anexo.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No hay anexos para esta escuela.</p>
                  )}
                  <Button
                    className="mt-4"
                    onClick={() => {
                      setAnexoFormData({ id: undefined, nombre: "", matricula: "" })
                      setIsEditingAnexo(false)
                      setIsAnexoDialogOpen(true)
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar Anexo
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Paquetes de Horas</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedEscuela.paquetesHoras && selectedEscuela.paquetesHoras.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedEscuela.paquetesHoras.map((paquete) => (
                        <li key={paquete.id}>
                          {paquete.cantidad} horas - {paquete.profesional.nombre} {paquete.profesional.apellido}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No hay paquetes de horas asignados a esta escuela.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAnexoDialogOpen} onOpenChange={setIsAnexoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingAnexo ? "Editar" : "Agregar"} Anexo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAnexoSubmit} className="space-y-4">
            <div>
              <Label htmlFor="anexoNombre">Nombre del Anexo</Label>
              <Input
                id="anexoNombre"
                value={anexoFormData.nombre}
                onChange={(e) => setAnexoFormData({ ...anexoFormData, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="anexoMatricula">Matrícula</Label>
              <Input
                id="anexoMatricula"
                type="number"
                value={anexoFormData.matricula}
                onChange={(e) => setAnexoFormData({ ...anexoFormData, matricula: e.target.value })}
                required
              />
            </div>
            <Button type="submit">{isEditingAnexo ? "Actualizar" : "Guardar"} Anexo</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isObservacionesDialogOpen} onOpenChange={setIsObservacionesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Observaciones del Espacio Físico</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleObservacionesSubmit} className="space-y-4">
            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                name="observaciones"
                placeholder="Registre problemas edilicios, disponibilidad de espacio, mobiliario, etc."
                className="min-h-[200px]"
                value={formData.observaciones}
                onChange={handleTextareaChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Incluya detalles sobre el estado edilicio, mobiliario, disponibilidad de espacio y cualquier problema
                que requiera atención.
              </p>
            </div>
            <Button type="submit">Guardar Observaciones</Button>
          </form>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  )
}
