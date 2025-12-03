// File: src/components/ui/home/useHomeProfessional.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Profesional } from '@/types/Profesional.interface'
import { Departamento } from '@/types/Departamento.interface'
import { Equipo } from '@/types/Equipo.interface'
import { CargoHoras } from '@/types/CargoHoras'

export interface DashboardData {
  totalProfessionals: number
  newProfessionalsThisMonth: number
  totalTasks: number
  newTasksThisWeek: number
  totalTeams: number
  newTeamsThisMonth: number
}

export function useHomeProfessionals(itemsPerPage = 10) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [professionals, setProfessionals] = useState<Profesional[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalProfessionals: 0,
    newProfessionalsThisMonth: 0,
    totalTasks: 0,
    newTasksThisWeek: 0,
    totalTeams: 0,
    newTeamsThisMonth: 0
  })
  const [currentProfesional, setCurrentProfesional] = useState<Profesional | null>(null)
  const [openModal, setOpenModal] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cuil: '',
    profesion: '',
    matricula: '',
    telefono: '',
    direccion: { calle: '', numero: '', departamentoId: '' },
    correoElectronico: '',
    fechaNacimiento: '',
    dni: '',
    fechaVencimientoMatricula: '',
    fechaVencimientoPsicofisico: '',
    equiposIds: [] as number[],
    cargosHoras: [] as CargoHoras[],
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const urlBase = process.env.NEXT_PUBLIC_BACKEND_URL
        const [professionalsRes, equiposRes, departamentosRes] = await Promise.all([
          fetch(`${urlBase}/profesionals?page=${currentPage}&limit=${itemsPerPage}`, { headers: { Authorization: `Bearer ${session?.user?.accessToken}` } }),
          fetch(`${urlBase}/equipos/short?page=1&limit=100`, { headers: { Authorization: `Bearer ${session?.user?.accessToken}` } }),
          fetch(`${urlBase}/departamentos`, { headers: { Authorization: `Bearer ${session?.user?.accessToken}` } })
        ])

        if (!professionalsRes.ok || !equiposRes.ok || !departamentosRes.ok) throw new Error('Failed to fetch')

        const [professionalsData, equiposData, departamentosData] = await Promise.all([
          professionalsRes.json(),
          equiposRes.json(),
          departamentosRes.json()
        ])

        // dashboard calc
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const newProfessionalsThisMonth = (professionalsData.data || professionalsData).filter((p: any) => p.createdAt && new Date(p.createdAt) >= firstDayOfMonth).length
        const equiposArray = equiposData.data || equiposData
        const newTeamsThisMonth = equiposArray.filter((e: any) => e.createdAt && new Date(e.createdAt) >= firstDayOfMonth).length

        setDashboardData({
          totalProfessionals: professionalsData.meta?.total ?? (professionalsData.data?.length ?? professionalsData.length),
          newProfessionalsThisMonth,
          totalTasks: 0,
          newTasksThisWeek: 0,
          totalTeams: equiposArray.length,
          newTeamsThisMonth
        })

        setProfessionals(professionalsData.data || professionalsData)
        setTotalPages(professionalsData.meta?.totalPages ?? 1)
        setTotalItems(professionalsData.meta?.total ?? (professionalsData.data?.length ?? 0))
        setEquipos(equiposArray)
        setDepartamentos(departamentosData.data || departamentosData)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.accessToken) fetchData()
  }, [session?.user?.accessToken, currentPage, itemsPerPage])

  const resetForm = () => setFormData({
    nombre: '', apellido: '', cuil: '', profesion: '', matricula: '', telefono: '',
    direccion: { calle: '', numero: '', departamentoId: '' }, correoElectronico: '', fechaNacimiento: '', dni: '',
    fechaVencimientoMatricula: '', fechaVencimientoPsicofisico: '', equiposIds: [], cargosHoras: []
  })

  const openCreateModal = () => { setCurrentProfesional(null); resetForm(); setOpenModal(true) }
  const openEditModal = (p: Profesional) => {
    setCurrentProfesional(p)
    setFormData({
      nombre: p.nombre || '', apellido: p.apellido || '', cuil: p.cuil || '', profesion: p.profesion || '', matricula: p.matricula || '', telefono: p.telefono || '',
      direccion: { calle: p.direccion?.calle || '', numero: p.direccion?.numero || '', departamentoId: p.direccion?.departamento?.id?.toString() || '' },
      correoElectronico: p.correoElectronico ?? '', fechaNacimiento: p.fechaNacimiento ?? '', dni: p.dni ?? '',
      fechaVencimientoMatricula: p.fechaVencimientoMatricula ?? '', fechaVencimientoPsicofisico: p.fechaVencimientoPsicofisico ?? '',
      equiposIds: p.equipos?.map(e => Number(e.id)) ?? [], cargosHoras: p.cargosHoras ?? []
    })
    setOpenModal(true)
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session?.user?.accessToken}` } })
      if (!res.ok) throw new Error('Error deleting')
      setProfessionals(prev => prev.filter(p => p.id !== id))
      setDashboardData(prev => ({ ...prev, totalProfessionals: prev.totalProfessionals - 1 }))
    } catch (err) { console.error(err); alert('Error al eliminar el profesional') }
  }

  // existing handleSubmit that uses internal formData
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    try {
      const url = currentProfesional ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${currentProfesional.id}` : `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals`
      const method = currentProfesional ? 'PATCH' : 'POST'

      const payload: any = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        profesion: formData.profesion,
        ...(formData.cuil && { cuil: formData.cuil }),
        ...(formData.matricula && { matricula: formData.matricula }),
        ...(formData.telefono && { telefono: formData.telefono }),
        ...(formData.fechaNacimiento && { fechaNacimiento: formData.fechaNacimiento }),
        ...(formData.dni && { dni: formData.dni }),
        ...(formData.fechaVencimientoMatricula && { fechaVencimientoMatricula: formData.fechaVencimientoMatricula }),
        ...(formData.fechaVencimientoPsicofisico && { fechaVencimientoPsicofisico: formData.fechaVencimientoPsicofisico }),
        ...(formData.correoElectronico && { correoElectronico: formData.correoElectronico }),
        equiposIds: formData.equiposIds,
        cargosHoras: formData.cargosHoras,
        ...(formData.direccion.calle && { direccion: {
          calle: formData.direccion.calle,
          numero: formData.direccion.numero,
          departamentoId: formData.direccion.departamentoId ? parseInt(formData.direccion.departamentoId) : undefined
        }})
      }

      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.user?.accessToken}` }, body: JSON.stringify(payload) })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || 'Error al guardar')
      }
      const saved = await response.json()
      setProfessionals(prev => currentProfesional ? prev.map(p => p.id === currentProfesional.id ? saved : p) : [...prev, saved])
      setOpenModal(false)
      setCurrentProfesional(null)
      resetForm()
    } catch (err) {
      console.error(err)
      alert('Error al guardar el profesional: ' + (err as Error).message)
    }
  }

// inside useHomeProfessional.tsx: improved saveProfessional
const saveProfessional = async (payload: any, id?: number) => {
  try {
    const url = id ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}` : `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals`
    const method = id ? 'PATCH' : 'POST'

    // log payload for debugging
    console.debug('saveProfessional payload:', { url, method, payload })

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.user?.accessToken}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      // try parse json error first, else fallback to text
      let serverMessage = ''
      try {
        const data = await response.json()
        serverMessage = JSON.stringify(data)
      } catch (jsonErr) {
        try {
          serverMessage = await response.text()
        } catch (textErr) {
          serverMessage = `Unknown error body (status ${response.status})`
        }
      }
      console.error('saveProfessional server error:', response.status, serverMessage)
      // throw an Error that includes server message
      throw new Error(`Server ${response.status}: ${serverMessage}`)
    }

    const saved = await response.json()
    setProfessionals(prev => id ? prev.map(p => p.id === id ? saved : p) : [...prev, saved])
    setOpenModal(false)
    setCurrentProfesional(null)
    resetForm()
    return saved
  } catch (err) {
    console.error('saveProfessional error', err)
    throw err
  }
}


  return {
    // estados y acciones principales
    isLoading, professionals, equipos, departamentos, dashboardData,
    currentProfesional, openModal, formData, setFormData,
    openCreateModal, openEditModal, setOpenModal, handleDelete, handleSubmit,
    currentPage, setCurrentPage, totalPages, totalItems,
    // nuevo export (útil para que otros componentes pidan cambiar el profesional seleccionado o actualizar listas)
    saveProfessional,
    // exposiciones adicionales para permitir manipulación desde Home u otros adapters
    setCurrentProfesional,
    setProfessionals,
    setDepartamentos,
    setIsLoading
  }
}
