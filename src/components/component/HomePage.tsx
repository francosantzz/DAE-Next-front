'use client'

import { useState, useEffect } from 'react'
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UsersIcon, BriefcaseIcon, CalendarIcon, PlusIcon, FilePenIcon, TrashIcon, TrendingUpIcon, PhoneIcon, MapPinIcon, ClockIcon, UserCheckIcon, XIcon } from 'lucide-react'
import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { PermissionButton } from '../PermissionButton'


interface Region {
  id: number;
  nombre: string;
}

interface Departamento {
  id: number;
  nombre: string;
  region?: Region;
}

interface Direccion {
  id: number;
  calle: string;
  numero: string;
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
  escuela: Escuela;
  equipo: string;
  createdAt?: string;
}

interface Equipo {
  id: number;
  nombre: string;
  profesionales: string[];
  createdAt?: string;
}

interface Professional {
  id: number;
  nombre: string;
  apellido: string;
  cuil: string;
  profesion: string;
  matricula: string;
  telefono: string;
  direccion: Direccion;
  paquetesHoras: PaqueteHoras[];
  equipos: Equipo[];
  totalHorasProfesional: number;
  createdAt?: string;
  correoElectronico?: string;
  fechaNacimiento?: string;
  dni?: string;
  fechaVencimientoMatricula?: string;
  fechaVencimientoPsicofisico?: string;
  cargosHoras?: CargoHoras[];
}

interface DashboardData {
  totalProfessionals: number;
  newProfessionalsThisMonth: number;
  totalTasks: number;
  newTasksThisWeek: number;
  totalTeams: number;
  newTeamsThisMonth: number;
}

interface CargoHoras {
  id?: number;
  tipo: 'comunes' | 'investigacion' | 'mision_especial' | 'regimen_27';
  cantidadHoras: number;
}

export function HomePage() {
  const [openModal, setOpenModal] = useState(false)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalProfessionals: 0,
    newProfessionalsThisMonth: 0,
    totalTasks: 0,
    newTasksThisWeek: 0,
    totalTeams: 0,
    newTeamsThisMonth: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [currentProfesional, setCurrentProfesional] = useState<Professional | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cuil: '',
    profesion: '',
    matricula: '',
    telefono: '',
    direccion: {
      calle: '',
      numero: '',
      departamentoId: ''
    },
    correoElectronico: '',
    fechaNacimiento: '',
    dni: '',
    fechaVencimientoMatricula: '',
    fechaVencimientoPsicofisico: '',
    equiposIds: [] as number[],
    cargosHoras: [] as CargoHoras[],
  })
  const { data: session } = useSession()
  const [equipos, setEquipos] = useState<Equipo[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [professionalsRes, equiposRes, paquetesRes, departamentosRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals?page=${currentPage}&limit=${itemsPerPage}`, {
            headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos?page=1&limit=100`, {
            headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes`, {
            headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`, {
            headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
          })
        ])
        
        if (!professionalsRes.ok || !equiposRes.ok || !paquetesRes.ok || !departamentosRes.ok) 
          throw new Error('Failed to fetch data')

        const [professionalsData, equiposData, paquetesData, departamentosData] = await Promise.all([
          professionalsRes.json(),
          equiposRes.json(),
          paquetesRes.json(),
          departamentosRes.json()
        ])

        // Calcular estadísticas
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))

        const newProfessionalsThisMonth = professionalsData.data.filter((p: Professional) => {
          if (!(p as any).createdAt) return false;
          const createdAtProf = new Date((p as any).createdAt);
          return createdAtProf >= firstDayOfMonth;
        }).length

        const equiposArray = equiposData.data || equiposData
        const newTeamsThisMonth = equiposArray.filter((e: Equipo) => {
          if (!(e as any).createdAt) return false;
          const createdAtEq = new Date((e as any).createdAt);
          return createdAtEq >= firstDayOfMonth;
        }).length

        const newTasksThisWeek = paquetesData.filter((p: PaqueteHoras) => {
          if (!(p as any).createdAt) return false;
          const createdAtPack = new Date((p as any).createdAt);
          return createdAtPack >= firstDayOfWeek;
        }).length

        setProfessionals(professionalsData.data)
        setTotalPages(professionalsData.meta.totalPages)
        setTotalItems(professionalsData.meta.total)
        setDashboardData({
          totalProfessionals: professionalsData.meta.total,
          newProfessionalsThisMonth,
          totalTasks: paquetesData.length,
          newTasksThisWeek,
          totalTeams: equiposArray.length,
          newTeamsThisMonth
        })
        setEquipos(equiposData.data || equiposData)
        setDepartamentos(departamentosData.data || departamentosData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.accessToken) {
      fetchData()
    }
  }, [session?.user?.accessToken, currentPage])

  const handleOpenModal = () => {
    // Reset current professional and form data before opening modal
    setCurrentProfesional(null)
    resetForm()
    setOpenModal(true)
  }
  const handleCloseModal = () => setOpenModal(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = currentProfesional
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${currentProfesional.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals`
      const method = currentProfesional ? 'PATCH' : 'POST'
      
      const payload = {
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
      }
  
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.accessToken}`
         },
        body: JSON.stringify(payload)
      })
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar el profesional');
      }
  
      const updatedProfessional = await response.json()
      setProfessionals(prev => 
        currentProfesional
          ? prev.map(p => p.id === currentProfesional.id ? updatedProfessional : p)
          : [...prev, updatedProfessional]
      )
      handleCloseModal()
      setCurrentProfesional(null)
      resetForm()
    } catch (error) {
      console.error('Error al guardar el profesional:', error)
      alert('Error al guardar el profesional: ' + error)
    }
  }
  
  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      cuil: '',
      profesion: '',
      matricula: '',
      telefono: '',
      direccion: {
        calle: '',
        numero: '',
        departamentoId: ''
      },
      correoElectronico: '',
      fechaNacimiento: '',
      dni: '',
      fechaVencimientoMatricula: '',
      fechaVencimientoPsicofisico: '',
      equiposIds: [],
      cargosHoras: [],
    })
  }

  const handleEdit = (professional: Professional) => {
    setCurrentProfesional(professional)
    setFormData({
      nombre: professional.nombre,
      apellido: professional.apellido,
      cuil: professional.cuil,
      profesion: professional.profesion,
      matricula: professional.matricula,
      telefono: professional.telefono,
      direccion: {
        calle: professional.direccion.calle,
        numero: professional.direccion.numero,
        departamentoId: professional.direccion.departamento.id.toString()
      },
      correoElectronico: professional.correoElectronico ?? '',
      fechaNacimiento: professional.fechaNacimiento ?? '',
      dni: professional.dni ?? '',
      fechaVencimientoMatricula: professional.fechaVencimientoMatricula ?? '',
      fechaVencimientoPsicofisico: professional.fechaVencimientoPsicofisico ?? '',
      equiposIds: professional.equipos.map(e => Number(e.id)),
      cargosHoras: professional.cargosHoras ?? [],
    })
    setOpenModal(true)
  }
  
  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar este profesional?')) return
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
      })
  
      if (!response.ok) throw new Error('Error al eliminar el profesional')
  
      setProfessionals(prev => prev.filter(p => p.id !== id))
      setDashboardData(prev => ({
        ...prev,
        totalProfessionals: prev.totalProfessionals - 1
      }))
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar el profesional')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50">
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total de Profesionales</CardTitle>
              <div className="bg-blue-50 rounded-full p-2">
                <UsersIcon className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{dashboardData?.totalProfessionals}</div>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="w-4 h-4 mr-1 text-blue-500" />
                <p className="text-sm text-gray-600">+{dashboardData?.newProfessionalsThisMonth} nuevos este mes</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Paquetes de Horas</CardTitle>
              <div className="bg-green-50 rounded-full p-2">
                <ClockIcon className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{dashboardData?.totalTasks}</div>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="w-4 h-4 mr-1 text-green-500" />
                <p className="text-sm text-gray-600">+{dashboardData?.newTasksThisWeek} nuevos esta semana</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Equipos</CardTitle>
              <div className="bg-purple-50 rounded-full p-2">
                <UserCheckIcon className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{dashboardData?.totalTeams}</div>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="w-4 h-4 mr-1 text-purple-500" />
                <p className="text-sm text-gray-600">+{dashboardData?.newTeamsThisMonth} nuevo este mes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border border-gray-200">
          <CardHeader className="bg-white border-b border-gray-200">
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-800">Profesionales</CardTitle>
                <p className="text-gray-600 mt-1">Gestión de profesionales del sistema</p>
              </div>
              <PermissionButton
                requiredPermission={{entity: 'profesional', action: 'create'}}
                onClick={handleOpenModal}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Agregar Profesional
              </PermissionButton>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Profesional</TableHead>
                    <TableHead className="font-semibold text-gray-700">Profesión</TableHead>
                    <TableHead className="font-semibold text-gray-700">Equipo</TableHead>
                    <TableHead className="font-semibold text-gray-700">Ubicación</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Horas</TableHead>
                    <TableHead className="font-semibold text-gray-700">Correo</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professionals.map((professional) => (
                    <TableRow key={professional.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                              {professional.nombre.charAt(0)}
                              {professional.apellido.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {professional.nombre} {professional.apellido}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <PhoneIcon className="w-3 h-3 mr-1" />
                              {professional.telefono}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {professional.profesion}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">Mat: {professional.matricula}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {professional.equipos && professional.equipos.length > 0 ? (
                            professional.equipos.map((equipo) => (
                              <div key={equipo.id} className="flex items-center gap-2">
                                <div className="bg-green-50 rounded-full p-1">
                                  <UsersIcon className="w-3 h-3 text-green-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                  {equipo.nombre || "Sin nombre"}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center gap-2 text-gray-500">
                              <div className="bg-gray-50 rounded-full p-1">
                                <UsersIcon className="w-3 h-3 text-gray-400" />
                              </div>
                              <span className="text-sm">Sin equipo</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-orange-50 rounded-full p-1">
                            <MapPinIcon className="w-3 h-3 text-orange-600" />
                          </div>
                          <div className="text-sm">
                            <div className="font-medium text-gray-700">
                              {professional.direccion.departamento.nombre}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {professional.direccion.calle} {professional.direccion.numero}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <div className="font-bold text-lg text-blue-700">
                            {professional.paquetesHoras.reduce((sum, p) => sum + p.cantidad, 0)}
                          </div>
                          <div className="text-xs text-blue-600">horas</div>
                        </div>
                      </TableCell>
                      <TableCell>{professional.correoElectronico}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <PermissionButton
                            requiredPermission={{ entity: 'profesional', action: 'update'}}
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(professional)}
                            className="hover:bg-blue-50 hover:border-blue-300"
                          >
                            <FilePenIcon className="w-4 h-4" />
                            <span className="sr-only">Editar</span>
                          </PermissionButton>
                          <PermissionButton
                            requiredPermission={{ entity: 'profesional', action: 'delete'}}
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(professional.id)}
                            className="hover:bg-red-50 hover:border-red-300 text-red-600"
                          >
                            <TrashIcon className="w-4 h-4" />
                            <span className="sr-only">Eliminar</span>
                          </PermissionButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-center items-center space-x-2 p-4">
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
          </CardContent>
        </Card>
      </main>

      <Dialog
        open={openModal}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseModal()
            setCurrentProfesional(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-800">
              {currentProfesional ? "Editar" : "Agregar"} Profesional
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido" className="text-sm font-medium text-gray-700">
                  Apellido
                </Label>
                <Input
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuil" className="text-sm font-medium text-gray-700">
                  CUIL
                </Label>
                <Input
                  id="cuil"
                  name="cuil"
                  value={formData.cuil}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profesion" className="text-sm font-medium text-gray-700">
                  Profesión
                </Label>
                <Input
                  id="profesion"
                  name="profesion"
                  value={formData.profesion}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matricula" className="text-sm font-medium text-gray-700">
                  Matrícula
                </Label>
                <Input
                  id="matricula"
                  name="matricula"
                  value={formData.matricula}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-sm font-medium text-gray-700">
                  Teléfono
                </Label>
                <Input
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion.calle" className="text-sm font-medium text-gray-700">
                  Calle
                </Label>
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
              <div className="space-y-2">
                <Label htmlFor="direccion.numero" className="text-sm font-medium text-gray-700">
                  Número
                </Label>
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
              <div className="space-y-2">
                <Label htmlFor="correoElectronico" className="text-sm font-medium text-gray-700">Correo electrónico</Label>
                <Input
                  id="correoElectronico"
                  name="correoElectronico"
                  value={formData.correoElectronico}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento" className="text-sm font-medium text-gray-700">Fecha de nacimiento</Label>
                <Input
                  id="fechaNacimiento"
                  name="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dni" className="text-sm font-medium text-gray-700">DNI</Label>
                <Input
                  id="dni"
                  name="dni"
                  value={formData.dni}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaVencimientoMatricula" className="text-sm font-medium text-gray-700">Vencimiento Matrícula</Label>
                <Input
                  id="fechaVencimientoMatricula"
                  name="fechaVencimientoMatricula"
                  type="date"
                  value={formData.fechaVencimientoMatricula}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaVencimientoPsicofisico" className="text-sm font-medium text-gray-700">Vencimiento Psicofísico</Label>
                <Input
                  id="fechaVencimientoPsicofisico"
                  name="fechaVencimientoPsicofisico"
                  type="date"
                  value={formData.fechaVencimientoPsicofisico}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500"
                />
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
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Cargos de Horas</Label>
                        {formData.cargosHoras.map((cargo, idx) => (
                          <div key={idx} className="flex gap-2 items-center mb-2">
                            <Select
                              value={cargo.tipo}
                              onValueChange={value => {
                                const updated = [...formData.cargosHoras];
                                updated[idx] = { ...cargo, tipo: value as CargoHoras['tipo'] };
                                setFormData(prev => ({ ...prev, cargosHoras: updated }));
                              }}
                            >
                              <SelectTrigger className="w-40 border-gray-300 focus:border-blue-500">
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="comunes">Comunes</SelectItem>
                                <SelectItem value="investigacion">Investigación</SelectItem>
                                <SelectItem value="mision_especial">Misión Especial</SelectItem>
                                <SelectItem value="regimen_27">Régimen 27</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              min={0}
                              className="w-24 border-gray-300 focus:border-blue-500"
                              value={cargo.cantidadHoras}
                              onChange={e => {
                                const updated = [...formData.cargosHoras];
                                updated[idx] = { ...cargo, cantidadHoras: Number(e.target.value) };
                                setFormData(prev => ({ ...prev, cargosHoras: updated }));
                              }}
                              placeholder="Horas"
                              required
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                cargosHoras: prev.cargosHoras.filter((_, i) => i !== idx)
                              }))}
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            cargosHoras: [...prev.cargosHoras, { tipo: 'comunes', cantidadHoras: 0 }]
                          }))}
                        >
                          Agregar Cargo de Horas
                        </Button>
                      </div>
              <div className="space-y-2">
                <Label htmlFor="direccion.departamentoId" className="text-sm font-medium text-gray-700">
                  Departamento
                </Label>
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
            </div>
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  handleCloseModal()
                  setCurrentProfesional(null)
                  resetForm()
                }}
                className="px-6"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-6"
              >
                {currentProfesional ? "Actualizar" : "Guardar"} Profesional
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}