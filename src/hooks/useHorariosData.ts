'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Session } from "next-auth"
import type { PaqueteHoras } from "@/types/PaqueteHoras.interface"
import type { Profesional } from "@/types/Profesional.interface"
import type { Equipo } from "@/types/Equipo.interface"
import type { Escuela } from "@/types/Escuela.interface"

/**
 * Payload para create/update
 */
export type PaquetePayload = {
    tipo: string;
    escuelaId: number | null;
    equipoId: number;
    profesionalId: number;
    diaSemana: number | null;
    horaInicio: string;
    horaFin: string;
    rotativo: boolean;
    semanas?: number[] | null;
}

/** Normaliza paquetes (soporta backend con campo `dias`) */
export function normalizarPaquetes(paquetesData: any[]): PaqueteHoras[] {
    return paquetesData.map((p: any) => ({
        ...p,
        diaSemana: p.diaSemana ?? p.dias?.diaSemana ?? null,
        horaInicio: (p.horaInicio ?? p.dias?.horaInicio ?? '').toString().slice(0, 5),
        horaFin: (p.horaFin ?? p.dias?.horaFin ?? '').toString().slice(0, 5),
        rotativo: p.rotativo ?? p.dias?.rotativo ?? false,
        semanas: p.semanas ?? p.dias?.semanas ?? null,
    }))
}

export default function useHorariosData(session: Session | null) {
    // datos
    const [paquetes, setPaquetes] = useState<PaqueteHoras[]>([])
    const [filteredPaquetes, setFilteredPaquetes] = useState<PaqueteHoras[]>([])
    const [profesionalesFiltrados, setProfesionalesFiltrados] = useState<Profesional[]>([])
    const [equipos, setEquipos] = useState<Equipo[]>([])
    const [escuelasDelEquipo, setEscuelasDelEquipo] = useState<Escuela[]>([])

    // UI state
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [verAnteriores, setVerAnteriores] = useState<boolean>(false)
    const [paquetesCargados, setPaquetesCargados] = useState<boolean>(false)

    const [equipoSeleccionado, setEquipoSeleccionado] = useState<string>("")
    const [profesionalSeleccionado, setProfesionalSeleccionado] = useState<string>("")
    const [searchTerm, setSearchTerm] = useState<string>("")

    // refresh total horas
    const refreshProfesionalTotalHoras = useCallback(async () => {
        try {
            if (!profesionalSeleccionado) return
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${profesionalSeleccionado}`,
                { headers: { Authorization: `Bearer ${session?.user?.accessToken}` } }
            )
            if (!res.ok) return
            const prof = await res.json()
            setProfesionalesFiltrados(prev =>
                prev.map(p => (p.id === prof.id ? { ...p, totalHoras: prof.totalHoras } : p))
            )
        } catch (err) {
            console.error("refreshProfesionalTotalHoras error:", err)
        }
    }, [profesionalSeleccionado, session?.user?.accessToken])

    // initial fetch equipos - reemplaza tu useEffect actual por este
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true)
            try {
                const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/short?page=1&limit=100${verAnteriores ? "&onlyFormer=true" : ""}`
                const equiposRes = await fetch(url, {
                    headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
                })
                if (!equiposRes.ok) throw new Error("Error al obtener datos iniciales")
                const equiposData = await equiposRes.json()

                // DEBUG: inspeccioná la respuesta en consola una vez (podés borrar luego)
                console.debug("equiposData (onlyFormer=" + verAnteriores + "):", equiposData)

                // Soportar respuesta { data: [...] } o directamente [...]
                const list = equiposData.data ?? equiposData
                setEquipos(Array.isArray(list) ? list : [])

                // después de cargar equipos, reseteamos flags dependientes
                setPaquetes([])
                setFilteredPaquetes([])
                setPaquetesCargados(false)
                // profesionales deben vaciarse también
                setProfesionalesFiltrados([])
            } catch (error) {
                console.error("Error fetching initial data:", error)
                // si hay error, aseguramos que no quede un estado inconsistente
                setEquipos([])
                setProfesionalesFiltrados([])
                setPaquetes([])
                setFilteredPaquetes([])
                setPaquetesCargados(false)
            } finally {
                // limpiamos selecciones y stop loading al final
                setEquipoSeleccionado("")      // <--- limpiar selección actual
                setProfesionalSeleccionado("") // <--- limpiar selección actual
                setIsLoading(false)
            }
        }

        // Limpiamos selección **antes** de iniciar fetch para evitar UI stale
        setEquipoSeleccionado("")
        setProfesionalSeleccionado("")
        setProfesionalesFiltrados([])
        setPaquetes([])
        setFilteredPaquetes([])
        setPaquetesCargados(false)
        console.log();
        
        fetchInitialData()
    }, [session?.user?.accessToken, verAnteriores])


    // cargar profesionales al cambiar equipo
    useEffect(() => {
        if (!equipoSeleccionado) {
            setProfesionalesFiltrados([])
            return
        }
        setIsLoading(true)
        try {
            const equipo = equipos.find(e => e.id.toString() === equipoSeleccionado)
            if (equipo && (equipo as any).profesionales) {
                setProfesionalesFiltrados((equipo as any).profesionales as Profesional[])
            } else {
                setProfesionalesFiltrados([])
            }
            setProfesionalSeleccionado("")
            setPaquetesCargados(false)
        } catch (error) {
            console.error("Error al obtener profesionales del equipo:", error)
            setProfesionalesFiltrados([])
        } finally {
            setIsLoading(false)
        }
    }, [equipoSeleccionado, equipos])

    // fetchEscuelasDelEquipo
    const fetchEscuelasDelEquipo = useCallback(async (equipoId: string) => {
        if (!equipoId) {
            setEscuelasDelEquipo([])
            return
        }
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/por-equipo/${equipoId}`, {
                headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
            })
            if (!response.ok) throw new Error("Error al obtener escuelas del equipo")
            const escolasData = await response.json()
            setEscuelasDelEquipo(escolasData.data || escolasData)
        } catch (error) {
            console.error("Error fetching escuelas del equipo:", error)
            setEscuelasDelEquipo([])
        }
    }, [session?.user?.accessToken])

    // fetch paquetes
    useEffect(() => {
        const fetchPaquetes = async () => {
            if (!profesionalSeleccionado || !equipoSeleccionado) {
                setPaquetes([])
                setFilteredPaquetes([])
                setPaquetesCargados(false)
                return
            }

            setIsLoading(true)
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes?profesionalId=${profesionalSeleccionado}${verAnteriores ? "&includeDeleted=true" : ""}`,
                    { headers: { Authorization: `Bearer ${session?.user?.accessToken}` } }
                )
                if (!response.ok) throw new Error("Error al obtener paquetes")
                const paquetesData = await response.json()
                const rawArray = Array.isArray(paquetesData) ? paquetesData : paquetesData.data ?? paquetesData
                const paquetesFiltrados = rawArray.filter((paquete: any) => paquete.equipo?.id?.toString() === equipoSeleccionado)
                const normalizados = normalizarPaquetes(paquetesFiltrados)
                setPaquetes(normalizados)
                setFilteredPaquetes(normalizados)
                await refreshProfesionalTotalHoras()
                setPaquetesCargados(true)
            } catch (error) {
                console.error("Error fetching paquetes:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchPaquetes()
    }, [profesionalSeleccionado, equipoSeleccionado, session?.user?.accessToken, refreshProfesionalTotalHoras, verAnteriores])

    // search filter
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredPaquetes(paquetes)
        } else {
            const lowerSearchTerm = searchTerm.toLowerCase()
            const filtered = paquetes.filter(
                (paquete) =>
                    (paquete.escuela?.nombre?.toLowerCase() || "").includes(lowerSearchTerm) ||
                    (paquete.tipo || "").toLowerCase().includes(lowerSearchTerm)
            )
            setFilteredPaquetes(filtered)
        }
    }, [searchTerm, paquetes])

    // reloadPaquetes
    const reloadPaquetes = useCallback(async () => {
        if (!profesionalSeleccionado) return
        setIsLoading(true)
        try {
            const resp = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes?profesionalId=${profesionalSeleccionado}${verAnteriores ? "&includeDeleted=true" : ""}`,
                { headers: { Authorization: `Bearer ${session?.user?.accessToken}` } }
            )
            if (!resp.ok) throw new Error("Error al actualizar los paquetes")
            const data = await resp.json()
            const rawArray = Array.isArray(data) ? data : data.data ?? data
            const paquetesFiltrados = rawArray.filter((paquete: any) => paquete.equipo?.id?.toString() === equipoSeleccionado)
            const normalizados = normalizarPaquetes(paquetesFiltrados)
            setPaquetes(normalizados)
            setFilteredPaquetes(normalizados)
            await refreshProfesionalTotalHoras()
            setPaquetesCargados(true)
        } catch (error) {
            console.error("Error reloading paquetes:", error)
        } finally {
            setIsLoading(false)
        }
    }, [profesionalSeleccionado, equipoSeleccionado, session?.user?.accessToken, refreshProfesionalTotalHoras, verAnteriores])

    // CRUD: create / update / delete (centralizados en el hook)
    const createPaquete = useCallback(async (payload: PaquetePayload) => {
        setIsLoading(true)
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.accessToken}`,
                },
                body: JSON.stringify({
                    tipo: payload.tipo,
                    escuelaId: payload.escuelaId,
                    equipoId: payload.equipoId,
                    profesionalId: payload.profesionalId,
                    diaSemana: payload.diaSemana,
                    horaInicio: payload.horaInicio,
                    horaFin: payload.horaFin,
                    rotativo: payload.rotativo,
                    semanas: payload.rotativo ? payload.semanas ?? null : null,
                }),
            })
            if (!resp.ok) {
                const text = await resp.text().catch(() => null)
                throw new Error(`Error createPaquete: ${resp.status} ${text || resp.statusText}`)
            }
            // recargar
            await reloadPaquetes()
            return true
        } catch (error) {
            console.error("createPaquete error:", error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }, [session?.user?.accessToken, reloadPaquetes])

    const updatePaquete = useCallback(async (id: number, payload: PaquetePayload) => {
        setIsLoading(true)
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.accessToken}`,
                },
                body: JSON.stringify({
                    tipo: payload.tipo,
                    escuelaId: payload.escuelaId,
                    equipoId: payload.equipoId,
                    profesionalId: payload.profesionalId,
                    diaSemana: payload.diaSemana,
                    horaInicio: payload.horaInicio,
                    horaFin: payload.horaFin,
                    rotativo: payload.rotativo,
                    semanas: payload.rotativo ? payload.semanas ?? null : null,
                }),
            })
            if (!resp.ok) {
                const text = await resp.text().catch(() => null)
                throw new Error(`Error updatePaquete: ${resp.status} ${text || resp.statusText}`)
            }
            await reloadPaquetes()
            return true
        } catch (error) {
            console.error("updatePaquete error:", error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }, [session?.user?.accessToken, reloadPaquetes])

    const deletePaquete = useCallback(async (id: number) => {
        setIsLoading(true)
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
            })
            if (!resp.ok) {
                const text = await resp.text().catch(() => null)
                throw new Error(`Error deletePaquete: ${resp.status} ${text || resp.statusText}`)
            }
            await reloadPaquetes()
            return true
        } catch (error) {
            console.error("deletePaquete error:", error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }, [session?.user?.accessToken, reloadPaquetes])

    // sortedPaquetes (mismo algoritmo)
    const sortedPaquetes = useMemo(() => {
        const toHM = (t?: string) => (t ?? "").slice(0, 5)
        const safeDia = (d?: number | null) => (Number.isFinite(d) ? Number(d) : 99)
        const isRot = (p: PaqueteHoras) => !!p.rotativo
        const normWeeks = (p: PaqueteHoras): number[] => {
            const w = p.semanas ?? []
            return Array.isArray(w) ? Array.from(new Set(w)).sort((a, b) => a - b) : []
        }
        const cmpWeeks = (a: number[], b: number[]) => {
            const L = Math.max(a.length, b.length)
            for (let i = 0; i < L; i++) {
                const va = a[i] ?? 999
                const vb = b[i] ?? 999
                if (va !== vb) return va - vb
            }
            return 0
        }

        return [...filteredPaquetes].sort((a, b) => {
            const da = safeDia(a.diaSemana)
            const db = safeDia(b.diaSemana)
            if (da !== db) return da - db

            const ha = toHM(a.horaInicio)
            const hb = toHM(b.horaInicio)
            if (ha !== hb) return ha.localeCompare(hb)

            const ra = isRot(a) ? 1 : 0
            const rb = isRot(b) ? 1 : 0
            if (ra !== rb) return ra - rb

            if (ra === 1 && rb === 1) {
                const wa = normWeeks(a)
                const wb = normWeeks(b)
                const cmpw = cmpWeeks(wa, wb)
                if (cmpw !== 0) return cmpw
            }

            const fa = toHM(a.horaFin)
            const fb = toHM(b.horaFin)
            if (fa !== fb) return fa.localeCompare(fb)

            const ea = a.escuela?.Numero ?? ""
            const eb = b.escuela?.Numero ?? ""
            if (ea !== eb) return ea.localeCompare(eb, "es", { numeric: true, sensitivity: "base" })

            return (a.tipo ?? "").localeCompare(b.tipo ?? "")
        })
    }, [filteredPaquetes])

    return {
        // datos
        paquetes,
        filteredPaquetes,
        sortedPaquetes,
        profesionalesFiltrados,
        equipos,
        escuelasDelEquipo,

        // estados UI
        isLoading,
        paquetesCargados,
        verAnteriores,

        // control UI
        equipoSeleccionado,
        setEquipoSeleccionado,
        profesionalSeleccionado,
        setProfesionalSeleccionado,
        searchTerm,
        setSearchTerm,
        setVerAnteriores,

        // acciones
        fetchEscuelasDelEquipo,
        refreshProfesionalTotalHoras,
        reloadPaquetes,

        // CRUD
        createPaquete,
        updatePaquete,
        deletePaquete,
    }
}
