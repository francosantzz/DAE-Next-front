'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useDebounce } from '@/hooks/useDebounce'
import type { EquipoMuyShortResponseDto } from '@/types/dto/EquipoShort.dto'
import type { Departamento } from '@/types/Departamento.interface'
import type { EscuelaDetallada, PaqueteHorasDetallado } from '@/types/dto/EscuelaDetallada.interface'

/** Tipo “liviano” para la lista (evita el choque onView). */
export type Escuela = {
  id: number
  nombre: string
  Numero?: string
  observaciones?: string
  direccion?: {
    calle?: string
    numero?: string
    departamento?: { id: number; nombre: string }
  }
  equipo?: { id: number; nombre: string } | null
  // opcional para badges/estadísticas rápidas
  paquetesHoras?: PaqueteHorasDetallado[]
  anexos?: { id: number; nombre: string; matricula: number }[]
}

export type EscuelaFormData = {
  nombre: string; CUE?: string | number; Numero?: string; telefono?: string; matricula?: string | number;
  IVE?: string; Ambito?: string;
  'direccion.calle': string; 'direccion.numero': string; departamentoId?: string;
  equipoId?: string; observaciones?: string;
}

const API = process.env.NEXT_PUBLIC_BACKEND_URL

export function useEscuelas() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken

  // estado base
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [equipos, setEquipos] = useState<EquipoMuyShortResponseDto[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // filtros y paginación
  const [busquedaInput, setBusquedaInput] = useState('')
  const busqueda = useDebounce(busquedaInput, 600)
  const [filtroEquipo, setFiltroEquipo] = useState('todos')
  const [filtroSinPaquetes, setFiltroSinPaquetes] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  // diálogos y formularios
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentEscuela, setCurrentEscuela] = useState<EscuelaDetallada | null>(null)
  const [formData, setFormData] = useState<EscuelaFormData>({
    nombre: '', CUE: '', Numero: '', telefono: '', matricula: '',
    IVE: '', Ambito: '', 'direccion.calle': '', 'direccion.numero': '',
    departamentoId: '', equipoId: '', observaciones: ''
  })

  // detalle
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedDetallada, setSelectedDetallada] = useState<EscuelaDetallada | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  // fetch principal
  const fetchData = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
        search: busqueda,
        ...(filtroEquipo !== 'todos' && { equipoId: filtroEquipo }),
        ...(filtroSinPaquetes && { sinPaquetes: 'true' }),
      })
      const [escuelasRes, equiposRes, departamentosRes] = await Promise.all([
        fetch(`${API}/escuelas?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/equipos/muy-short?page=1&limit=200`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/departamentos`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (!escuelasRes.ok || !equiposRes.ok || !departamentosRes.ok) throw new Error('Error al obtener datos')
      const [escuelasData, equiposData, departamentosData] = await Promise.all([
        escuelasRes.json(),
        equiposRes.json(),
        departamentosRes.json(),
      ])

      setEscuelas(escuelasData.data as Escuela[])
      setTotalPages(escuelasData.meta?.totalPages ?? 1)
      setEquipos(equiposData.data || equiposData)
      setDepartamentos(departamentosData)
    } finally {
      setIsLoading(false)
    }
  }, [token, currentPage, busqueda, filtroEquipo, filtroSinPaquetes])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setCurrentPage(1) }, [busqueda, filtroEquipo, filtroSinPaquetes])

  // helpers
  const toFormData = (e: EscuelaDetallada): EscuelaFormData => ({
    nombre: e.nombre ?? '',
    CUE: e.CUE ?? '',
    Numero: e.Numero ?? '',
    telefono: e.telefono ?? '',
    matricula: e.matricula ?? '',
    IVE: e.IVE ?? '',
    Ambito: e.Ambito ?? '',
    'direccion.calle': e.direccion?.calle ?? '',
    'direccion.numero': e.direccion?.numero ?? '',
    departamentoId: e.direccion?.departamento?.id != null ? String(e.direccion.departamento.id) : '',
    equipoId: e.equipo?.id != null ? String(e.equipo.id) : '',
    observaciones: e.observaciones ?? '',
  })

  // acciones de UI (paridad con equipos)
  const openCreateDialog = () => {
    setCurrentEscuela(null)
    setFormData({
      nombre: '', CUE: '', Numero: '', telefono: '', matricula: '',
      IVE: '', Ambito: '', 'direccion.calle': '', 'direccion.numero': '',
      departamentoId: '', equipoId: '', observaciones: ''
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (e: EscuelaDetallada | Escuela) => {
    // Si llega "list", podés tener una ruta /escuelas/:id para traer detalle.
    const mayBeDetallada = e as EscuelaDetallada
    setCurrentEscuela(mayBeDetallada.id ? (mayBeDetallada as any) : null)
    setFormData(toFormData(mayBeDetallada as any))
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!token) return
    if (!confirm('¿Eliminar escuela?')) return
    const res = await fetch(`${API}/escuelas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) setEscuelas(prev => prev.filter(e => e.id !== id))
  }

  const handleViewDetails = async (e: Escuela) => {
    // Estrategia simple: si ya tenés suficiente data, mostrala;
    // si preferís “detallada”, hacé fetch por id aquí.
    setIsDetailLoading(true)
    setIsDetailDialogOpen(true)
    try {
      const res = await fetch(`${API}/escuelas/${e.id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const full = await res.json()
        setSelectedDetallada(full)
      } else {
        // fallback: mostrar lo que ya hay
        setSelectedDetallada(e as unknown as EscuelaDetallada)
      }
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!token) return
    const url = currentEscuela
      ? `${API}/escuelas/${currentEscuela.id}`
      : `${API}/escuelas`
    const method = currentEscuela ? 'PATCH' : 'POST'

    const payload = {
      nombre: formData.nombre || undefined,
      CUE: formData.CUE ? Number(formData.CUE) : undefined,
      Numero: formData.Numero || undefined,
      telefono: formData.telefono || undefined,
      matricula: formData.matricula ? Number(formData.matricula) : undefined,
      IVE: formData.IVE || undefined,
      Ambito: formData.Ambito || undefined,
      direccion: {
        id: currentEscuela?.direccion?.id,
        calle: formData['direccion.calle'] || undefined,
        numero: formData['direccion.numero'] || undefined,
        departamentoId: formData.departamentoId ? Number(formData.departamentoId) : undefined,
      },
      equipoId: formData.equipoId ? Number(formData.equipoId) : undefined,
      observaciones: formData.observaciones || undefined,
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Error al guardar la escuela')
    const updated = await res.json()

    setEscuelas(prev =>
      currentEscuela ? prev.map(e => (e.id === updated.id ? updated : e)) : [updated, ...prev]
    )

    if (selectedDetallada?.id === updated.id) setSelectedDetallada(updated)
    setIsDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setCurrentEscuela(null)
    setFormData({
      nombre: '', CUE: '', Numero: '', telefono: '', matricula: '',
      IVE: '', Ambito: '', 'direccion.calle': '', 'direccion.numero': '',
      departamentoId: '', equipoId: '', observaciones: ''
    })
  }

  // permisos (inyectá tu lógica real)
  const canEdit = () => true
  const canDelete = () => true

  // ===== Observaciones (actualización local) =====
const updateObservacionesLocal = (escuelaId: number, newObs: string) => {
    setEscuelas(prev => prev.map(e => e.id === escuelaId ? { ...e, observaciones: newObs } : e))
    setSelectedDetallada(prev => prev && prev.id === escuelaId ? { ...prev, observaciones: newObs } : prev)
  }
  
  // ===== Anexos (estado del diálogo) =====
  const [isAnexoDialogOpen, setIsAnexoDialogOpen] = useState(false)
  const [isEditingAnexo, setIsEditingAnexo] = useState(false)
  const [anexoFormData, setAnexoFormData] = useState<{ id?: number; nombre: string; matricula: string }>({
    nombre: '', matricula: ''
  })
  const [currentAnexoId, setCurrentAnexoId] = useState<number | null>(null)
  
  // Helpers UI
  const openAddAnexo = () => {
    setIsEditingAnexo(false)
    setCurrentAnexoId(null)
    setAnexoFormData({ nombre: '', matricula: '' })
    setIsAnexoDialogOpen(true)
  }
  
  const openEditAnexo = (anexo: { id: number; nombre: string; matricula: number | string }) => {
    setIsEditingAnexo(true)
    setCurrentAnexoId(anexo.id)
    setAnexoFormData({ id: anexo.id, nombre: anexo.nombre, matricula: String(anexo.matricula ?? '') })
    setIsAnexoDialogOpen(true)
  }
  
  const isEscuelaPayload = (payload: any): payload is { id: number; anexos: any[] } =>
    payload && typeof payload === 'object' && Array.isArray(payload.anexos)
  
  // CREATE
  const createAnexo = async (escuelaId: number, data: { nombre: string; matricula: string }) => {
    if (!token) return
    const res = await fetch(`${API}/escuelas/${escuelaId}/anexos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nombre: data.nombre, matricula: Number(data.matricula) })
    })
    if (!res.ok) throw new Error('No se pudo crear el anexo')
    const payload = await res.json()
  
    if (isEscuelaPayload(payload)) {
      // backend devolvió la ESCUELA
      setSelectedDetallada(prev => prev && prev.id === payload.id ? { ...prev, anexos: payload.anexos } : prev)
      setEscuelas(prev => prev.map(e => e.id === payload.id ? { ...e, anexos: payload.anexos } : e))
    } else {
      // backend devolvió el ANEXO
      const nuevo = payload
      setSelectedDetallada(prev => prev ? { ...prev, anexos: [...(prev.anexos ?? []), nuevo] } : prev)
      setEscuelas(prev => prev.map(e => e.id === escuelaId ? { ...e, anexos: [ ...(e.anexos ?? []), nuevo ] } : e))
    }
  }
  
  // UPDATE
  const updateAnexo = async (escuelaId: number, anexoId: number, data: { nombre: string; matricula: string }) => {
    if (!token) return
    const res = await fetch(`${API}/escuelas/${escuelaId}/anexos/${anexoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nombre: data.nombre, matricula: Number(data.matricula) })
    })
    if (!res.ok) throw new Error('No se pudo actualizar el anexo')
    const payload = await res.json()
  
    if (isEscuelaPayload(payload)) {
      setSelectedDetallada(prev => prev && prev.id === payload.id ? { ...prev, anexos: payload.anexos } : prev)
      setEscuelas(prev => prev.map(e => e.id === payload.id ? { ...e, anexos: payload.anexos } : e))
    } else {
      const updated = payload
      setSelectedDetallada(prev => prev ? {
        ...prev,
        anexos: (prev.anexos ?? []).map(a => a.id === anexoId ? updated : a)
      } : prev)
      setEscuelas(prev => prev.map(e => e.id === escuelaId ? {
        ...e,
        anexos: (e.anexos ?? []).map(a => a.id === anexoId ? updated : a)
      } : e))
    }
  }
  
  // DELETE (por si el backend devuelve escuela completa)
  const deleteAnexo = async (escuelaId: number, anexoId: number) => {
    if (!token) return
    if (!confirm('¿Eliminar anexo?')) return
    const res = await fetch(`${API}/escuelas/${escuelaId}/anexos/${anexoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('No se pudo eliminar el anexo')
    const payload = await res.json().catch(() => null)
  
    if (payload && isEscuelaPayload(payload)) {
      setSelectedDetallada(prev => prev && prev.id === payload.id ? { ...prev, anexos: payload.anexos } : prev)
      setEscuelas(prev => prev.map(e => e.id === payload.id ? { ...e, anexos: payload.anexos } : e))
    } else {
      setSelectedDetallada(prev => prev ? {
        ...prev,
        anexos: (prev.anexos ?? []).filter(a => a.id !== anexoId)
      } : prev)
      setEscuelas(prev => prev.map(e => e.id === escuelaId ? {
        ...e,
        anexos: (e.anexos ?? []).filter(a => a.id !== anexoId)
      } : e))
    }
  }
  
  
  // Submit del diálogo de Anexo
  const submitAnexoDialog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDetallada?.id) return
    const escuelaId = selectedDetallada.id
  
    if (isEditingAnexo && currentAnexoId != null) {
      await updateAnexo(escuelaId, currentAnexoId, anexoFormData)
    } else {
      await createAnexo(escuelaId, anexoFormData)
    }
    setIsAnexoDialogOpen(false)
  }
  

  return {
    // datos
    escuelas, equipos, departamentos,
    isLoading,

    // filtros
    busquedaInput, setBusquedaInput,
    filtroEquipo, setFiltroEquipo,
    filtroSinPaquetes, setFiltroSinPaquetes,

    // paginación
    currentPage, setCurrentPage, totalPages,

    // form/dialog
    isDialogOpen, setIsDialogOpen,
    currentEscuela, formData, setFormData,
    resetForm, openCreateDialog, handleSubmit,
    

    // detalle
    selectedDetallada, isDetailDialogOpen, setIsDetailDialogOpen, isDetailLoading,
    updateObservacionesLocal,

    // Anexos
    isAnexoDialogOpen, setIsAnexoDialogOpen,
    isEditingAnexo, setIsEditingAnexo,
    anexoFormData, setAnexoFormData,
    openAddAnexo, openEditAnexo, submitAnexoDialog, deleteAnexo,

    // acciones
    handleViewDetails, handleEdit, handleDelete,

    // permisos
    canEdit, canDelete,
  }
}
