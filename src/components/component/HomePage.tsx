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
import { UsersIcon, BriefcaseIcon, CalendarIcon, PlusIcon, FilePenIcon, TrashIcon, TrendingUpIcon, PhoneIcon, MapPinIcon, ClockIcon, UserCheckIcon } from 'lucide-react'
import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"


interface Region {
  id: number;
  nombre: string;
}

interface Departamento {
  id: number;
  nombre: string;
  region: Region;
}

interface Direccion {
  id: number;
  calle: string;
  numero: number;
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
}

interface Equipo {
  id: number;
  nombre: string;
  profesionales: string[];

}

interface Professional {
  id: number;
  nombre: string;
  apellido: string;
  cuil: number;
  profesion: string;
  matricula: string;
  telefono: number;
  direccion: Direccion;
  paquetesHoras: PaqueteHoras[];
  equipos: Equipo[];
  totalHorasProfesional: number;
}

interface DashboardData {
  totalProfessionals: number;
  newProfessionalsThisMonth: number;
  totalTasks: number;
  newTasksThisWeek: number;
  totalTeams: number;
  newTeamsThisMonth: number;
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
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cuil: '',
    profesion: '',
    matricula: '',
    telefono: '',
    'direccion.calle': '',
    'direccion.numero': '',
    'direccion.departamentoId': '',
  })
  const { data: session } = useSession()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [professionalsRes, equiposRes, paquetesRes, departamentosRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals`, {
            headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`, {
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

        const newProfessionalsThisMonth = professionalsData.filter((p: Professional) => {
          const createdAt = new Date(p.createdAt)
          return createdAt >= firstDayOfMonth
        }).length

        const newTeamsThisMonth = equiposData.filter((e: Equipo) => {
          const createdAt = new Date(e.createdAt)
          return createdAt >= firstDayOfMonth
        }).length

        const newTasksThisWeek = paquetesData.filter((p: PaqueteHoras) => {
          const createdAt = new Date(p.createdAt)
          return createdAt >= firstDayOfWeek
        }).length

        setProfessionals(professionalsData)
        setDashboardData({
          totalProfessionals: professionalsData.length,
          newProfessionalsThisMonth,
          totalTasks: paquetesData.length,
          newTasksThisWeek,
          totalTeams: equiposData.length,
          newTeamsThisMonth
        })
        setDepartamentos(departamentosData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.accessToken) {
      fetchData()
    }
  }, [session?.user?.accessToken])

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
        cuil: parseInt(formData.cuil),
        profesion: formData.profesion,
        matricula: formData.matricula,
        telefono: parseInt(formData.telefono),
        direccion: {
          calle: formData['direccion.calle'],
          numero: parseInt(formData['direccion.numero']),
          departamento: {
            id: parseInt(formData['direccion.departamentoId'])
          }
        }
      }
  
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
      'direccion.calle': '',
      'direccion.numero': '',
      'direccion.departamentoId': '',
    })
  }

  const handleEdit = (professional: Professional) => {
    setCurrentProfesional(professional)
    setFormData({
      nombre: professional.nombre,
      apellido: professional.apellido,
      cuil: professional.cuil.toString(),
      profesion: professional.profesion,
      matricula: professional.matricula,
      telefono: professional.telefono.toString(),
      'direccion.calle': professional.direccion.calle,
      'direccion.numero': professional.direccion.numero.toString(),
      'direccion.departamentoId': professional.direccion.departamento.id.toString(),
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
              <Button
                onClick={handleOpenModal}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Agregar Profesional
              </Button>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(professional)}
                            className="hover:bg-blue-50 hover:border-blue-300"
                          >
                            <FilePenIcon className="w-4 h-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(professional.id)}
                            className="hover:bg-red-50 hover:border-red-300 text-red-600"
                          >
                            <TrashIcon className="w-4 h-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  value={formData["direccion.calle"]}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500"
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
                  value={formData["direccion.numero"]}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion.departamentoId" className="text-sm font-medium text-gray-700">
                Departamento
              </Label>
              <Select
                name="direccion.departamentoId"
                onValueChange={(value) => handleSelectChange("direccion.departamentoId", value)}
                value={formData["direccion.departamentoId"]}
              >
                <SelectTrigger id="direccion.departamentoId" className="border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <ScrollArea className="h-[200px]">
                    {departamentos.map((departamento) => (
                      <SelectItem key={departamento.id} value={departamento.id.toString()}>
                        {departamento.nombre}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
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