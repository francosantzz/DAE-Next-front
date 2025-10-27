"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDebounce } from "@/hooks/useDebounce"
import { cn } from "@/lib/utils"
import { Loader2, Save, CheckCircle2, XCircle, Filter, ChevronDown, ChevronUp, Info, AlertTriangle } from "lucide-react"

/* ========= Tipos ========= */
interface Region { id: number; nombre: string }
interface Departamento { id: number; nombre: string; region?: Region }
interface Equipo {
  id: number
  nombre: string
  departamento: Departamento
  observaciones?: string
}
interface Direccion {
  id: number
  calle: string
  numero: string
  departamento: Departamento
}
interface Escuela {
  id: number
  nombre: string
  Numero?: string
  observaciones?: string
  direccion: Direccion
  equipo: Equipo | null
}

type GrupoEquipo = {
  equipoId: number | null
  equipoNombre: string
  observaciones?: string
  escuelas: Escuela[]
}
type GrupoDepartamento = {
  departamentoNombre: string
  colorClass: string
  grupos: GrupoEquipo[]
  total: number
}
type EquipoMetric = {
  equipoId: number
  promedio: number
  horasEnEscuelas: number
  escuelasCount: number
  loaded: boolean
  error?: boolean
}

/* ========= Helpers de color ========= */
// Chips más grandes; paleta determinística por Departamento
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
function colorForDepartamento(nombre: string) {
  let h = 0
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) & 0xffffffff
  const idx = Math.abs(h) % DEPT_COLORS.length
  return DEPT_COLORS[idx]
}
// Acento sutil por equipo (bordes)
const TEAM_ACCENTS = [
  "border-blue-300", "border-emerald-300", "border-violet-300", "border-amber-300",
  "border-rose-300", "border-sky-300", "border-teal-300", "border-fuchsia-300"
]
function borderForEquipo(nombre: string) {
  let h = 0
  for (let i = 0; i < nombre.length; i++) h = (h * 29 + nombre.charCodeAt(i)) & 0xffffffff
  const idx = Math.abs(h) % TEAM_ACCENTS.length
  return TEAM_ACCENTS[idx]
}

export default function EscuelasSinPaquetes() {
  const { data: session } = useSession()

  const [isLoading, setIsLoading] = useState(true)
  const [escuelas, setEscuelas] = useState<Escuela[]>([])

  // catálogos para filtros
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [regiones, setRegiones] = useState<Region[]>([])

  // Filtros
  const [searchInput, setSearchInput] = useState("")
  const search = useDebounce(searchInput, 500)
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>("todos")
  const [filtroEquipo, setFiltroEquipo] = useState<string>("todos")
  const [filtroRegion, setFiltroRegion] = useState<string>("todas")
  const [soloSinPaquetes, setSoloSinPaquetes] = useState<boolean>(true) // esta vista es de "sin paquetes", lo dejo activado

  const [equipoMetrics, setEquipoMetrics] = useState<Record<number, EquipoMetric>>({})
  const fetchedEquipoIdsRef = useRef<Set<number>>(new Set())
  const abortEquipoControllersRef = useRef<Map<number, AbortController>>(new Map())
  const abortMainRef = useRef<AbortController | null>(null)
  const abortCatalogsRef = useRef<AbortController | null>(null)
  const abortMetricsRef = useRef<AbortController | null>(null)
  const unmountedRef = useRef<boolean>(false)
 const [soloEquiposBajo4, setSoloEquiposBajo4] = useState<boolean>(false)
  const [calcularPromedios, setCalcularPromedios] = useState<boolean>(false)

  // Paginación
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(150)
  const [totalItems, setTotalItems] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const [lastQuery, setLastQuery] = useState<string>("")
  

  // Observaciones por sección (equipo): estado local editable y estado de guardado
  const [obsByEquipo, setObsByEquipo] = useState<Record<string, string>>({})
  const [savingEquipo, setSavingEquipo] = useState<Record<string, boolean>>({})
  const [savedEquipoOk, setSavedEquipoOk] = useState<Record<string, "ok" | "err" | undefined>>({})

  // Dialog de detalle de un departamento
  const [deptDetalleAbierto, setDeptDetalleAbierto] = useState(false)
  const [deptDetalle, setDeptDetalle] = useState<GrupoDepartamento | null>(null)
  

  // ⬇️ reemplazá TODO el useCallback(fetchCatalogos) por esto
const fetchCatalogos = useCallback(async () => {
  if (!session?.user?.accessToken) return

  // cache en sessionStorage (reduce llamadas si ya entraste antes)
  const fromCache = <T,>(k: string): T | null => {
    try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) as T : null } catch { return null }
  }
  const toCache = (k: string, v: unknown) => {
    try { sessionStorage.setItem(k, JSON.stringify(v)) } catch {}
  }

  try {
    // abort anterior si existía
    abortCatalogsRef.current?.abort()
    const controller = new AbortController()
    abortCatalogsRef.current = controller
    const headers = { Authorization: `Bearer ${session.user.accessToken}` }

    // 1) equipos/short (primero intentá cache)
const eqCache = fromCache<Equipo[]>('equiposShort_v2')
if (eqCache) {
  setEquipos(eqCache)
  // Sembrar observaciones desde cache
  const nextObs: Record<string, string> = {}
  for (const eq of eqCache) {
    if (eq?.observaciones != null) nextObs[String(eq.id)] = eq.observaciones
  }
  setObsByEquipo(prev => ({ ...nextObs, ...prev }))
}

    // 2) departamentos
    const depCache = fromCache<Departamento[]>('departamentos_v1')
    if (depCache) setDepartamentos(depCache)

    // 3) regions  (⚠️ tu back usa /regions)
    const regCache = fromCache<Region[]>('regions_v1')
    if (regCache) setRegiones(regCache)

    // pedí en paralelo solo lo que falte o para refrescar
    const [equiposRes, departamentosRes, regionesRes] = await Promise.allSettled([
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/short?page=1&limit=1000`, { headers, signal: controller.signal }),
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`, { headers, signal: controller.signal }),
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/regions`, { headers, signal: controller.signal }), // ✅ /regions
    ])

if (equiposRes.status === "fulfilled" && equiposRes.value.ok) {
  const je = await equiposRes.value.json()
  const next: Equipo[] = je.data || je
  setEquipos(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
  toCache('equiposShort_v2', next)

  // Sembrar observaciones desde el back short
  const nextObs: Record<string, string> = {}
  for (const eq of next) {
    if (eq?.observaciones != null) nextObs[String(eq.id)] = eq.observaciones
  }
  setObsByEquipo(prev => ({ ...nextObs, ...prev }))
}

    if (departamentosRes.status === "fulfilled" && departamentosRes.value.ok) {
      const jd = await departamentosRes.value.json()
      const next: Departamento[] = jd.data || jd
      setDepartamentos(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
      toCache('departamentos_v1', next)
    }

    if (regionesRes.status === "fulfilled" && regionesRes.value.ok) {
      const jr = await regionesRes.value.json()
      const next = jr.data || jr
      setRegiones(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
      toCache('regions_v1', next)
    }
  } catch (e: any) {
    if (e?.name !== 'AbortError') console.error("Error catálogos:", e)
  }
}, [session?.user?.accessToken])


     const didFetchCatalogs = useRef<string | null>(null)
      useEffect(() => {
        const token = session?.user?.accessToken || ""
        if (!token) return
        if (didFetchCatalogs.current === token) return
        didFetchCatalogs.current = token
        fetchCatalogos()
      }, [fetchCatalogos, session?.user?.accessToken])

  /* ====== Fetch principal ====== */
  const fetchEscuelas = useCallback(async () => {
    if (!session?.user?.accessToken) return
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search ? { search } : {}),
        ...(soloSinPaquetes ? { sinPaquetes: "true" } : {}),
        ...(filtroDepartamento !== "todos" ? { departamentoId: filtroDepartamento } : {}),
        ...(filtroEquipo !== "todos" ? { equipoId: filtroEquipo } : {}),
        ...(filtroRegion !== "todas" ? { regionId: filtroRegion } : {}),
      })
      const qs = params.toString()
      if (qs === lastQuery) return                   
    
      setIsLoading(true)
      setLastQuery(qs)
      console.debug("[fetchEscuelas]", `/escuelas?${qs}`)
    
      // aborta anterior
      abortMainRef.current?.abort()
      const controller = new AbortController()
      abortMainRef.current = controller

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas?${qs}`, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` },
        signal: controller.signal,
      })
      if (!res.ok) throw new Error("Error al obtener escuelas")
      const json = await res.json()

      const data: Escuela[] = Array.isArray(json) ? json : json.data
      setEscuelas(data || [])

      if (!Array.isArray(json) && json?.meta) {
        setTotalItems(json.meta.total ?? data.length)
        setTotalPages(json.meta.totalPages ?? Math.ceil((json.meta.total ?? data.length) / limit))
      } else {
        setTotalItems(data.length)
        setTotalPages(Math.max(1, Math.ceil(data.length / limit)))
      }

      // precargar observaciones por equipo si vienen en el payload
      const nextObs: Record<string, string> = {}
      for (const e of data) {
        const key = String(e.equipo?.id ?? "null")
        if (e.equipo?.observaciones != null && nextObs[key] == null) nextObs[key] = e.equipo.observaciones
      }
      setObsByEquipo((prev) => ({ ...nextObs, ...prev }))
    } catch (e: any) {
      if (e?.name !== 'AbortError') console.error(e)
    } finally {
      setIsLoading(false)
      if (abortMainRef.current) {
        abortMainRef.current = null
      }
    }
  }, [session?.user?.accessToken, page, limit, search, filtroDepartamento, filtroEquipo, filtroRegion, soloSinPaquetes, lastQuery])

  useEffect(() => {
    fetchEscuelas()
  }, [fetchEscuelas])

  // Resetear a page 1 cuando cambian filtros o limit
  useEffect(() => {
    setPage(1)
  }, [search, limit, filtroDepartamento, filtroEquipo, filtroRegion, soloSinPaquetes])

  

  // ========= Batch de métricas por equipo =========
const fetchPromediosBatch = useCallback(async (ids: number[]) => {
  if (!session?.user?.accessToken) return
  if (!ids.length) return

  // Cancelá el batch anterior si existía
  if (abortMetricsRef.current) {
    abortMetricsRef.current.abort()
  }
  const controller = new AbortController()
  abortMetricsRef.current = controller

  // Para no hacer URLs gigantes, chunk en grupos de 80-100
  const CHUNK = 80
  const chunks: number[][] = []
  for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK))

  try {
    // Para cada chunk, golpeá el endpoint batch en paralelo
    const headers = { Authorization: `Bearer ${session.user.accessToken}` }
    const promises = chunks.map(async (chunk) => {
      const qs = encodeURIComponent(chunk.join(','))
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/metrics/escuelas-promedio?ids=${qs}`
      const res = await fetch(url, { headers, signal: controller.signal })
      if (!res.ok) throw new Error('Error al obtener promedios')
      const json = await res.json() as Array<{
        equipoId: number
        nombre: string
        departamento: { id: number, nombre: string } | null
        escuelasCount: number
        horasEnEscuelas: number
        promedio: number
      }>

      // Index rápido para los que sí vinieron
      const map = new Map<number, typeof json[number]>()
      json.forEach(r => map.set(r.equipoId, r))

      // Armá payload de actualización (incluí también los que no vinieron para marcarlos como error)
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
      setEquipoMetrics(prev => ({ ...prev, ...updates }))
    })

    await Promise.allSettled(promises)
  } catch (e: any) {
    if (e?.name !== 'AbortError') {
      console.error('Error metrics batch:', e)
      // Si falla todo el batch, marcá como error lo que intentabas cargar
      setEquipoMetrics(prev => {
        const next = { ...prev }
        ids.forEach(id => {
          next[id] = next[id] ?? {
            equipoId: id, promedio: 0, horasEnEscuelas: 0, escuelasCount: 0, loaded: true, error: true,
          }
        })
        return next
      })
    }
  } finally {
    abortMetricsRef.current = null
  }
}, [session?.user?.accessToken])



  /* ====== Agrupar y ordenar ====== */
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

    // Sincroniza obs del estado
    for (const dep of byDept.values()) {
      for (const g of dep.grupos) {
        const key = String(g.equipoId ?? "null")
        if (obsByEquipo[key] != null) g.observaciones = obsByEquipo[key]
      }
      // ordenar equipos por nombre
      dep.grupos.sort((a, b) => a.equipoNombre.localeCompare(b.equipoNombre, "es"))
    }
    return Array.from(byDept.values())
  }, [escuelas, obsByEquipo])

  const totalGlobal = useMemo(() => escuelas.length, [escuelas])


  // Cleanup al desmontar: abortar todo
  useEffect(() => {
    return () => {
      unmountedRef.current = true
      const main = abortMainRef.current
      const catalogs = abortCatalogsRef.current
      const mapCopy = new Map<number, AbortController>(abortEquipoControllersRef.current)
      if (main) main.abort()
      if (catalogs) catalogs.abort()
      mapCopy.forEach((c) => c.abort())
      abortMetricsRef.current?.abort()
    }
  }, [])

  // ⬇️ reemplazá el useEffect que arma 'pending' por esto
  useEffect(() => {
    // juntar ids visibles
    const ids: number[] = []
    for (const dep of grupos) {
      for (const g of dep.grupos) {
        if (typeof g.equipoId === 'number') ids.push(g.equipoId)
      }
    }
    const want = Array.from(new Set(ids))

    // pedí solo los que NO están en metrics ni en “ya solicitados”
    const pending = want.filter(id => !equipoMetrics[id]?.loaded && !fetchedEquipoIdsRef.current.has(id))
    if (pending.length === 0) return

    // marcá como solicitados ya mismo
    pending.forEach(id => fetchedEquipoIdsRef.current.add(id))

    fetchPromediosBatch(pending)
  }, [grupos, equipoMetrics, fetchPromediosBatch])

  

  /* ====== Guardar observación por equipo ====== */
  const saveObservacionEquipo = async (equipoId: number | null) => {
    const key = String(equipoId ?? "null")
    const texto = obsByEquipo[key] ?? ""
    if (!equipoId) {
      // sin equipo concreto: guardado local
      setSavedEquipoOk((s) => ({ ...s, [key]: "ok" }))
      setTimeout(() => setSavedEquipoOk((s) => ({ ...s, [key]: undefined })), 1500)
      return
    }
    if (!session?.user?.accessToken) return
    try {
      setSavingEquipo((s) => ({ ...s, [key]: true }))
      setSavedEquipoOk((s) => ({ ...s, [key]: undefined }))

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/${equipoId}/observaciones`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
        },
        body: JSON.stringify({ observaciones: texto }),
      })
      if (!res.ok) throw new Error("No se pudo guardar en el servidor")

      setSavedEquipoOk((s) => ({ ...s, [key]: "ok" }))

// 1) Actualizá escuelas que muestran ese equipo
setEscuelas((prev) =>
  prev.map((es) =>
    es.equipo?.id === equipoId ? { ...es, equipo: { ...es.equipo, observaciones: texto } as Equipo } : es,
  ),
)

// 2) Actualizá el catálogo equipos en memoria
setEquipos(prev => prev.map(eq => eq.id === equipoId ? { ...eq, observaciones: texto } : eq))

// 3) Actualizá el estado centralizado de obs
setObsByEquipo(o => ({ ...o, [key]: texto }))

// 4) (opcional) refrescá el cache corto si lo usás luego
try {
  const cached = sessionStorage.getItem('equiposShort_v2')
  if (cached) {
    const arr: Equipo[] = JSON.parse(cached)
    const upd = arr.map(eq => eq.id === equipoId ? { ...eq, observaciones: texto } : eq)
    sessionStorage.setItem('equiposShort_v2', JSON.stringify(upd))
  }
} catch {}
    } catch (err) {
      console.error(err)
      setSavedEquipoOk((s) => ({ ...s, [key]: "err" }))
    } finally {
      setSavingEquipo((s) => ({ ...s, [key]: false }))
      setTimeout(() => setSavedEquipoOk((s) => ({ ...s, [key]: undefined })), 2500)
    }
  }

  const toNumber = (v: unknown): number => {
    if (typeof v === "number") return v
    const n = parseFloat(String(v))
    return Number.isFinite(n) ? n : 0
  }
  
  const perteneceASemana1 = (paquete: any): boolean => {
    const d = paquete?.dias
    if (!d) return true
    if (!d.rotativo) return true
    if (!Array.isArray(d.semanas) || d.semanas.length === 0) return true
    return d.semanas.includes(1)
  }
  

  const onChangeObs = (equipoId: number | null, value: string) => {
    const key = String(equipoId ?? "null")
    setObsByEquipo((o) => ({ ...o, [key]: value }))
  }

  /* ====== UI ====== */
  const abrirDetalleDepto = (dep: GrupoDepartamento) => {
    setDeptDetalle(dep)
    setDeptDetalleAbierto(true)
  }

  return (
    <ProtectedRoute requiredPermission={{ entity: "escuela", action: "read" }}>
      <div className="p-4 md:p-8 space-y-4">
       {/* Filtros arriba + Resumen abajo (apilados y compactos) */}
<div className="space-y-4">
  {/* --- FILTROS (compactos) --- */}
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2">
          Escuelas sin paquetes de horas
          <Badge className="text-sm sm:text-base px-2.5 py-1.5">Listado</Badge>
        </CardTitle>

        <div className="flex items-center gap-2">
          <div className="text-sm md:text-base text-muted-foreground">
            {isLoading ? "Cargando…" : (
              <>Mostrando <strong className="text-primary">{escuelas.length}</strong>{typeof totalItems === "number" ? <> de <strong>{totalItems}</strong></> : null}</>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearchInput("")
              setFiltroRegion("todas")
              setFiltroDepartamento("todos")
              setFiltroEquipo("todos")
              setLimit(150)
              setSoloSinPaquetes(true)
              setPage(1)
            }}
            title="Limpiar filtros"
          >
            Limpiar filtros
          </Button>
        </div>
      </div>
    </CardHeader>

    <CardContent className="space-y-2">
      {/* Grid compacto: 2 col en mobile, 6 col en desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
        <div className="col-span-2 md:col-span-2">
          <Label htmlFor="search" className="text-xs">Buscar</Label>
          <Input
            id="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nombre o Nº de escuela"
            className="h-9 text-sm"
          />
        </div>

        <div>
          <Label htmlFor="region" className="text-xs">Región</Label>
          <Select value={filtroRegion} onValueChange={setFiltroRegion}>
            <SelectTrigger id="region" className="h-9 text-sm">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="todas">Todas</SelectItem>
              {regiones.map(r => (
                <SelectItem key={r.id} value={String(r.id)}>{r.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="departamento" className="text-xs">Departamento</Label>
          <Select value={filtroDepartamento} onValueChange={setFiltroDepartamento}>
            <SelectTrigger id="departamento" className="h-9 text-sm">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="todos">Todos</SelectItem>
              {departamentos.map(d => (
                <SelectItem key={d.id} value={String(d.id)}>{d.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="equipo" className="text-xs">Equipo / Sección</Label>
          <Select value={filtroEquipo} onValueChange={setFiltroEquipo}>
            <SelectTrigger id="equipo" className="h-9 text-sm">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="todos">Todos</SelectItem>
              {equipos.map(eq => (
                <SelectItem key={eq.id} value={String(eq.id)}>{eq.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="limit" className="text-xs">Resultados</Label>
          <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
            <SelectTrigger id="limit" className="h-9 text-sm">
              <SelectValue placeholder="Cantidad" />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100, 150].map(n => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2">
          <input
            type="checkbox"
            id="soloSinPaquetes"
            checked={soloSinPaquetes}
            onChange={(e) => setSoloSinPaquetes(e.target.checked)}
            className="h-4 w-4 text-primary border-gray-300 rounded"
          />
          <Label htmlFor="soloSinPaquetes" className="text-xs">Solo SIN paquetes</Label>
        </div>
      </div>
      <div className="flex items-end gap-2">
         <input
           type="checkbox"
           id="soloEquiposBajo4"
           checked={soloEquiposBajo4}
           onChange={(e) => setSoloEquiposBajo4(e.target.checked)}
           className="h-4 w-4 text-primary border-gray-300 rounded"
         />
         <Label htmlFor="soloEquiposBajo4" className="text-xs">Solo equipos &lt; 4h</Label>
       </div>

      {/* Chips de filtros activos (opcionales, compactos) */}
      {(filtroRegion !== "todas" || filtroDepartamento !== "todos" || filtroEquipo !== "todos" || search) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {search && <Badge variant="outline" className="text-xs">Buscar: “{search}”</Badge>}
          {filtroRegion !== "todas" && (
            <Badge variant="outline" className="text-xs">
              Región: {regiones.find(r => String(r.id) === filtroRegion)?.nombre || filtroRegion}
            </Badge>
          )}
          {filtroDepartamento !== "todos" && (
            <Badge variant="outline" className="text-xs">
              Depto: {departamentos.find(d => String(d.id) === filtroDepartamento)?.nombre || filtroDepartamento}
            </Badge>
          )}
          {filtroEquipo !== "todos" && (
            <Badge variant="outline" className="text-xs">
              Equipo: {equipos.find(e => String(e.id) === filtroEquipo)?.nombre || filtroEquipo}
            </Badge>
          )}
        </div>
      )}
    </CardContent>
  </Card>

  {/* --- RESUMEN (abajo, a lo largo, scrolleable) --- */}
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2">
        Resumen <Info className="h-5 w-5 text-muted-foreground" />
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="border-gray-400 text-base px-3 py-1.5 rounded-full">
          Total sin cubrir
        </Badge>
        <span className="text-3xl font-bold">{isLoading ? "…" : totalGlobal}</span>
      </div>

      {/* Lista completa de departamentos con scroll si excede altura */}
      <div className="max-h-[220px] sm:max-h-[260px] overflow-auto pr-1">
        <div className="divide-y">
          {grupos.map((g) => (
            <div key={g.departamentoNombre} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className={cn("text-sm px-3 py-1 rounded-full border font-medium", g.colorClass)}>
                  {g.departamentoNombre}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm rounded-full px-3 py-1">{g.total}</Badge>
                <Button size="sm" variant="outline" onClick={() => abrirDetalleDepto(g)}>
                  Ver detalle
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
</div>


        {/* Tabla agrupada */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-16 text-center text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" /> Cargando…
              </div>
            ) : grupos.length === 0 ? (
              <div className="py-16 text-center">No se encontraron escuelas con los filtros aplicados.</div>
            ) : (
              <div className="divide-y">
                {grupos.map((dep) => (
                  <section key={dep.departamentoNombre} className="p-4">
                    <header className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={cn("text-base px-3 py-1 rounded-full border font-semibold", dep.colorClass)}>
                          {dep.departamentoNombre}
                        </span>
                        <Badge className="rounded-full text-sm px-3 py-1 bg-primary/10 text-primary">
                          {dep.total} sin cubrir
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => abrirDetalleDepto(dep)}>
                        Ver detalle
                      </Button>
                    </header>

                   {/* Grupos por equipo (Sección) – versión compacta */}
<div className="space-y-3">
{ (soloEquiposBajo4
     ? dep.grupos.filter((g) => {
         if (g.equipoId == null) return true // mostrar "Sin equipo"
         const m = equipoMetrics[g.equipoId]
         return m?.loaded ? m.promedio < 4 : true // si no cargó aún, lo mostramos
       })
     : dep.grupos
   ).map((g) => {
    const key = String(g.equipoId ?? "null")
    const saving = !!savingEquipo[key]
    const saved = savedEquipoOk[key]
    return (
      <div
        key={key}
        className={cn(
          "rounded-md border bg-card overflow-hidden",
          borderForEquipo(g.equipoNombre) // mantiene el acento por equipo
        )}
      >
        {/* Header súper chato con acento izquierdo */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pl-3 pr-2 py-2 border-b relative">
          <div className="absolute left-0 top-0 h-full w-1 bg-primary/60" />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary text-primary text-sm px-2 py-0.5 rounded-md">
              {g.equipoNombre}
            </Badge>
            <Badge variant="secondary" className="text-sm px-2 py-0.5 rounded-md">
              {g.escuelas.length} escuelas
            </Badge>
            {/* Métrica de promedio x escuela */}
              {typeof g.equipoId === "number" && (
                (() => {
                  const m = equipoMetrics[g.equipoId]
                  if (!m?.loaded) {
                    return (
                      <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-md border-dashed">
                        calc. promedio…
                      </Badge>
                    )
                  }
                  const avg = m.promedio
                  const critico = avg < 4
                  const cercano = avg >= 4 && avg < 5
                  return (
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-md font-semibold",
                          critico
                            ? "border-rose-400 text-rose-700 bg-rose-50"
                            : cercano
                            ? "border-amber-400 text-amber-700 bg-amber-50"
                            : "border-emerald-400 text-emerald-700 bg-emerald-50"
                        )}
                        title="Promedio de horas en escuelas (semana 1) = horas_en_escuelas / cantidad_escuelas"
                      >
                        Prom.: {avg.toFixed(1)}h/esc
                      </Badge>
                      {critico && (
                        <Badge variant="destructive" className="text-xs px-2 py-0.5 rounded-md">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                          Bajo 4h
                        </Badge>
                      )}
                    </div>
                  )
                })()
              )}
          </div>

          {/* Observación por SECCIÓN (equipo) compacta */}
          <div className="w-full md:w-[48%]">
            <Label className="text-[11px]">Observación de la sección</Label>
            <div className="flex gap-1 mt-1">
              <Textarea
                value={obsByEquipo[key] ?? g.observaciones ?? ""}
                onChange={(e) => onChangeObs(g.equipoId, e.target.value)}
                placeholder=""
                className="min-h-[48px] text-sm py-2"
              />
              <Button
                type="button"
                onClick={() => saveObservacionEquipo(g.equipoId)}
                disabled={saving}
                size="icon"
                variant="outline"
                className="shrink-0 h-9 w-9 self-start"
                title="Guardar observación"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
            {saved === "ok" && (
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 mt-1">
                <CheckCircle2 className="h-3 w-3" /> Guardado
              </div>
            )}
            {saved === "err" && (
              <div className="flex items-center gap-1 text-[11px] text-rose-700 mt-1">
                <XCircle className="h-3 w-3" /> No se pudo guardar. Quedó local.
              </div>
            )}
          </div>
        </div>

        {/* ====== MOBILE LIST (xs–sm) ====== */}
                  <div className="p-2 md:hidden">
                    <ul className="space-y-2">
                      {g.escuelas.map((e) => (
                        <li key={e.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn("text-[11px] px-2 py-0.5 rounded border shrink-0", dep.colorClass)}>
                              {e.direccion?.departamento?.nombre || "-"}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">{g.equipoNombre}</span>
                          </div>
                          <div className="mt-1 font-medium text-sm line-clamp-2">
                            {e.nombre}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground flex items-center justify-between">
                            <span>Anexo: {e.Numero || "—"}</span>
                          </div>
                          {e.observaciones && (
                            <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {e.observaciones}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* ====== DESKTOP TABLE (md+) ====== */}
                  <div className="p-2 hidden md:block">
                    <Table className="[&_th]:py-2 [&_td]:py-1.5 [&_th]:text-xs [&_td]:text-sm [&_td]:align-middle">
                      <TableHeader>
                        <TableRow className="h-9">
                          <TableHead className="w-[180px]">Departamento</TableHead>
                          <TableHead className="w-[220px]">Equipo</TableHead>
                          <TableHead>Escuela sin cubrir</TableHead>
                          <TableHead className="w-[120px]">Nº anexo</TableHead>
                          <TableHead>Obs. (lectura)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {g.escuelas.map((e) => (
                          <TableRow key={e.id} className="h-9">
                            <TableCell className="whitespace-nowrap">
                              <span className={cn("text-[11px] px-2 py-0.5 rounded border", dep.colorClass)}>
                                {e.direccion?.departamento?.nombre || "-"}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{g.equipoNombre}</TableCell>
                            <TableCell className="truncate">{e.nombre}</TableCell>
                            <TableCell className="whitespace-nowrap">{e.Numero || ""}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {e.observaciones || <span className="text-xs italic">—</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                        </div>
                      )
                    })}
                  </div>

                  </section>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginación */}
        {(totalPages ?? 1) > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Anterior
            </Button>
            <div className="text-sm md:text-base text-muted-foreground">
              Página <strong>{page}</strong> de <strong>{totalPages ?? "…"}</strong>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => (totalPages ? Math.min(totalPages, p + 1) : p + 1))}
              disabled={!!totalPages && page >= totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}

        {/* Dialog de detalle por Departamento */}
        <Dialog open={deptDetalleAbierto} onOpenChange={setDeptDetalleAbierto}>
          <DialogContent className="w-[95vw] h-[90vh] sm:max-w-3xl sm:h-auto sm:max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {deptDetalle ? (
                  <>
                    <span className={cn("text-sm px-3 py-1 rounded-full border font-semibold", deptDetalle.colorClass)}>
                      {deptDetalle.departamentoNombre}
                    </span>
                    <Badge className="rounded-full px-3 py-1 text-base">
                      {deptDetalle.total} sin cubrir
                    </Badge>
                  </>
                ) : "Detalle"}
              </DialogTitle>
            </DialogHeader>

            {deptDetalle && (
              <div className="space-y-4">
                {deptDetalle.grupos.map((g) => (
                  <Card key={g.equipoId ?? "null"} className={cn("border", borderForEquipo(g.equipoNombre))}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2">
                      <Badge variant="outline" className="border-primary text-primary text-xs sm:text-sm px-2 py-0.5 rounded-md">
                        {g.equipoNombre}
                      </Badge>
                      <Badge variant="secondary" className="text-xs sm:text-sm px-2 py-0.5 rounded-md">
                        {g.escuelas.length} escuelas
                      </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-1">
                        {g.escuelas.map((e) => (
                          <li key={e.id} className="text-base">
                            {e.nombre}{e.Numero ? ` — Anexo ${e.Numero}` : ""}
                            {e.observaciones ? (
                              <span className="text-sm text-muted-foreground"> — {e.observaciones}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
