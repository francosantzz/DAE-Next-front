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
import Layout from '../../components/LayoutProf'
import { ScrollArea } from '@radix-ui/react-scroll-area'

interface PaqueteHoras {
  id: number;
  tipo: string;
  cantidad: number;
  escuela: {
    id: number;
    nombre: string;
  };
  equipo: string;
}

interface Departamento {
  id: number;
  nombre: string;
}

interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
  cuil: number;
  profesion: string;
  matricula: string;
  telefono: number;
  direccion: {
    calle: string;
    numero: number;
    departamento: Departamento;
  };
  paquetesHoras: PaqueteHoras[];
  equipos: {
    id: number;
    nombre: string;
    seccion: string;
    profesionales: string[];
  }[];
}

export default function ListaProfesionales() {
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos')
  const [filtroSeccion, setFiltroSeccion] = useState('todas')
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentProfesional, setCurrentProfesional] = useState<Profesional | null>(null)
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
  const router = useRouter()

  useEffect(() => {
    fetchProfesionales()
    fetchDepartamentos()
  }, [])

  const fetchDepartamentos = async () => {
    setIsLoading(true)
    try {
      const responseDep = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`)
      const data = await responseDep.json()
      setDepartamentos(data)
    } catch (error) {
      console.error("Error al obtener departamentos:", error)
    } finally {
      setIsLoading(false)
    }
  }

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

  const profesionalesFiltrados = profesionales.filter(profesional => 
    `${profesional.nombre} ${profesional.apellido}`.toLowerCase().includes(filtroNombre.toLowerCase()) &&
    (filtroDepartamento === 'todos' || profesional.direccion.departamento.nombre === filtroDepartamento) &&
    (filtroSeccion === 'todas' || profesional.equipos.some(equipo => equipo.seccion === filtroSeccion))
  )

  const secciones = Array.from(new Set(profesionales.flatMap(p => p.equipos.map(equipo => equipo.seccion))))

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
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          cuil: parseInt(formData.cuil),
          profesion: formData.profesion,
          matricula: formData.matricula,
          telefono: parseInt(formData.telefono),
          direccion: {
            calle: formData['direccion.calle'],
            numero: parseInt(formData['direccion.numero']),
            departamentoId: parseInt(formData['direccion.departamentoId'])
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar el profesional');
      }

      await fetchProfesionales()
      setIsDialogOpen(false)
      setCurrentProfesional(null)
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
    } catch (error) {
      alert('Error al guardar el profesional: ' + error);
    }
  }

  const handleEdit = (profesional: Profesional) => {
    setCurrentProfesional(profesional)
    setFormData({
      nombre: profesional.nombre,
      apellido: profesional.apellido,
      cuil: profesional.cuil.toString(),
      profesion: profesional.profesion,
      matricula: profesional.matricula,
      telefono: profesional.telefono.toString(),
      'direccion.calle': profesional.direccion.calle,
      'direccion.numero': profesional.direccion.numero.toString(),
      'direccion.departamentoId': profesional.direccion.departamento.id.toString(),
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
                      <p><strong>Profesión:</strong> {profesional.profesion}</p>
                      <p><strong>Departamento:</strong> {profesional.direccion.departamento.nombre}</p>
                      <p><strong>Equipo:</strong> {profesional.equipos.map(equipo => equipo.nombre).join(', ')}</p>
                      <p><strong>Sección:</strong> {profesional.equipos.map(equipo => equipo.seccion).join(', ')}</p>
                      <div>
                        <strong>Paquetes de Horas:</strong>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          {profesional.paquetesHoras.map((paquete, index) => (
                            <li key={index}>
                              {paquete.cantidad} horas en {paquete.escuela.nombre} en el equipo {paquete.equipo}
                            </li>
                          ))}
                        </ul>
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
  )
}