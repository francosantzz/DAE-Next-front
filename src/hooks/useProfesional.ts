// hooks/useProfesionales.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import type { Departamento } from '@/types/Departamento.interface'
import type { Profesional } from '@/types/Profesional.interface'
import type { Equipo } from '@/types/Equipo.interface'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

export function useProfesional(accessToken?: string) {
  // filtros / búsqueda / paginado
  const [filtroNombre, setFiltroNombre] = useState('')
  const busqueda = useDebounce(filtroNombre, 1000)
  const [filtroEquipo, setFiltroEquipo] = useState<'todos' | string>('todos')
  const [filtroDepartamento, setFiltroDepartamento] = useState<'todos' | string>('todos')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // datos
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])

  // UI states
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // modal / edición
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentProfesional, setCurrentProfesional] = useState<Profesional | null>(null)

  const fetchData = useCallback(async () => {
    if (!accessToken) return
    setIsLoading(true)
    try {
      const qEquipo = filtroEquipo !== 'todos' ? `&equipoId=${filtroEquipo}` : ''
      const qDept = filtroDepartamento !== 'todos' ? `&departamentoId=${filtroDepartamento}` : ''
      const urlProf = `${API}/profesionals?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(busqueda)}${qEquipo}${qDept}`
      const [profRes, eqRes, deptRes] = await Promise.all([
        fetch(urlProf, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API}/equipos/short?page=1&limit=100`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API}/departamentos`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ])

      if (!profRes.ok) throw new Error('Error fetching profesionales')
      const profJson = await profRes.json()
      const eqJson = await eqRes.json()
      const deptJson = await deptRes.json()

      setProfesionales(profJson.data ?? [])
      setTotalPages(profJson.meta?.totalPages ?? 1)
      setTotalItems(profJson.meta?.total ?? 0)
      setEquipos(eqJson.data ?? eqJson)
      setDepartamentos(deptJson ?? [])
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err?.message || 'Error al obtener datos')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, currentPage, busqueda, filtroEquipo, filtroDepartamento])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setCurrentPage(1) }, [busqueda, filtroEquipo, filtroDepartamento])

  // acciones CRUD simplificadas (pueden expandirse)
  const createOrUpdate = async (payload: any, currentId?: number) => {
    if (!accessToken) throw new Error('No token')
    const url = currentId ? `${API}/profesionals/${currentId}` : `${API}/profesionals`
    const method = currentId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Error guardando profesional')
    const saved = await res.json()
    // actualizar localmente
    if (currentId) {
      setProfesionales(prev => prev.map(p => p.id === saved.id ? saved : p))
    } else {
      setProfesionales(prev => [saved, ...prev])
      setTotalItems(t => t + 1)
    }

    // cerrar modal / limpiar current (UX)
    setCurrentProfesional(null)
    setIsDialogOpen(false)

    return saved
  }

  const remove = async (id: number) => {
    if (!accessToken) throw new Error('No token')
    const res = await fetch(`${API}/profesionals/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } })
    if (!res.ok) throw new Error('Error eliminando profesional')
    setProfesionales(prev => prev.filter(p => p.id !== id))
    setTotalItems(t => Math.max(0, t - 1))
  }

  // helper para abrir modal de edición desde cualquier componente
  const handleEdit = (profesional: Profesional) => {
    setCurrentProfesional(profesional)
    setIsDialogOpen(true)
  }

  // Exponer todo al consumidor
  return {
    // data + UI
    profesionales, equipos, departamentos,
    isLoading, errorMessage,
    // filtros y setters
    filtroNombre, setFiltroNombre,
    filtroEquipo, setFiltroEquipo,
    filtroDepartamento, setFiltroDepartamento,
    // paginado
    currentPage, setCurrentPage, itemsPerPage, totalPages, totalItems,
    // acciones
    fetchData, createOrUpdate, remove,
    // modal / edición
    currentProfesional, setCurrentProfesional,
    isDialogOpen, setIsDialogOpen,
    handleEdit,
    // helpers
    setProfesionales, setEquipos, setDepartamentos,
  }
}
