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
  region: {
    id: number;
    nombre: string;
  };
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
  seccion: {
    id: number;
    nombre: string;
  };
}

interface PaqueteHoras {
  id: number;
  tipo: string;
  cantidad: number;
  equipo: {
    id: number;
    nombre: string;
  };
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

interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
  cuil: number;
  profesion: string;
  matricula: string;
  telefono: string;
  equipos: Equipo[];
  paquetesHoras: PaqueteHoras[];
  direccion: Direccion;
}

export default function ListaProfesionales() {
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [paquetesPorProfesional, setPaquetesPorProfesional] = useState<{ [key: number]: PaqueteHoras[] }>({})
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos')
  const [filtroSeccion, setFiltroSeccion] = useState('todas')
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentProfesional, setCurrentProfesional] = useState<Profesional | null>(null)
  const [formData, setFormData] = useState({
    id: 0,
    nombre: '',
    apellido: '',
    cuil: '',
    profesion: '',
    matricula: '',
    telefono: '',
    direccion: {
      calle: '',
      numero: '',
      departamento: 0
    }
  })
  const router = useRouter()

  const fetchProfesionales = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals`)
      const data = await response.json()
      setProfesionales(data)
    } catch (error) {
      console.error("Error al obtener profesionales:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPaquetesProfesional = async (profesionalId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${profesionalId}/paquetes`)
      if (!response.ok) throw new Error('Error al obtener paquetes')
      const data = await response.json()
      setPaquetesPorProfesional(prev => ({
        ...prev,
        [profesionalId]: data
      }))
    } catch (error) {
      console.error("Error al obtener paquetes del profesional:", error)
    }
  }

  const fetchDepartamentos = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`)
      if (!response.ok) throw new Error('Error al obtener departamentos')
      const data = await response.json()
      setDepartamentos(data)
    } catch (error) {
      console.error("Error al obtener departamentos:", error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [profResponse, depResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`)
        ])

        if (!profResponse.ok || !depResponse.ok) {
          throw new Error('Error al obtener datos')
        }

        const [profData, depData] = await Promise.all([
          profResponse.json(),
          depResponse.json()
        ])

        setProfesionales(profData)
        setDepartamentos(depData)

        // Obtener paquetes para cada profesional
        await Promise.all(profData.map((prof: Profesional) => fetchPaquetesProfesional(prof.id)))
      } catch (error) {
        console.error("Error al obtener datos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const getPaquetesProfesional = (profesionalId: number) => {
    return paquetesPorProfesional[profesionalId] || []
  }

  const profesionalesFiltrados = profesionales.filter(profesional => 
    `${profesional.nombre} ${profesional.apellido}`.toLowerCase().includes(filtroNombre.toLowerCase()) &&
    (filtroDepartamento === 'todos' || profesional.direccion.departamento.nombre === filtroDepartamento) &&
    (filtroSeccion === 'todas' || profesional.equipos.some(equipo => equipo.seccion.nombre === filtroSeccion))
  )

  const secciones = Array.from(new Set(profesionales.flatMap(p => p.equipos.map(equipo => equipo.seccion.nombre))))

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const profesionalData = {
        ...formData,
        cuil: Number(formData.cuil),
        direccion: {
          ...formData.direccion,
          departamento: {
            id: formData.direccion.departamento
          }
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${formData.id || ''}`, {
        method: formData.id ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profesionalData),
      })

      if (!response.ok) {
        throw new Error('Error al guardar el profesional')
      }

      setIsDialogOpen(false)
      fetchProfesionales()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar el profesional')
    }
  }

  const handleEdit = (profesional: Profesional) => {
    setCurrentProfesional(profesional)
    setFormData({
      id: profesional.id,
      nombre: profesional.nombre,
      apellido: profesional.apellido,
      cuil: profesional.cuil.toString(),
      profesion: profesional.profesion,
      matricula: profesional.matricula,
      telefono: profesional.telefono,
      direccion: {
        calle: profesional.direccion.calle,
        numero: profesional.direccion.numero,
        departamento: profesional.direccion.departamento.id
      }
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este profesional?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}`, {
          method: 'DELETE'
        })

        if (!response.ok) throw new Error('Error al eliminar el profesional')

        await fetchProfesionales()
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
              <Label htmlFor="filtroDepartamento">Filtrar por departamento</Label>
              <Select onValueChange={setFiltroDepartamento} value={filtroDepartamento}>
                <SelectTrigger id="filtroDepartamento">
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                    <ScrollArea className="h-[200px]">
                      <SelectItem value="todos">Todos los departamentos</SelectItem>
                      {departamentos.map((departamento) => (
                        <SelectItem key={departamento.id} value={departamento.nombre}>{departamento.nombre}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filtroSeccion">Filtrar por sección</Label>
              <Select onValueChange={setFiltroSeccion} value={filtroSeccion}>
                <SelectTrigger id="filtroSeccion">
                  <SelectValue placeholder="Selecciona una sección" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="todas">Todas las secciones</SelectItem>
                    {secciones.map((sec) => (
                      <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                    ))}
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
                      cuil: '',
                      profesion: '',
                      matricula: '',
                      telefono: '',
                      direccion: {
                        calle: '',
                        numero: '',
                        departamento: 0
                      }
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
                        value={formData.direccion.calle}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="direccion.numero">Número</Label>
                      <Input
                        id="direccion.numero"
                        name="direccion.numero"
                        value={formData.direccion.numero}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="direccion.departamento">Departamento</Label>
                      <Select
                        name="direccion.departamento"
                        onValueChange={(value) => handleSelectChange('direccion.departamento', Number(value))}
                        value={formData.direccion.departamento.toString()}
                      >
                        <SelectTrigger id="direccion.departamento">
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
                                {equipo.nombre} - {equipo.seccion.nombre}
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
                                {` (${paquete.equipo.nombre})`}
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