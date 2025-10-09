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
import { PlusCircle, Pencil, Trash2, AlertCircle, Edit, XIcon, BriefcaseIcon, CalendarIcon, ClockIcon, FilePenIcon, MapPinIcon, PhoneIcon, TrendingUpIcon, UserCheckIcon, UsersIcon, Plus, X, Copy } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Layout from "./LayoutProf"
import ErrorBoundary from "../ErrorBoundary"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "../ProtectedRoute"
import { PermissionButton } from "../PermissionButton"

// Interfaces
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
  Numero: string
  nombre: string
}

interface Equipo {
  id: number
  nombre: string
  departamento: Departamento
}

interface PaqueteHoras {
  id: number
  tipo: string
  cantidad: number
  equipo: Equipo
  escuela?: Escuela
  // Campos directos (pueden venir del backend o ser normalizados)
  diaSemana?: number
  horaInicio?: string
  horaFin?: string
  rotativo?: boolean
  semanas?: number[] | null
  // Estructura anidada (puede venir del backend)
  dias?: {
    diaSemana: number
    horaInicio: string
    horaFin: string
    rotativo: boolean
    semanas?: number[] | null
    cicloSemanas?: number
  }
}

interface CargoHoras {
  id?: number;
  tipo: 'comunes' | 'investigacion' | 'mision_especial_primaria' | 'mision_especial_secundaria' | 'regimen_27';
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
  // NUEVOS CAMPOS DE LICENCIA
  tipoLicencia?: string
  fechaInicioLicencia?: string
  fechaFinLicencia?: string
  licenciaActiva: boolean
  disponible?: boolean
}

export default function PerfilProfesional() {
  const { data: session } = useSession()
  const params = useParams();
  const id = params?.id;
  const [profesional, setProfesional] = useState<Profesional | null>(null)
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [escuelasFiltradas, setEscuelasFiltradas] = useState<Escuela[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPaqueteDialogOpen, setIsPaqueteDialogOpen] = useState(false)
  const [currentPaquete, setCurrentPaquete] = useState<PaqueteHoras | null>(null)
  const [isLicenciaDialogOpen, setIsLicenciaDialogOpen] = useState(false)
const [licenciaFormData, setLicenciaFormData] = useState({
  tipoLicencia: "",
  fechaInicioLicencia: "",
  fechaFinLicencia: "",
  licenciaActiva: false
})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false);
  const [loadedData, setLoadedData] = useState({
    equipos: false,
    departamentos: false
  })

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
    equipoId: "",
    escuelaId: "",
    diaSemana: "",
    horaInicio: "",
    horaFin: "",
    rotativo: false,
    semanas: [] as number[],
  })

  const router = useRouter()
  const tiposPaquete = ["Escuela", "Trabajo Interdisciplinario", "Carga en Gei"]

  // Carga inicial solo del profesional
  useEffect(() => {
    const fetchProfesionalData = async () => {
      if (!session?.user?.accessToken || !id) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}`, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` }
        });

        if (!response.ok) throw new Error("Error al obtener los datos del profesional");
        
        const profesionalData = await response.json();
        const profesionalNormalizado = {
          ...profesionalData,
          paquetesHoras: profesionalData.paquetesHoras?.map(normalizePaquete) || []
        };
        setProfesional(profesionalNormalizado);
        
        setFormData({
          nombre: profesionalData.nombre || "",
          apellido: profesionalData.apellido || "",
          cuil: profesionalData.cuil || "",
          profesion: profesionalData.profesion || "",
          matricula: profesionalData.matricula || "",
          telefono: profesionalData.telefono || "",
          fechaNacimiento: profesionalData.fechaNacimiento || "",
          dni: profesionalData.dni || "",
          fechaVencimientoMatricula: profesionalData.fechaVencimientoMatricula || "",
          fechaVencimientoPsicofisico: profesionalData.fechaVencimientoPsicofisico || "",
          correoElectronico: profesionalData.correoElectronico || "",
          equiposIds: profesionalData.equipos?.map((e: Equipo) => e.id) || [],
          cargosHoras: profesionalData.cargosHoras || [],
          direccion: {
            calle: profesionalData.direccion?.calle || "",
            numero: profesionalData.direccion?.numero || "",
            departamentoId: profesionalData.direccion?.departamento?.id?.toString() || ""
          }
          
        });
      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfesionalData();
  }, [id, session?.user?.accessToken]);

  const normalizePaquete = (paquete: any): any => {
    return {
      ...paquete,
      diaSemana: paquete.diaSemana ?? paquete.dias?.diaSemana ?? null,
      horaInicio: (paquete.horaInicio ?? paquete.dias?.horaInicio ?? '').toString().slice(0,5),
      horaFin: (paquete.horaFin ?? paquete.dias?.horaFin ?? '').toString().slice(0,5),
      rotativo: paquete.rotativo ?? paquete.dias?.rotativo ?? false,
      semanas: paquete.semanas ?? paquete.dias?.semanas ?? null,
    };
  };

  // Carga bajo demanda de equipos y departamentos
  const loadEditFormData = async () => {
    if (loadedData.equipos && loadedData.departamentos) return;
    
    try {
      const [equiposRes, departamentosRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/short?page=1&limit=100`, {
          headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`, {
          headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
        })
      ]);

      if (!equiposRes.ok || !departamentosRes.ok) throw new Error("Error al obtener datos");

      const [equiposData, departamentosData] = await Promise.all([
        equiposRes.json(),
        departamentosRes.json()
      ]);

      setEquipos(equiposData.data || equiposData);
      setDepartamentos(departamentosData);
      setLoadedData(prev => ({ ...prev, equipos: true, departamentos: true }));
    } catch (error) {
      console.error("Error al cargar datos para edición:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Oculta el mensaje después de 2 segundos
      })
      .catch(err => {
        console.error('Error al copiar:', err);
      });
  };

  const handleEditClick = () => {
    setIsDialogOpen(true);   
    void loadEditFormData();      
  };
  

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

  const handleLicenciaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}`, {
        method: "PATCH",
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.accessToken}`
        },
        body: JSON.stringify({
          tipoLicencia: licenciaFormData.tipoLicencia,
          fechaInicioLicencia: licenciaFormData.fechaInicioLicencia,
          fechaFinLicencia: licenciaFormData.fechaFinLicencia,
          licenciaActiva: licenciaFormData.licenciaActiva
        }),
      })
  
      if (!response.ok) throw new Error("Error al actualizar la licencia")
  
      const updatedProfesional = await response.json()
      setProfesional(updatedProfesional)
      setIsLicenciaDialogOpen(false)
      
    } catch (error) {
      console.error("Error al actualizar la licencia:", error)
      alert("Error al actualizar la licencia")
    }
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/por-equipo/${equipoId}`, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` }
      })

      if (response.ok) {
        const data = await response.json()
        setEscuelasFiltradas(data)
      } else {
        throw new Error('Error al cargar escuelas por equipo')
      }
    } catch (error) {
      console.error('Error al cargar escuelas por equipo:', error)
      setEscuelasFiltradas([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Igual a la lista: incluimos SOLO si hay valor
      const payload: any = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        profesion: formData.profesion,
        // opcionales
        ...(formData.cuil && { cuil: formData.cuil }),
        ...(formData.matricula && { matricula: formData.matricula }),
        ...(formData.telefono && { telefono: formData.telefono }),
        ...(formData.fechaNacimiento && { fechaNacimiento: formData.fechaNacimiento }),
        ...(formData.dni && { dni: formData.dni }),
        ...(formData.fechaVencimientoMatricula && { fechaVencimientoMatricula: formData.fechaVencimientoMatricula }),
        ...(formData.fechaVencimientoPsicofisico && { fechaVencimientoPsicofisico: formData.fechaVencimientoPsicofisico }),
        ...(formData.correoElectronico && { correoElectronico: formData.correoElectronico }),
        // estos dos los mandabas siempre en la lista
        equiposIds: formData.equiposIds,
        cargosHoras: formData.cargosHoras,
        // dirección solo si tiene calle (como en la lista)
        ...(formData.direccion.calle && {
          direccion: {
            calle: formData.direccion.calle,
            numero: formData.direccion.numero,
            ...(formData.direccion.departamentoId && {
              departamentoId: parseInt(formData.direccion.departamentoId, 10)
            })
          }
        })
      };
  
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.accessToken}`
        },
        body: JSON.stringify(payload)
      });
  
      if (!res.ok) throw new Error("Error al actualizar el profesional");
  
      const updated = await res.json();
      setProfesional(updated);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error al actualizar el profesional:", error);
      alert("No se pudo guardar los cambios");
    }
  };
  

  const handlePaqueteEdit = async (paquete: PaqueteHoras) => {
    
    const normalizedPaquete = normalizePaquete(paquete);
  
    setCurrentPaquete(normalizedPaquete)
    setPaqueteFormData({
      id: paquete.id,
      tipo: paquete.tipo,
      equipoId: paquete.equipo.id.toString(),
      escuelaId: paquete.escuela?.id?.toString() || "",
      diaSemana: paquete.diaSemana?.toString() ?? "",
      horaInicio: paquete.horaInicio || "",
      horaFin: paquete.horaFin || "",
      rotativo: paquete.rotativo ?? false,
      semanas: paquete.semanas || [],
    })
    
    await cargarEscuelasPorEquipo(paquete.equipo.id.toString())
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
      const requestData = {
        tipo: paqueteFormData.tipo,
        equipoId: Number(paqueteFormData.equipoId),
        escuelaId: paqueteFormData.tipo === "Escuela" ? Number(paqueteFormData.escuelaId) : null,
        diaSemana: paqueteFormData.diaSemana ? Number(paqueteFormData.diaSemana) : null,
        horaInicio: paqueteFormData.horaInicio,
        horaFin: paqueteFormData.horaFin,
        rotativo: paqueteFormData.rotativo,
        semanas: paqueteFormData.rotativo ? paqueteFormData.semanas : null,
      }

      const url = currentPaquete
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}/paquetes/${currentPaquete.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}/paquetes`
      const method = currentPaquete ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session?.user?.accessToken}`
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al guardar el paquete de horas")
      }

      const updatedProfesional = await response.json()
      
      const updatedPaquete = updatedProfesional.paquetesHoras.find(
        (p: PaqueteHoras) => p.id === (currentPaquete?.id || updatedProfesional.paquetesHoras[updatedProfesional.paquetesHoras.length - 1].id)
      )

      const paqueteCompleto = updatedPaquete;

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
        equipoId: "",
        escuelaId: "",
        diaSemana: "",
        horaInicio: "",
        horaFin: "",
        rotativo: false,
        semanas: [],
      })
    } catch (error) {
      console.error("Error al guardar el paquete de horas:", error)
      setFormError(error instanceof Error ? error.message : "Error al guardar el paquete de horas")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaqueteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    if (name === "rotativo") {
      setPaqueteFormData(prev => ({ ...prev, rotativo: checked }))
      return
    }
    setPaqueteFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const toggleSemana = (sem: number) => {
    setPaqueteFormData(prev => {
      const present = prev.semanas.includes(sem)
      return { ...prev, semanas: present ? prev.semanas.filter(s => s !== sem) : [...prev.semanas, sem] }
    })
  }

  const handlePaqueteSelectChange = async (name: string, value: string) => {
    setPaqueteFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === "equipoId" ? { escuelaId: "" } : {})
    }));

    if (name === "equipoId") {
      await cargarEscuelasPorEquipo(value);
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
                {/* Tarjeta de Información Personal */}
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
                    {/* Profesión y Matrícula */}
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-blue-50 text-base text-blue-700 border-blue-200">
                        {profesional.profesion}
                      </Badge>
                      <div className="flex items-center gap-1 text-gray-700">
                        <span className="font-medium">Matrícula:</span>
                        <span>{profesional.matricula}</span>
                      </div>
                    </div>

                    {/* Datos personales */}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                          onClick={() => copyToClipboard(profesional.dni)}
                          title="Copiar DNI"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
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
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-orange-50 rounded-full p-2">
                          <MapPinIcon className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">Dirección</h4>
                          {profesional.direccion ? (
                            <>
                              {(profesional.direccion.calle || profesional.direccion.numero) && (
                                <p className="text-base text-gray-600">
                                  {profesional.direccion.calle} {profesional.direccion.numero}
                                </p>
                              )}
                              {profesional.direccion.departamento && (
                                <p className="text-base text-gray-600">
                                  {profesional.direccion.departamento.nombre}
                                  {profesional.direccion.region?.nombre && `, ${profesional.direccion.region.nombre}`}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-base text-gray-500 italic">No registrada</p>
                          )}
                        </div>
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
                        <span className="font-medium"> Venc. Psicofísico: </span>
                        {(!profesional.fechaVencimientoPsicofisico ||
                          new Date(profesional.fechaVencimientoPsicofisico) < new Date()) ? (
                          <Badge variant="destructive">
                            {!profesional.fechaVencimientoPsicofisico
                              ? "Psicofísico no cargado"
                              : `Vencido: ${new Date(profesional.fechaVencimientoPsicofisico).toLocaleDateString()}`}
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white">
                            Válido hasta: {new Date(profesional.fechaVencimientoPsicofisico).toLocaleDateString()}
                          </Badge>
                        )}
                      </p>
                      </div>
                    </div>
                  </div>
                  </CardContent>
                </Card>

                {/* Tarjeta de Equipos */}
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

                {/* Tarjeta de Cargos de Horas */}
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
                            {cargo.tipo.replace(/_/g, ' ')}
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

                {/* Tarjeta de Licencia */}
                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${
                          profesional.licenciaActiva && profesional.fechaFinLicencia && new Date(profesional.fechaFinLicencia) >= new Date() 
                            ? "bg-red-50" 
                            : "bg-green-50"
                        }`}>
                          <CalendarIcon className={`w-5 h-5 ${
                            profesional.licenciaActiva && profesional.fechaFinLicencia && new Date(profesional.fechaFinLicencia) >= new Date() 
                              ? "text-red-600" 
                              : "text-green-600"
                          }`} />
                        </div>
                        <CardTitle className="text-xl font-semibold text-gray-800">
                          Estado de Licencia
                        </CardTitle>
                      </div>
                      <PermissionButton
                        requiredPermission={{entity: "profesional", action: "update"}}
                        className={`${
                          profesional.licenciaActiva 
                            ? "bg-orange-600 hover:bg-orange-700" 
                            : "bg-blue-600 hover:bg-blue-700"
                        } text-white shadow-sm`}
                        onClick={() => {
                          // Abrir diálogo de licencia
                          setLicenciaFormData({
                            tipoLicencia: profesional.tipoLicencia || "",
                            fechaInicioLicencia: profesional.fechaInicioLicencia || "",
                            fechaFinLicencia: profesional.fechaFinLicencia || "",
                            licenciaActiva: profesional.licenciaActiva || false
                          })
                          setIsLicenciaDialogOpen(true)
                        }}
                      >
                        {profesional.licenciaActiva ? (
                          <><Edit className="mr-2 h-4 w-4" /> Editar Licencia</>
                        ) : (
                          <><PlusCircle className="mr-2 h-4 w-4" /> Agregar Licencia</>
                        )}
                      </PermissionButton>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {profesional.licenciaActiva ? (
                      <div className="space-y-4">
                        <Alert className={
                          profesional.fechaFinLicencia && new Date(profesional.fechaFinLicencia) < new Date() 
                            ? "bg-green-50 border-green-200" 
                            : "bg-red-50 border-red-200"
                        }>
                          <AlertCircle className={
                            profesional.fechaFinLicencia && new Date(profesional.fechaFinLicencia) < new Date() 
                              ? "h-4 w-4 text-green-600" 
                              : "h-4 w-4 text-red-600"
                          } />
                          <AlertDescription className={
                            profesional.fechaFinLicencia && new Date(profesional.fechaFinLicencia) < new Date() 
                              ? "text-green-700" 
                              : "text-red-700"
                          }>
                            {profesional.fechaFinLicencia && new Date(profesional.fechaFinLicencia) < new Date() 
                              ? "✅ Licencia vencida - Profesional disponible" 
                              : "❌ Profesional en licencia - No disponible"}
                          </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Tipo de Licencia</Label>
                            <p className="text-base font-semibold text-gray-800">
                              {profesional.tipoLicencia || "No especificado"}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Fecha Inicio</Label>
                            <p className="text-base font-semibold text-gray-800">
                              {profesional.fechaInicioLicencia 
                                ? new Date(profesional.fechaInicioLicencia).toLocaleDateString('es-ES') 
                                : "No especificada"}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Fecha Fin</Label>
                            <p className="text-base font-semibold text-gray-800">
                              {profesional.fechaFinLicencia 
                                ? new Date(profesional.fechaFinLicencia).toLocaleDateString('es-ES') 
                                : "No especificada"}
                            </p>
                          </div>
                        </div>

                        {profesional.fechaFinLicencia && new Date(profesional.fechaFinLicencia) >= new Date() && (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <ClockIcon className="w-4 h-4" />
                            <span>
                              La licencia vence en {Math.ceil((new Date(profesional.fechaFinLicencia).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="bg-green-50 rounded-full p-3 inline-flex mb-3">
                          <UserCheckIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-gray-600 mb-2">El profesional se encuentra disponible</p>
                        <p className="text-sm text-gray-500">No hay licencias activas registradas</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tarjeta de Paquetes de Horas */}
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
                            equipoId: "",
                            escuelaId: "",
                            diaSemana: "",
                            horaInicio: "",
                            horaFin: "",
                            rotativo: false,
                            semanas: [],
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
                                <p className="text-base font-medium text-gray-700">Horario:</p>
                                <div className="flex items-center gap-2 text-base text-gray-600">
                                  <div className="bg-gray-100 p-1 rounded-full">
                                    <CalendarIcon className="w-3 h-3 text-gray-600" />
                                  </div>
                                  <span>
                                    {(() => {
                                      const dia = (paquete as any).diaSemana ?? (paquete as any).dias?.diaSemana
                                      const hI = ((paquete as any).horaInicio ?? (paquete as any).dias?.horaInicio ?? '').toString().slice(0,5)
                                      const hF = ((paquete as any).horaFin ?? (paquete as any).dias?.horaFin ?? '').toString().slice(0,5)
                                      const rot = (paquete as any).rotativo ?? (paquete as any).dias?.rotativo
                                      const sem = (paquete as any).semanas ?? (paquete as any).dias?.semanas
                                      const diaLabel = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][dia as number] || "-"
                                      return `${diaLabel} ${hI} - ${hF}${rot ? ` (Semanas: ${sem?.join(', ') || '-'})` : ''}`
                                    })()}
                                  </span>
                                </div>
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

                {/* Tarjeta de Resumen */}
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
                        {profesional.totalHoras} semanales
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

                {/* Botones de acción */}
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
                    onClick={handleEditClick}
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

          {/* Diálogo de edición de perfil */}
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
                  />
                </div>
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
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
                  />
                </div>
                <div>
                  <Label htmlFor="dni">DNI</Label>
                  <Input
                    id="dni"
                    name="dni"
                    value={formData.dni}
                    onChange={handleInputChange}
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
                  >
                    <SelectTrigger id="direccion.departamentoId">
                      <SelectValue placeholder="Seleccione un departamento" />
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
                              <SelectItem value="mision_especial_primaria">Misión Especial Primaria</SelectItem>
                              <SelectItem value="mision_especial_secundaria">Misión Especial Secundaria</SelectItem>
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
                    <SelectContent className="max-h-60 overflow-y-auto">
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

          {/* Diálogo de paquete de horas */}
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
                  {/* cantidad ya no se ingresa manualmente */}
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
                            {escuela.nombre} {escuela.Numero}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diaSemana">Día de la semana</Label>
                    <Select
                      name="diaSemana"
                      value={paqueteFormData.diaSemana}
                      onValueChange={(value) => handlePaqueteSelectChange("diaSemana", value)}
                      required
                    >
                      <SelectTrigger id="diaSemana">
                        <SelectValue placeholder="Seleccione un día" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Lunes</SelectItem>
                        <SelectItem value="2">Martes</SelectItem>
                        <SelectItem value="3">Miércoles</SelectItem>
                        <SelectItem value="4">Jueves</SelectItem>
                        <SelectItem value="5">Viernes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="horaInicio">Hora inicio</Label>
                      <Input id="horaInicio" name="horaInicio" type="time" value={paqueteFormData.horaInicio} onChange={handlePaqueteInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="horaFin">Hora fin</Label>
                      <Input id="horaFin" name="horaFin" type="time" value={paqueteFormData.horaFin} onChange={handlePaqueteInputChange} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input id="rotativo" name="rotativo" type="checkbox" checked={paqueteFormData.rotativo} onChange={handlePaqueteInputChange} />
                      <Label htmlFor="rotativo">Horario rotativo</Label>
                    </div>
                    {paqueteFormData.rotativo && (
                      <div>
                        <Label>Semanas del ciclo (1-4)</Label>
                        <div className="flex gap-3 mt-1">
                          {[1,2,3,4].map((s) => (
                            <label key={s} className="flex items-center gap-1">
                              <input type="checkbox" checked={paqueteFormData.semanas.includes(s)} onChange={() => toggleSemana(s)} />
                              <span>{s}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
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
          {/* Diálogo de Licencia */}
          <Dialog open={isLicenciaDialogOpen} onOpenChange={setIsLicenciaDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {profesional?.licenciaActiva ? "Editar Licencia" : "Agregar Licencia"}
                </DialogTitle>
                <DialogDescription>
                  {profesional?.licenciaActiva 
                    ? "Modifique los datos de la licencia del profesional" 
                    : "Registre una nueva licencia para el profesional"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleLicenciaSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoLicencia">Tipo de Licencia</Label>
                  <Input
                    id="tipoLicencia"
                    name="tipoLicencia"
                    value={licenciaFormData.tipoLicencia}
                    onChange={(e) => setLicenciaFormData(prev => ({
                      ...prev,
                      tipoLicencia: e.target.value
                    }))}
                    placeholder="Ej: Enfermedad, Maternidad, Vacaciones, etc."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaInicioLicencia">Fecha Inicio</Label>
                    <Input
                      id="fechaInicioLicencia"
                      name="fechaInicioLicencia"
                      type="date"
                      value={licenciaFormData.fechaInicioLicencia}
                      onChange={(e) => setLicenciaFormData(prev => ({
                        ...prev,
                        fechaInicioLicencia: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fechaFinLicencia">Fecha Fin</Label>
                    <Input
                      id="fechaFinLicencia"
                      name="fechaFinLicencia"
                      type="date"
                      value={licenciaFormData.fechaFinLicencia}
                      onChange={(e) => setLicenciaFormData(prev => ({
                        ...prev,
                        fechaFinLicencia: e.target.value
                      }))}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    id="licenciaActiva"
                    name="licenciaActiva"
                    type="checkbox"
                    checked={licenciaFormData.licenciaActiva}
                    onChange={(e) => setLicenciaFormData(prev => ({
                      ...prev,
                      licenciaActiva: e.target.checked
                    }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="licenciaActiva" className="text-sm font-medium">
                    Licencia activa
                  </Label>
                </div>
                
                {licenciaFormData.licenciaActiva && (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">
                      Al activar la licencia, el profesional será marcado como No disponible
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsLicenciaDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {profesional?.licenciaActiva ? "Actualizar" : "Agregar"} Licencia
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </Layout>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}