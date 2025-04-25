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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react'

interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
}

interface Anexo {
  id: number;
  nombre: string;
  matricula: number;
  escuela: {
    id: number;
    nombre: string;
  };
}

interface Direccion {
  id: number;
  calle: string;
  numero: number;
  departamento: {
    id: number;
    nombre: string;
  };
}

interface PaqueteHoras {
  id: number;
  cantidad: number;
  profesional: Profesional;
}

interface Seccion {
  id: number;
  nombre: string;
}

interface Departamento {
  id: number;
  nombre: string;
}

interface Escuela {
  id: number;
  nombre: string;
  direccion: Direccion;
  seccion: Seccion;
  anexos: Anexo[];
  paquetesHoras: PaqueteHoras[];
}

export default function ListaEscuelas() {
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroSeccion, setFiltroSeccion] = useState('todas')
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentEscuela, setCurrentEscuela] = useState<Escuela | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    'direccion.calle': '',
    'direccion.numero': '',
    departamentoId: '',
    seccionId: '',
  })
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false)
  const [selectedEscuela, setSelectedEscuela] = useState<Escuela | null>(null)
  const [isAnexoDialogOpen, setIsAnexoDialogOpen] = useState(false)
  const [anexoFormData, setAnexoFormData] = useState<{ id: number | undefined; nombre: string; matricula: string }>({ 
    id: undefined, 
    nombre: '', 
    matricula: '' 
  })
  const [isEditingAnexo, setIsEditingAnexo] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [escuelasRes, seccionesRes, departamentosRes, anexosRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/seccions`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/anexos`)
      ])
      
      if (!escuelasRes.ok || !seccionesRes.ok || !departamentosRes.ok || !anexosRes.ok) 
        throw new Error('Error al obtener los datos')

      const [escuelasData, seccionesData, departamentosData, anexosData] = await Promise.all([
        escuelasRes.json(),
        seccionesRes.json(),
        departamentosRes.json(),
        anexosRes.json()
      ])

      console.log('Anexos from API:', anexosData)

      setEscuelas(escuelasData)
      setSecciones(seccionesData)
      setDepartamentos(departamentosData)
      setAnexos(anexosData)
    } catch (error) {
      console.error('Error al obtener datos:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  console.log(anexos)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const escuelasFiltradas = escuelas.filter(escuela => 
    escuela.nombre.toLowerCase().includes(filtroNombre.toLowerCase()) &&
    (filtroSeccion === 'todas' || escuela.seccion.id.toString() === filtroSeccion)
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = currentEscuela
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${currentEscuela.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas`
      const method = currentEscuela ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          direccion: {
            calle: formData['direccion.calle'],
            numero: parseInt(formData['direccion.numero']),
            departamentoId: parseInt(formData.departamentoId)
          },
          seccionId: parseInt(formData.seccionId)
        })
      })

      if (!response.ok) throw new Error('Error al guardar la escuela')

      const updatedEscuela = await response.json()
      
      setEscuelas(prev => 
        currentEscuela
          ? prev.map(e => e.id === updatedEscuela.id ? updatedEscuela : e)
          : [...prev, updatedEscuela]
      )

      if (selectedEscuela && selectedEscuela.id === updatedEscuela.id) {
        setSelectedEscuela(updatedEscuela)
      }

      setIsDialogOpen(false)
      setCurrentEscuela(null)
      setFormData({
        nombre: '',
        'direccion.calle': '',
        'direccion.numero': '',
        departamentoId: '',
        seccionId: '',
      })
    } catch (error) {
      console.error('Error al guardar la escuela:', error)
    }
  }

  const handleEdit = useCallback((escuela: Escuela) => {
    setCurrentEscuela(escuela)
    setFormData({
      nombre: escuela.nombre,
      'direccion.calle': escuela.direccion.calle,
      'direccion.numero': escuela.direccion.numero.toString(),
      departamentoId: escuela.direccion.departamento.id.toString(), 
      seccionId: escuela.seccion?.id?.toString() || '',
    })
    setIsDialogOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta escuela?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${id}`, {
          method: 'DELETE'
        })

        if (!response.ok) throw new Error('Error al eliminar la escuela')

        setEscuelas(prev => prev.filter(e => e.id !== id))
        if (selectedEscuela && selectedEscuela.id === id) {
          setSelectedEscuela(null)
          setIsDetailViewOpen(false)
        }
      } catch (error) {
        console.error('Error al eliminar la escuela:', error)
      }
    }
  }, [selectedEscuela])

  const handleViewDetails = useCallback((escuela: Escuela) => {
    const updatedEscuela = escuelas.find(e => e.id === escuela.id) || escuela;
    setSelectedEscuela(updatedEscuela)
    setIsDetailViewOpen(true)
  }, [escuelas])

  const getAnexosForEscuela = useCallback((escuelaId: number) => {
    return anexos.filter(anexo => anexo?.escuela && anexo.escuela.id === escuelaId)
  }, [anexos])

  const handleAnexoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEscuela) return

    try {
      const url = isEditingAnexo
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${selectedEscuela.id}/edit/editaranexo/${anexoFormData.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${selectedEscuela.id}/edit/agregaranexo`
      const method = isEditingAnexo ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: anexoFormData.nombre,
          matricula: parseInt(anexoFormData.matricula)
        })
      })

      if (!response.ok) throw new Error(`Error al ${isEditingAnexo ? 'editar' : 'agregar'} anexo`)

      const anexosResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/anexos`)
      if (!anexosResponse.ok) throw new Error('Error al obtener anexos actualizados')
      
      const updatedAnexos = await anexosResponse.json()
      setAnexos(updatedAnexos)

      setIsAnexoDialogOpen(false)
      setAnexoFormData({ id: undefined, nombre: '', matricula: '' })
      setIsEditingAnexo(false)
    } catch (error) {
      console.error(`Error al ${isEditingAnexo ? 'editar' : 'agregar'} anexo:`, error)
    }
  }

  const handleEditAnexo = useCallback((anexo: Anexo) => {
    setAnexoFormData({ 
      id: anexo.id, 
      nombre: anexo.nombre, 
      matricula: anexo.matricula.toString() 
    })
    setIsEditingAnexo(true)
    setIsAnexoDialogOpen(true)
  }, [])

  const handleDeleteAnexo = useCallback(async (escuelaId: number, anexoId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este anexo?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${escuelaId}/anexos/${anexoId}`, {
          method: 'DELETE'
        })

        if (!response.ok) throw new Error('Error al eliminar el anexo')

        setAnexos(prev => prev.filter(a => a.id !== anexoId))
      } catch (error) {
        console.error('Error al eliminar el anexo:', error)
      }
    }
  }, [])

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <>
      <div className='bg-gray-100'>
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Escuelas</h1>
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
                placeholder="Nombre de la escuela"
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filtroSeccion">Filtrar por sección</Label>
              <Select onValueChange={setFiltroSeccion} value={filtroSeccion}>
                <SelectTrigger id="filtroSeccion">
                  <SelectValue placeholder="Selecciona una sección" />
                </SelectTrigger>
                <SelectContent className='max-h-60 overflow-y-auto'>
                  <SelectItem value="todas">Todas las secciones</SelectItem>
                  {secciones.map((seccion) => (
                    <SelectItem key={seccion.id} value={seccion.id.toString()}>{seccion.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setCurrentEscuela(null)
                    setFormData({
                      nombre: '',
                      'direccion.calle': '',
                      'direccion.numero': '',
                      departamentoId: '',
                      seccionId: '',
                    })
                  }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar Escuela
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{currentEscuela ? 'Editar' : 'Agregar'} Escuela</DialogTitle>
                    <DialogDescription>
                      Complete los detallesComplete los detalles de la escuela aquí. Haga clic en guardar cuando termine.
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
                        type="number"
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
                      <Label htmlFor="seccionId">Sección</Label>
                      <Select
                        name="seccionId"
                        onValueChange={(value) => handleSelectChange('seccionId', value)}
                        value={formData.seccionId}
                      >
                        <SelectTrigger id="seccionId">
                          <SelectValue placeholder="Selecciona una sección" />
                        </SelectTrigger>
                        <SelectContent>
                          {secciones.map((seccion) => (
                            <SelectItem key={seccion.id} value={seccion.id.toString()}>
                              {seccion.nombre}
                            </SelectItem>
                          ))}
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
            <p className="text-center py-4">Cargando escuelas...</p>
          ) : escuelasFiltradas.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {escuelasFiltradas.map((escuela) => (
                <AccordionItem key={escuela.id} value={String(escuela.id)}>
                  <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between w-full">
                      <span>{escuela.nombre}</span>
                      <span className="text-sm text-gray-500">
                        {escuela.seccion ? `Sección: ${escuela.seccion.nombre}` : 'Sin sección asignada'}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4">
                    <div className="space-y-4">
                      <p><strong>Dirección:</strong> {escuela.direccion.calle} {escuela.direccion.numero}</p>
                      <div>
                        <strong>Anexos:</strong>
                        {getAnexosForEscuela(escuela.id).length > 0 ? (
                          <ul className="list-disc pl-5 mt-2 space-y-1">
                            {getAnexosForEscuela(escuela.id).map((anexo) => (
                              <li key={anexo.id}>
                                {anexo.nombre} - Matrícula: {anexo.matricula}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>Sin anexos.</p>
                        )}
                      </div>
                      <div>
                        <strong>Paquetes de Horas:</strong>
                        {escuela.paquetesHoras.length > 0 ? (
                          <ul className="list-disc pl-5 mt-2 space-y-1">
                            {escuela.paquetesHoras.map((paquete) => (
                              <li key={paquete.id}>
                                {paquete.cantidad} horas - {paquete.profesional.nombre} {paquete.profesional.apellido}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No hay paquetes de horas asignados.</p>
                        )}
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => handleViewDetails(escuela)}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                        </Button>
                        <Button variant="outline" onClick={() => handleEdit(escuela)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </Button>
                        <Button variant="destructive" onClick={() => handleDelete(escuela.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center py-4 bg-white rounded-lg shadow">
              No se encontraron escuelas con los filtros aplicados.
            </p>
          )}
        </div>
      </div>

      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Escuela</DialogTitle>
          </DialogHeader>
          {selectedEscuela && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedEscuela.nombre}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Dirección:</strong> {selectedEscuela.direccion.calle} {selectedEscuela.direccion.numero}</p>
                  <p><strong>Departamento:</strong> {selectedEscuela.direccion.departamento.nombre}</p>
                  <p><strong>Sección:</strong> {selectedEscuela.seccion ? selectedEscuela.seccion.nombre : 'Sin sección asignada'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Anexos</CardTitle>
                </CardHeader>
                <CardContent>
                  {getAnexosForEscuela(selectedEscuela.id).length > 0 ? (
                    <ul className="space-y-2">
                      {getAnexosForEscuela(selectedEscuela.id).map((anexo) => (
                        <li key={anexo.id} className="flex justify-between items-center">
                          <span>{anexo.nombre} - Matrícula: {anexo.matricula}</span>
                          <div>
                            <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditAnexo(anexo)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteAnexo(selectedEscuela.id, anexo.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No hay anexos para esta escuela.</p>
                  )}
                  <Button className="mt-4" onClick={() => {
                    setAnexoFormData({ id: undefined, nombre: '', matricula: '' });
                    setIsEditingAnexo(false);
                    setIsAnexoDialogOpen(true);
                  }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar Anexo
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Paquetes de Horas</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedEscuela.paquetesHoras.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedEscuela.paquetesHoras.map((paquete) => (
                        <li key={paquete.id}>
                          {paquete.cantidad} horas - {paquete.profesional.nombre} {paquete.profesional.apellido}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No hay paquetes de horas asignados a esta escuela.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAnexoDialogOpen} onOpenChange={setIsAnexoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingAnexo ? 'Editar' : 'Agregar'} Anexo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAnexoSubmit} className="space-y-4">
            <div>
              <Label htmlFor="anexoNombre">Nombre del Anexo</Label>
              <Input
                id="anexoNombre"
                value={anexoFormData.nombre}
                onChange={(e) => setAnexoFormData({ ...anexoFormData, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="anexoMatricula">Matrícula</Label>
              <Input
                id="anexoMatricula"
                type="number"
                value={anexoFormData.matricula}
                onChange={(e) => setAnexoFormData({ ...anexoFormData, matricula: e.target.value })}
                required
              />
            </div>
            <Button type="submit">{isEditingAnexo ? 'Actualizar' : 'Guardar'} Anexo</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}