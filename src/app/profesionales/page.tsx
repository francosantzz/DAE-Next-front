'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusCircle, Edit, Trash2, Plus, X } from 'lucide-react'
import Layout from '../../components/profesional/LayoutProf'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Badge } from '@/components/ui/badge'
import { XIcon } from 'lucide-react'
import { useSession } from "next-auth/react"
import { useDebounce } from "@/hooks/useDebounce"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { PermissionButton } from "@/components/PermissionButton"
import { PermissionContent } from "@/components/PermissionContent"
import { Direccion } from '@/types/Direccion.interface'
import { Departamento } from '@/types/Departamento.interface'
import { PaqueteHorasProfesional } from '@/types/dto/PaqueteHorasProfesional.dto'


interface Equipo {
  id: number;
  nombre: string;
  departamento: Departamento;
}

interface Escuela {
  id: number;
  nombre: string;
}


interface CargoHoras {
  id?: number;
  tipo: 'comunes' | 'investigacion' | 'mision_especial_primaria' | 'mision_especial_secundaria' | 'regimen_27';
  cantidadHoras: number;
}

interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
  cuil: string;
  profesion: string;
  matricula: string;
  telefono: string;
  fechaNacimiento: string;
  dni: string;
  fechaVencimientoMatricula: string;
  fechaVencimientoPsicofisico: string;
  correoElectronico: string;
  totalHoras: number;
  cargosHoras: CargoHoras[];
  equipos: Equipo[];
  paquetesHoras: PaqueteHorasProfesional[];
  direccion: Direccion;
  // NUEVOS CAMPOS DE LICENCIA
  tipoLicencia?: string;
  fechaInicioLicencia?: string;
  fechaFinLicencia?: string;
  licenciaActiva: boolean;
  disponible?: boolean;
}

export default function ListaProfesionales() {
  const { data: session } = useSession()
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [filtroNombre, setFiltroNombre] = useState('')
  const busqueda = useDebounce(filtroNombre, 1000)
  const [filtroEquipo, setFiltroEquipo] = useState('todos')
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos')
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const isBlank = (v?: string | null) => !v || String(v).trim() === "";
  const [currentProfesional, setCurrentProfesional] = useState<Profesional | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10
  const [formData, setFormData] = useState({
    id: 0,
    nombre: '',
    apellido: '',
    cuil: '',
    profesion: '',
    matricula: '',
    telefono: '',
    fechaNacimiento: '',
    dni: '',
    fechaVencimientoMatricula: '',
    fechaVencimientoPsicofisico: '',
    correoElectronico: '',
    equiposIds: [] as number[],
    cargosHoras: [] as CargoHoras[],
    direccion: {
      calle: '',
      numero: '',
      departamentoId: ''
    }
  })
  const router = useRouter()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [profesionalesRes, equiposRes, departamentosRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals?page=${currentPage}&limit=${itemsPerPage}&search=${busqueda}${filtroEquipo !== 'todos' ? `&equipoId=${filtroEquipo}` : ''}${filtroDepartamento !== 'todos' ? `&departamentoId=${filtroDepartamento}` : ''}`, {
          headers: {
            'Authorization': `Bearer ${session?.user?.accessToken}`
          }
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/short?page=1&limit=100`, {
          headers: {
            'Authorization': `Bearer ${session?.user?.accessToken}`
          }
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`, {
          headers: {
            'Authorization': `Bearer ${session?.user?.accessToken}`
          }
        }),
      ])

      if (!profesionalesRes.ok || !equiposRes.ok || !departamentosRes.ok)
        throw new Error('Error al obtener los datos')

      const [profesionalesData, equiposData, departamentosData] = await Promise.all([
        profesionalesRes.json(),
        equiposRes.json(),
        departamentosRes.json(),
      ])

      setProfesionales(profesionalesData.data)
      setTotalPages(profesionalesData.meta.totalPages)
      setTotalItems(profesionalesData.meta.total)
      setEquipos(equiposData.data || equiposData)
      setDepartamentos(departamentosData)
    } catch (error) {
      console.error('Error al obtener datos:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.accessToken, currentPage, busqueda, filtroEquipo, filtroDepartamento])

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchData()
    }
  }, [fetchData, session?.user?.accessToken])

  // Resetear página cuando cambie la búsqueda
  useEffect(() => {
    setCurrentPage(1)
  }, [busqueda, filtroEquipo, filtroDepartamento])

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
    console.log('Cargo de horas actualizado:', updatedCargos[index])
  }

  const addCargoHoras = () => {
    const newCargos = [...formData.cargosHoras, { tipo: 'comunes' as const, cantidadHoras: 0 }]
    setFormData({
      ...formData,
      cargosHoras: newCargos
    })
    console.log('Nuevo cargo de horas agregado:', newCargos)
  }

  const removeCargoHoras = (index: number) => {
    setFormData({
      ...formData,
      cargosHoras: formData.cargosHoras.filter((_, i) => i !== index)
    })
  }

  const handleEdit = (profesional: Profesional) => {
    console.log('Profesional a editar:', profesional)
    console.log('Cargos de horas del profesional:', profesional.cargosHoras)
    
    setCurrentProfesional(profesional)
    setFormData({
      id: profesional.id,
      nombre: profesional.nombre,
      apellido: profesional.apellido,
      cuil: profesional.cuil || '',
      profesion: profesional.profesion,
      matricula: profesional.matricula || '',
      telefono: profesional.telefono || '',
      fechaNacimiento: profesional.fechaNacimiento || '',
      dni: profesional.dni || '',
      fechaVencimientoMatricula: profesional.fechaVencimientoMatricula || '',
      fechaVencimientoPsicofisico: profesional.fechaVencimientoPsicofisico || '',
      correoElectronico: profesional.correoElectronico || '',
      equiposIds: profesional.equipos?.map(e => e.id) || [],
      cargosHoras: profesional.cargosHoras || [],
      direccion: {
        calle: profesional.direccion?.calle || '',
        numero: profesional.direccion?.numero || '',
        departamentoId: profesional.direccion?.departamento?.id.toString() || ''
      }
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  try {
    const payload = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      profesion: formData.profesion,
      // Solo incluir campos no vacíos
      ...(formData.cuil && { cuil: formData.cuil }),
      ...(formData.matricula && { matricula: formData.matricula }),
      ...(formData.telefono && { telefono: formData.telefono }),
      ...(formData.fechaNacimiento && { fechaNacimiento: formData.fechaNacimiento }),
      ...(formData.dni && { dni: formData.dni }),
      ...(formData.fechaVencimientoMatricula && { fechaVencimientoMatricula: formData.fechaVencimientoMatricula }),
      ...(formData.fechaVencimientoPsicofisico && { fechaVencimientoPsicofisico: formData.fechaVencimientoPsicofisico }),
      ...(formData.correoElectronico && { correoElectronico: formData.correoElectronico }),
      equiposIds: formData.equiposIds,
      cargosHoras: formData.cargosHoras,
      ...(formData.direccion.calle && {
        direccion: {
          calle: formData.direccion.calle,
          numero: formData.direccion.numero,
          departamentoId: formData.direccion.departamentoId ? parseInt(formData.direccion.departamentoId) : undefined
        }
      })
    }

    const url = currentProfesional
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${currentProfesional.id}`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals`
    const method = currentProfesional ? 'PATCH' : 'POST'

    const response = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.user?.accessToken}`
      },
      body: JSON.stringify(payload),
    })

      if (!response.ok) throw new Error('Error al guardar el profesional')

      const updatedProfesional = await response.json()
      console.log('Respuesta del backend:', updatedProfesional)
      console.log('Cargos de horas en la respuesta:', updatedProfesional.cargosHoras)

      // Obtener el profesional completo desde el endpoint específico, igual que en el perfil profesional
      if (currentProfesional) {
        try {
          const getResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${currentProfesional.id}`, {
            headers: {
              'Authorization': `Bearer ${session?.user?.accessToken}`
            }
          })
          
          if (getResponse.ok) {
            const completeProfesional = await getResponse.json()
            console.log('Profesional completo obtenido:', completeProfesional)
            
            // Actualizar el estado local con los datos completos
            setProfesionales(prev =>
              prev.map(p => p.id === completeProfesional.id ? completeProfesional : p)
            )
          } else {
            // Si falla, usar la respuesta del endpoint de actualización
            setProfesionales(prev =>
              prev.map(p => p.id === updatedProfesional.id ? updatedProfesional : p)
            )
          }
        } catch (error) {
          console.error('Error al obtener el profesional completo:', error)
          // Si falla, usar la respuesta del endpoint de actualización
          setProfesionales(prev =>
            prev.map(p => p.id === updatedProfesional.id ? updatedProfesional : p)
          )
        }
      } else {
        // Para nuevos profesionales, usar la respuesta del endpoint de creación
        setProfesionales(prev => [...prev, updatedProfesional])
      }

      setIsDialogOpen(false)
      setCurrentProfesional(null)
      setFormData({
        id: 0,
        nombre: '',
        apellido: '',
        cuil: '',
        profesion: '',
        matricula: '',
        telefono: '',
        fechaNacimiento: '',
        dni: '',
        fechaVencimientoMatricula: '',
        fechaVencimientoPsicofisico: '',
        correoElectronico: '',
        equiposIds: [],
        cargosHoras: [],
        direccion: {
          calle: '',
          numero: '',
          departamentoId: ''
        }
      })
    } catch (error) {
      console.error('Error al guardar el profesional:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este profesional?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.user?.accessToken}`
          }
        })

        if (!response.ok) throw new Error('Error al eliminar el profesional')

        setProfesionales(prev => prev.filter(p => p.id !== id))
      } catch (error) {
        console.error('Error al eliminar el profesional:', error)
      }
    }
  }

  function getMissingPersonalFields(p: Profesional) {
    const missing: string[] = [];
    if (isBlank(p.cuil)) missing.push("CUIL");
    if (isBlank(p.dni)) missing.push("DNI");
    if (isBlank(p.telefono)) missing.push("Teléfono");
    if (isBlank(p.correoElectronico)) missing.push("Correo");
    if (isBlank(p.fechaNacimiento)) missing.push("Fecha de nacimiento");
    if (isBlank(p.matricula)) missing.push("Matrícula")
    if (isBlank(p.fechaVencimientoMatricula)) missing.push("Vencimiento Matrícula")
    if (!p.direccion || isBlank(p.direccion.calle) || isBlank(p.direccion.numero) || !p.direccion.departamento) {
      missing.push("Dirección");
    }
    return missing;
  }

  function getPsicofisicoEstado(p: Profesional) {
    if (!p.fechaVencimientoPsicofisico) return "FALTA" as const;
    const vto = new Date(p.fechaVencimientoPsicofisico);
    const hoy = new Date();
    return vto < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) ? "VENCIDO" : "OK";
  }


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <ProtectedRoute requiredPermission={{ entity: "profesional", action: "read" }}>
      <ErrorBoundary>
      <Layout>
        <div className="space-y-6">
          <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div>
                <Label htmlFor="filtroNombre">Filtrar por nombre</Label>
                <Input
                  id="filtroNombre"
                  placeholder="Nombre del profesional"
                  value={filtroNombre}
                  onChange={(e) => setFiltroNombre(e.target.value)}
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
                    <ScrollArea className="h-[200px]">
                      <SelectItem value="todos">Todos los equipos</SelectItem>
                      {equipos.map((equipo) => (
                        <SelectItem key={equipo.id} value={equipo.id.toString()}>
                          {equipo.nombre}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filtroDepartamento">Filtrar por departamento</Label>
                <Select onValueChange={setFiltroDepartamento} value={filtroDepartamento}>
                  <SelectTrigger id="filtroDepartamento" className="h-10">
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <ScrollArea className="h-[200px]">
                      <SelectItem value="todos">Todos los departamentos</SelectItem>
                      {departamentos.map((departamento) => (
                        <SelectItem key={departamento.id} value={departamento.id.toString()}>
                          {departamento.nombre}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <PermissionButton
                      requiredPermission={{ entity: "profesional", action: "create" }}
                      onClick={() => {
                        setCurrentProfesional(null)
                        setFormData({
                        id: 0,
                        nombre: '',
                        apellido: '',
                        cuil: '',
                        profesion: '',
                        matricula: '',
                        telefono: '',
                        fechaNacimiento: '',
                        dni: '',
                        fechaVencimientoMatricula: '',
                        fechaVencimientoPsicofisico: '',
                        correoElectronico: '',
                        equiposIds: [],
                        cargosHoras: [],
                        direccion: {
                          calle: '',
                          numero: '',
                          departamentoId: ''
                        }
                      })
                    }}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Agregar Profesional
                    </PermissionButton>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] h-[90vh] sm:max-w-[1000px] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{currentProfesional ? 'Editar' : 'Agregar'} Profesional</DialogTitle>
                      {currentProfesional && (
                        <DialogDescription>
                          Al cambiar los equipos del profesional, los paquetes de horas en equipos removidos se eliminarán automáticamente.
                        </DialogDescription>
                      )}
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2 text-sm text-gray-700">Datos personales</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* nombre */}
                          <div>
                            <Label htmlFor="nombre">Nombre</Label>
                            <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
                          </div>
                          <div>
                            <Label htmlFor="apellido">Apellido</Label>
                            <Input id="apellido" name="apellido" value={formData.apellido} onChange={handleInputChange} required />
                          </div>
                          <div>
                            <Label htmlFor="profesion">Profesión</Label>
                            <Input id="profesion" name="profesion" value={formData.profesion} onChange={handleInputChange} required />
                          </div>
                          <div>
                            <Label htmlFor="cuil">CUIL</Label>
                            <Input id="cuil" name="cuil" value={formData.cuil} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="dni">DNI</Label>
                            <Input id="dni" name="dni" value={formData.dni} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="correoElectronico">Correo Electrónico</Label>
                            <Input id="correoElectronico" name="correoElectronico" value={formData.correoElectronico} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                            <Input id="fechaNacimiento" name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="matricula">Matrícula</Label>
                            <Input id="matricula" name="matricula" value={formData.matricula} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="fechaVencimientoMatricula">Vto. Matrícula</Label>
                            <Input id="fechaVencimientoMatricula" name="fechaVencimientoMatricula" type="date" value={formData.fechaVencimientoMatricula} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="fechaVencimientoPsicofisico">Vto. Psicofísico</Label>
                            <Input id="fechaVencimientoPsicofisico" name="fechaVencimientoPsicofisico" type="date" value={formData.fechaVencimientoPsicofisico} onChange={handleInputChange} />
                          </div>
                        </div>
                      </div>
                      {/* Dirección */}
                      <div>
                        <h3 className="font-semibold mb-2 text-sm text-gray-700">Dirección</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="direccion.calle">Calle</Label>
                            <Input id="direccion.calle" name="direccion.calle" value={formData.direccion.calle}
                              onChange={(e) => setFormData(prev => ({ ...prev, direccion: { ...prev.direccion, calle: e.target.value } }))} />
                          </div>
                          <div>
                            <Label htmlFor="direccion.numero">Número</Label>
                            <Input id="direccion.numero" name="direccion.numero" value={formData.direccion.numero}
                              onChange={(e) => setFormData(prev => ({ ...prev, direccion: { ...prev.direccion, numero: e.target.value } }))} />
                          </div>
                          <div>
                            <Label htmlFor="direccion.departamentoId">Departamento</Label>
                            <Select
                              onValueChange={(value) => setFormData(prev => ({ ...prev, direccion: { ...prev.direccion, departamentoId: value } }))}
                              value={formData.direccion.departamentoId}
                            >
                              <SelectTrigger id="direccion.departamentoId"><SelectValue placeholder="Seleccione" /></SelectTrigger>
                              <SelectContent className="max-h-60 overflow-y-auto">
                                {departamentos.map((d) => <SelectItem key={d.id} value={d.id.toString()}>{d.nombre}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      {/* Cargos de horas + Equipos */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <Label>Cargos de Horas</Label>
                          <div className="space-y-3">
                            {formData.cargosHoras.map((cargo, index) => (
                              <div key={index} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end border p-3 rounded-lg">
                                <div className="flex-1">
                                  <Label>Tipo de Cargo</Label>
                                  <Select value={cargo.tipo} onValueChange={(v) => handleCargoHorasChange(index, 'tipo', v as any)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccione tipo" /></SelectTrigger>
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
                                  <Label>Cantidad de Horas</Label>
                                  <Input type="number" value={cargo.cantidadHoras} min={0}
                                    onChange={(e) => handleCargoHorasChange(index, 'cantidadHoras', parseInt(e.target.value) || 0)} />
                                </div>
                                <Button type="button" variant="destructive" size="sm" onClick={() => removeCargoHoras(index)} className="sm:self-end">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button type="button" variant="outline" onClick={addCargoHoras} className="w-full">
                              <Plus className="mr-2 h-4 w-4" /> Agregar Cargo de Horas
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="equiposIds">Equipos</Label>
                          <Select
                            onValueChange={(value) => {
                              const id = parseInt(value)
                              setFormData(prev => ({
                                ...prev,
                                equiposIds: prev.equiposIds.includes(id) ? prev.equiposIds.filter(eid => eid !== id) : [...prev.equiposIds, id]
                              }))
                            }}
                            value=""
                          >
                            <SelectTrigger id="equiposIds"><SelectValue placeholder="Seleccione equipos" /></SelectTrigger>
                            <SelectContent>
                              {equipos.map((e) => <SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>)}
                            </SelectContent>
                          </Select>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {formData.equiposIds.map(id => {
                              const eq = equipos.find(e => e.id === id)
                              return eq ? (
                                <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                  {eq.nombre}
                                  <Button
                                    variant="ghost" size="sm" className="h-4 w-4 p-0"
                                    onClick={() => setFormData(prev => ({ ...prev, equiposIds: prev.equiposIds.filter(eid => eid !== id) }))}
                                  >
                                    <XIcon className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ) : null
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit">Guardar Cambios</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {isLoading ? (
              <p className="text-center py-4">Cargando profesionales...</p>
            ) : profesionales.length > 0 ? (
              <>
                <Accordion type="multiple" className="w-full">
                  {profesionales.map((profesional) => {
                    return (
                      <AccordionItem key={profesional.id} value={String(profesional.id)}>
                        <AccordionTrigger className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
                            {/* Izquierda: nombre + badges (wrap en móvil) */}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              {/* psicofísico */}
                              {(() => {
                                const psic = getPsicofisicoEstado(profesional);
                                return (psic === "FALTA" || psic === "VENCIDO") ? (
                                  <span
                                    className="w-2 h-2 rounded-full bg-red-500"
                                    title={psic === "FALTA" ? "Psicofísico no cargado" : "Psicofísico vencido"}
                                  />
                                ) : null;
                              })()}

                              <span className="font-medium text-sm sm:text-base">
                                {`${profesional.apellido} ${profesional.nombre}`}
                              </span>

                              {/* Licencia */}
                              {profesional.licenciaActiva && profesional.fechaFinLicencia && new Date(profesional.fechaFinLicencia) >= new Date() && (
                                <Badge variant="destructive" className="text-[11px] px-2 py-0 h-5">En Licencia</Badge>
                              )}

                              {/* Faltantes personales */}
                              {(() => {
                                const faltan = getMissingPersonalFields(profesional);
                                return faltan.length > 0 ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[11px] px-2 py-0 h-5 bg-yellow-50 text-yellow-800 border-yellow-300"
                                    title={`Faltan: ${faltan.join(", ")}`}
                                  >
                                    Faltan datos · {faltan.length}
                                  </Badge>
                                ) : null;
                              })()}

                              {/* Estado psicofísico */}
                              {(() => {
                                const psic = getPsicofisicoEstado(profesional);
                                if (psic === "FALTA")
                                  return <Badge variant="outline" className="text-[11px] px-2 py-0 h-5 bg-orange-50 text-orange-800 border-orange-300">Psicofísico faltante</Badge>
                                if (psic === "VENCIDO")
                                  return <Badge variant="destructive" className="text-[11px] px-2 py-0 h-5">Psicofísico vencido</Badge>
                                return null
                              })()}
                            </div>

                            {/* Derecha: profesión (baja a segunda línea en móvil) */}
                            <span className="text-xs sm:text-sm text-gray-500">{profesional.profesion}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 sm:px-6 py-4">
                          <div className="space-y-4">
                            <div>
                              <strong>Cargos de Horas:</strong>
                              {profesional.cargosHoras?.length ? (
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {profesional.cargosHoras.map((cargo, i) => (
                                    <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                      <span className="capitalize text-sm">{cargo.tipo.replace(/_/g, ' ')}</span>
                                      <Badge variant="outline" className="text-xs">{cargo.cantidadHoras} horas</Badge>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-600 mt-1">No hay cargos de horas asignados</p>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <strong>Equipos:</strong>
                                {profesional.equipos?.length ? (
                                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                    {profesional.equipos.map(eq => <li key={eq.id}>{eq.nombre}</li>)}
                                  </ul>
                                ) : <p className="text-sm text-gray-600 mt-1">No hay equipos asignados</p>}
                              </div>

                              <div>
                                <strong>Paquetes de Horas Activos:</strong>
                                {profesional.paquetesHoras?.length ? (
                                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                    {profesional.paquetesHoras.map(ph => (
                                      <li key={ph.id}>
                                        {ph.tipo} - {ph.cantidad} horas
                                        {ph.escuela && ` - ${ph.escuela.nombre}`}
                                        {` (${ph.equipo?.nombre})`}
                                      </li>
                                    ))}
                                  </ul>
                                ) : <p className="text-sm text-gray-600 mt-1">No hay paquetes de horas activos</p>}
                              </div>
                            </div>

                            {/* Acciones: apiladas en móvil */}
                            <div className="flex flex-col sm:flex-row justify-end gap-2">
                              <Button
                                onClick={() => {
                                  router.push(`/perfil/${profesional.id}`)
                                }}
                              >
                                Ver Perfil Detallado
                              </Button>

                              <PermissionButton
                                requiredPermission={{ entity: "profesional", action: "update" }}
                                variant="outline"
                                onClick={() => handleEdit(profesional)}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Editar
                              </PermissionButton>

                              <PermissionButton
                                requiredPermission={{ entity: "profesional", action: "delete" }}
                                variant="destructive"
                                onClick={() => handleDelete(profesional.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                              </PermissionButton>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>

                {/* Paginación */}
                <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-center py-4">No se encontraron profesionales con los filtros aplicados.</p>
            )}
          </div>
        </div>
      </Layout>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}