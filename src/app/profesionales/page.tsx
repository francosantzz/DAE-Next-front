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

interface Departamento {
  id: number;
  nombre: string;
}

interface Direccion {
  id: number;
  calle: string;
  numero: string;
  departamento: Departamento;
}

interface Equipo {
  id: number;
  nombre: string;
  departamento: Departamento;
}

interface Escuela {
  id: number;
  nombre: string;
}

interface PaqueteHoras {
  id: number;
  tipo: string;
  cantidad: number;
  escuela?: Escuela;
  equipo?: Equipo;
}

interface CargoHoras {
  id?: number;
  tipo: 'comunes' | 'investigacion' | 'mision_especial' | 'regimen_27';
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
  paquetesHoras: PaqueteHoras[];
  direccion: Direccion;
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
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos?page=1&limit=100`, {
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
    console.log('Tipo de cargosHoras:', typeof profesional.cargosHoras)
    console.log('Es array:', Array.isArray(profesional.cargosHoras))
    console.log('Longitud del array:', profesional.cargosHoras?.length)
    setCurrentProfesional(profesional)
    setFormData({
      id: profesional.id,
      nombre: profesional.nombre,
      apellido: profesional.apellido,
      cuil: profesional.cuil,
      profesion: profesional.profesion,
      matricula: profesional.matricula,
      telefono: profesional.telefono,
      fechaNacimiento: profesional.fechaNacimiento,
      dni: profesional.dni,
      fechaVencimientoMatricula: profesional.fechaVencimientoMatricula,
      fechaVencimientoPsicofisico: profesional.fechaVencimientoPsicofisico,
      correoElectronico: profesional.correoElectronico,
      equiposIds: profesional.equipos.map(e => e.id),
      cargosHoras: profesional.cargosHoras,
      direccion: {
        calle: profesional.direccion.calle,
        numero: profesional.direccion.numero,
        departamentoId: profesional.direccion.departamento.id.toString()
      }
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <ProtectedRoute requiredPermission={{ entity: "profesional", action: "read" }}>
      <ErrorBoundary>
      <Layout>
        <div className="space-y-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <Label htmlFor="filtroNombre">Filtrar por nombre</Label>
                <Input
                  id="filtroNombre"
                  placeholder="Nombre del profesional"
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
                  <SelectTrigger id="filtroDepartamento">
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
                  <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
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
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input
                          id="nombre"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          required
                          className="border border-gray-600 rounded px-2 py-1"
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
                          className="border border-gray-600 rounded px-2 py-1"
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
                        <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                          <div className="flex justify-between w-full">
                            <span className="font-medium">{`${profesional.nombre} ${profesional.apellido}`}</span>
                            <span className="text-sm text-gray-500">{profesional.profesion}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 py-4">
                          <div className="space-y-4">
                            <div>
                              <strong>Cargos de Horas:</strong>
                              {profesional.cargosHoras && profesional.cargosHoras.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                  {profesional.cargosHoras.map((cargo, index) => (
                                    <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                      <span className="capitalize">{cargo.tipo.replace('_', ' ')}</span>
                                      <Badge variant="outline">{cargo.cantidadHoras} horas</Badge>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p>No hay cargos de horas asignados</p>
                              )}
                            </div>
                            
                            <div>
                              <strong>Equipos:</strong>
                              {profesional.equipos && profesional.equipos.length > 0 ? (
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                  {profesional.equipos.map((equipo) => (
                                    <li key={equipo.id} className="flex items-center justify-between">
                                      <span>{equipo.nombre}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p>No hay equipos asignados</p>
                              )}
                            </div>
                            
                            <div>
                              <strong>Paquetes de Horas Activos:</strong>
                              {profesional.paquetesHoras.length > 0 ? (
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                  {profesional.paquetesHoras.map((paquete) => (
                                    <li key={paquete.id}>
                                      {paquete.tipo} - {paquete.cantidad} horas
                                      {paquete.escuela && ` - ${paquete.escuela.nombre}`}
                                      {` (${paquete.equipo?.nombre})`}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p>No hay paquetes de horas activos</p>
                              )}
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                            <Button onClick={() => {
                              console.log('ID profesional:', profesional.id, profesional)
                              router.push(`/perfil/${profesional.id}`)
                            }}>
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
                <div className="mt-4 flex justify-center items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
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