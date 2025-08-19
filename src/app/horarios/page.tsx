'use client'

import { useState, useEffect } from "react"
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

interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
  totalHoras: number;
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

interface PaqueteHoras {
  id: number;
  tipo: string;
  cantidad: number; // calculada por backend
  profesional: {
    id: number;
    nombre: string;
    apellido: string;
  };
  escuela?: {
    id: number;
    Numero: string;
    nombre: string;
  };
  equipo: {
    id: number;
    nombre: string;
  };
  diaSemana: number; // 0=Domingo .. 6=Sábado
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  rotativo: boolean;
  semanas?: number[] | null; // solo si rotativo
}

export default function GrillaHorarios() {
  const { data: session} = useSession()
  const [paquetes, setPaquetes] = useState<PaqueteHoras[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [profesionalesFiltrados, setProfesionalesFiltrados] = useState<Profesional[]>([])
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [escuelasDelEquipo, setEscuelasDelEquipo] = useState<Escuela[]>([])
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
  const refreshProfesionalTotalHoras = async () => {
    try {
      if (!profesionalSeleccionado) return
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${profesionalSeleccionado}`, {
        headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
      })
      if (!res.ok) return
      const prof = await res.json()
      setProfesionalesFiltrados(prev => prev.map(p => p.id === prof.id ? { ...p, totalHoras: prof.totalHoras } : p))
    } catch {
      // no-op
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true)
      try {
        const [equiposRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos?page=1&limit=100`, {
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
  }, [session?.user?.accessToken])

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
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes?profesionalId=${profesionalSeleccionado}`,
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
  }, [profesionalSeleccionado, equipoSeleccionado, session?.user.accessToken])

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
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes?profesionalId=${profesionalSeleccionado}`,
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
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes?profesionalId=${profesionalSeleccionado}`,
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>
  }

  return (
    <ErrorBoundary>
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Grilla de Paquetes de Horas</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "seleccion" | "horarios")}>
            <TabsList>
              <TabsTrigger value="seleccion">Selección</TabsTrigger>
              <TabsTrigger value="horarios" disabled={!paquetesCargados}>Paquetes</TabsTrigger>
            </TabsList>

            <TabsContent value="seleccion" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Equipo</Label>
                  <Select
                    value={equipoSeleccionado}
                    onValueChange={setEquipoSeleccionado}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un equipo" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80 overflow-y-auto">
                      {equipos.map((equipo) => (
                        <SelectItem key={equipo.id} value={equipo.id.toString()}>
                          {equipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Profesional</Label>
                  <Select
                    value={profesionalSeleccionado}
                    onValueChange={setProfesionalSeleccionado}
                    disabled={!equipoSeleccionado}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un profesional" />
                    </SelectTrigger>
                    <SelectContent>
                      {profesionalesFiltrados.map((profesional) => (
                        <SelectItem key={profesional.id} value={profesional.id.toString()}>
                          {profesional.nombre} {profesional.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {profesionalSeleccionado && (
                <div className="flex justify-end">
                  <PermissionButton 
                    requiredPermission={{ entity: 'paquetehoras', action: 'read'}}
                    onClick={() => setActiveTab("horarios")}>
                    Ver Paquetes
                  </PermissionButton>
                </div>
              )}
            </TabsContent>

            <TabsContent value="horarios">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <UsersIcon className="h-5 w-5" />
                      <span className="font-semibold">{getNombreEquipoSeleccionado()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-5 w-5" />
                      <span className="font-semibold">{getNombreProfesionalSeleccionado()}</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-lg">
                      <span className="text-sm font-medium text-blue-700">Total:</span>
                      <span className="text-lg font-bold text-blue-800">{getTotalHoras()} horas semanales</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="relative w-64">
                    <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <PermissionButton 
                    requiredPermission={{ entity: 'paquetehoras', action: 'create'}}
                    onClick={() => handleOpenModal()}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Agregar Paquete
                  </PermissionButton>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Escuela</TableHead>
                        <TableHead>Día</TableHead>
                        <TableHead>Inicio</TableHead>
                        <TableHead>Fin</TableHead>
                        <TableHead>Rotativo</TableHead>
                        <TableHead>Semanas</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPaquetes.map((paquete) => (
                        <TableRow key={paquete.id}>
                          <TableCell>{paquete.tipo}</TableCell>
                          <TableCell>{paquete.cantidad} horas</TableCell>
                          <TableCell>
                            {paquete.escuela?.nombre}
                            <br />
                            <small className="text-gray-500">{paquete.escuela?.Numero}</small>
                          </TableCell>
                          <TableCell>{["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][paquete.diaSemana] || "-"}</TableCell>
                          <TableCell>{paquete.horaInicio}</TableCell>
                          <TableCell>{paquete.horaFin}</TableCell>
                          <TableCell>{paquete.rotativo ? "Sí" : "No"}</TableCell>
                          <TableCell>{paquete.rotativo && paquete.semanas?.length ? paquete.semanas.join(', ') : '-'}</TableCell>
                          <TableCell className="text-right">
                            <PermissionButton
                              requiredPermission={{ entity: 'paquetehoras', action: 'update'}}
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenModal(paquete)}
                            >
                              <FilePenIcon className="h-4 w-4" />
                            </PermissionButton>
                            <PermissionButton
                              requiredPermission={{ entity: 'paquetehoras', action: 'delete'}}
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(paquete.id)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </PermissionButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{currentPaquete ? "Editar" : "Agregar"} Paquete de Horas</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Paquete</Label>
                <Select
                  name="tipo"
                  value={formData.tipo}
                  onValueChange={(value) => handleSelectChange("tipo", value)}
                  required
                >
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Seleccione un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposPaquete.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* cantidad ya no se ingresa manualmente */}
              <div className="space-y-2">
                <Label htmlFor="escuelaId">Escuela</Label>
                <Select
                  name="escuelaId"
                  value={formData.escuelaId}
                  onValueChange={(value) => handleSelectChange("escuelaId", value)}
                  disabled={formData.tipo !== "Escuela"}
                >
                  <SelectTrigger id="escuelaId">
                    <SelectValue placeholder="Seleccione una escuela" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <ScrollArea>
                      <SelectItem value="none">Ninguna</SelectItem>
                      {escuelasDelEquipo?.map((escuela) => (
                        <SelectItem key={escuela.id} value={escuela.id.toString()}>
                          {escuela.nombre} {escuela.Numero}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diaSemana">Día de la semana</Label>
                <Select
                  name="diaSemana"
                  value={formData.diaSemana}
                  onValueChange={(value) => handleSelectChange("diaSemana", value)}
                  required
                >
                  <SelectTrigger id="diaSemana">
                    <SelectValue placeholder="Seleccione un día" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Usamos 1..5 como antes */}
                    <SelectItem value="1">Lunes</SelectItem>
                    <SelectItem value="2">Martes</SelectItem>
                    <SelectItem value="3">Miércoles</SelectItem>
                    <SelectItem value="4">Jueves</SelectItem>
                    <SelectItem value="5">Viernes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horaInicio">Hora inicio</Label>
                  <Input id="horaInicio" name="horaInicio" type="time" value={formData.horaInicio} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaFin">Hora fin</Label>
                  <Input id="horaFin" name="horaFin" type="time" value={formData.horaFin} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input id="rotativo" name="rotativo" type="checkbox" checked={formData.rotativo} onChange={handleInputChange} />
                  <Label htmlFor="rotativo">Horario rotativo</Label>
                </div>
                {formData.rotativo && (
                  <div>
                    <Label>Semanas del ciclo (1-4)</Label>
                    <div className="flex gap-3 mt-1">
                      {[1,2,3,4].map((s) => (
                        <label key={s} className="flex items-center gap-1">
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} onClick={handleSubmit}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ErrorBoundary>
  )
} 