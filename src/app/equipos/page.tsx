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
import EquipoForm from '@/components/ui/equipo/formulario-equipo'
import EquipoActions from '@/components/ui/equipo/EquipoActions'


export default function ListaEquiposPantallaCompleta() {
  const { data: session } = useSession()
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [busquedaInput, setBusquedaInput] = useState('')
  const busqueda = useDebounce(busquedaInput, 1000)
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos')
  const [isLoading, setIsLoading] = useState(true)

  // dialog crear/editar
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentEquipo, setCurrentEquipo] = useState<Equipo | null>(null)

  // dialog detalle
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  // paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  const token = session?.user?.accessToken || ''

  const fetchData = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const [equiposRes, departamentosRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/short?page=${currentPage}&limit=${itemsPerPage}&search=${busqueda}${filtroDepartamento !== 'todos' ? `&departamentoId=${filtroDepartamento}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (!equiposRes.ok || !departamentosRes.ok) throw new Error('Error al obtener los datos')

      const [equiposData, departamentosData] = await Promise.all([equiposRes.json(), departamentosRes.json()])
      setEquipos(equiposData.data || [])
      setTotalPages(equiposData.meta.totalPages)
      setTotalItems(equiposData.meta.total)
      setDepartamentos(departamentosData)
    } catch (e) {
      console.error('Error al obtener datos:', e)
    } finally {
      setIsLoading(false)
    }
  }, [token, currentPage, busqueda, filtroDepartamento])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setCurrentPage(1) }, [busqueda, filtroDepartamento])

  const fetchEquipoCompleto = async (equipoId: number): Promise<Equipo | null> => {
    if (!token) return null
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/${equipoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Error al cargar detalles del equipo')
      return await response.json()
    } catch (error) {
      console.error('Error al cargar equipo completo:', error)
      return null
    }
  }

  const handleDelete = async (id: number) => {
    if (!token) return
    if (!confirm('¿Estás seguro de que quieres eliminar este equipo?')) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Error al eliminar el equipo')
      fetchData()
    } catch (error) {
      console.error('Error al eliminar el equipo:', error)
    }
  }

  const handleEdit = async (equipo: Equipo) => {
    setCurrentEquipo(equipo)
    setIsDialogOpen(true)
  }

  const handleViewDetails = async (equipo: Equipo) => {
    if (!equipo?.id) return
    setIsDetailDialogOpen(true)
    setIsDetailLoading(true)
    setSelectedEquipo(equipo)
    const full = await fetchEquipoCompleto(equipo.id)
    if (full) setSelectedEquipo(full)
    setIsDetailLoading(false)
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
                    onClick={() => { setCurrentEquipo(null); setIsDialogOpen(true) }}
                    className="w-full sm:w-auto"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar Equipo
                  </PermissionButton>
                </DialogTrigger>

                <DialogContent className="w-[95vw] h-[90vh] sm:max-w-[1000px] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{currentEquipo ? 'Editar' : 'Agregar'} Equipo</DialogTitle>
                    <DialogDescription>Complete los detalles del equipo y guarde.</DialogDescription>
                  </DialogHeader>

                  {/* —— AQUÍ USAMOS EL FORM REUTILIZABLE —— */}
                  {session?.user?.accessToken && (
                    <EquipoForm
                      accessToken={session.user.accessToken}
                      departamentos={departamentos}
                      equipo={currentEquipo}
                      onSaved={() => {
                        setIsDialogOpen(false)
                        setCurrentEquipo(null)
                        fetchData()
                      }}
                      onCancel={() => {
                        setIsDialogOpen(false)
                        setCurrentEquipo(null)
                      }}
                    />
                  )}
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
                        <EquipoActions
                          equipo={equipo}
                          compact
                          onView={handleViewDetails}
                          onEdit={handleEdit}
                          onDelete={async (id) => {
                          await handleDelete(id)
                          }}
                          />
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
