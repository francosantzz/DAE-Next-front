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
import { PlusCircle, Edit, Trash2, Eye, AlertTriangle } from "lucide-react"
import { ObservacionesEditor } from "@/components/escuela/observaciones-editor"
import { determinarEstado, EstadoFisicoCard, getIconAndColor } from "@/components/escuela/estado-fisico-card"
import ErrorBoundary from "@/components/ErrorBoundary"
import { useSession } from "next-auth/react"
import { useDebounce } from "@/hooks/useDebounce"
import { PermissionButton } from "@/components/PermissionButton"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { usePermissions } from "@/hooks/usePermissions"
import { Direccion } from "@/types/Direccion.interface"
import { Departamento } from "@/types/Departamento.interface"

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

interface PaqueteHoras {
  id: number
  cantidad: string
  profesional: {
    id: number
    nombre: string
    apellido: string
    // AGREGAR ESTOS CAMPOS
    licenciaActiva: boolean
    tipoLicencia?: string
    fechaFinLicencia?: string
  }
}

interface Seccion {
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
  CUE?: number
  Numero?: string
  telefono?: string
  matricula?: number
  IVE?: string
  Ambito?: string
  direccion: Direccion
  equipo: Equipo
  anexos: Anexo[]
  paquetesHoras: PaqueteHoras[]
  observaciones?: string
}

//

export default function ListaEscuelas() {
  const { data: session } = useSession()
  const { hasPermission, userRole } = usePermissions()
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [busquedaInput, setBusquedaInput] = useState('')
  const busqueda = useDebounce(busquedaInput, 1000)
  const [filtroEquipo, setFiltroEquipo] = useState("todos")
  const [filtroSinPaquetes, setFiltroSinPaquetes] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentEscuela, setCurrentEscuela] = useState<Escuela | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    CUE: "",
    Numero: "",
    telefono: "",
    matricula: "",
    IVE: "",
    Ambito: "",
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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  const fetchData = useCallback(async () => {
    if (!session?.user?.accessToken) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: busqueda,
        ...(filtroEquipo !== 'todos' && { equipoId: filtroEquipo }),
        ...(filtroSinPaquetes && { sinPaquetes: 'true' }) // <- NUEVO PARÁMETRO
      });
      const [escuelasRes, equiposRes, departamentosRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas?${params}`, {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`
          }
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/short?page=1&limit=100`, {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`
          }
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`, {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`
          }
        })
      ])

      if (!escuelasRes.ok || !equiposRes.ok || !departamentosRes.ok)
        throw new Error("Error al obtener los datos")

      const [escuelasData, equiposData, departamentosData] = await Promise.all([
        escuelasRes.json(),
        equiposRes.json(),
        departamentosRes.json()
      ])

      setEscuelas(escuelasData.data)
      setTotalPages(escuelasData.meta.totalPages)
      setTotalItems(escuelasData.meta.total)
      setEquipos(equiposData.data || equiposData)
      setDepartamentos(departamentosData)
    } catch (error) {
      console.error("Error al obtener datos:", error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.accessToken, currentPage, busqueda, filtroEquipo, filtroSinPaquetes])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Resetear página cuando cambie la búsqueda
  useEffect(() => {
    setCurrentPage(1)
  }, [busqueda, filtroEquipo, filtroSinPaquetes])

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
    if (!session?.user?.accessToken) return

    try {
      const url = currentEscuela
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${currentEscuela.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas`
      const method = currentEscuela ? "PATCH" : "POST"
  
      const payload = {
        nombre: formData.nombre,
        CUE: formData.CUE ? Number(formData.CUE) : undefined,
        Numero: formData.Numero || undefined,
        telefono: formData.telefono || undefined,
        matricula: formData.matricula ? Number(formData.matricula) : undefined,
        IVE: formData.IVE || undefined,
        Ambito: formData.Ambito || undefined,
        direccion: {
          id: currentEscuela?.direccion?.id,
          calle: formData["direccion.calle"],
          numero: formData["direccion.numero"],
          departamentoId: formData.departamentoId ? Number(formData.departamentoId) : undefined
        },
        equipoId: formData.equipoId ? Number(formData.equipoId) : undefined,
        observaciones: formData.observaciones,
        anexos: currentEscuela?.anexos || [],
        paquetesHorasIds: currentEscuela?.paquetesHoras?.map(p => p.id) || []
      }
  
      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify(payload)
      })
  
      if (!response.ok) throw new Error("Error al guardar la escuela")
  
      const updatedEscuela = await response.json()
      
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
    }
  }
  
  const resetForm = () => {
    setFormData({
      nombre: "",
      CUE: "",
      Numero: "",
      telefono: "",
      matricula: "",
      IVE: "",
      Ambito: "",
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
      CUE: escuela.CUE?.toString() || "",
      Numero: escuela.Numero || "",
      telefono: escuela.telefono || "",
      matricula: escuela.matricula?.toString() || "",
      IVE: escuela.IVE || "",
      Ambito: escuela.Ambito || "",
      "direccion.calle": escuela.direccion.calle,
      "direccion.numero": escuela.direccion.numero,
      departamentoId: escuela.direccion.departamento.id.toString(),
      equipoId: escuela.equipo?.id?.toString() || '',
      observaciones: escuela.observaciones || ""
    })
    setIsDialogOpen(true)
  }, [])

  const handleDelete = useCallback(
    async (id: number) => {
      if (!session?.user?.accessToken) return

      if (window.confirm("¿Estás seguro de que quieres eliminar esta escuela?")) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session.user.accessToken}`
            }
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
    [selectedEscuela, session?.user?.accessToken],
  )

  const handleViewDetails = useCallback(
    (escuela: Escuela) => {
      const updatedEscuela = escuelas.find((e) => e.id === escuela.id) || escuela
      setSelectedEscuela(updatedEscuela)
      setIsDetailViewOpen(true)
    },
    [escuelas],
  )


  const handleAnexoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEscuela?.id || !session?.user?.accessToken) return;
  
    try {
      const url = isEditingAnexo
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${selectedEscuela.id}/anexos/${anexoFormData.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${selectedEscuela.id}/anexos`;
      const method = isEditingAnexo ? "PATCH" : "POST";
  
      const payload = {
        nombre: anexoFormData.nombre,
        matricula: Number(anexoFormData.matricula)
      };
  
      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) throw new Error("Error al guardar el anexo");
  
      const updatedEscuela = await response.json();
  
      // Actualizar la escuela seleccionada
      setSelectedEscuela(updatedEscuela);
      
      // Actualizar la lista de escuelas
      setEscuelas(prev => 
        prev.map(e => e.id === selectedEscuela.id ? updatedEscuela : e)
      );
  
      setIsAnexoDialogOpen(false);
      setAnexoFormData({ id: undefined, nombre: "", matricula: "" });
      setIsEditingAnexo(false);
    } catch (error) {
      console.error("Error al guardar el anexo:", error);
    }
  };

  const handleDeleteAnexo = async (anexoId: number) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este anexo?") || !session?.user?.accessToken) return;
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/anexos/${anexoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`
        }
      });
  
      if (!response.ok) throw new Error("Error al eliminar el anexo");
  
      // Actualizar la escuela seleccionada
      if (selectedEscuela) {
        const updatedEscuela = {
          ...selectedEscuela,
          anexos: selectedEscuela.anexos.filter(a => a.id !== anexoId)
        };
        setSelectedEscuela(updatedEscuela);
  
        // Actualizar también en la lista de escuelas
        setEscuelas(prev => 
          prev.map(e => e.id === selectedEscuela.id ? updatedEscuela : e)
        );
      }
    } catch (error) {
      console.error("Error al eliminar el anexo:", error);
    }
  };

  const handleEditAnexo = (anexo: Anexo) => {
    setAnexoFormData({
      id: anexo.id,
      nombre: anexo.nombre,
      matricula: anexo.matricula.toString()
    })
    setIsEditingAnexo(true)
    setIsAnexoDialogOpen(true)
  }

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
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.accessToken}`
          },
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
  // Función para verificar si el usuario puede editar completamente una escuela
  // El rol equipo solo puede editar observaciones, no otros campos
  const canEditEscuelaCompletely = () => {
    return hasPermission("escuela", "update") && userRole !== "equipo"
  }

  // Función para verificar si el usuario puede eliminar escuelas
  const canDeleteEscuela = () => {
    return hasPermission("escuela", "delete")
  }

  // Función para calcular estadísticas de horas
const calcularEstadisticasHoras = (paquetesHoras: PaqueteHoras[]) => {
  const totalHoras = paquetesHoras.reduce((total, ph) => total + parseFloat(ph.cantidad), 0);
  
  // Filtrar paquetes de profesionales que NO están en licencia activa
  const paquetesActivos = paquetesHoras.filter(paquete => {
    const profesional = paquete.profesional;
    return !profesional.licenciaActiva || 
           !profesional.fechaFinLicencia || 
           new Date(profesional.fechaFinLicencia) < new Date();
  });
  
  const horasActivas = paquetesActivos.reduce((total, ph) => total + parseFloat(ph.cantidad), 0);
  const horasEnLicencia = totalHoras - horasActivas;
  
  return {
    totalHoras,
    horasActivas,
    horasEnLicencia,
    paquetesActivos,
    paquetesEnLicencia: paquetesHoras.filter(paquete => {
      const profesional = paquete.profesional;
      return profesional.licenciaActiva && 
             profesional.fechaFinLicencia && 
             new Date(profesional.fechaFinLicencia) >= new Date();
    })
  };
};

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <ProtectedRoute requiredPermission={{entity: "escuela", action: "read"}}>
    <ErrorBoundary>
      <div className="bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Escuelas</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <PermissionButton
                    requiredPermission={{entity: "escuela", action: "create"}}
                      onClick={() => {
                        setCurrentEscuela(null)
                        resetForm()
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Agregar Escuela
                    </PermissionButton>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] h-[90vh] sm:max-w-[1000px] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{currentEscuela ? "Editar" : "Agregar"} Escuela</DialogTitle>
                      <DialogDescription>
                        Complete los detalles de la escuela aquí. Haga clic en guardar cuando termine.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nombre">Nombre</Label>
                          <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
                        </div>
                        <div>
                          <Label htmlFor="CUE">CUE</Label>
                          <Input id="CUE" name="CUE" value={formData.CUE} onChange={handleInputChange} type="number" />
                        </div>
                        <div>
                          <Label htmlFor="Numero">Número Anexo</Label>
                          <Input id="Numero" name="Numero" value={formData.Numero} onChange={handleInputChange} />
                        </div>
                        <div>
                          <Label htmlFor="telefono">Teléfono</Label>
                          <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleInputChange} />
                        </div>
                        <div>
                          <Label htmlFor="matricula">Matrícula</Label>
                          <Input id="matricula" name="matricula" value={formData.matricula} onChange={handleInputChange} type="number" />
                        </div>
                        <div>
                          <Label htmlFor="IVE">IVE</Label>
                          <Select
                            name="IVE"
                            onValueChange={(value) => handleSelectChange("IVE", value)}
                            value={formData.IVE}
                          >
                            <SelectTrigger id="IVE">
                              <SelectValue placeholder="Selecciona el IVE" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="alto">Alto</SelectItem>
                              <SelectItem value="medio">Medio</SelectItem>
                              <SelectItem value="bajo">Bajo</SelectItem>
                              <SelectItem value="sin ive">Sin IVE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="Ambito">Ámbito</Label>
                          <Input id="Ambito" name="Ambito" value={formData.Ambito} onChange={handleInputChange} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <SelectContent className="max-h-60 overflow-y-auto">
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
                      </div>
                      
                      <div>
                        <Label htmlFor="observaciones">Observaciones (opcional)</Label>
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
        </header>
      </div>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-8">
          {/* Grid RESPONSIVE: 1 col (xs), 2 col (sm), 3 col (lg) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <Label htmlFor="busqueda">Filtrar por nombre o número de escuela</Label>
              <Input
                id="busqueda"
                placeholder="Nombre/Número de la escuela"
                value={busquedaInput}
                onChange={(e) => setBusquedaInput(e.target.value)}
                className="h-10"
              />
            </div>

            <div>
              <Label htmlFor="filtroEquipo">Filtrar por equipo</Label>
              <Select onValueChange={setFiltroEquipo} value={filtroEquipo}>
                <SelectTrigger id="filtroEquipo" className="h-10">
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

            {/* El checkbox ocupa su propia celda y se ve bien en móvil */}
            <div className="flex items-center gap-2 sm:justify-start pt-6 sm:pt-7">
              <input
                type="checkbox"
                id="filtroSinPaquetes"
                checked={filtroSinPaquetes}
                onChange={(e) => setFiltroSinPaquetes(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="filtroSinPaquetes" className="text-sm font-medium text-gray-700">
                Mostrar sólo escuelas SIN profesionales
              </Label>
            </div>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center py-4">Cargando escuelas...</p>
        ) : escuelas.length > 0 ? (
          <>
            <Accordion type="multiple" className="w-full">
              {escuelas.map((escuela) => {
                const { estado, label } = determinarEstado(escuela.observaciones);
                const { icon: EstadoIcon, color } = getIconAndColor(estado);
                return (
                  <AccordionItem key={escuela.id} value={String(escuela.id)}>
                    <AccordionTrigger className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
                        {/* Izquierda: nombre + badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-1.5 sm:gap-2">
                          <div className="text-sm sm:text-base font-medium">
                            {escuela.nombre} {escuela.Numero ? <>- {escuela.Numero}</> : null}
                          </div>

                          {escuela.observaciones && (
                            <Badge variant="outline" className={`w-fit ${color} border-current`}>
                              <EstadoIcon className="w-3 h-3 mr-1" />
                              {label}
                            </Badge>
                          )}

                          {/* HORAS (usa tu calcularEstadisticasHoras) */}
                          {(() => {
                            const stats = calcularEstadisticasHoras(escuela.paquetesHoras || [])
                            if (stats.totalHoras === 0) {
                              return (
                                <Badge variant="destructive" className="w-fit flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Sin profesionales
                                </Badge>
                              )
                            }
                            return (
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <Badge variant="outline" className="w-fit border-green-500 text-green-700 bg-green-50">
                                  {stats.horasActivas}h cubiertas
                                </Badge>
                                {stats.horasEnLicencia > 0 && (
                                  <Badge variant="outline" className="w-fit border-orange-500 text-orange-700 bg-orange-50">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    {stats.horasEnLicencia}h licencia
                                  </Badge>
                                )}
                              </div>
                            )
                          })()}
                        </div>

                        {/* Derecha: equipo */}
                        <span className="text-xs sm:text-sm text-gray-500">
                          {escuela.equipo ? `Equipo: ${escuela.equipo.nombre}` : "Sin equipo asignado"}
                        </span>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 sm:px-6 py-4">
                      <div className="space-y-4">
                        {/* Info básica */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <p>
                            <strong>Dirección:</strong> {escuela.direccion.calle} {escuela.direccion.numero}
                          </p>

                          <div className="space-y-1">
                            {escuela.observaciones && (
                              <>
                                <strong>Observaciones:</strong>
                                <p className="mt-1 text-gray-700 bg-gray-50 p-2 rounded border border-gray-200 text-sm">
                                  {escuela.observaciones.length > 150
                                    ? `${escuela.observaciones.substring(0, 150)}...`
                                    : escuela.observaciones}
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Listas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <strong>Anexos:</strong>
                            {escuela.anexos?.length ? (
                              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                {escuela.anexos.map(a => (
                                  <li key={a.id}>{a.nombre} — Matrícula: {a.matricula}</li>
                                ))}
                              </ul>
                            ) : <p className="text-sm text-gray-600 mt-1">Sin anexos.</p>}
                          </div>

                          <div>
                            <strong>Paquetes de Horas:</strong>
                            {escuela.paquetesHoras?.length ? (
                              <ul className="list-disc pl-5 mt-2 space-y-2 text-sm">
                                {escuela.paquetesHoras.map((paquete: any) => {
                                  const enLic = paquete.profesional.licenciaActiva &&
                                                paquete.profesional.fechaFinLicencia &&
                                                new Date(paquete.profesional.fechaFinLicencia) >= new Date()
                                  const d = paquete.dias || {}
                                  const hI = (d.horaInicio || '').toString().slice(0,5)
                                  const hF = (d.horaFin || '').toString().slice(0,5)
                                  const dia = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][Number(d.diaSemana)] || "-"
                                  const rot = !!d.rotativo
                                  const sem = d.semanas as number[] | undefined

                                  return (
                                    <li key={paquete.id} className={enLic ? "text-orange-600" : ""}>
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="font-medium">{paquete.cantidad} h</span>
                                        <span>— {paquete.profesional.nombre} {paquete.profesional.apellido}</span>
                                        {enLic && (
                                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                            ⚠️ En Licencia
                                          </Badge>
                                        )}
                                      </div>
                                      {(hI || hF) && (
                                        <div className={`text-xs ml-0.5 ${enLic ? "text-orange-500" : "text-gray-600"}`}>
                                          {dia} {hI}–{hF}{rot ? (sem?.length ? ` (Rotativo, semanas: ${sem.join(", ")})` : " (Rotativo)") : ""}
                                        </div>
                                      )}
                                    </li>
                                  )
                                })}
                              </ul>
                            ) : <p className="text-sm text-gray-600 mt-1">No hay paquetes de horas.</p>}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex flex-col sm:flex-row justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(escuela)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                          </Button>

                          {canEditEscuelaCompletely() && (
                            <PermissionButton
                              requiredPermission={{entity: "escuela", action: "update"}}
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(escuela)}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </PermissionButton>
                          )}

                          {canDeleteEscuela() && (
                            <PermissionButton
                              requiredPermission={{entity: "escuela", action: "delete"}}
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(escuela.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </PermissionButton>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>

            {/* Paginación */}
            <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-2">
              <Button variant="outline" size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <Button variant="outline" size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </>
        ) : (
          <p className="text-center py-4 bg-white rounded-lg shadow">
            {filtroSinPaquetes 
              ? "No se encontraron escuelas sin paquetes de horas asignados." 
              : "No se encontraron escuelas con los filtros aplicados."
            }
          </p>
        )}
      </div>

      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="w-[95vw] h-[90vh] sm:max-w-[1000px] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Escuela</DialogTitle>
          </DialogHeader>
          {selectedEscuela && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">{selectedEscuela.nombre}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <p><strong>Dirección:</strong> {selectedEscuela.direccion?.calle} {selectedEscuela.direccion?.numero}</p>
                    <p><strong>Departamento:</strong> {selectedEscuela.direccion?.departamento?.nombre || 'No asignado'}</p>
                    <p><strong>Equipo:</strong> {selectedEscuela.equipo?.nombre || 'No asignado'}</p>
                    {selectedEscuela.CUE && <p><strong>CUE:</strong> {selectedEscuela.CUE}</p>}
                    {selectedEscuela.Numero && <p><strong>Número:</strong> {selectedEscuela.Numero}</p>}
                    {selectedEscuela.telefono && <p><strong>Teléfono:</strong> {selectedEscuela.telefono}</p>}
                    {selectedEscuela.matricula && <p><strong>Matrícula:</strong> {selectedEscuela.matricula}</p>}
                    {selectedEscuela.IVE && <p><strong>IVE:</strong> {selectedEscuela.IVE}</p>}
                    {selectedEscuela.Ambito && <p><strong>Ámbito:</strong> {selectedEscuela.Ambito}</p>}
                  </div>
                </CardContent>
              </Card>

              <ObservacionesEditor
                escuelaId={selectedEscuela.id}
                observaciones={selectedEscuela.observaciones}
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
                {selectedEscuela.anexos && selectedEscuela.anexos.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedEscuela.anexos.map((anexo) => (
                      <li key={anexo.id} className="flex justify-between items-center">
                        <span>
                          {anexo.nombre} - Matrícula: {anexo.matricula}
                        </span>
                        <div>
                          <PermissionButton 
                            requiredPermission={{ entity: 'anexo', action: 'update'}}
                            variant="outline" 
                            size="sm" 
                            className="mr-2" 
                            onClick={() => handleEditAnexo(anexo)}
                          >
                            <Edit className="h-4 w-4" />
                          </PermissionButton>
                          <PermissionButton
                            requiredPermission={{ entity: 'anexo', action: 'delete'}}
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteAnexo(anexo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </PermissionButton>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No hay anexos para esta escuela.</p>
                )}
                  <PermissionButton
                    requiredPermission={{ entity: 'anexo', action: 'create'}}
                    className="mt-4"
                    onClick={() => {
                      setAnexoFormData({ id: undefined, nombre: "", matricula: "" })
                      setIsEditingAnexo(false)
                      setIsAnexoDialogOpen(true)
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar Anexo
                  </PermissionButton>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Paquetes de Horas</CardTitle>
                  {selectedEscuela.paquetesHoras?.length ? (() => {
                    const stats = calcularEstadisticasHoras(selectedEscuela.paquetesHoras)
                    return (
                      <div className="flex gap-2 text-xs sm:text-sm overflow-x-auto pb-1">
                        <Badge variant="outline" className="whitespace-nowrap border-green-500 text-green-700 bg-green-50">
                          {stats.horasActivas}h cubiertas
                        </Badge>
                        {stats.horasEnLicencia > 0 && (
                          <Badge variant="outline" className="whitespace-nowrap border-orange-500 text-orange-700 bg-orange-50">
                            {stats.horasEnLicencia}h en licencia
                          </Badge>
                        )}
                      </div>
                    )
                  })() : null}
                </CardHeader>

                <CardContent>
                  {selectedEscuela.paquetesHoras && selectedEscuela.paquetesHoras.length > 0 ? (
                    <ul className="space-y-3">
                      {selectedEscuela.paquetesHoras.map((paquete: any) => {
                        const profesionalEnLicencia = paquete.profesional.licenciaActiva && 
                          paquete.profesional.fechaFinLicencia && 
                          new Date(paquete.profesional.fechaFinLicencia) >= new Date();
                        
                        return (
                          <li key={paquete.id} className={`p-3 rounded-lg border ${
                            profesionalEnLicencia ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"
                          }`}>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">{paquete.cantidad} horas</span>
                                  <span>- {paquete.profesional.nombre} {paquete.profesional.apellido}</span>
                                  {profesionalEnLicencia && (
                                    <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                                      ⚠️ En Licencia
                                      {paquete.profesional.tipoLicencia && ` - ${paquete.profesional.tipoLicencia}`}
                                    </Badge>
                                  )}
                                </div>
                                {profesionalEnLicencia && paquete.profesional.fechaFinLicencia && (
                                  <div className="text-xs text-orange-600 mb-1">
                                    Hasta: {new Date(paquete.profesional.fechaFinLicencia).toLocaleDateString('es-ES')}
                                  </div>
                                )}
                                {(() => {
                                  const d = paquete.dias || {}
                                  const dia = d.diaSemana
                                  const hI = (d.horaInicio || '').toString().slice(0,5)
                                  const hF = (d.horaFin || '').toString().slice(0,5)
                                  const rot = !!d.rotativo
                                  const sem = d.semanas as number[] | undefined
                                  const diaLabel = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][Number(dia)] || "-"
                                  if (!dia && !hI && !hF) return null
                                  return (
                                    <div className={`text-sm ${profesionalEnLicencia ? "text-orange-700" : "text-gray-600"}`}>
                                      <span className="font-medium">Horario:</span> {diaLabel} {hI} - {hF}
                                      {rot ? (sem && sem.length ? ` (Rotativo, semanas: ${sem.join(', ')})` : ' (Rotativo)') : ''}
                                    </div>
                                  )
                                })()}
                              </div>
                            </div>
                          </li>
                        )
                      })}
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
        <DialogContent className="w-[95vw] h-[90vh] sm:max-w-[1000px] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
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
        <DialogContent className="w-[95vw] h-[90vh] sm:max-w-[1000px] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Observaciones</DialogTitle>
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
            <PermissionButton
              requiredPermission={{ entity: "escuela", action: "update" }}
              type="submit"
            >
              Guardar Observaciones
            </PermissionButton>
          </form>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
    </ProtectedRoute>
  )
}
