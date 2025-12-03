// hooks/useEscuelasSinPaquetes.ts
"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useSession } from "next-auth/react"
import { useDebounce } from "@/hooks/useDebounce"
import type { Departamento } from "@/types/Departamento.interface"
import type { Region } from "@/types/Region.interface"
import type { EscuelaSinPaqueteDTO } from "@/types/dto/EscuelaSinPaquetes.dto"
import type { EquipoEscuelaSinPaqueteDTO } from "@/types/dto/EquipoEscuelaSinPaquete.dto"

/* ========= Tipos ========= */

// extendemos el DTO para incluir lo que viene de /escuelas/short (cubierta)
export type EscuelaConCubierta = EscuelaSinPaqueteDTO & {
  cubierta: boolean
}

export type GrupoEquipo = {
  equipoId: number | null
  equipoNombre: string
  observaciones?: string
  escuelas: EscuelaConCubierta[]
}

export type GrupoDepartamento = {
  departamentoNombre: string
  colorClass: string
  grupos: GrupoEquipo[]
  total: number
}

export type EquipoMetric = {
  equipoId: number
  promedio: number
  horasEnEscuelas: number
  escuelasCount: number
  loaded: boolean
  error?: boolean
}

/* ========= Helpers de color ========= */

const DEPT_COLORS = [
  "bg-blue-100 text-blue-900 border-blue-300",
  "bg-emerald-100 text-emerald-900 border-emerald-300",
  "bg-violet-100 text-violet-900 border-violet-300",
  "bg-amber-100 text-amber-900 border-amber-300",
  "bg-rose-100 text-rose-900 border-rose-300",
  "bg-sky-100 text-sky-900 border-sky-300",
  "bg-teal-100 text-teal-900 border-teal-300",
  "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300",
]

export function colorForDepartamento(nombre: string) {
  let h = 0
  for (let i = 0; i < nombre.length; i++) {
    h = (h * 31 + nombre.charCodeAt(i)) & 0xffffffff
  }
  const idx = Math.abs(h) % DEPT_COLORS.length
  return DEPT_COLORS[idx]
}

const TEAM_ACCENTS = [
  "border-blue-300",
  "border-emerald-300",
  "border-violet-300",
  "border-amber-300",
  "border-rose-300",
  "border-sky-300",
  "border-teal-300",
  "border-fuchsia-300",
]

export function borderForEquipo(nombre: string) {
  let h = 0
  for (let i = 0; i < nombre.length; i++) {
    h = (h * 29 + nombre.charCodeAt(i)) & 0xffffffff
  }
  const idx = Math.abs(h) % TEAM_ACCENTS.length
  return TEAM_ACCENTS[idx]
}

/* ========= Hook principal ========= */

export function useEscuelasSinPaquetes() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken

  const [isLoading, setIsLoading] = useState(true)
  const [escuelas, setEscuelas] = useState<EscuelaConCubierta[]>([])

  const [equipos, setEquipos] = useState<EquipoEscuelaSinPaqueteDTO[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [regiones, setRegiones] = useState<Region[]>([])

  // filtros
  const [searchInput, setSearchInput] = useState("")
  const search = useDebounce(searchInput, 500)
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>("todos")
  const [filtroEquipo, setFiltroEquipo] = useState<string>("todos")
  const [filtroRegion, setFiltroRegion] = useState<string>("todas")
  const [soloSinPaquetes, setSoloSinPaquetes] = useState<boolean>(true)
  const [soloEquiposBajo4, setSoloEquiposBajo4] = useState<boolean>(false)
  const [calcularPromedios, setCalcularPromedios] = useState<boolean>(false)

  // paginación
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(150)
  const [totalItems, setTotalItems] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number | null>(null)

  // métricas
  const [equipoMetrics, setEquipoMetrics] = useState<Record<number, EquipoMetric>>(
    {},
  )
  const fetchedEquipoIdsRef = useRef<Set<number>>(new Set())

  // observaciones por equipo
  const [obsByEquipo, setObsByEquipo] = useState<Record<string, string>>({})
  const [savingEquipo, setSavingEquipo] = useState<Record<string, boolean>>({})
  const [savedEquipoOk, setSavedEquipoOk] = useState<
    Record<string, "ok" | "err" | undefined>
  >({})

  // detalle dpto
  const [deptDetalleAbierto, setDeptDetalleAbierto] = useState(false)
  const [deptDetalle, setDeptDetalle] =
    useState<GrupoDepartamento | null>(null)

  /* ========= Catálogos: equipos / departamentos / regiones ========= */

  const fetchCatalogos = useCallback(async () => {
    if (!token) return

    try {
      const headers = { Authorization: `Bearer ${token}` }

      const [equiposRes, departamentosRes, regionesRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/muy-short?page=1&limit=200`,
          { headers },
        ),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`, {
          headers,
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/regions`, {
          headers,
        }),
      ])

      if (!equiposRes.ok) {
        console.error("Error equipos muy-short", equiposRes.status)
      } else {
        const equiposJson = await equiposRes.json()
        const nextEquipos =
          (equiposJson.data as EquipoEscuelaSinPaqueteDTO[]) ??
          (equiposJson as EquipoEscuelaSinPaqueteDTO[])
        setEquipos(nextEquipos)

        const nextObs: Record<string, string> = {}
        for (const eq of nextEquipos) {
          if (eq?.observaciones != null) {
            nextObs[String(eq.id)] = eq.observaciones
          }
        }
        setObsByEquipo((prev) => ({ ...nextObs, ...prev }))
      }

      if (!departamentosRes.ok) {
        console.error("Error departamentos", departamentosRes.status)
      } else {
        const depJson = await departamentosRes.json()
        const nextDeps =
          (depJson.data as Departamento[]) ?? (depJson as Departamento[])
        setDepartamentos(nextDeps)
      }

      if (!regionesRes.ok) {
        console.error("Error regions", regionesRes.status)
      } else {
        const regJson = await regionesRes.json()
        const nextRegs =
          (regJson.data as Region[]) ?? (regJson as Region[])
        setRegiones(nextRegs)
      }
    } catch (e) {
      console.error("Error catálogos /equipos.muy-short /departamentos /regions:", e)
    }
  }, [token])

  useEffect(() => {
    fetchCatalogos()
  }, [fetchCatalogos])

  /* ========= Fetch principal: /escuelas/short ========= */

  const fetchEscuelas = useCallback(async () => {
    if (!token) return
    setIsLoading(true)

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search ? { search } : {}),
        ...(soloSinPaquetes ? { sinPaquetes: "true" } : {}),
        ...(filtroDepartamento !== "todos"
          ? { departamentoId: filtroDepartamento }
          : {}),
        ...(filtroEquipo !== "todos" ? { equipoId: filtroEquipo } : {}),
        ...(filtroRegion !== "todas" ? { regionId: filtroRegion } : {}),
      })

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/short?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (!res.ok) {
        console.error("Error al obtener escuelas/short", res.status)
        setEscuelas([])
        setTotalItems(0)
        setTotalPages(1)
        return
      }

      const json = await res.json()
      const data = (Array.isArray(json)
        ? json
        : json.data || json) as EscuelaConCubierta[]

      setEscuelas(data || [])

      if (!Array.isArray(json) && json?.meta) {
        const total = json.meta.total ?? data.length
        const totalP = json.meta.totalPages ?? Math.ceil(total / limit)
        setTotalItems(total)
        setTotalPages(totalP)
      } else {
        const total = data.length
        setTotalItems(total)
        setTotalPages(Math.max(1, Math.ceil(total / limit)))
      }

      // observaciones equipo desde payload (si vienen)
      const nextObs: Record<string, string> = {}
      for (const e of data) {
        const key = String(e.equipo?.id ?? "null")
        if (e.equipo?.observaciones != null && nextObs[key] == null) {
          nextObs[key] = e.equipo.observaciones
        }
      }
      setObsByEquipo((prev) => ({ ...nextObs, ...prev }))
    } catch (e) {
      console.error("Error fetchEscuelas /escuelas/short:", e)
    } finally {
      setIsLoading(false)
    }
  }, [
    token,
    page,
    limit,
    search,
    filtroDepartamento,
    filtroEquipo,
    filtroRegion,
    soloSinPaquetes,
  ])

  useEffect(() => {
    fetchEscuelas()
  }, [fetchEscuelas])

  // reset page en cambios de filtros
  useEffect(() => {
    setPage(1)
  }, [search, limit, filtroDepartamento, filtroEquipo, filtroRegion, soloSinPaquetes])

  /* ========= Batch métricas por equipo ========= */

  const fetchPromediosBatch = useCallback(
    async (ids: number[]) => {
      if (!token) return
      if (!ids.length) return

      try {
        const headers = { Authorization: `Bearer ${token}` }

        const CHUNK = 80
        const chunks: number[][] = []
        for (let i = 0; i < ids.length; i += CHUNK) {
          chunks.push(ids.slice(i, i + CHUNK))
        }

        const promises = chunks.map(async (chunk) => {
          const qs = encodeURIComponent(chunk.join(","))
          const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/metrics/escuelas-promedio?ids=${qs}`
          const res = await fetch(url, { headers })
          if (!res.ok) {
            console.error("Error metrics equipos", res.status)
            return
          }
          const json = (await res.json()) as Array<{
            equipoId: number
            nombre: string
            departamento: { id: number; nombre: string } | null
            escuelasCount: number
            horasEnEscuelas: number
            promedio: number
          }>

          const map = new Map<number, (typeof json)[number]>()
          json.forEach((r) => map.set(r.equipoId, r))

          const updates: Record<number, EquipoMetric> = {}
          for (const id of chunk) {
            const r = map.get(id)
            if (r) {
              updates[id] = {
                equipoId: r.equipoId,
                promedio: r.promedio ?? 0,
                horasEnEscuelas: r.horasEnEscuelas ?? 0,
                escuelasCount: r.escuelasCount ?? 0,
                loaded: true,
              }
            } else {
              updates[id] = {
                equipoId: id,
                promedio: 0,
                horasEnEscuelas: 0,
                escuelasCount: 0,
                loaded: true,
                error: true,
              }
            }
          }
          setEquipoMetrics((prev) => ({ ...prev, ...updates }))
        })

        await Promise.all(promises)
      } catch (e) {
        console.error("Error metrics batch:", e)
        setEquipoMetrics((prev) => {
          const next = { ...prev }
          ids.forEach((id) => {
            next[id] =
              next[id] ??
              ({
                equipoId: id,
                promedio: 0,
                horasEnEscuelas: 0,
                escuelasCount: 0,
                loaded: true,
                error: true,
              } as EquipoMetric)
          })
          return next
        })
      }
    },
    [token],
  )

  /* ========= Agrupar por dpto/equipo ========= */

  const grupos = useMemo<GrupoDepartamento[]>(() => {
    const sorted = [...escuelas].sort((a, b) => {
      const depA = a.direccion?.departamento?.nombre || ""
      const depB = b.direccion?.departamento?.nombre || ""
      if (depA !== depB) return depA.localeCompare(depB, "es")
      const eqA = a.equipo?.nombre || ""
      const eqB = b.equipo?.nombre || ""
      if (eqA !== eqB) return eqA.localeCompare(eqB, "es")
      return (a.nombre || "").localeCompare(b.nombre || "", "es")
    })

    const byDept = new Map<string, GrupoDepartamento>()
    for (const e of sorted) {
      const depNom = e.direccion?.departamento?.nombre || "Sin departamento"
      if (!byDept.has(depNom)) {
        byDept.set(depNom, {
          departamentoNombre: depNom,
          colorClass: colorForDepartamento(depNom),
          grupos: [],
          total: 0,
        })
      }
      const dep = byDept.get(depNom)!
      dep.total++

      const eqId = e.equipo?.id ?? null
      const eqNom = e.equipo?.nombre ?? "Sin equipo"
      let grupoEq = dep.grupos.find((g) => g.equipoId === eqId)
      if (!grupoEq) {
        const key = String(eqId ?? "null")
        grupoEq = {
          equipoId: eqId,
          equipoNombre: eqNom,
          observaciones: obsByEquipo[key],
          escuelas: [],
        }
        dep.grupos.push(grupoEq)
      }
      grupoEq.escuelas.push(e)
    }

    for (const dep of byDept.values()) {
      for (const g of dep.grupos) {
        const key = String(g.equipoId ?? "null")
        if (obsByEquipo[key] != null) g.observaciones = obsByEquipo[key]
      }
      dep.grupos.sort((a, b) =>
        a.equipoNombre.localeCompare(b.equipoNombre, "es"),
      )
    }

    return Array.from(byDept.values())
  }, [escuelas, obsByEquipo])

  const totalGlobal = useMemo(() => escuelas.length, [escuelas])

  /* ========= Cargar métricas cuando cambian grupos ========= */

  useEffect(() => {
    const ids: number[] = []
    for (const dep of grupos) {
      for (const g of dep.grupos) {
        if (typeof g.equipoId === "number") ids.push(g.equipoId)
      }
    }
    const want = Array.from(new Set(ids))
    const pending = want.filter(
      (id) =>
        !equipoMetrics[id]?.loaded &&
        !fetchedEquipoIdsRef.current.has(id),
    )
    if (!pending.length) return

    pending.forEach((id) => fetchedEquipoIdsRef.current.add(id))
    fetchPromediosBatch(pending)
  }, [grupos, equipoMetrics, fetchPromediosBatch])

  /* ========= Observaciones ========= */

  const onChangeObs = (equipoId: number | null, value: string) => {
    const key = String(equipoId ?? "null")
    setObsByEquipo((o) => ({ ...o, [key]: value }))
  }

  const saveObservacionEquipo = async (equipoId: number | null) => {
    const key = String(equipoId ?? "null")
    const texto = obsByEquipo[key] ?? ""
    if (!equipoId) {
      setSavedEquipoOk((s) => ({ ...s, [key]: "ok" }))
      setTimeout(
        () => setSavedEquipoOk((s) => ({ ...s, [key]: undefined })),
        1500,
      )
      return
    }
    if (!token) return
    try {
      setSavingEquipo((s) => ({ ...s, [key]: true }))
      setSavedEquipoOk((s) => ({ ...s, [key]: undefined }))

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/${equipoId}/observaciones`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ observaciones: texto }),
        },
      )
      if (!res.ok) throw new Error("No se pudo guardar en el servidor")

      setSavedEquipoOk((s) => ({ ...s, [key]: "ok" }))

      setEscuelas((prev) =>
        prev.map((es) =>
          es.equipo?.id === equipoId
            ? {
                ...es,
                equipo: {
                  ...(es.equipo as EquipoEscuelaSinPaqueteDTO),
                  observaciones: texto,
                },
              }
            : es,
        ),
      )

      setEquipos((prev) =>
        prev.map((eq) =>
          eq.id === equipoId ? { ...eq, observaciones: texto } : eq,
        ),
      )

      setObsByEquipo((o) => ({ ...o, [key]: texto }))
    } catch (err) {
      console.error(err)
      setSavedEquipoOk((s) => ({ ...s, [key]: "err" }))
    } finally {
      setSavingEquipo((s) => ({ ...s, [key]: false }))
      setTimeout(
        () => setSavedEquipoOk((s) => ({ ...s, [key]: undefined })),
        2500,
      )
    }
  }

  /* ========= Detalle depto ========= */

  const abrirDetalleDepto = (dep: GrupoDepartamento) => {
    setDeptDetalle(dep)
    setDeptDetalleAbierto(true)
  }
  const cerrarDetalleDepto = () => setDeptDetalleAbierto(false)

  return {
    // datos base
    isLoading,
    escuelas,
    equipos,
    departamentos,
    regiones,

    // filtros
    searchInput,
    setSearchInput,
    search,
    filtroDepartamento,
    setFiltroDepartamento,
    filtroEquipo,
    setFiltroEquipo,
    filtroRegion,
    setFiltroRegion,
    soloSinPaquetes,
    setSoloSinPaquetes,
    soloEquiposBajo4,
    setSoloEquiposBajo4,
    calcularPromedios,
    setCalcularPromedios,

    // paginación
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    totalPages,

    // agrupación
    grupos,
    totalGlobal,

    // métricas
    equipoMetrics,

    // observaciones
    obsByEquipo,
    onChangeObs,
    saveObservacionEquipo,
    savingEquipo,
    savedEquipoOk,

    // detalle depto
    deptDetalleAbierto,
    deptDetalle,
    abrirDetalleDepto,
    cerrarDetalleDepto,
    setDeptDetalleAbierto,
  }
}
