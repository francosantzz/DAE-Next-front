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
import { UsersIcon, BriefcaseIcon, CalendarIcon, PlusIcon, FilePenIcon, TrashIcon } from 'lucide-react'


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
  seccion: string;
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
  totalHoras: number;
}


export function HomePage() {
  const [openModal, setOpenModal] = useState(false)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [professionalsRes, dashboardRes, departamentosRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboard`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`)
        ])
        
        if (!professionalsRes.ok || !departamentosRes.ok) 
          throw new Error('Failed to fetch data')

        const professionalsData = await professionalsRes.json()
        const dashboardData = await dashboardRes.json()
        const departamentosData = await departamentosRes.json()

        setProfessionals(professionalsData)
        console.log(professionalsData)
        setDashboardData(dashboardData)
        setDepartamentos(departamentosData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

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
        method: 'DELETE'
      })
  
      if (!response.ok) throw new Error('Error al eliminar el profesional')
  
      setProfessionals(prev => prev.filter(p => p.id !== id))
      setDashboardData(prev => prev ? {
        ...prev,
        totalProfessionals: prev.totalProfessionals - 1
      } : null)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar el profesional')
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-background">
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Profesionales</CardTitle>
              <UsersIcon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalProfessionals}</div>
              <p className="text-xs text-muted-foreground">+{dashboardData?.newProfessionalsThisMonth} nuevos este mes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tareas</CardTitle>
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalTasks}</div>
              <p className="text-xs text-muted-foreground">+{dashboardData?.newTasksThisWeek} nuevas esta semana</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Equipos</CardTitle>
              <UsersIcon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalTeams}</div>
              <p className="text-xs text-muted-foreground">+{dashboardData?.newTeamsThisMonth} nuevo este mes</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Profesionales</CardTitle>
            <Button variant="outline" size="sm" onClick={handleOpenModal}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Agregar Profesional
            </Button>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Nombre</TableHead>
                <TableHead>Profesión</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead className="text-center">Horas asignadas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {professionals.map((professional) => (
                  <TableRow key={professional.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarFallback>{professional.nombre.charAt(0)}{professional.apellido.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>{professional.nombre} {professional.apellido}</div>
                      </div>
                    </TableCell>
                    <TableCell>{professional.profesion}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {professional.equipos.map(equipo => (
                          <div key={equipo.id} className="flex items-center gap-2">
                            <UsersIcon className="w-4 h-4 text-muted-foreground" />
                            <div>{equipo.nombre} ({equipo.seccion})</div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BriefcaseIcon className="w-4 h-4 text-muted-foreground" />
                        <div>{professional.direccion.departamento.nombre}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-medium">{professional.totalHoras}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(professional)}>
                        <FilePenIcon className="w-4 h-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(professional.id)}>
                        <TrashIcon className="w-4 h-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                          ))}
          </TableBody>
          </Table>
        </Card>
      </main>
      <Dialog open={openModal} onOpenChange={(open) => {
        if (!open) {
          // When closing the modal
          handleCloseModal()
          setCurrentProfesional(null)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentProfesional ? 'Editar' : 'Agregar'} Profesional</DialogTitle>
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
              <Label htmlFor="direccion.calle">Calle</Label>
              <Input
                id="direccion.calle"
                name="direccion.calle"
                value={formData['direccion.calle']}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="direccion.numero">Número</Label>
              <Input
                id="direccion.numero"
                name="direccion.numero"
                value={formData['direccion.numero']}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="direccion.departamentoId">Departamento</Label>
              <Select
                name="direccion.departamentoId"
                onValueChange={(value) => handleSelectChange('direccion.departamentoId', value)}
                value={formData['direccion.departamentoId']}
              >
                <SelectTrigger id="direccion.departamentoId">
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
            <Button type="submit">Guardar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}