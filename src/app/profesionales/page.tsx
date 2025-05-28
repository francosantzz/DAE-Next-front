'use client'

import { useEffect, useState } from 'react'
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
import { PlusCircle, Edit, Trash2 } from 'lucide-react'
import Layout from '../../components/profesional/LayoutProf'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import ErrorBoundary from '@/components/ErrorBoundary'

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
  equipo?: Equipo
}

interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  departamento: Departamento;
  equipos: Equipo[];
  paquetesHoras: PaqueteHoras[];
  totalHorasProfesional: number;
}

export default function ListaProfesionales() {
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroEquipo, setFiltroEquipo] = useState('todos')
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos')
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentProfesional, setCurrentProfesional] = useState<Profesional | null>(null)
  const [formData, setFormData] = useState({
    id: 0,
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    departamentoId: '',
    equipoId: '',
  })
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [profesionalesRes, equiposRes, departamentosRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`),
        ])

        if (!profesionalesRes.ok || !equiposRes.ok || !departamentosRes.ok)
          throw new Error('Error al obtener los datos')

        const [profesionalesData, equiposData, departamentosData] = await Promise.all([
          profesionalesRes.json(),
          equiposRes.json(),
          departamentosRes.json(),
        ])

        setProfesionales(profesionalesData)
        setEquipos(equiposData)
        setDepartamentos(departamentosData)
      } catch (error) {
        console.error('Error al obtener datos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const profesionalesFiltrados = profesionales.filter(profesional => {
    const cumpleFiltroNombre = 
      profesional.nombre.toLowerCase().includes(filtroNombre.toLowerCase()) ||
      profesional.apellido.toLowerCase().includes(filtroNombre.toLowerCase())
    
    const cumpleFiltroEquipo = filtroEquipo === 'todos' ||
      profesional.equipos.some(equipo => equipo.id === Number(filtroEquipo))
      
    const cumpleFiltroDepartamento = filtroDepartamento === 'todos' || 
      (profesional.departamento && profesional.departamento.id === Number(filtroDepartamento))
    
    return cumpleFiltroNombre && cumpleFiltroEquipo && cumpleFiltroDepartamento
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleEdit = (profesional: Profesional) => {
    setCurrentProfesional(profesional)
    setFormData({
      id: profesional.id,
      nombre: profesional.nombre,
      apellido: profesional.apellido,
      email: profesional.email,
      telefono: profesional.telefono,
      departamentoId: profesional.departamento.id.toString(),
      equipoId: profesional.equipos[0]?.id.toString() || '',
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          telefono: formData.telefono,
          departamentoId: Number.parseInt(formData.departamentoId),
          equipoId: Number.parseInt(formData.equipoId),
        }),
      })

      if (!response.ok) throw new Error('Error al guardar el profesional')

      const updatedProfesional = await response.json()

      setProfesionales(prev =>
        currentProfesional
          ? prev.map(p => p.id === updatedProfesional.id ? updatedProfesional : p)
          : [...prev, updatedProfesional]
      )

      setIsDialogOpen(false)
      setCurrentProfesional(null)
      setFormData({
        id: 0,
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        departamentoId: '',
        equipoId: '',
      })
    } catch (error) {
      console.error('Error al guardar el profesional:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este profesional?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}`, {
          method: 'DELETE'
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
                  <Button onClick={() => {
                    setCurrentProfesional(null)
                    setFormData({
                      id: 0,
                      nombre: '',
                      apellido: '',
                      email: '',
                      telefono: '',
                      departamentoId: '',
                      equipoId: '',
                    })
                  }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar Profesional
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{currentProfesional ? 'Editar' : 'Agregar'} Profesional</DialogTitle>
                    <DialogDescription>
                      Complete los detalles del profesional aquí. Haga clic en guardar cuando termine.
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
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        value={formData.email}
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
                      <Label htmlFor="departamentoId">Departamento</Label>
                      <Select
                        name="departamentoId"
                        onValueChange={(value) => handleSelectChange('departamentoId', value)}
                        value={formData.departamentoId}
                      >
                        <SelectTrigger id="departamentoId">
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
                    <div>
                      <Label htmlFor="equipoId">Equipo</Label>
                      <Select
                        name="equipoId"
                        onValueChange={(value) => handleSelectChange('equipoId', value)}
                        value={formData.equipoId}
                      >
                        <SelectTrigger id="equipoId">
                          <SelectValue placeholder="Selecciona un equipo" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <ScrollArea className="h-[200px]">
                            {equipos.map((equipo) => (
                              <SelectItem key={equipo.id} value={equipo.id.toString()}>
                                {equipo.nombre}
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
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {isLoading ? (
            <p className="text-center py-4">Cargando profesionales...</p>
          ) : profesionalesFiltrados.length > 0 ? (
            <Accordion type="multiple" collapsible className="w-full">
              {profesionalesFiltrados.map((profesional) => (
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
                        <strong>Equipos:</strong>
                        {profesional.equipos && profesional.equipos.length > 0 ? (
                          <ul className="list-disc pl-5 mt-2 space-y-1">
                            {profesional.equipos.map((equipo) => (
                              <li key={equipo.id}>
                                {equipo.nombre}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No hay equipos asignados</p>
                        )}
                      </div>
                      <div>
                        <strong>Paquetes de Horas:</strong>
                        {profesional.paquetesHoras && profesional.paquetesHoras.length > 0 ? (
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
                          <p>No hay paquetes de horas asignados</p>
                        )}
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button onClick={() => router.push(`/perfil/${profesional.id}`)}>
                          Ver Perfil Detallado
                        </Button>
                        <Button variant="outline" onClick={() => handleEdit(profesional)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </Button>
                        <Button variant="destructive" onClick={() => handleDelete(profesional.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center py-4">No se encontraron profesionales con los filtros aplicados.</p>
          )}
        </div>
      </div>
    </Layout>
    </ErrorBoundary>
  )
}