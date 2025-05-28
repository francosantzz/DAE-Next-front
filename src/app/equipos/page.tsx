'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Edit, Trash2, X } from 'lucide-react'
import ErrorBoundary from '@/components/ErrorBoundary'

interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
}

interface Seccion {
  id: number;
  nombre: string;
}

interface PaqueteHoras {
  id: number;
  tipo: string;
  cantidad: number;
  profesional: Profesional;
  escuela: {
    id: number;
    nombre: string;
  };
  dias: {
    lunes: boolean;
    martes: boolean;
    miercoles: boolean;
    jueves: boolean;
    viernes: boolean;
  };
}

interface Equipo {
  id: number;
  nombre: string;
  profesionales: Profesional[];
  departamento: Departamento;
  escuelas: Escuela[];
  paquetesHoras: PaqueteHoras[];
  totalHoras: number;
}

interface Departamento {
  id: number;
  nombre: string;
}

interface Escuela {
  id: number;
  nombre: string;
}

export function ListaEquiposPantallaCompleta() {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos')
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentEquipo, setCurrentEquipo] = useState<Equipo | null>(null)
  const [formData, setFormData] = useState({
    id: 0,
    nombre: '',
    departamentoId: 0,
    profesionalesIds: [] as number[],
    escuelasIds: [] as number[]
  })
  const [profesionalSearch, setProfesionalSearch] = useState('')
  const [escuelaSearch, setEscuelaSearch] = useState('')
  const [profesionalesSeleccionados, setProfesionalesSeleccionados] = useState<Profesional[]>([])
  const [escuelasSeleccionadas, setEscuelasSeleccionadas] = useState<Escuela[]>([])
  const [isEditing, setIsEditing] = useState(false)
 
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [equiposRes, profesionalesRes, departamentosRes, escuelasRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas`)
        ])
        
        if (!equiposRes.ok || !profesionalesRes.ok || !departamentosRes.ok || !escuelasRes.ok) 
          throw new Error('Error al obtener los datos')

        const [equiposData, profesionalesData, departamentosData, escuelasData] = await Promise.all([
          equiposRes.json(),
          profesionalesRes.json(),
          departamentosRes.json(),
          escuelasRes.json()
        ])

        setEquipos(equiposData)
        setProfesionales(profesionalesData)
        setDepartamentos(departamentosData)
        setEscuelas(escuelasData)
      } catch (error) {
        console.error('Error al obtener datos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const equiposFiltrados = equipos.filter(equipo => {
    const cumpleFiltroNombre = equipo.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
    const cumpleFiltroDepartamento = filtroDepartamento === 'todos' || 
      (equipo.departamento && equipo.departamento.id === Number(filtroDepartamento))
    return cumpleFiltroNombre && cumpleFiltroDepartamento
  })
  console.log(equiposFiltrados);
  
  const profesionalesFiltrados = profesionales.filter(profesional => 
    (profesional.nombre.toLowerCase().includes(profesionalSearch.toLowerCase()) ||
     profesional.apellido.toLowerCase().includes(profesionalSearch.toLowerCase())) &&
    !profesionalesSeleccionados.some(p => p.id === profesional.id)
  )

  const escuelasFiltradas = escuelas.filter(escuela => 
    escuela.nombre.toLowerCase().includes(escuelaSearch.toLowerCase()) &&
    !escuelasSeleccionadas.some(e => e.id === escuela.id)
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: Number(value) })
  }

  const handleProfesionalSelect = (profesional: Profesional) => {
    setProfesionalesSeleccionados(prev => [...prev, profesional])
    setFormData(prev => ({
      ...prev,
      profesionalesIds: [...prev.profesionalesIds, profesional.id]
    }))
    setProfesionalSearch('')
  }

  const handleProfesionalRemove = (profesionalId: number) => {
    setProfesionalesSeleccionados(prev => prev.filter(p => p.id !== profesionalId))
    setFormData(prev => ({
      ...prev,
      profesionalesIds: prev.profesionalesIds.filter(id => id !== profesionalId)
    }))
  }

  const handleEscuelaSelect = (escuela: Escuela) => {
    setEscuelasSeleccionadas(prev => [...prev, escuela])
    setFormData(prev => ({
      ...prev,
      escuelasIds: [...prev.escuelasIds, escuela.id]
    }))
    setEscuelaSearch('')
  }

  const handleEscuelaRemove = (escuelaId: number) => {
    setEscuelasSeleccionadas(prev => prev.filter(e => e.id !== escuelaId))
    setFormData(prev => ({
      ...prev,
      escuelasIds: prev.escuelasIds.filter(id => id !== escuelaId)
    }))
  }

  const handleEdit = (equipo: Equipo) => {
    setCurrentEquipo(equipo)
    setFormData({
      id: equipo.id,
      nombre: equipo.nombre,
      departamentoId: equipo.departamento.id,
      profesionalesIds: equipo.profesionales.map(p => p.id),
      escuelasIds: equipo.escuelas.map(e => e.id)
    })
    setProfesionalesSeleccionados(equipo.profesionales)
    setEscuelasSeleccionadas(equipo.escuelas)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const equipoData = {
        ...formData,
        departamentoId: formData.departamentoId || null,
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/${formData.id || ''}`, {
        method: formData.id ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(equipoData),
      })

      if (!response.ok) {
        throw new Error('Error al guardar el equipo')
      }

      setIsDialogOpen(false)
      fetchEquipos()
      resetForm()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar el equipo')
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/${id}`, {
          method: 'DELETE'
        })

        if (!response.ok) throw new Error('Error al eliminar el equipo')

        setEquipos(prev => prev.filter(e => e.id !== id))
      } catch (error) {
        console.error('Error al eliminar el equipo:', error)
      }
    }
  }

  const fetchEquipos = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`)
      if (!response.ok) throw new Error('Error al obtener equipos')
      const data = await response.json()
      setEquipos(data)
    } catch (error) {
      console.error('Error al obtener equipos:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      id: 0,
      nombre: '',
      departamentoId: 0,
      profesionalesIds: [],
      escuelasIds: []
    })
    setProfesionalesSeleccionados([])
    setEscuelasSeleccionadas([])
    setIsEditing(false)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <ErrorBoundary>
      <div className='bg-gray-100'>
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Equipos</h1>
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
                placeholder="Nombre del equipo"
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filtroDepartamento">Filtrar por departamento</Label>
              <Select onValueChange={setFiltroDepartamento} value={filtroDepartamento}>
                <SelectTrigger id="filtroDepartamento">
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los departamentos</SelectItem>
                  {departamentos.map((departamento) => (
                    <SelectItem key={departamento.id} value={departamento.id.toString()}>
                      {departamento.nombre}
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
                      setCurrentEquipo(null)
                      resetForm()
                      setIsDialogOpen(true)
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar Equipo
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar' : 'Agregar'} Equipo</DialogTitle>
                    <DialogDescription>
                      Complete los detalles del equipo aquí. Haga clic en guardar cuando termine.
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
                      <Label htmlFor="departamento">Departamento</Label>
                      <Select
                        name="departamento"
                        onValueChange={(value) => handleSelectChange('departamentoId', value)}
                        value={formData.departamentoId.toString()}
                      >
                        <SelectTrigger id="departamento">
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
                      <Label htmlFor="profesionalSearch">Buscar y seleccionar profesionales</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="profesionalSearch"
                          value={profesionalSearch}
                          onChange={(e) => setProfesionalSearch(e.target.value)}
                          placeholder="Buscar profesionales..."
                        />
                      </div>
                      {profesionalSearch && (
                        <ScrollArea className="h-32 overflow-auto mt-2 border rounded-md">
                          <div className="p-2">
                            {profesionalesFiltrados.map((profesional) => (
                              <div
                                key={profesional.id}
                                className="cursor-pointer hover:bg-gray-100 p-2 rounded"
                                onClick={() => handleProfesionalSelect(profesional)}
                              >
                                {profesional.nombre} {profesional.apellido}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="escuelaSearch">Buscar y seleccionar escuelas</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="escuelaSearch"
                          value={escuelaSearch}
                          onChange={(e) => setEscuelaSearch(e.target.value)}
                          placeholder="Buscar escuelas..."
                        />
                      </div>
                      {escuelaSearch && (
                        <ScrollArea className="h-32 overflow-auto mt-2 border rounded-md">
                          <div className="p-2">
                            {escuelasFiltradas.map((escuela) => (
                              <div
                                key={escuela.id}
                                className="cursor-pointer hover:bg-gray-100 p-2 rounded"
                                onClick={() => handleEscuelaSelect(escuela)}
                              >
                                {escuela.nombre}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                    <div>
                      <Label>Profesionales seleccionados</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profesionalesSeleccionados.map((profesional) => (
                          <Badge key={profesional.id} variant="secondary" className="flex items-center gap-1">
                            {profesional.nombre} {profesional.apellido}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={() => handleProfesionalRemove(profesional.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Escuelas seleccionadas</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {escuelasSeleccionadas.map((escuela) => (
                          <Badge key={escuela.id} variant="secondary" className="flex items-center gap-1">
                            {escuela.nombre}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={() => handleEscuelaRemove(escuela.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button type="submit">Guardar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {equiposFiltrados.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {equiposFiltrados.map((equipo) => (
                <AccordionItem key={equipo.id} value={String(equipo.id)}>
                  <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between w-full">
                      <span>{equipo.nombre}</span>
                      <span className="text-sm text-gray-500">
                        {equipo.departamento ? `Departamento: ${equipo.departamento.nombre}` : 'Sin departamento asignado'}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4">
                    <div className="space-y-4">
                      <p>
                        <strong>Departamento:</strong> 
                        {equipo.departamento ? equipo.departamento.nombre : 'Sin departamento asignado'}
                      </p>
                      <div>
                        <strong>Profesionales:</strong>
                        {equipo.profesionales && equipo.profesionales.length > 0 ? (
                          <ul className="list-disc pl-5 mt-2 space-y-1">
                            {equipo.profesionales.map((profesional) => (
                              <li key={profesional.id}>
                                {profesional.nombre} {profesional.apellido}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No hay profesionales asignados</p>
                        )}
                      </div>
                      <div>
                        <strong>Escuelas:</strong>
                        {equipo.escuelas && equipo.escuelas.length > 0 ? (
                          <ul className="list-disc pl-5 mt-2 space-y-1">
                            {equipo.escuelas.map((escuela) => (
                              <li key={escuela.id}>
                                {escuela.nombre}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No hay escuelas asignadas</p>
                        )}
                      </div>
                      <div>
                        <strong>Paquetes de Horas:</strong>
                        {equipo.paquetesHoras && equipo.paquetesHoras.length > 0 ? (
                          <ul className="list-disc pl-5 mt-2 space-y-1">
                            {equipo.paquetesHoras.map((paquete) => (
                              <li key={paquete.id}>
                                {paquete.tipo} - {paquete.cantidad} horas
                                {paquete.escuela && ` - ${paquete.escuela.nombre}`}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No hay paquetes de horas asignados</p>
                        )}
                      </div>
                      <p><strong>Horas totales del Equipo:</strong> {equipo.totalHoras || 0}</p>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => handleEdit(equipo)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </Button>
                        <Button variant="destructive" onClick={() => handleDelete(equipo.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center py-4">No se encontraron equipos con los filtros aplicados.</p>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default ListaEquiposPantallaCompleta;