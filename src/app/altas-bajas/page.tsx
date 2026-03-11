// app/.../altas-bajas/page.tsx

"use client"

import { useState, useEffect, useCallback } from "react"
import type { FormEvent } from "react"
import { Button } from "@/components/ui/genericos/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/genericos/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/genericos/tabs"
import { Input } from "@/components/ui/genericos/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/genericos/select"
import { Paginator } from "@/components/ui/genericos/Paginator"
import { RefreshCwIcon, TrendingUpIcon, UserPlusIcon, UserMinusIcon } from "lucide-react"

import type { MovimientoEstado, MovimientoProfesional, MovimientosResponse, TipoMovimiento } from "@/types/MovimientoProfesional.interface"
import { StatsCardsAltasBajas } from "@/components/ui/altas-bajas/StatsCardsAltasBajas"
import { AltasTable } from "@/components/ui/altas-bajas/AltasTable"
import { BajasTable } from "@/components/ui/altas-bajas/BajasTable"

const normalizeEstado = (
  estado: MovimientoEstado | "procesado" | null | undefined,
  registrado?: boolean,
): MovimientoEstado => {
  if (estado === "procesado") return "confirmado"
  if (estado) return estado
  return registrado ? "confirmado" : "pendiente"
}

const normalizeMovimiento = (m: MovimientoProfesional): MovimientoProfesional => {
  const registrado = m.registrado ?? false
  const estado = normalizeEstado(m.estado as MovimientoEstado | "procesado" | null | undefined, registrado)
  return {
    ...m,
    registrado,
    estado,
  }
}

export default function ListaAltasBajasPage() {
  const apiBase = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/api\/v1\/?$/, "")
  const currentYearDefault = new Date().getFullYear()

  const initialState: MovimientosResponse = {
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  }

  const [isLoading, setIsLoading] = useState(false)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"altas" | "bajas">("altas")
  const [currentYear, setCurrentYear] = useState(currentYearDefault)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState<"todos" | MovimientoEstado>("todos")
  const [altasState, setAltasState] = useState<MovimientosResponse>(initialState)
  const [bajasState, setBajasState] = useState<MovimientosResponse>(initialState)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [updatingSeccionIds, setUpdatingSeccionIds] = useState<Set<string>>(new Set())

  const altas = altasState.items
  const bajas = bajasState.items
  const activeTipo: TipoMovimiento = activeTab === "altas" ? "alta" : "baja"
  const yearOptions = Array.from({ length: 5 }, (_, index) => currentYearDefault - index)

  const setStateForTipo = useCallback((tipo: TipoMovimiento, data: MovimientosResponse) => {
    const normalized: MovimientosResponse = {
      ...data,
      items: data.items.map(normalizeMovimiento),
    }
    if (tipo === "alta") {
      setAltasState(normalized)
    } else {
      setBajasState(normalized)
    }
  }, [setAltasState, setBajasState])

  const fetchMovimientos = useCallback(
    async (tipo: TipoMovimiento, page: number, limit: number) => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") /* o "accessToken" */ : null

      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(limit))
      params.set("tipo", tipo)
      const trimmedSearch = search.trim()
      if (trimmedSearch) params.set("search", trimmedSearch)
      if (estadoFiltro !== "todos") params.set("estado", estadoFiltro)

      const url = `${apiBase}/api/v1/altas-bajas/anio/${currentYear}?${params.toString()}`

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        console.error("Error al traer registros", res.status, text)
        const error = new Error(`Error al traer registros (status ${res.status})`)
        ;(error as any).status = res.status
        throw error
      }

      const data = (await res.json()) as MovimientosResponse
      return data
    },
    [search, estadoFiltro, currentYear, apiBase],
  )

  const loadMovimientos = useCallback(
    async (tipo: TipoMovimiento, page: number, limit: number) => {
      try {
        setIsLoading(true)
        setErrorMsg(null)

        const data = await fetchMovimientos(tipo, page, limit)
        setStateForTipo(tipo, data)
        setUltimaActualizacion(new Date())
      } catch (err) {
        const status = (err as any)?.status
        if (status === 401) {
          setErrorMsg("No autorizado. Revisá el token (sesión expirada o no logueado).")
        } else {
          setErrorMsg("Error al traer registros.")
        }
      } finally {
        setIsLoading(false)
      }
    },
    [fetchMovimientos, setStateForTipo],
  )

  useEffect(() => {
    const state = activeTab === "altas" ? altasState : bajasState
    loadMovimientos(activeTipo, state.page, state.limit)
  }, [
    activeTab,
    activeTipo,
    altasState.page,
    altasState.limit,
    bajasState.page,
    bajasState.limit,
    search,
    estadoFiltro,
    currentYear,
    loadMovimientos,
  ])

  const handleTraerRegistros = async () => {
    const state = activeTab === "altas" ? altasState : bajasState
    await loadMovimientos(activeTipo, state.page, state.limit)
  }

  const updateMovimientoLocal = (updated: MovimientoProfesional) => {
    const applyUpdate = (state: MovimientosResponse): MovimientosResponse => ({
      ...state,
      items: state.items.map((m) =>
        m.id === updated.id && m.tipo === updated.tipo
          ? { ...m, ...updated, registrado: updated.registrado ?? m.registrado }
          : m,
      ),
    })
    setAltasState((prev) => applyUpdate(prev))
    setBajasState((prev) => applyUpdate(prev))
  }

  const handleEstadoChange = async (mov: MovimientoProfesional, nuevoEstado: MovimientoEstado) => {
    const key = `${mov.tipo}-${mov.id}`
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const prevEstado = normalizeEstado(
      mov.estado as MovimientoEstado | "procesado" | null | undefined,
      mov.registrado,
    )

    setUpdatingIds((prev) => {
      const next = new Set(prev)
      next.add(key)
      return next
    })

    updateMovimientoLocal({ ...mov, estado: nuevoEstado })

    try {
      const res = await fetch(
        `${apiBase}/api/v1/altas-bajas/${mov.tipo}/${mov.id}/estado`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        },
      )

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        console.error("Error al actualizar estado", res.status, text)
        throw new Error(`Error al actualizar estado (status ${res.status})`)
      }

      const updated = (await res.json()) as MovimientoProfesional
      updateMovimientoLocal(normalizeMovimiento({ ...updated, estado: updated.estado ?? nuevoEstado }))
    } catch (e) {
      updateMovimientoLocal({ ...mov, estado: prevEstado })
      setErrorMsg("Error al actualizar estado.")
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const isUpdating = (mov: MovimientoProfesional) => updatingIds.has(`${mov.tipo}-${mov.id}`)
  const isSavingSeccion = (mov: MovimientoProfesional) => updatingSeccionIds.has(`${mov.tipo}-${mov.id}`)

  const handleSeccionSave = async (mov: MovimientoProfesional, seccion: string | null) => {
    const key = `${mov.tipo}-${mov.id}`
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const prevSeccion = mov.seccion ?? null

    setUpdatingSeccionIds((prev) => {
      const next = new Set(prev)
      next.add(key)
      return next
    })

    updateMovimientoLocal({ ...mov, seccion })

    try {
      const res = await fetch(
        `${apiBase}/api/v1/altas-bajas/${mov.tipo}/${mov.id}/seccion`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ seccion }),
        },
      )

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        console.error("Error al actualizar secciÃ³n", res.status, text)
        throw new Error(`Error al actualizar secciÃ³n (status ${res.status})`)
      }

      const updated = (await res.json()) as MovimientoProfesional
      updateMovimientoLocal(normalizeMovimiento({ ...updated, seccion: updated.seccion ?? seccion }))
    } catch (e) {
      updateMovimientoLocal({ ...mov, seccion: prevSeccion })
      setErrorMsg("Error al actualizar secciÃ³n.")
    } finally {
      setUpdatingSeccionIds((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const next = searchInput.trim()
    setAltasState((prev) => ({ ...prev, page: 1 }))
    setBajasState((prev) => ({ ...prev, page: 1 }))
    setSearch(next)
  }

  const handleEstadoFiltroChange = (value: string) => {
    setAltasState((prev) => ({ ...prev, page: 1 }))
    setBajasState((prev) => ({ ...prev, page: 1 }))
    setEstadoFiltro(value as "todos" | MovimientoEstado)
  }

  const handleYearChange = (value: string) => {
    const nextYear = Number(value)
    setCurrentYear(nextYear)
    setAltasState((prev) => ({ ...prev, page: 1 }))
    setBajasState((prev) => ({ ...prev, page: 1 }))
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-background">
      <main className="flex-1 p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {activeTab === "altas"
                  ? `Altas de profesionales - Año ${currentYear}`
                  : `Bajas de profesionales - Año ${currentYear}`}
              </h1>
              <p className="text-blue-100">Sincronización con sistema de horas (gestor_horas2)</p>
            </div>
            <TrendingUpIcon className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        {/* Botón / buscador / filtros / último update / error */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:flex-wrap">
            <Button
              onClick={handleTraerRegistros}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <RefreshCwIcon className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Sincronizando..." : "Traer Registros"}
            </Button>

            <form onSubmit={handleSearchSubmit} className="w-full md:w-auto">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por DNI, nombre, apellido, profesión o CUIL"
                className="md:w-[320px]"
              />
            </form>

            <Select value={estadoFiltro} onValueChange={handleEstadoFiltroChange}>
              <SelectTrigger className="h-10 w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="cargado">Cargado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={String(currentYear)} onValueChange={handleYearChange}>
              <SelectTrigger className="h-10 w-[140px]">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1">
            {ultimaActualizacion && (
              <p className="text-sm text-muted-foreground">
                Última actualización: {ultimaActualizacion.toLocaleString()}
              </p>
            )}
            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          </div>
        </div>

        {/* Stats */}
        <StatsCardsAltasBajas altas={altas} bajas={bajas} />

        {/* Tabs Altas/Bajas */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5 text-blue-600" />
              Movimientos recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "altas" | "bajas")}
              className="w-full"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="altas" className="flex items-center gap-2">
                  <UserPlusIcon className="h-4 w-4 text-green-600" />
                  Altas
                </TabsTrigger>
                <TabsTrigger value="bajas" className="flex items-center gap-2">
                  <UserMinusIcon className="h-4 w-4 text-red-600" />
                  Bajas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="altas">
                <AltasTable
                  altas={altas}
                  onEstadoChange={handleEstadoChange}
                  isUpdating={isUpdating}
                  onSeccionSave={handleSeccionSave}
                  isSavingSeccion={isSavingSeccion}
                />
                <div className="mt-4">
                  <Paginator
                    page={altasState.page}
                    totalItems={altasState.total}
                    pageSize={altasState.limit}
                    totalPages={altasState.totalPages}
                    onPageChange={(page) => setAltasState((prev) => ({ ...prev, page }))}
                    onPageSizeChange={(size) => setAltasState((prev) => ({ ...prev, limit: size, page: 1 }))}
                    disabled={isLoading}
                  />
                </div>
              </TabsContent>

              <TabsContent value="bajas">
                <BajasTable
                  bajas={bajas}
                  onEstadoChange={handleEstadoChange}
                  isUpdating={isUpdating}
                  onSeccionSave={handleSeccionSave}
                  isSavingSeccion={isSavingSeccion}
                />
                <div className="mt-4">
                  <Paginator
                    page={bajasState.page}
                    totalItems={bajasState.total}
                    pageSize={bajasState.limit}
                    totalPages={bajasState.totalPages}
                    onPageChange={(page) => setBajasState((prev) => ({ ...prev, page }))}
                    onPageSizeChange={(size) => setBajasState((prev) => ({ ...prev, limit: size, page: 1 }))}
                    disabled={isLoading}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
