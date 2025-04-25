'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, Edit, Trash2, X } from 'lucide-react'

interface Escuela {
  id: number;
  nombre: string;
}

interface Equipo {
  id: number;
  nombre: string;
  profesionales: string[];
}

interface Departamento {
  id: number;
  nombre: string;
}

interface Seccion {
  id: number;
  nombre: string;
  equipo: Equipo | null;
  escuelas: Escuela[];
  totalHorasseccion: number;
  departamento: string | null;
}

export default function ListaSecciones() {
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos')
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentSeccion, setCurrentSeccion] = useState<Seccion | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    equipoId: '',
    departamentoId: '',
  })
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [equiposVacios, setEquiposVacios] = useState<Equipo[]>([])
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [escuelaSearch, setEscuelaSearch] = useState('')
  const [escuelasSeleccionadas, setEscuelasSeleccionadas] = useState<Escuela[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [seccionesRes, equiposRes, escuelasRes, departamentosRes, equiposVaciosRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/seccions`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/sin-seccion`),
        ])
        
        if (!seccionesRes.ok || !equiposRes.ok || !escuelasRes.ok || !departamentosRes.ok) 
          throw new Error('Error al obtener los datos')

        const [seccionesData, equiposData, escuelasData, departamentosData, equiposVaciosData] = await Promise.all([
          seccionesRes.json(),
          equiposRes.json(),
          escuelasRes.json(),
          departamentosRes.json(),
          equiposVaciosRes.json(),
        ])

        setSecciones(seccionesData)
        setEquipos(equiposData)
        setEscuelas(escuelasData)
        setDepartamentos(departamentosData)
        setEquiposVacios(equiposVaciosData)
      } catch (error) {
        console.error('Error al obtener datos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])
  
  const seccionesFiltradas = secciones.filter(seccion => 
    seccion.nombre.toLowerCase().includes(filtroNombre.toLowerCase()) &&
    (filtroDepartamento === 'todos' || seccion.departamento === filtroDepartamento)
  )

  const escuelasFiltradas = escuelas.filter(escuela => 
    escuela.nombre.toLowerCase().includes(escuelaSearch.toLowerCase()) &&
    !escuelasSeleccionadas.some(e => e.id === escuela.id)
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleEscuelaSelect = (escuela: Escuela) => {
    setEscuelasSeleccionadas(prev => [...prev, escuela])
    setEscuelaSearch('')
  }

  const handleEscuelaRemove = (escuelaId: number) => {
    setEscuelasSeleccionadas(prev => prev.filter(e => e.id !== escuelaId))
  }

  // Verificar si alguna de las escuelas seleccionadas ya está asignada a otra sección
  const validarEscuelasSeleccionadas = () => {
    const escuelasAsignadas = secciones.flatMap(seccion => seccion.escuelas.map(escuela => escuela.id));
    const escuelasDuplicadas = escuelasSeleccionadas.filter(escuela => escuelasAsignadas.includes(escuela.id));

    if (escuelasDuplicadas.length > 0) {
      const nombresEscuelas = escuelasDuplicadas.map(esc => esc.nombre).join(', ');
      alert(`Las siguientes escuelas ya están asignadas a otra sección: ${nombresEscuelas}`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validación previa para verificar si las escuelas seleccionadas ya están asignadas
  if (!validarEscuelasSeleccionadas()) {
    return; // Evita el envío si hay duplicados
  }

  try {
    const url = currentSeccion
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/seccions/${currentSeccion.id}`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/seccions`;
    const method = currentSeccion ? 'PATCH' : 'POST';

    const dataToSend = {
      nombre: formData.nombre,
      ...(formData.equipoId && { equipoId: parseInt(formData.equipoId) }),
      ...(formData.departamentoId && { departamentoId: parseInt(formData.departamentoId) }),
      escuelasIds: escuelasSeleccionadas.map(e => e.id) // Always send the array, even if empty
    };

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    });

    if (!response.ok) throw new Error('Error al guardar la sección');

    const updatedSeccion = await response.json();

    setSecciones(prev =>
      currentSeccion
        ? prev.map(s => s.id === updatedSeccion.id ? updatedSeccion : s)
        : [...prev, updatedSeccion]
    );

    setIsDialogOpen(false);
    setCurrentSeccion(null);
    setFormData({
      nombre: '',
      equipoId: '',
      departamentoId: '',
    });
    setEscuelasSeleccionadas([]);
  } catch (error) {
    console.error('Error al guardar la sección:', error);
  }
};

  const handleEdit = (seccion: Seccion) => {
  setCurrentSeccion(seccion);

  // Combinar el equipo asignado a la sección actual con los equipos sin sección asignada
  const equiposParaFormulario = seccion.equipo
    ? [...equiposVacios, seccion.equipo] // Incluye el equipo actual asignado en edición
    : equiposVacios;

  setEquipos(equiposParaFormulario);

  setFormData({
    nombre: seccion.nombre,
    equipoId: seccion.equipo?.id?.toString() || '',
    departamentoId: seccion.departamento ? departamentos.find(dep => dep.nombre === seccion.departamento)?.id.toString() || '' : '',
  });
  setEscuelasSeleccionadas(seccion.escuelas || []);
  setIsDialogOpen(true);
};

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta sección?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/seccions/${id}`, {
          method: 'DELETE'
        })

        if (!response.ok) throw new Error('Error al eliminar la sección')

        setSecciones(prev => prev.filter(s => s.id !== id))
      } catch (error) {
        console.error('Error al eliminar la sección:', error)
      }
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <>
      <div className='bg-gray-100'>
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Secciones</h1>
          </div>
        </header>
      </div>

      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="filtroNombre">Filtrar por nombre</Label>
                <Input
                  id="filtroNombre"
                  placeholder="Nombre de la sección"
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
                      <SelectItem key={departamento.id} value={departamento.nombre}>{departamento.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end bg-white">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setCurrentSeccion(null)
                      setFormData({
                        nombre: '',
                        equipoId: '',
                        departamentoId: '',
                      })
                      setEquipos(equiposVacios)
                      setEscuelasSeleccionadas([])
                    }}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Agregar Sección
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{currentSeccion ? 'Editar' : 'Agregar'} Sección</DialogTitle>
                      <DialogDescription>
                        Complete los detalles de la sección aquí. Haga clic en guardar cuando termine.
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
                        <Label htmlFor="equipoId">Equipo</Label>
                        <Select
                          name="equipoId"
                          onValueChange={(value) => handleSelectChange("equipoId", value)}
                          value={formData.equipoId}
                        >
                          <SelectTrigger id="equipoId">
                            <SelectValue placeholder="Selecciona un equipo" />
                          </SelectTrigger>
                          <SelectContent>
                           
                            {equipos.length === 0 ? (
                              <SelectItem value="No hay equipos disponibles" disabled>
                                No hay equipos disponibles
                              </SelectItem>
                            ) : (
                              <>
                                <SelectItem value="null">Sin equipo</SelectItem> {/* Opción para "Sin equipo" */}
                                {equipos.map((equipo) => (
                                  <SelectItem key={equipo.id} value={equipo.id.toString()}>
                                    {equipo.nombre}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
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
                      <Button  type="submit">Guardar</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {isLoading ? (
              <p className="text-center py-4">Cargando secciones...</p>
            ) : seccionesFiltradas.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {seccionesFiltradas.map((seccion) => (
                  <AccordionItem key={seccion.id} value={String(seccion.id)}>
                    <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex justify-between w-full">
                        <span className="font-medium">{seccion.nombre}</span>
                        <span className="text-sm text-gray-500">Departamento: {seccion.departamento}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2">Equipo:</h3>
                          <p>{seccion.equipo?.nombre}</p>
                          <ul className="list-disc pl-5 space-y-1">
                            {seccion.equipo?.profesionales.map((profesional, index) => (
                              <li key={index}>{profesional}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">Escuelas:</h3>
                          <ul className="list-disc pl-5 space-y-1">
                            {seccion.escuelas.map((escuela) => (
                              <li key={escuela.id}>{escuela.nombre}</li>
                            ))}
                          </ul>
                        </div>
                        <p><strong>Horas totales de la sección:</strong> {seccion.totalHorasseccion}</p>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(seccion)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(seccion.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-center py-4">No se encontraron secciones con los filtros aplicados.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}