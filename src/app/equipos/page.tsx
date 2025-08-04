'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
import { PlusCircle, Edit, Trash2, X, UserCheck, Building, Eye } from 'lucide-react'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useSession } from 'next-auth/react'
import { useDebounce } from '@/hooks/useDebounce'
import { PermissionButton } from '@/components/PermissionButton'
import { DetalleEquipoDialog } from '@/components/equipo/detalle-equipo-dialog'

interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
}

interface Region {
  id: number;
  nombre: string;
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
    matricula: number;
    Numero: number;
  };
  dias: {
    lunes: string;
    martes: string;
    miercoles: string;
    jueves: string;
    viernes: string;
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
  region?: Region;
}

interface Escuela {
  id: number;
  Numero: number;
  matricula: number;
  nombre: string;
}

export default function ListaEquiposPantallaCompleta() {
  const { data: session } = useSession()
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [busquedaInput, setBusquedaInput] = useState('')
  const busqueda = useDebounce(busquedaInput, 1000)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
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
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10
  const [profesionalesBusqueda, setProfesionalesBusqueda] = useState<Profesional[]>([])
  const [escuelasBusqueda, setEscuelasBusqueda] = useState<Escuela[]>([])
  const profesionalSearchTimeout = useRef<NodeJS.Timeout | null>(null)
  const escuelaSearchTimeout = useRef<NodeJS.Timeout | null>(null)


  const fetchData = useCallback(async () => {
    if (!session?.user?.accessToken) return
    
    setIsLoading(true)
    try {
      const [equiposRes, departamentosRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos?page=${currentPage}&limit=${itemsPerPage}&search=${busqueda}${filtroDepartamento !== 'todos' ? `&departamentoId=${filtroDepartamento}` : ''}`, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`, {
          headers: { Authorization: `Bearer ${session.user.accessToken}`}
        })
      ])
      
      if (!equiposRes.ok || !departamentosRes.ok) 
        throw new Error('Error al obtener los datos')

      const [equiposData, departamentosData] = await Promise.all([
        equiposRes.json(),
        departamentosRes.json()
      ])

      setEquipos(equiposData.data || [])
      setTotalPages(equiposData.meta.totalPages)
      setTotalItems(equiposData.meta.total)
      setDepartamentos(departamentosData)
    } catch (error) {
      console.error('Error al obtener datos:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.accessToken, currentPage, busqueda, filtroDepartamento])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Resetear página cuando cambie la búsqueda
  useEffect(() => {
    setCurrentPage(1)
  }, [busqueda, filtroDepartamento])

  // Buscar profesionales dinámicamente
  useEffect(() => {
    if (!profesionalSearch || !session?.user?.accessToken) {
      setProfesionalesBusqueda([])
      return
    }
    if (profesionalSearchTimeout.current) clearTimeout(profesionalSearchTimeout.current)
    profesionalSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals?page=1&limit=20&search=${encodeURIComponent(profesionalSearch)}`, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` }
        })
        if (res.ok) {
          const data = await res.json()
          // Asegurarse de que los seleccionados estén presentes
          const seleccionados = profesionalesSeleccionados.filter(sel => !data.data.some((p: Profesional) => p.id === sel.id))
          setProfesionalesBusqueda([...seleccionados, ...data.data])
        } else {
          setProfesionalesBusqueda([])
        }
      } catch {
        setProfesionalesBusqueda([])
      }
    }, 400)
    // eslint-disable-next-line
  }, [profesionalSearch, session?.user?.accessToken, profesionalesSeleccionados])

  // Buscar escuelas dinámicamente
  useEffect(() => {
    if (!escuelaSearch || !session?.user?.accessToken) {
      setEscuelasBusqueda([])
      return
    }
    if (escuelaSearchTimeout.current) clearTimeout(escuelaSearchTimeout.current)
    escuelaSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas?page=1&limit=20&search=${encodeURIComponent(escuelaSearch)}`, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` }
        })
        if (res.ok) {
          const data = await res.json()
          // Asegurarse de que los seleccionados estén presentes
          const seleccionadas = escuelasSeleccionadas.filter(sel => !data.data.some((e: Escuela) => e.id === sel.id))
          setEscuelasBusqueda([...seleccionadas, ...data.data])
        } else {
          setEscuelasBusqueda([])
        }
      } catch {
        setEscuelasBusqueda([])
      }
    }, 400)
    // eslint-disable-next-line
  }, [escuelaSearch, session?.user?.accessToken, escuelasSeleccionadas])

  const profesionalesFiltrados = profesionalesBusqueda.filter(
    profesional => !profesionalesSeleccionados.some(p => p.id === profesional.id)
  )
  const escuelasFiltradas = escuelasBusqueda.filter(
    escuela => !escuelasSeleccionadas.some(e => e.id === escuela.id)
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
    if (!session?.user?.accessToken) return

    try {
      const url = currentEquipo
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/${currentEquipo.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`
      const method = currentEquipo ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Error al guardar el equipo')
      }

      setIsDialogOpen(false)
      fetchData()
      resetForm()
    } catch (error) {
      console.error('Error al guardar el equipo:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!session?.user?.accessToken) return

    if (!confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el equipo')
      }

      fetchData()
    } catch (error) {
      console.error('Error al eliminar el equipo:', error)
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

  const handleViewDetails = (equipo: Equipo) => {
    if (!equipo || !equipo.id) {
      console.error("Equipo inválido:", equipo)
      return
    }
    setSelectedEquipo(equipo)
    setIsDetailDialogOpen(true)
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
                value={busquedaInput}
                onChange={(e) => setBusquedaInput(e.target.value)}
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
                  <PermissionButton
                  requiredPermission={{ entity: 'equipo', action: 'create'}}
                    onClick={() => {
                      setCurrentEquipo(null)
                      resetForm()
                      setIsDialogOpen(true)
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar Equipo
                  </PermissionButton>
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
                        <SelectContent className='max-h-60 overflow-y-auto'>
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
                      {profesionalSearch && profesionalesFiltrados.length > 0 && (
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
                      {escuelaSearch && escuelasFiltradas.length > 0 && (
                        <ScrollArea className="h-32 overflow-auto mt-2 border rounded-md">
                          <div className="p-2">
                            {escuelasFiltradas.map((escuela) => (
                              <div
                                key={escuela.id}
                                className="cursor-pointer hover:bg-gray-100 p-2 rounded"
                                onClick={() => handleEscuelaSelect(escuela)}
                              >
                                {escuela.nombre} {escuela.Numero}
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
                           <Badge
                           key={profesional.id}
                           variant="secondary"
                           className="bg-blue-100 text-blue-800 px-3 py-1"
                         >
                           <UserCheck className="h-3 w-3 mr-1" />
                           {profesional.nombre} {profesional.apellido}
                           <Button
                             type="button"
                             variant="ghost"
                             size="sm"
                             className="h-4 w-4 p-0 ml-2 hover:bg-blue-200"
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
                           <Badge
                           key={escuela.id}
                           variant="secondary"
                           className="bg-green-100 text-green-800 px-3 py-1"
                         >
                           <Building className="h-3 w-3 mr-1" />
                           {escuela.nombre} {escuela.Numero}
                           <Button
                             type="button"
                             variant="ghost"
                             size="sm"
                             className="h-4 w-4 p-0 ml-2 hover:bg-green-200"
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
          {isLoading ? (
            <p className="text-center py-4">Cargando equipos...</p>
          ) : equipos.length > 0 ? (
            <>
              <Accordion type="multiple" className="w-full">
                {equipos.map((equipo) => (
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
                                  {escuela.nombre} Nº {escuela.Numero}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>No hay escuelas asignadas</p>
                          )}
                        </div>
                        <p><strong>Horas totales del Equipo:</strong> {equipo.totalHoras || 0}</p>
                        <div className="flex justify-end space-x-2">
                        <PermissionButton
                          requiredPermission={{ entity: 'equipo', action: 'read'}}
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(equipo)}
                          className="hover:bg-green-50 hover:border-green-300 text-green-600"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Ver Detalles
                        </PermissionButton>
                          <PermissionButton
                          requiredPermission={{entity: "equipo", action: "update"}} 
                          variant="outline" 
                          onClick={() => handleEdit(equipo)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </PermissionButton>
                          <PermissionButton 
                          requiredPermission={{entity: "equipo", action: "delete"}}
                          variant="destructive" 
                          onClick={() => handleDelete(equipo.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </PermissionButton>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

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
            <p className="text-center py-4 bg-white rounded-lg shadow">
              No se encontraron equipos con los filtros aplicados.
            </p>
          )}
        </div>
      </div>
      <DetalleEquipoDialog
        equipo={selectedEquipo}
        isOpen={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false)
          setSelectedEquipo(null)
        }}
      />
    </ErrorBoundary>
  )
}
