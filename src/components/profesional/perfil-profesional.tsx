"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Pencil, Trash2, AlertCircle, Edit, XIcon, BriefcaseIcon, CalendarIcon, ClockIcon, FilePenIcon, MapPinIcon, PhoneIcon, TrendingUpIcon, UserCheckIcon, UsersIcon, Plus, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Layout from "./LayoutProf"
import ErrorBoundary from "../ErrorBoundary"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "../ProtectedRoute"
import { PermissionButton } from "../PermissionButton"

// Interfaces (unchanged)
interface Departamento {
  id: number
  nombre: string
}

interface Region {
  id: number
  nombre: string
}

interface Direccion {
  id: number
  calle: string
  numero: string
  departamento: Departamento
  region?: Region
}

interface Escuela {
  id: number
  nombre: string
}

interface Equipo {
  id: number
  nombre: string
  departamento: Departamento
}

interface Dias {
  lunes: string | null
  martes: string | null
  miercoles: string | null
  jueves: string | null
  viernes: string | null
}

interface PaqueteHoras {
  id: number
  tipo: string
  cantidad: number
  equipo: Equipo
  escuela: Escuela
  dias: Dias
}

interface CargoHoras {
  id?: number;
  tipo: 'comunes' | 'investigacion' | 'mision_especial' | 'regimen_27';
  cantidadHoras: number;
}

interface Profesional {
  id: number
  nombre: string
  apellido: string
  cuil: string
  profesion: string
  matricula: string
  telefono: string
  fechaNacimiento: string
  dni: string
  fechaVencimientoMatricula: string
  fechaVencimientoPsicofisico: string
  correoElectronico: string
  totalHoras: number
  cargosHoras: CargoHoras[]
  equipos: Equipo[]
  paquetesHoras: PaqueteHoras[]
  direccion: Direccion
}

export default function PerfilProfesional() {
  const { data: session } = useSession()
  const params = useParams();
  const id = params?.id; // Esto sí será el id correcto como string
  const [profesional, setProfesional] = useState<Profesional | null>(null)
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [escuelasFiltradas, setEscuelasFiltradas] = useState<Escuela[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPaqueteDialogOpen, setIsPaqueteDialogOpen] = useState(false)
  const [currentPaquete, setCurrentPaquete] = useState<PaqueteHoras | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cuil: "",
    profesion: "",
    matricula: "",
    telefono: "",
    fechaNacimiento: "",
    dni: "",
    fechaVencimientoMatricula: "",
    fechaVencimientoPsicofisico: "",
    correoElectronico: "",
    equiposIds: [] as number[],
    cargosHoras: [] as CargoHoras[],
    direccion: {
      calle: "",
      numero: "",
      departamentoId: ""
    }
  })
  const [paqueteFormData, setPaqueteFormData] = useState({
    id: 0,
    tipo: "",
    cantidad: "",
    equipoId: "",
    escuelaId: "",
    dias: {
      lunes: "",
      martes: "",
      miercoles: "",
      jueves: "",
      viernes: "",
    },
  })
  const router = useRouter()

  const tiposPaquete = ["Escuela", "Trabajo Interdisciplinario", "Carga en Gei"]

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.accessToken) return;
      
      setIsLoading(true)
      try {
        const [profesionalRes, equiposRes, departamentosRes, escuelasRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}`, {
            headers: {Authorization: `Bearer ${session?.user?.accessToken}`}
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`, {
            headers: {Authorization: `Bearer ${session?.user?.accessToken}`}
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`, {
            headers: {Authorization: `Bearer ${session?.user?.accessToken}`}
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas`, {
            headers: { Authorization: `Bearer ${session?.user?.accessToken}`}
          }),
        ])

        if (!profesionalRes.ok || !equiposRes.ok || !departamentosRes.ok || !escuelasRes.ok)
          throw new Error("Error al obtener los datos")

        const [profesionalData, equiposData, departamentosData, escuelasData] = await Promise.all([
          profesionalRes.json(),
          equiposRes.json(),
          departamentosRes.json(),
          escuelasRes.json(),
        ])


        setProfesional(profesionalData)
        setEquipos(equiposData.data || equiposData)
        setDepartamentos(departamentosData)
        setEscuelas(escuelasData.data || [])

        // Cargar los datos del profesional en el formulario
        setFormData({
          nombre: profesionalData.nombre,
          apellido: profesionalData.apellido,
          cuil: profesionalData.cuil,
          profesion: profesionalData.profesion,
          matricula: profesionalData.matricula,
          telefono: profesionalData.telefono,
          fechaNacimiento: profesionalData.fechaNacimiento,
          dni: profesionalData.dni,
          fechaVencimientoMatricula: profesionalData.fechaVencimientoMatricula,
          fechaVencimientoPsicofisico: profesionalData.fechaVencimientoPsicofisico,
          correoElectronico: profesionalData.correoElectronico,
          equiposIds: profesionalData.equipos.map((e: Equipo) => e.id),
          cargosHoras: profesionalData.cargosHoras,
          direccion: {
            calle: profesionalData.direccion.calle,
            numero: profesionalData.direccion.numero,
            departamentoId: profesionalData.direccion.departamento.id.toString()
          }
        })
      } catch (error) {
        console.error("Error al obtener datos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, session?.user?.accessToken])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleCargoHorasChange = (index: number, field: keyof CargoHoras, value: string | number) => {
    const updatedCargos = [...formData.cargosHoras]
    updatedCargos[index] = { ...updatedCargos[index], [field]: value }
    setFormData({ ...formData, cargosHoras: updatedCargos })
  }

  const addCargoHoras = () => {
    setFormData({
      ...formData,
      cargosHoras: [...formData.cargosHoras, { tipo: 'comunes', cantidadHoras: 0 }]
    })
  }

  const removeCargoHoras = (index: number) => {
    setFormData({
      ...formData,
      cargosHoras: formData.cargosHoras.filter((_, i) => i !== index)
    })
  }

  const cargarEscuelasPorEquipo = async (equipoId: string) => {
    if (!session?.user?.accessToken || !equipoId) {
      setEscuelasFiltradas([])
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/por-equipo/${equipoId}`, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` }
      })

      if (response.ok) {
        const data = await response.json()
        setEscuelasFiltradas(data)
      } else {
        console.error('Error al cargar escuelas por equipo')
        setEscuelasFiltradas([])
      }
    } catch (error) {
      console.error('Error al cargar escuelas por equipo:', error)
      setEscuelasFiltradas([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}`, {
        method: "PATCH",
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.accessToken}`
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          cuil: formData.cuil,
          profesion: formData.profesion,
          matricula: formData.matricula,
          telefono: formData.telefono,
          fechaNacimiento: formData.fechaNacimiento,
          dni: formData.dni,
          fechaVencimientoMatricula: formData.fechaVencimientoMatricula,
          fechaVencimientoPsicofisico: formData.fechaVencimientoPsicofisico,
          correoElectronico: formData.correoElectronico,
          equiposIds: formData.equiposIds,
          cargosHoras: formData.cargosHoras,
          direccion: {
            calle: formData.direccion.calle,
            numero: formData.direccion.numero,
            departamentoId: parseInt(formData.direccion.departamentoId)
          }
        }),
      })

      if (!response.ok) throw new Error("Error al actualizar el profesional")

      const updatedProfesional = await response.json()
      setProfesional(updatedProfesional)
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error al actualizar el profesional:", error)
    }
  }

  const handlePaqueteEdit = (paquete: PaqueteHoras) => {
    setCurrentPaquete(paquete)
    setPaqueteFormData({
      id: paquete.id,
      tipo: paquete.tipo,
      cantidad: paquete.cantidad.toString(),
      equipoId: paquete.equipo.id.toString(),
      escuelaId: paquete.escuela?.id?.toString() || "",
      dias: {
        lunes: paquete.dias.lunes || "",
        martes: paquete.dias.martes || "",
        miercoles: paquete.dias.miercoles || "",
        jueves: paquete.dias.jueves || "",
        viernes: paquete.dias.viernes || "",
      },
    })
    
    // Cargar las escuelas correspondientes al equipo del paquete
    cargarEscuelasPorEquipo(paquete.equipo.id.toString())
    
    setIsPaqueteDialogOpen(true)
  }

  const handlePaqueteDelete = async (paqueteId: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este paquete de horas?")) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}/paquetes/${paqueteId}`,
          {
            method: "DELETE",
            headers: {
              'Authorization': `Bearer ${session?.user?.accessToken}`
            }
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Error al eliminar el paquete de horas")
        }

        // Actualizar el estado local inmediatamente
        if (profesional) {
          const updatedPaquetes = profesional.paquetesHoras.filter((p) => p.id !== paqueteId)
          setProfesional({
            ...profesional,
            paquetesHoras: updatedPaquetes,
            totalHoras: updatedPaquetes.reduce((sum, p) => sum + p.cantidad, 0),
          })
        }
      } catch (error) {
        console.error("Error al eliminar el paquete de horas:", error)
        alert(error instanceof Error ? error.message : "Error al eliminar el paquete de horas")
      }
    }
  }

  const handlePaqueteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    try {
      // Validar que si el tipo no es Escuela, no se envíe escuelaId
      const requestData = {
        tipo: paqueteFormData.tipo,
        cantidad: Number(paqueteFormData.cantidad),
        equipoId: Number(paqueteFormData.equipoId),
        escuelaId: paqueteFormData.tipo === "Escuela" ? Number(paqueteFormData.escuelaId) : null,
        dias: paqueteFormData.dias,
      }

      const url = currentPaquete
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}/paquetes/${currentPaquete.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}/paquetes`
      const method = currentPaquete ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json",
          'Authorization': `Bearer ${session?.user?.accessToken}`
         },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al guardar el paquete de horas")
      }

      const updatedProfesional = await response.json()
      
      // Encontrar el paquete actualizado en la respuesta
      const updatedPaquete = updatedProfesional.paquetesHoras.find(
        (p: PaqueteHoras) => p.id === (currentPaquete?.id || updatedProfesional.paquetesHoras[updatedProfesional.paquetesHoras.length - 1].id)
      )

      const paqueteCompleto = updatedPaquete;

      // Actualizar el estado local inmediatamente
      if (profesional) {
        const updatedPaquetes = currentPaquete
          ? profesional.paquetesHoras.map((p) => (p.id === currentPaquete.id ? paqueteCompleto : p))
          : [...profesional.paquetesHoras, paqueteCompleto]

        setProfesional({
          ...profesional,
          paquetesHoras: updatedPaquetes,
          totalHoras: updatedPaquetes.reduce((sum, p) => sum + p.cantidad, 0),
        })
      }

      setIsPaqueteDialogOpen(false)
      setCurrentPaquete(null)
      setPaqueteFormData({
        id: 0,
        tipo: "",
        cantidad: "",
        equipoId: "",
        escuelaId: "",
        dias: {
          lunes: "",
          martes: "",
          miercoles: "",
          jueves: "",
          viernes: "",
        },
      })
    } catch (error) {
      console.error("Error al guardar el paquete de horas:", error)
      setFormError(error instanceof Error ? error.message : "Error al guardar el paquete de horas")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaqueteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name.startsWith("dias.")) {
      const dia = name.split(".")[1]
      setPaqueteFormData((prev) => ({
        ...prev,
        dias: {
          ...prev.dias,
          [dia]: value,
        },
      }))
    } else {
      setPaqueteFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handlePaqueteSelectChange = (name: string, value: string) => {
    setPaqueteFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Si se selecciona un equipo, cargar las escuelas correspondientes
    if (name === "equipoId") {
      cargarEscuelasPorEquipo(value)
      // Limpiar la escuela seleccionada cuando cambia el equipo
      setPaqueteFormData((prev) => ({
        ...prev,
        escuelaId: ""
      }))
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!profesional) {
    return <div>No se encontró el profesional</div>
  }

  return (
    <ProtectedRoute requiredPermission={{ entity: "profesional", action: "read" }}>
    <ErrorBoundary>
    <Layout>
  <div className="container mx-auto py-8 bg-gray-50">
    {isLoading ? (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3 bg-gray-200 rounded-lg" />
        <Skeleton className="h-32 w-full bg-gray-200 rounded-lg" />
        <Skeleton className="h-32 w-full bg-gray-200 rounded-lg" />
      </div>
    ) : profesional ? (
      <div className="space-y-6">
        {/* Tarjeta de Información Personal - Mejorada */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 rounded-full p-2">
                <UserCheckIcon className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-800">
                Información Personal
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-blue-50 text-base text-blue-700 border-blue-200">
                  {profesional.profesion}
                </Badge>
                <span className="text-base">Mat: {profesional.matricula}</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <UserCheckIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <p className="text-gray-700">
                    <span className="font-medium">Nombre:</span> {profesional.nombre} {profesional.apellido}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <FilePenIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <p className="text-gray-700">
                    <span className="font-medium">DNI:</span> {profesional.dni}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <FilePenIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <p className="text-gray-700">
                    <span className="font-medium">CUIL:</span> {profesional.cuil}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <PhoneIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <p className="text-gray-700">
                    <span className="font-medium">Teléfono:</span> {profesional.telefono}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <FilePenIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <p className="text-gray-700">
                    <span className="font-medium">Correo:</span> {profesional.correoElectronico}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <CalendarIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <p className="text-gray-700">
                    <span className="font-medium">Fecha Nacimiento:</span> {profesional.fechaNacimiento}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-orange-50 rounded-full p-2">
                  <MapPinIcon className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Dirección</h4>
                  <p className="text-base text-gray-600">
                    {profesional.direccion.calle} {profesional.direccion.numero}
                  </p>
                  <p className="text-base text-gray-600">
                    {profesional.direccion.departamento.nombre}
                    {profesional.direccion.region?.nombre && `, ${profesional.direccion.region.nombre}`}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <CalendarIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <p className="text-gray-700">
                    <span className="font-medium">Venc. Matrícula:</span> {profesional.fechaVencimientoMatricula}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <CalendarIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <p className="text-gray-700">
                    <span className="font-medium">Venc. Psicofísico:</span> {profesional.fechaVencimientoPsicofisico}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de Equipos - Mejorada */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 rounded-full p-2">
                <UsersIcon className="w-5 h-5 text-purple-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-800">
                Equipos
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {profesional.equipos && profesional.equipos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profesional.equipos.map((equipo) => (
                  <div key={equipo.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-base text-gray-800">{equipo.nombre}</h4>
                        <div className="flex items-center mt-2 gap-2">
                          <div className="bg-gray-100 p-1 rounded-full">
                            <MapPinIcon className="w-3 h-3 text-base text-gray-600" />
                          </div>
                          <p className="text-base text-gray-600">{equipo.departamento.nombre}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-purple-50 text-base text-purple-700 border-purple-200">
                        Miembro
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay equipos asignados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarjeta de Cargos de Horas - Nueva */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 rounded-full p-2">
                <ClockIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-800">
                Cargos de Horas
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {profesional.cargosHoras && profesional.cargosHoras.length > 0 ? (
              <div className="space-y-3">
                {profesional.cargosHoras.map((cargo, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className="bg-indigo-50 text-indigo-700 border-indigo-200 capitalize"
                      >
                        {cargo.tipo.replace('_', ' ')}
                      </Badge>
                      <span className="text-gray-700 font-medium">{cargo.cantidadHoras} horas</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay cargos de horas asignados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarjeta de Paquetes de Horas - Mejorada */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-50 rounded-full p-2">
                  <ClockIcon className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-800">
                  Paquetes de Horas
                </CardTitle>
              </div>
              <PermissionButton
                requiredPermission={{entity: "paquetehoras", action: "create"}}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                onClick={() => {
                  setCurrentPaquete(null)
                  setPaqueteFormData({
                    id: 0,
                    tipo: "",
                    cantidad: "",
                    equipoId: "",
                    escuelaId: "",
                    dias: {
                      lunes: "",
                      martes: "",
                      miercoles: "",
                      jueves: "",
                      viernes: "",
                    },
                  })
                  setEscuelasFiltradas([])
                  setIsPaqueteDialogOpen(true)
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Agregar Paquete
              </PermissionButton>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {profesional.paquetesHoras && profesional.paquetesHoras.length > 0 ? (
              <div className="space-y-4">
                {profesional.paquetesHoras.map((paquete) => (
                  <div 
                    key={paquete.id} 
                    className={`
                      border-2 rounded-lg p-4 
                      hover:shadow-lg transition-shadow 
                      ${paquete.tipo === "Escuela" ? "border-green-300 ring-1 ring-green-300" : 
                        paquete.tipo === "Trabajo Interdisciplinario" ? "border-purple-300 ring-1 ring-purple-300" : 
                        "border-orange-300 ring-1 ring-orange-300"}
                    `}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="outline" 
                            className={
                              paquete.tipo === "Escuela" ? "bg-green-50 text-base text-green-700 border-green-200" :
                              paquete.tipo === "Trabajo Interdisciplinario" ? "bg-purple-50 text-base text-purple-700 border-purple-200" :
                              "bg-orange-50 text-base text-orange-700 border-orange-200"
                            }
                          >
                            {paquete.tipo}
                          </Badge>
                          <div className="bg-blue-50 rounded-lg px-3 py-1">
                            <div className="font-bold text-lg text-blue-700">
                              {paquete.cantidad}
                              <span className="text-base ml-1">horas</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-100 p-1 rounded-full">
                            <UsersIcon className="w-3 h-3 text-gray-600" />
                          </div>
                          <p className="text-base text-gray-700">{paquete.equipo.nombre}</p>
                        </div>
                        
                        {paquete.escuela && (
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-100 p-1 rounded-full">
                              <BriefcaseIcon className="w-3 h-3 text-gray-600" />
                            </div>
                            <p className="text-base text-gray-700">{paquete.escuela.nombre}</p>
                          </div>
                        )}
                        
                        <div className="mt-2">
                          <p className="text-base font-medium text-gray-700">Horarios:</p>
                          <ul className="mt-1 space-y-1">
                            {Object.entries(paquete.dias).map(([dia, horario]) => (
                              horario && (
                                <li key={dia} className="flex items-center gap-2 text-base text-gray-600">
                                  <div className="bg-gray-100 p-1 rounded-full">
                                    <CalendarIcon className="w-3 h-3 text-gray-600" />
                                  </div>
                                  <span>
                                    {dia.charAt(0).toUpperCase() + dia.slice(1)}: {horario}
                                  </span>
                                </li>
                              )
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <PermissionButton 
                          requiredPermission={{entity: "paquetehoras", action: "update"}}
                          variant="outline" 
                          size="sm"
                          className="hover:bg-blue-50 hover:border-blue-300"
                          onClick={() => handlePaqueteEdit(paquete)}
                        >
                          <Edit className="h-4 w-4" />
                        </PermissionButton>
                        <PermissionButton 
                          requiredPermission={{entity: "paquetehoras", action: "delete"}}
                          variant="outline" 
                          size="sm"
                          className="hover:bg-red-50 hover:border-red-300 text-red-600"
                          onClick={() => handlePaqueteDelete(paquete.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </PermissionButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay paquetes de horas asignados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarjeta de Resumen - Mejorada */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 rounded-full p-2">
                <TrendingUpIcon className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-800">
                Resumen de Horas
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-700">
                  {profesional.totalHoras}
                </div>
                <p className="text-base text-gray-600">Horas totales</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800">
                  {profesional.paquetesHoras.length}
                </div>
                <p className="text-base text-gray-600">Paquetes</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-700">
                  {profesional.cargosHoras.length}
                </div>
                <p className="text-base text-gray-600">Cargos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción - Mejorados */}
        <div className="flex justify-between items-center pt-4">
          <Button 
            variant="outline" 
            className="border-gray-300 hover:bg-gray-100"
            onClick={() => router.push('/profesionales')}
          >
            Volver a la lista
          </Button>
          <PermissionButton 
            requiredPermission={{entity: "profesional", action: "update"}}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            onClick={() => setIsDialogOpen(true)}
          >
            <Pencil className="mr-2 h-4 w-4" /> Editar Perfil
          </PermissionButton>
        </div>
      </div>
    ) : (
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          No se encontró el profesional solicitado.
        </AlertDescription>
      </Alert>
    )}
  </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
                        Al cambiar los equipos del profesional, los paquetes de horas en equipos removidos se eliminarán automáticamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="cuil">CUIL</Label>
              <Input
                id="cuil"
                name="cuil"
                value={formData.cuil}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="profesion">Profesión</Label>
              <Input
                id="profesion"
                name="profesion"
                value={formData.profesion}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                name="matricula"
                value={formData.matricula}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
              <Input
                id="fechaNacimiento"
                name="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="dni">DNI</Label>
              <Input
                id="dni"
                name="dni"
                value={formData.dni}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="fechaVencimientoMatricula">Fecha de Vencimiento de Matrícula</Label>
              <Input
                id="fechaVencimientoMatricula"
                name="fechaVencimientoMatricula"
                type="date"
                value={formData.fechaVencimientoMatricula}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="fechaVencimientoPsicofisico">Fecha de Vencimiento Psicofísico</Label>
              <Input
                id="fechaVencimientoPsicofisico"
                name="fechaVencimientoPsicofisico"
                type="date"
                value={formData.fechaVencimientoPsicofisico}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="correoElectronico">Correo Electrónico</Label>
              <Input
                id="correoElectronico"
                name="correoElectronico"
                type="email"
                value={formData.correoElectronico}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="direccion.calle">Calle</Label>
              <Input
                id="direccion.calle"
                name="direccion.calle"
                value={formData.direccion.calle}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  direccion: { ...prev.direccion, calle: e.target.value }
                }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="direccion.numero">Número</Label>
              <Input
                id="direccion.numero"
                name="direccion.numero"
                value={formData.direccion.numero}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  direccion: { ...prev.direccion, numero: e.target.value }
                }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="direccion.departamentoId">Departamento</Label>
              <Select
                name="direccion.departamentoId"
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  direccion: { ...prev.direccion, departamentoId: value }
                }))}
                value={formData.direccion.departamentoId}
                required
              >
                <SelectTrigger id="direccion.departamentoId">
                  <SelectValue placeholder="Seleccione un departamento" />
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
              <Label>Cargos de Horas</Label>
              <div className="space-y-3">
                {formData.cargosHoras.map((cargo, index) => (
                  <div key={index} className="flex gap-2 items-end border p-3 rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor={`cargo-tipo-${index}`}>Tipo de Cargo</Label>
                      <Select
                        value={cargo.tipo}
                        onValueChange={(value) => handleCargoHorasChange(index, 'tipo', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comunes">Comunes</SelectItem>
                          <SelectItem value="investigacion">Investigación</SelectItem>
                          <SelectItem value="mision_especial">Misión Especial</SelectItem>
                          <SelectItem value="regimen_27">Régimen 27</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`cargo-horas-${index}`}>Cantidad de Horas</Label>
                      <Input
                        id={`cargo-horas-${index}`}
                        type="number"
                        value={cargo.cantidadHoras}
                        onChange={(e) => handleCargoHorasChange(index, 'cantidadHoras', parseInt(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeCargoHoras(index)}
                      className="mb-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCargoHoras}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" /> Agregar Cargo de Horas
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="equiposIds">Equipos</Label>
              <Select
                name="equiposIds"
                onValueChange={(value) => {
                  const equipoId = parseInt(value);
                  setFormData(prev => ({
                    ...prev,
                    equiposIds: prev.equiposIds.includes(equipoId)
                      ? prev.equiposIds.filter(id => id !== equipoId)
                      : [...prev.equiposIds, equipoId]
                  }))
                }}
                value=""
              >
                <SelectTrigger id="equiposIds">
                  <SelectValue placeholder="Seleccione equipos" />
                </SelectTrigger>
                <SelectContent>
                  {equipos.map((equipo) => (
                    <SelectItem key={equipo.id} value={equipo.id.toString()}>
                      {equipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.equiposIds.map(id => {
                  const equipo = equipos.find(e => e.id === id);
                  return equipo ? (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                      {equipo.nombre}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          equiposIds: prev.equiposIds.filter(eid => eid !== id)
                        }))}
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaqueteDialogOpen} onOpenChange={setIsPaqueteDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{currentPaquete ? "Editar" : "Agregar"} Paquete de Horas</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <form onSubmit={handlePaqueteSubmit} className="space-y-4">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Paquete</Label>
                <Select
                  name="tipo"
                  value={paqueteFormData.tipo}
                  onValueChange={(value) => {
                    setPaqueteFormData(prev => ({
                      ...prev,
                      tipo: value,
                      escuelaId: value !== "Escuela" ? "" : prev.escuelaId
                    }))
                  }}
                  required
                >
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Seleccione un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposPaquete.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad de Horas</Label>
                <Input
                  id="cantidad"
                  name="cantidad"
                  type="number"
                  min="1"
                  value={paqueteFormData.cantidad}
                  onChange={handlePaqueteInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipoId">Equipo</Label>
                <Select
                  name="equipoId"
                  value={paqueteFormData.equipoId}
                  onValueChange={(value) => handlePaqueteSelectChange("equipoId", value)}
                  required
                >
                  <SelectTrigger id="equipoId">
                    <SelectValue placeholder="Seleccione un equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {profesional?.equipos?.map((equipo) => (
                      <SelectItem key={equipo.id} value={equipo.id.toString()}>
                        {equipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="escuelaId">Escuela</Label>
                <Select
                  name="escuelaId"
                  value={paqueteFormData.escuelaId}
                  onValueChange={(value) => handlePaqueteSelectChange("escuelaId", value)}
                  disabled={paqueteFormData.tipo !== "Escuela" || !paqueteFormData.equipoId}
                >
                  <SelectTrigger id="escuelaId">
                    <SelectValue placeholder={!paqueteFormData.equipoId ? "Primero seleccione un equipo" : "Seleccione una escuela"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="none">Ninguna</SelectItem>
                    {escuelasFiltradas?.map((escuela) => (
                      <SelectItem key={escuela.id} value={escuela.id.toString()}>
                        {escuela.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Días de la semana</Label>
                <div className="grid grid-cols-2 gap-4">
                  {["lunes", "martes", "miercoles", "jueves", "viernes"].map((dia) => (
                    <div className="space-y-2" key={dia}>
                      <Label htmlFor={`dias.${dia}`}>{dia.charAt(0).toUpperCase() + dia.slice(1)}</Label>
                      <Input
                        id={`dias.${dia}`}
                        name={`dias.${dia}`}
                        type="text"
                        placeholder="Ej: 8:00 - 12:00"
                        value={paqueteFormData.dias[dia as keyof typeof paqueteFormData.dias]}
                        onChange={handlePaqueteInputChange}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsPaqueteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} onClick={handlePaqueteSubmit}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
    </ErrorBoundary>
    </ProtectedRoute>
  )
}
