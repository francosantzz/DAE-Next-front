'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { Equipo, Profesional, Escuela } from '@/types/equipos'
import { EquipoDepartamentoDTO } from '@/types/dto/EquipoDepartamento.dto'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

export function useEquipos() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken

  // filtros
  const [busquedaInput, setBusquedaInput] = useState('')
  const busqueda = useDebounce(busquedaInput, 1000)
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos')

  // datos
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [departamentos, setDepartamentos] = useState<EquipoDepartamentoDTO[]>([])

  // paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // carga & errores
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // dialogs (detalle)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null)

  // dialogs (form)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentEquipo, setCurrentEquipo] = useState<Equipo | null>(null)

  // form state (simple, el form lo consume por contexto del hook)
  const [formData, setFormData] = useState({
    id: 0,
    nombre: '',
    departamentoId: 0,
    profesionalesIds: [] as number[],
    escuelasIds: [] as number[],
  })
  const [profesionalesSeleccionados, setProfesionalesSeleccionados] = useState<Profesional[]>([])
  const [escuelasSeleccionadas, setEscuelasSeleccionadas] = useState<Escuela[]>([])

  // búsquedas dinámicas
  const [profesionalSearch, setProfesionalSearch] = useState('')
  const [escuelaSearch, setEscuelaSearch] = useState('')
  const [profesionalesBusqueda, setProfesionalesBusqueda] = useState<Profesional[]>([])
  const [escuelasBusqueda, setEscuelasBusqueda] = useState<Escuela[]>([])
  const profesionalSearchTimeout = useRef<NodeJS.Timeout | null>(null)
  const escuelaSearchTimeout = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(async () => {
    if (!token) { setIsLoading(true); return }
    setIsLoading(true)
    try {
      const qDepto = (filtroDepartamento !== 'todos') ? `&departamentoId=${filtroDepartamento}` : ''
      const urlEquipos = `${API}/equipos/short?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(busqueda)}${qDepto}`
      const urlDeptos = `${API}/departamentos`

      const [equiposRes, departamentosRes] = await Promise.all([
        fetch(urlEquipos, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(urlDeptos, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (!equiposRes.ok || !departamentosRes.ok) throw new Error('Error al obtener los datos')

      const equiposData = await equiposRes.json()
      const departamentosData = await departamentosRes.json()

      setEquipos(equiposData.data || [])
      setTotalPages(equiposData.meta?.totalPages ?? 1)
      setTotalItems(equiposData.meta?.total ?? 0)
      setDepartamentos(departamentosData || [])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [token, currentPage, busqueda, filtroDepartamento])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setCurrentPage(1) }, [busqueda, filtroDepartamento])

  // búsqueda Profesionales
  useEffect(() => {
    if (!profesionalSearch || !token) { setProfesionalesBusqueda([]); return }
    if (profesionalSearchTimeout.current) clearTimeout(profesionalSearchTimeout.current)

    profesionalSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API}/profesionals?page=1&limit=20&search=${encodeURIComponent(profesionalSearch)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (res.ok) {
          const data = await res.json()
          const seleccionados = profesionalesSeleccionados.filter(sel => !data.data.some((p: Profesional) => p.id === sel.id))
          setProfesionalesBusqueda([...seleccionados, ...data.data])
        } else setProfesionalesBusqueda([])
      } catch { setProfesionalesBusqueda([]) }
    }, 400)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profesionalSearch, token, profesionalesSeleccionados])

  // búsqueda Escuelas
  useEffect(() => {
    if (!escuelaSearch || !token) { setEscuelasBusqueda([]); return }
    if (escuelaSearchTimeout.current) clearTimeout(escuelaSearchTimeout.current)

    escuelaSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API}/escuelas?page=1&limit=20&search=${encodeURIComponent(escuelaSearch)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (res.ok) {
          const data = await res.json()
          const seleccionadas = escuelasSeleccionadas.filter(sel => !data.data.some((e: Escuela) => e.id === sel.id))
          setEscuelasBusqueda([...seleccionadas, ...data.data])
        } else setEscuelasBusqueda([])
      } catch { setEscuelasBusqueda([]) }
    }, 400)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escuelaSearch, token, escuelasSeleccionadas])

  const profesionalesFiltrados = useMemo(
    () => profesionalesBusqueda.filter(p => !profesionalesSeleccionados.some(s => s.id === p.id)),
    [profesionalesBusqueda, profesionalesSeleccionados]
  )
  const escuelasFiltradas = useMemo(
    () => escuelasBusqueda.filter(e => !escuelasSeleccionadas.some(s => s.id === e.id)),
    [escuelasBusqueda, escuelasSeleccionadas]
  )

  // helpers form
  const resetForm = () => {
    setFormData({ id: 0, nombre: '', departamentoId: 0, profesionalesIds: [], escuelasIds: [] })
    setProfesionalesSeleccionados([])
    setEscuelasSeleccionadas([])
    setIsEditing(false)
  }
  const openCreateDialog = () => {
    setCurrentEquipo(null)
    setErrorMessage('')
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEdit = (equipo: Equipo) => {
    setCurrentEquipo(equipo)
    setErrorMessage('')
    const departamentoId = equipo.departamento?.id ?? 0
    const ps = equipo.profesionales ?? []
    const es = equipo.escuelas ?? []
    setFormData({
      id: equipo.id,
      nombre: equipo.nombre ?? '',
      departamentoId,
      profesionalesIds: ps.map(p => p.id),
      escuelasIds: es.map(e => e.id),
    })
    setProfesionalesSeleccionados(ps)
    setEscuelasSeleccionadas(es)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!token) return
    if (!confirm('¿Estás seguro de que quieres eliminar este equipo?')) return
    try {
      const response = await fetch(`${API}/equipos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Error al eliminar el equipo')
      fetchData()
    } catch (e) {
      console.error('Error al eliminar el equipo:', e)
    }
  }

  const handleSubmit = async () => {
    if (!token) { setErrorMessage(''); return }
    try {
      const url = currentEquipo ? `${API}/equipos/${currentEquipo.id}` : `${API}/equipos`
      const method = currentEquipo ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
    } catch (e: any) {
      console.error('Error al guardar el equipo:', e)
      setErrorMessage(e?.message || 'Error al guardar el equipo')
    }
  }

  const fetchEquipoCompleto = async (equipoId: number): Promise<Equipo | null> => {
    if (!token) return null
    try {
      const response = await fetch(`${API}/equipos/${equipoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Error al cargar detalles del equipo')
      return await response.json()
    } catch (e) {
      console.error('Error al cargar equipo completo:', e)
      return null
    }
  }

  const handleViewDetails = async (equipo: Equipo) => {
    if (!equipo?.id) return
    setIsDetailDialogOpen(true)
    setIsDetailLoading(true)
    setSelectedEquipo(equipo) // datos básicos
    const full = await fetchEquipoCompleto(equipo.id)
    if (full) setSelectedEquipo(full)
    setIsDetailLoading(false)
  }

  // Exponer todo lo necesario a los componentes
  return {
    // filtros
    busquedaInput, setBusquedaInput,
    filtroDepartamento, setFiltroDepartamento,
    departamentos,

    // datos
    equipos, isLoading,

    // paginación
    currentPage, setCurrentPage, totalPages, totalItems,

    // form/dialog
    isDialogOpen, setIsDialogOpen, isEditing, currentEquipo,
    formData, setFormData,
    profesionalesSeleccionados, setProfesionalesSeleccionados,
    escuelasSeleccionadas, setEscuelasSeleccionadas,
    profesionalSearch, setProfesionalSearch,
    escuelaSearch, setEscuelaSearch,
    profesionalesFiltrados, escuelasFiltradas,
    errorMessage, setErrorMessage,
    openCreateDialog, handleEdit, handleDelete, handleSubmit, resetForm,

    // detalle
    isDetailDialogOpen, setIsDetailDialogOpen, selectedEquipo, isDetailLoading, handleViewDetails,
  }
}
