'use client'

import { useState, useEffect, useMemo, useCallback } from "react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusIcon, FilePenIcon, TrashIcon, SearchIcon, UsersIcon, UserIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ErrorBoundary from "@/components/ErrorBoundary"
import { useSession } from "next-auth/react"
import { PermissionButton } from "@/components/PermissionButton"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { PaqueteHoras } from "@/types/PaqueteHoras.interface"
 
interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
  licenciaActiva: boolean;
  totalHoras: number;
  fechaBaja?: string | null;
  equipos: {
    id: number;
    nombre: string;
  }[];
}

interface Escuela {
  id: number;
  Numero: string;
  nombre: string;
}

interface Equipo {
  id: number;
  nombre: string;
  profesionales?: Profesional[]; // Added profesionales to the interface
}


export default function GrillaHorarios() {
  const { data: session} = useSession()
  const [paquetes, setPaquetes] = useState<PaqueteHoras[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [profesionalesFiltrados, setProfesionalesFiltrados] = useState<Profesional[]>([])
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [escuelasDelEquipo, setEscuelasDelEquipo] = useState<Escuela[]>([])
  const [verAnteriores, setVerAnteriores] = useState(false);
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [currentPaquete, setCurrentPaquete] = useState<PaqueteHoras | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPaquetes, setFilteredPaquetes] = useState<PaqueteHoras[]>([])
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string>("")
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState<string>("")
  const [paquetesCargados, setPaquetesCargados] = useState(false)
  const [activeTab, setActiveTab] = useState<"seleccion" | "horarios">("seleccion")

  const tiposPaquete = [
    "Escuela",
    "Carga en GEI",
    "Trabajo Interdisciplinario"
  ]

  const [formData, setFormData] = useState({
    tipo: "",
    escuelaId: "",
    equipoId: "",
    diaSemana: "",
    horaInicio: "",
    horaFin: "",
    rotativo: false,
    semanas: [] as number[]
  })

  // Refrescar total de horas del profesional seleccionado desde el backend
  const refreshProfesionalTotalHoras = useCallback(async () => {
    try {
      if (!profesionalSeleccionado) return;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${profesionalSeleccionado}`,
        { headers: { Authorization: `Bearer ${session?.user?.accessToken}` } }
      );
      if (!res.ok) return;
      const prof = await res.json();
      setProfesionalesFiltrados(prev =>
        prev.map(p => (p.id === prof.id ? { ...p, totalHoras: prof.totalHoras } : p))
      );
    } catch {/* no-op */}
  }, [profesionalSeleccionado, session?.user?.accessToken]);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true)
      try {
        const [equiposRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/short?page=1&limit=100${verAnteriores ? '&onlyFormer=true' : ''}`, {
            headers: { Authorization: `Bearer ${session?.user?.accessToken}`}
          }),
        ])

        if (!equiposRes.ok) throw new Error('Error al obtener datos iniciales')

        const [equiposData] = await Promise.all([
          equiposRes.json()
        ])

        setEquipos(equiposData.data || [])
      } catch (error) {
        console.error("Error fetching initial data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
    setEquipoSeleccionado('');
    setProfesionalSeleccionado('');
    setPaquetes([]);
    setFilteredPaquetes([]);
    setPaquetesCargados(false);
  }, [session?.user?.accessToken, verAnteriores])

  // Cargar escuelas del equipo cuando se abre el modal
  const fetchEscuelasDelEquipo = async (equipoId: string) => {
    if (!equipoId) {
      setEscuelasDelEquipo([])
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/por-equipo/${equipoId}`, {
        headers: { Authorization: `Bearer ${session?.user?.accessToken}`}
      })
      
      if (!response.ok) throw new Error('Error al obtener escuelas del equipo')
      
      const escuelasData = await response.json()
      setEscuelasDelEquipo(escuelasData.data || escuelasData)
    } catch (error) {
      console.error("Error fetching escuelas del equipo:", error)
      setEscuelasDelEquipo([])
    }
  }

  // Reemplazar el useEffect que carga profesionales al seleccionar un equipo:
  useEffect(() => {
    if (!equipoSeleccionado) {
      setProfesionalesFiltrados([])
      return
    }
    setIsLoading(true)
    try {
      const equipo = equipos.find(e => e.id.toString() === equipoSeleccionado)
      if (equipo && equipo.profesionales) {
        setProfesionalesFiltrados(equipo.profesionales)
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

  // Cargar paquetes cuando se selecciona un profesional
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
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes?profesionalId=${profesionalSeleccionado}${verAnteriores ? '&includeDeleted=true' : ''}`,
          {
            headers: { Authorization: `Bearer ${session?.user.accessToken}`}
          }
        )
        
        if (!response.ok) throw new Error('Error al obtener paquetes')
        
        const paquetesData = await response.json()

        // Filtrar los paquetes por el equipo seleccionado
        const paquetesFiltrados = paquetesData.filter(
          (paquete: any) => paquete.equipo.id.toString() === equipoSeleccionado
        )

        // Normalizar estructura (soportar backend con campo 'dias')
        const normalizados: PaqueteHoras[] = paquetesFiltrados.map((p: any) => ({
          ...p,
          diaSemana: p.diaSemana ?? p.dias?.diaSemana ?? null,
          horaInicio: (p.horaInicio ?? p.dias?.horaInicio ?? '').toString().slice(0,5),
          horaFin: (p.horaFin ?? p.dias?.horaFin ?? '').toString().slice(0,5),
          rotativo: p.rotativo ?? p.dias?.rotativo ?? false,
          semanas: p.semanas ?? p.dias?.semanas ?? null,
        }))

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
  }, [profesionalSeleccionado, equipoSeleccionado, session?.user.accessToken, refreshProfesionalTotalHoras, verAnteriores])

  // Filtrar paquetes cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPaquetes(paquetes)
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase()
      const filtered = paquetes.filter(
        (paquete) =>
          (paquete.escuela?.nombre?.toLowerCase() || '').includes(lowerSearchTerm) ||
          paquete.tipo.toLowerCase().includes(lowerSearchTerm)
      )
      setFilteredPaquetes(filtered)
    }
  }, [searchTerm, paquetes])

  const handleOpenModal = (paquete?: PaqueteHoras) => {
    if (paquete) {
      setCurrentPaquete(paquete)
      setFormData({
        tipo: paquete.tipo,
        escuelaId: paquete.escuela?.id.toString() || "",
        equipoId: paquete.equipo.id.toString(),
        diaSemana: (paquete.diaSemana ?? (paquete as any)?.dias?.diaSemana ?? '').toString(),
        horaInicio: (paquete.horaInicio ?? (paquete as any)?.dias?.horaInicio ?? '').toString().slice(0,5),
        horaFin: (paquete.horaFin ?? (paquete as any)?.dias?.horaFin ?? '').toString().slice(0,5),
        rotativo: paquete.rotativo ?? (paquete as any)?.dias?.rotativo ?? false,
        semanas: paquete.semanas ?? (paquete as any)?.dias?.semanas ?? []
      })
      // Cargar escuelas del equipo del paquete
      fetchEscuelasDelEquipo(paquete.equipo.id.toString())
    } else {
      setCurrentPaquete(null)
      setFormData({
        tipo: tiposPaquete[0],
        escuelaId: "",
        equipoId: equipoSeleccionado,
        diaSemana: "",
        horaInicio: "",
        horaFin: "",
        rotativo: false,
        semanas: []
      })
      // Cargar escuelas del equipo seleccionado
      fetchEscuelasDelEquipo(equipoSeleccionado)
    }
    setOpenModal(true)
  }

  const handleCloseModal = () => setOpenModal(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    if (name === "rotativo") {
      setFormData(prev => ({ ...prev, rotativo: checked }))
      return
    }
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    // Si el tipo cambia a "Carga en GEI" o "Trabajo Interdisciplinario", limpiar la escuela
    if (name === "tipo" && (value === "Carga en GEI" || value === "Trabajo Interdisciplinario")) {
      setFormData(prev => ({ ...prev, escuelaId: "" }))
    }
  }

  const toggleSemana = (sem: number) => {
    setFormData(prev => {
      const present = prev.semanas.includes(sem)
      return { ...prev, semanas: present ? prev.semanas.filter(s => s !== sem) : [...prev.semanas, sem] }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = currentPaquete
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes/${currentPaquete.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes`

      const method = currentPaquete ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`
         },
        body: JSON.stringify({
          tipo: formData.tipo,
          escuelaId: formData.tipo === "Escuela" ? Number.parseInt(formData.escuelaId) : null,
          equipoId: Number.parseInt(formData.equipoId),
          profesionalId: Number.parseInt(profesionalSeleccionado),
          diaSemana: formData.diaSemana ? Number.parseInt(formData.diaSemana) : null,
          horaInicio: formData.horaInicio,
          horaFin: formData.horaFin,
          rotativo: formData.rotativo,
          semanas: formData.rotativo ? formData.semanas : null
        }),
      })

      if (!response.ok) throw new Error('Error al guardar el paquete')

      // Recargar los paquetes
      const updatedResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes?profesionalId=${profesionalSeleccionado}${verAnteriores ? '&includeDeleted=true' : ''}`,
        {
          headers: { Authorization: `Bearer ${session?.user.accessToken}`}
        }
      )
      if (!updatedResponse.ok) throw new Error('Error al actualizar los paquetes')
      
      const updatedPaquetes = await updatedResponse.json()
      const paquetesFiltrados = updatedPaquetes.filter(
          (paquete: any) => paquete.equipo.id.toString() === equipoSeleccionado
        )
      const normalizados: PaqueteHoras[] = paquetesFiltrados.map((p: any) => ({
        ...p,
        diaSemana: p.diaSemana ?? p.dias?.diaSemana ?? null,
        horaInicio: (p.horaInicio ?? p.dias?.horaInicio ?? '').toString().slice(0,5),
        horaFin: (p.horaFin ?? p.dias?.horaFin ?? '').toString().slice(0,5),
        rotativo: p.rotativo ?? p.dias?.rotativo ?? false,
        semanas: p.semanas ?? p.dias?.semanas ?? null,
      }))
      setPaquetes(normalizados)
      setFilteredPaquetes(normalizados)
      await refreshProfesionalTotalHoras()
      setOpenModal(false)
    } catch (error) {
      console.error("Error al guardar el paquete:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este paquete?")) return

    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.user.accessToken}`
        }
      })

      if (!response.ok) throw new Error('Error al eliminar el paquete')

      // Recargar los paquetes
      const updatedResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes?profesionalId=${profesionalSeleccionado}${verAnteriores ? '&includeDeleted=true' : ''}`,
        {
          headers: { Authorization: `Bearer ${session?.user.accessToken}`}
        }
      )
      if (!updatedResponse.ok) throw new Error('Error al actualizar los paquetes')
      
      const updatedPaquetes = await updatedResponse.json()
      const paquetesFiltrados = updatedPaquetes.filter(
        (paquete: any) => paquete.equipo.id.toString() === equipoSeleccionado
      )
      const normalizados: PaqueteHoras[] = paquetesFiltrados.map((p: any) => ({
        ...p,
        diaSemana: p.diaSemana ?? p.dias?.diaSemana ?? null,
        horaInicio: (p.horaInicio ?? p.dias?.horaInicio ?? '').toString().slice(0,5),
        horaFin: (p.horaFin ?? p.dias?.horaFin ?? '').toString().slice(0,5),
        rotativo: p.rotativo ?? p.dias?.rotativo ?? false,
        semanas: p.semanas ?? p.dias?.semanas ?? null,
      }))
      setPaquetes(normalizados)
      setFilteredPaquetes(normalizados)
      await refreshProfesionalTotalHoras()
    } catch (error) {
      console.error("Error al eliminar el paquete:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getNombreEquipoSeleccionado = () => {
    const equipo = equipos.find(e => e.id.toString() === equipoSeleccionado)
    return equipo ? equipo.nombre : ""
  }

  const getNombreProfesionalSeleccionado = () => {
    const profesional = profesionalesFiltrados.find(p => p.id.toString() === profesionalSeleccionado)
    return profesional ? `${profesional.nombre} ${profesional.apellido}` : ""
  }

  const getTotalHoras = () => {
    if (!profesionalSeleccionado) return 0;
    const profesional = profesionalesFiltrados.find(p => p.id.toString() === profesionalSeleccionado);
    return profesional?.totalHoras || 0;
  };

  const sortedPaquetes = useMemo(() => {
    const toHM = (t?: string) => (t ?? "").slice(0, 5);           // "HH:MM"
    const safeDia = (d?: number | null) => (Number.isFinite(d) ? Number(d) : 99);
    const isRot = (p: PaqueteHoras) => !!p.rotativo;
    const normWeeks = (p: PaqueteHoras): number[] => {
      const w = p.semanas ?? [];
      return Array.isArray(w) ? Array.from(new Set(w)).sort((a, b) => a - b) : [];
    };
  
    const cmpWeeks = (a: number[], b: number[]) => {
      // Orden lexicográfico: [1] < [1,3] < [2] < [2,4] ...
      const L = Math.max(a.length, b.length);
      for (let i = 0; i < L; i++) {
        const va = a[i] ?? 999;
        const vb = b[i] ?? 999;
        if (va !== vb) return va - vb;
      }
      return 0;
    };
  
    return [...filteredPaquetes].sort((a, b) => {
      // 1) Día
      const da = safeDia(a.diaSemana);
      const db = safeDia(b.diaSemana);
      if (da !== db) return da - db;
  
      // 2) Hora inicio
      const ha = toHM(a.horaInicio);
      const hb = toHM(b.horaInicio);
      if (ha !== hb) return ha.localeCompare(hb);
  
      // 3) No rotativo primero, luego rotativo
      const ra = isRot(a) ? 1 : 0;
      const rb = isRot(b) ? 1 : 0;
      if (ra !== rb) return ra - rb;
  
      // 4) Entre rotativos, ordenar por semanas (lexicográfico)
      if (ra === 1 && rb === 1) {
        const wa = normWeeks(a);
        const wb = normWeeks(b);
        const cmpw = cmpWeeks(wa, wb);
        if (cmpw !== 0) return cmpw;
      }
  
      // 5) Hora fin
      const fa = toHM(a.horaFin);
      const fb = toHM(b.horaFin);
      if (fa !== fb) return fa.localeCompare(fb);
  
      // 6) Estabilidad visual: número de escuela, luego tipo
      const ea = a.escuela?.Numero ?? "";
      const eb = b.escuela?.Numero ?? "";
      if (ea !== eb) return ea.localeCompare(eb, "es", { numeric: true, sensitivity: "base" });
  
      return (a.tipo ?? "").localeCompare(b.tipo ?? "");
    });
  }, [filteredPaquetes]);
  

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>
  }

  return (
    <ErrorBoundary>
    <div className="container mx-auto px-2 sm:px-4">
      <Card className="w-full max-w-[100vw] overflow-x-hidden">
        <CardHeader className="px-3 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Grilla de Paquetes de Horas</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 overflow-x-hidden max-w-[100vw]">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as "seleccion" | "horarios")}
            className="w-full max-w-[100vw] overflow-x-hidden"
            >
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="seleccion" className="text-xs sm:text-sm">Selección</TabsTrigger>
              <TabsTrigger value="horarios" disabled={!paquetesCargados} className="text-xs sm:text-sm">Paquetes</TabsTrigger>
            </TabsList>

            <TabsContent value="seleccion" className="space-y-4">
              {/* barra superior con el toggle a la derecha */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {verAnteriores ? "Mostrando profesionales anteriores" : "Mostrando profesionales activos"}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="toggleAnteriores" className="text-xs sm:text-sm">Profesionales anteriores</Label>
                  <Switch
                    id="toggleAnteriores"
                    checked={verAnteriores}
                    onCheckedChange={setVerAnteriores}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Equipo</Label>
                  <Select value={equipoSeleccionado} onValueChange={setEquipoSeleccionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un equipo" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-80 overflow-y-auto">
                      {equipos.map((equipo) => (
                        <SelectItem key={equipo.id} value={equipo.id.toString()}>
                          {equipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Profesional</Label>
                  <Select
                    value={profesionalSeleccionado}
                    onValueChange={setProfesionalSeleccionado}
                    disabled={!equipoSeleccionado}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un profesional" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {profesionalesFiltrados.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.nombre} {p.apellido}
                          {verAnteriores && p.fechaBaja && (
                            <span className="ml-2 text-xs text-red-600">
                              (baja {new Date(p.fechaBaja).toLocaleDateString('es-AR')})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {profesionalSeleccionado && (
                <div className="flex justify-end">
                  <PermissionButton
                    requiredPermission={{ entity: 'paquetehoras', action: 'read' }}
                    onClick={() => setActiveTab("horarios")}
                    className="w-full sm:w-auto"
                  >
                    Ver Paquetes
                  </PermissionButton>
                </div>
              )}
            </TabsContent>


            <TabsContent value="horarios">
  <div className="space-y-4 w-full overflow-x-hidden max-w-[100vw] min-w-0">
    {/* HEADER RESPONSIVE */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-6 min-w-0">
        <div className="flex items-center space-x-2 min-w-0">
          <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-semibold text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">
            {getNombreEquipoSeleccionado()}
          </span>
        </div>
        <div className="flex items-center space-x-2 min-w-0">
          <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-semibold text-sm sm:text-base max-w-[150px] sm:max-w-none">
            {getNombreProfesionalSeleccionado()}
          </span>
          {profesionalesFiltrados.find(p => p.id.toString() === profesionalSeleccionado)?.licenciaActiva && (
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
              ⚠️ En Licencia
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 px-2 py-1 rounded-lg">
          <span className="text-xs sm:text-sm font-medium text-blue-700">Total:</span>
          <span className="text-sm sm:text-lg font-bold text-blue-800">{getTotalHoras()}h</span>
        </div>
      </div>
      {verAnteriores && (
        <Badge variant="destructive" className="text-xs self-start sm:self-auto">
          Vista histórica (sólo lectura)
        </Badge>
      )}
    </div>

    {/* BARRA DE BÚSQUEDA Y BOTÓN */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
      <div className="relative w-full sm:w-64 min-w-0">
        <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 text-sm sm:text-base"
        />
      </div>
      <PermissionButton
        requiredPermission={{ entity: 'paquetehoras', action: 'create'}}
        onClick={() => handleOpenModal()}
        disabled={verAnteriores}
        className="w-full sm:w-auto text-sm"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Agregar Paquete
      </PermissionButton>
    </div>

    {/* CONTENEDOR DE TABLA — móvil: solo la tabla scrollea; desktop: sin scroll */}
<div className="w-full rounded-lg border">
  {/* Este contenedor crea el scroll horizontal SOLO para la tabla en móvil */}
  <div className="overflow-x-auto md:overflow-visible [-webkit-overflow-scrolling:touch]">
    {/* inline-block evita que el hijo fuerce el ancho del body; min-w da scroll en móvil */}
    <div className="inline-block align-top min-w-[760px] md:min-w-0 md:w-full">
      <Table className="w-full table-fixed md:table-auto">
        {/* Anchos proporcionales en desktop; 'Escuela' ancho grande */}
        <colgroup>
          <col className="md:w-[10%]" />   {/* Tipo */}
          <col className="md:w-[8%]" />    {/* Cantidad */}
          <col className="md:w-[45%]" />   {/* Escuela */}
          <col className="md:w-[10%]" />   {/* Día */}
          <col className="md:w-[7%]" />    {/* Inicio */}
          <col className="md:w-[7%]" />    {/* Fin */}
          <col className="md:w-[6%]" />    {/* Rotativo */}
          <col className="md:w-[7%]" />    {/* Semanas */}
          <col className="md:w-[10%]" />   {/* Acciones */}
        </colgroup>

        <TableHeader>
          <TableRow>
            <TableHead className="text-xs md:text-sm whitespace-nowrap">Tipo</TableHead>
            <TableHead className="text-xs md:text-sm whitespace-nowrap">Cantidad</TableHead>
            <TableHead className="text-xs md:text-sm">Escuela</TableHead>
            <TableHead className="text-xs md:text-sm whitespace-nowrap">Día</TableHead>
            <TableHead className="text-xs md:text-sm whitespace-nowrap">Inicio</TableHead>
            <TableHead className="text-xs md:text-sm whitespace-nowrap">Fin</TableHead>
            <TableHead className="text-xs md:text-sm whitespace-nowrap">Rotativo</TableHead>
            <TableHead className="text-xs md:text-sm whitespace-nowrap">Semanas</TableHead>
            <TableHead className="text-xs md:text-sm text-right whitespace-nowrap">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {sortedPaquetes.map((paquete) => {
            let tipoBorder = "", tipoBadge = ""
            if (paquete.tipo === "Escuela") {
              tipoBorder = "border-l-4 border-l-green-400 bg-green-50"
              tipoBadge  = "bg-green-100 text-green-800"
            } else if (paquete.tipo === "Carga en GEI") {
              tipoBorder = "border-l-4 border-l-violet-400 bg-violet-50"
              tipoBadge  = "bg-violet-100 text-violet-800"
            } else if (paquete.tipo === "Trabajo Interdisciplinario") {
              tipoBorder = "border-l-4 border-l-blue-400 bg-blue-100"
              tipoBadge  = "bg-blue-200 text-blue-800"
            }

            return (
              <TableRow key={paquete.id} className={paquete.rotativo ? "font-semibold" : ""}>
                <TableCell className={tipoBorder}>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${tipoBadge}`}>
                    {paquete.tipo}
                  </span>
                </TableCell>

                <TableCell className="whitespace-nowrap">{paquete.cantidad} h</TableCell>

                {/* ESCUELA
                   - móvil: truncado 1 línea + title
                   - desktop: envuelve por palabra (sin romper letra a letra) */}
                <TableCell>
                  <div
                    className="
                      max-w-[240px] md:max-w-none
                      whitespace-nowrap md:whitespace-normal
                      truncate md:truncate-none
                      md:break-words
                    "
                    title={
                      paquete.escuela?.nombre
                        ? `${paquete.escuela.nombre}${paquete.escuela?.Numero ? ` • N° ${paquete.escuela.Numero}` : ""}`
                        : "-"
                    }
                    style={{ wordBreak: "break-word", hyphens: "auto" }}
                  >
                    <div className="font-medium md:leading-snug">
                      {paquete.escuela?.nombre || "-"}
                    </div>
                    {paquete.escuela?.Numero && (
                      <div className="text-xs text-gray-500 md:leading-tight">
                        N° {paquete.escuela.Numero}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="whitespace-nowrap">
                  {["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][paquete.diaSemana] || "-"}
                </TableCell>
                <TableCell className="whitespace-nowrap">{paquete.horaInicio}</TableCell>
                <TableCell className="whitespace-nowrap">{paquete.horaFin}</TableCell>
                <TableCell className={`whitespace-nowrap ${paquete.rotativo ? "bg-yellow-100 text-yellow-800 font-semibold" : ""}`}>
                  {paquete.rotativo ? "Sí" : "No"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {paquete.rotativo && paquete.semanas?.length ? paquete.semanas.join(", ") : "-"}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <PermissionButton
                      requiredPermission={{ entity: "paquetehoras", action: "update" }}
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenModal(paquete)}
                      className="h-8 w-8"
                    >
                      <FilePenIcon className="h-4 w-4" />
                    </PermissionButton>
                    <PermissionButton
                      requiredPermission={{ entity: "paquetehoras", action: "delete" }}
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(paquete.id)}
                      className="h-8 w-8"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </PermissionButton>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  </div>
</div>

    {sortedPaquetes.length === 0 && (
      <div className="text-center py-8 text-gray-500">
        No se encontraron paquetes de horas
      </div>
    )}
  </div>
</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{currentPaquete ? "Editar" : "Agregar"} Paquete de Horas</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo" className="text-sm sm:text-base">Tipo de Paquete</Label>
                <Select
                  name="tipo"
                  value={formData.tipo}
                  onValueChange={(value) => handleSelectChange("tipo", value)}
                  required
                >
                  <SelectTrigger id="tipo" className="text-sm sm:text-base">
                    <SelectValue placeholder="Seleccione un tipo" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {tiposPaquete.map((tipo) => (
                      <SelectItem key={tipo} value={tipo} className="text-sm sm:text-base">
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="escuelaId" className="text-sm sm:text-base">Escuela</Label>
                <Select
                  name="escuelaId"
                  value={formData.escuelaId}
                  onValueChange={(value) => handleSelectChange("escuelaId", value)}
                  disabled={formData.tipo !== "Escuela"}
                >
                  <SelectTrigger id="escuelaId" className="text-sm sm:text-base">
                    <SelectValue placeholder="Seleccione una escuela" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="none" className="text-sm sm:text-base">Ninguna</SelectItem>
                    {escuelasDelEquipo?.map((escuela) => (
                      <SelectItem key={escuela.id} value={escuela.id.toString()} className="text-sm sm:text-base">
                        {escuela.nombre} {escuela.Numero}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diaSemana" className="text-sm sm:text-base">Día de la semana</Label>
                <Select
                  name="diaSemana"
                  value={formData.diaSemana}
                  onValueChange={(value) => handleSelectChange("diaSemana", value)}
                  required
                >
                  <SelectTrigger id="diaSemana" className="text-sm sm:text-base">
                    <SelectValue placeholder="Seleccione un día" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="1" className="text-sm sm:text-base">Lunes</SelectItem>
                    <SelectItem value="2" className="text-sm sm:text-base">Martes</SelectItem>
                    <SelectItem value="3" className="text-sm sm:text-base">Miércoles</SelectItem>
                    <SelectItem value="4" className="text-sm sm:text-base">Jueves</SelectItem>
                    <SelectItem value="5" className="text-sm sm:text-base">Viernes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horaInicio" className="text-sm sm:text-base">Hora inicio</Label>
                  <Input 
                    id="horaInicio" 
                    name="horaInicio" 
                    type="time" 
                    value={formData.horaInicio} 
                    onChange={handleInputChange} 
                    required 
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaFin" className="text-sm sm:text-base">Hora fin</Label>
                  <Input 
                    id="horaFin" 
                    name="horaFin" 
                    type="time" 
                    value={formData.horaFin} 
                    onChange={handleInputChange} 
                    required 
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input id="rotativo" name="rotativo" type="checkbox" checked={formData.rotativo} onChange={handleInputChange} />
                  <Label htmlFor="rotativo" className="text-sm sm:text-base">Horario rotativo</Label>
                </div>
                {formData.rotativo && (
                  <div>
                    <Label className="text-sm sm:text-base">Semanas del ciclo (1-4)</Label>
                    <div className="flex gap-3 mt-1">
                      {[1,2,3,4].map((s) => (
                        <label key={s} className="flex items-center gap-1 text-sm sm:text-base">
                          <input type="checkbox" checked={formData.semanas.includes(s)} onChange={() => toggleSemana(s)} />
                          <span>{s}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpenModal(false)} className="text-sm sm:text-base">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} onClick={handleSubmit} className="text-sm sm:text-base">
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ErrorBoundary>
  )
}