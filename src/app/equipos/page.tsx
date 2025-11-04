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
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { useSession } from 'next-auth/react'
import { useDebounce } from '@/hooks/useDebounce'
import { PermissionButton } from '@/components/ui/PermissionButton'
import { DetalleEquipoDialog } from '@/components/ui/equipo/detalle-equipo-dialog'
import { Equipo, Profesional, Escuela } from '@/types/equipos'
import { Departamento } from '@/types/Departamento.interface'


export default function ListaEquiposPantallaCompleta() {
  const { data: session } = useSession()
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [busquedaInput, setBusquedaInput] = useState('')
  const [isDetailLoading, setIsDetailLoading] = useState(false)
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
  const [errorMessage, setErrorMessage] = useState('')
  const [profesionalesBusqueda, setProfesionalesBusqueda] = useState<Profesional[]>([])
  const [escuelasBusqueda, setEscuelasBusqueda] = useState<Escuela[]>([])
  const profesionalSearchTimeout = useRef<NodeJS.Timeout | null>(null)
  const escuelaSearchTimeout = useRef<NodeJS.Timeout | null>(null)


  const fetchData = useCallback(async () => {
    if (!session?.user?.accessToken) return
    
    setIsLoading(true)
    try {
      const [equiposRes, departamentosRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/short?page=${currentPage}&limit=${itemsPerPage}&search=${busqueda}${filtroDepartamento !== 'todos' ? `&departamentoId=${filtroDepartamento}` : ''}`, {
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

  const fetchEquipoCompleto = async (equipoId: number): Promise<Equipo | null> => {
    if (!session?.user?.accessToken) return null;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/${equipoId}`, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` }
      });
      
      if (!response.ok) throw new Error('Error al cargar detalles del equipo');
      
      return await response.json();
    } catch (error) {
      console.error('Error al cargar equipo completo:', error);
      return null;
    }
  };

  const handleEdit = (equipo: Equipo) => {
    setCurrentEquipo(equipo)
    setErrorMessage('')
    const departamentoId = equipo.departamento?.id ?? 0
    const profesionales = equipo.profesionales ?? []
    const escuelas = equipo.escuelas ?? []

    setFormData({
      id: equipo.id,
      nombre: equipo.nombre ?? '',
      departamentoId,
      profesionalesIds: profesionales.map(p => p.id),
      escuelasIds: escuelas.map(e => e.id)
    })
    setProfesionalesSeleccionados(profesionales)
    setEscuelasSeleccionadas(escuelas)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.accessToken) return

    setErrorMessage('')

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
      const responseData = await response.json()
      if (!response.ok) {
        if (response.status === 404 && responseData.message?.includes('escuelas ya pertenecen')) {
        throw new Error(responseData.message)
      }
      throw new Error(responseData.message || 'Error al guardar el equipo')
      }

      setIsDialogOpen(false)
      fetchData()
      resetForm()
    } catch (error: any) {
      console.error('Error al guardar el equipo:', error)
      setErrorMessage(error.message || 'Error al guardar el equipo')
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

  const handleViewDetails = async (equipo: Equipo) => {
    if (!equipo || !equipo.id) {
      console.error("Equipo inválido:", equipo);
      return;
    }
    
    // Abrir el dialog inmediatamente
    setIsDetailDialogOpen(true);
    setIsDetailLoading(true); // Activar loading
    setSelectedEquipo(equipo); // Mostrar datos básicos mientras carga
    
    // Cargar los datos completos en segundo plano
    const equipoCompleto = await fetchEquipoCompleto(equipo.id);
    
    if (equipoCompleto) {
      setSelectedEquipo(equipoCompleto);
    }
    
    setIsDetailLoading(false); // Desactivar loading
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <ErrorBoundary>
      <div className='bg-gray-100'>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Equipos</h1>
        </div>
      </header>
      </div>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <Label htmlFor="filtroNombre">Filtrar por nombre</Label>
              <Input
                id="filtroNombre"
                placeholder="Nombre del equipo"
                value={busquedaInput}
                onChange={(e) => setBusquedaInput(e.target.value)}
                className="h-10"
              />
            </div>

            <div>
              <Label htmlFor="filtroDepartamento">Filtrar por departamento</Label>
              <Select onValueChange={setFiltroDepartamento} value={filtroDepartamento}>
                <SelectTrigger id="filtroDepartamento" className="h-10">
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="todos">Todos</SelectItem>
                  {departamentos.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex sm:items-end">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <PermissionButton
                    requiredPermission={{ entity: 'equipo', action: 'create'}}
                    onClick={() => { setCurrentEquipo(null); setErrorMessage(''); resetForm(); setIsDialogOpen(true) }}
                    className="w-full sm:w-auto"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar Equipo
                  </PermissionButton>
                </DialogTrigger>
                <DialogContent className="w-[95vw] h-[90vh] sm:max-w-[1000px] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar' : 'Agregar'} Equipo</DialogTitle>
                    <DialogDescription>
                      Complete los detalles del equipo aquí. Haga clic en guardar cuando termine.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
                      </div>
                      <div>
                        <Label htmlFor="departamento">Departamento</Label>
                        <Select onValueChange={(v) => handleSelectChange('departamentoId', v)} value={formData.departamentoId.toString()}>
                          <SelectTrigger id="departamento"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {departamentos.map((d) => <SelectItem key={d.id} value={d.id.toString()}>{d.nombre}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Buscadores apilados en móvil */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="profesionalSearch">Buscar profesionales</Label>
                        <Input id="profesionalSearch" value={profesionalSearch} onChange={(e)=>setProfesionalSearch(e.target.value)} placeholder="Buscar..." />
                        {profesionalSearch && profesionalesFiltrados.length > 0 && (
                          <ScrollArea className="mt-2 max-h-40 border rounded-md">
                            <div className="p-2">
                              {profesionalesFiltrados.map(p => (
                                <button
                                  type="button"
                                  key={p.id}
                                  className="w-full text-left p-2 rounded hover:bg-gray-100"
                                  onClick={() => handleProfesionalSelect(p)}
                                >
                                  {p.nombre} {p.apellido}
                                </button>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                        <Label className="mt-3 block">Profesionales seleccionados</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {profesionalesSeleccionados.map(p => (
                            <Badge key={p.id} variant="secondary" className="px-3 py-1">
                              <UserCheck className="h-3 w-3 mr-1" />
                              {p.nombre} {p.apellido}
                              <Button type="button" variant="ghost" size="sm" className="h-4 w-4 p-0 ml-2" onClick={() => handleProfesionalRemove(p.id)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="escuelaSearch">Buscar escuelas</Label>
                        <Input id="escuelaSearch" value={escuelaSearch} onChange={(e)=>setEscuelaSearch(e.target.value)} placeholder="Buscar..." />
                        {escuelaSearch && escuelasFiltradas.length > 0 && (
                          <ScrollArea className="mt-2 max-h-40 border rounded-md">
                            <div className="p-2">
                              {escuelasFiltradas.map(e => (
                                <button
                                  type="button"
                                  key={e.id}
                                  className="w-full text-left p-2 rounded hover:bg-gray-100"
                                  onClick={() => handleEscuelaSelect(e)}
                                >
                                  {e.nombre} {e.Numero}
                                </button>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                        <Label className="mt-3 block">Escuelas seleccionadas</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {escuelasSeleccionadas.map(e => (
                            <Badge key={e.id} variant="secondary" className="px-3 py-1">
                              <Building className="h-3 w-3 mr-1" />
                              {e.nombre} {e.Numero}
                              <Button type="button" variant="ghost" size="sm" className="h-4 w-4 p-0 ml-2" onClick={() => handleEscuelaRemove(e.id)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">{errorMessage}</div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <Button type="submit" className="w-full sm:w-auto">Guardar</Button>
                    </div>
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
                    <AccordionTrigger className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
                        <span className="text-sm sm:text-base font-medium">{equipo.nombre}</span>
                        <span className="text-xs sm:text-sm text-gray-500">
                          {equipo.departamento?.nombre ? `Departamento: ${equipo.departamento.nombre}` : 'Sin departamento asignado'}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 sm:px-6 py-4">
                      <div className="space-y-4">
                        <p className="text-sm">
                          <strong>Departamento:</strong> {equipo.departamento?.nombre ?? 'Sin departamento asignado'}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <strong>Profesionales:</strong>
                            {(equipo.profesionales?.length ?? 0) > 0 ? (
                              <ul className="list-disc pl-5 mt-2 space-y-2 text-sm">
                                {(equipo.profesionales ?? []).map((p) => (
                                  <li key={p.id} className="flex items-center gap-2">
                                    <span>{p.nombre} {p.apellido}</span>
                                    {p.licenciaActiva && (
                                      <Badge variant="outline" className="text-[11px] bg-orange-50 text-orange-700 border-orange-200">
                                        En Licencia
                                      </Badge>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : <p className="text-sm text-gray-600 mt-1">No hay profesionales asignados</p>}
                          </div>

                          <div>
                            <strong>Escuelas:</strong>
                            {(equipo.escuelas?.length ?? 0) > 0 ? (
                              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                {(equipo.escuelas ?? []).map((e) => (
                                  <li key={e.id}>{e.nombre} Nº {e.Numero}</li>
                                ))}
                              </ul>
                            ) : <p className="text-sm text-gray-600 mt-1">No hay escuelas asignadas</p>}
                          </div>
                        </div>

                        <p className="text-sm"><strong>Horas totales del Equipo:</strong> {equipo.totalHoras ?? 0}</p>

                        {/* Acciones: apiladas en móvil */}
                        <div className="flex flex-col sm:flex-row justify-end gap-2">
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
                            onClick={() => handleEdit(equipo)}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </PermissionButton>

                          <PermissionButton
                            requiredPermission={{entity: "equipo", action: "delete"}}
                            variant="destructive"
                            onClick={() => handleDelete(equipo.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </PermissionButton>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">Página {currentPage} de {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
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
          setIsDetailLoading(false) // Resetear loading al cerrar
        }}
        isLoading={isDetailLoading}
      />
    </ErrorBoundary>
  )
}
