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

interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
  equipos: {
    id: number;
    nombre: string;
  }[];
}

interface Escuela {
  id: number;
  nombre: string;
}

interface Equipo {
  id: number;
  nombre: string;
  seccion: string;
}

interface PaqueteHoras {
  id: number;
  tipo: string;
  cantidad: number;
  profesional: {
    id: number;
    nombre: string;
    apellido: string;
  };
  escuela?: {
    id: number;
    nombre: string;
  };
  equipo: {
    id: number;
    nombre: string;
  };
  dias: {
    lunes: string | null;
    martes: string | null;
    miercoles: string | null;
    jueves: string | null;
    viernes: string | null;
  };
}

export default function GrillaHorarios() {
  const [paquetes, setPaquetes] = useState<PaqueteHoras[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [profesionalesFiltrados, setProfesionalesFiltrados] = useState<Profesional[]>([])
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
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
    cantidad: "",
    escuelaId: "",
    equipoId: "",
    dias: {
      lunes: "",
      martes: "",
      miercoles: "",
      jueves: "",
      viernes: ""
    }
  })

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true)
      try {
        const [escuelasRes, equiposRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`)
        ])

        if (!escuelasRes.ok || !equiposRes.ok) throw new Error('Error al obtener datos iniciales')

        const [escuelasData, equiposData] = await Promise.all([
          escuelasRes.json(),
          equiposRes.json()
        ])

        setEscuelas(escuelasData)
        setEquipos(equiposData)
      } catch (error) {
        console.error("Error fetching initial data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  // Cargar profesionales cuando se selecciona un equipo
  useEffect(() => {
    const fetchProfesionales = async () => {
      if (!equipoSeleccionado) {
        setProfesionalesFiltrados([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals`)
        if (!response.ok) throw new Error('Error al obtener profesionales')
        
        const profesionalesData = await response.json()
        const filtrados = profesionalesData.filter((prof: Profesional) => 
          prof.equipos.some(equipo => equipo.id.toString() === equipoSeleccionado)
        )

        setProfesionales(profesionalesData)
        setProfesionalesFiltrados(filtrados)
        setProfesionalSeleccionado("")
        setPaquetesCargados(false)
      } catch (error) {
        console.error("Error fetching profesionales:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfesionales()
  }, [equipoSeleccionado])

  // Cargar paquetes cuando se selecciona un profesional
  useEffect(() => {
    const fetchPaquetes = async () => {
      if (!profesionalSeleccionado) {
        setPaquetes([])
        setFilteredPaquetes([])
        setPaquetesCargados(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes?profesionalId=${profesionalSeleccionado}`
        )
        
        if (!response.ok) throw new Error('Error al obtener paquetes')
        
        const paquetesData = await response.json()
        setPaquetes(paquetesData)
        setFilteredPaquetes(paquetesData)
        setPaquetesCargados(true)
      } catch (error) {
        console.error("Error fetching paquetes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPaquetes()
  }, [profesionalSeleccionado])

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
        cantidad: paquete.cantidad.toString(),
        escuelaId: paquete.escuela?.id.toString() || "",
        equipoId: paquete.equipo.id.toString(),
        dias: {
          lunes: paquete.dias.lunes || "",
          martes: paquete.dias.martes || "",
          miercoles: paquete.dias.miercoles || "",
          jueves: paquete.dias.jueves || "",
          viernes: paquete.dias.viernes || ""
        }
      })
    } else {
      setCurrentPaquete(null)
      setFormData({
        tipo: tiposPaquete[0],
        cantidad: "",
        escuelaId: "",
        equipoId: equipoSeleccionado,
        dias: {
          lunes: "",
          martes: "",
          miercoles: "",
          jueves: "",
          viernes: ""
        }
      })
    }
    setOpenModal(true)
  }

  const handleCloseModal = () => setOpenModal(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name.startsWith("dias.")) {
      const dia = name.split(".")[1]
      setFormData(prev => ({
        ...prev,
        dias: {
          ...prev.dias,
          [dia]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    // Si el tipo cambia a "Carga en GEI" o "Trabajo Interdisciplinario", limpiar la escuela
    if (name === "tipo" && (value === "Carga en GEI" || value === "Trabajo Interdisciplinario")) {
      setFormData(prev => ({ ...prev, escuelaId: "" }))
    }
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: formData.tipo,
          cantidad: Number.parseInt(formData.cantidad),
          escuelaId: formData.tipo === "Escuela" ? Number.parseInt(formData.escuelaId) : null,
          equipoId: Number.parseInt(formData.equipoId),
          profesionalId: Number.parseInt(profesionalSeleccionado),
          dias: {
            lunes: formData.dias.lunes || null,
            martes: formData.dias.martes || null,
            miercoles: formData.dias.miercoles || null,
            jueves: formData.dias.jueves || null,
            viernes: formData.dias.viernes || null
          }
        }),
      })

      if (!response.ok) throw new Error('Error al guardar el paquete')

      // Recargar los paquetes
      const updatedResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes?profesionalId=${profesionalSeleccionado}`
      )
      if (!updatedResponse.ok) throw new Error('Error al actualizar los paquetes')
      
      const updatedPaquetes = await updatedResponse.json()
      setPaquetes(updatedPaquetes)
      setFilteredPaquetes(updatedPaquetes)
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
      })

      if (!response.ok) throw new Error('Error al eliminar el paquete')

      // Recargar los paquetes
      const updatedResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/paquetes?profesionalId=${profesionalSeleccionado}`
      )
      if (!updatedResponse.ok) throw new Error('Error al actualizar los paquetes')
      
      const updatedPaquetes = await updatedResponse.json()
      setPaquetes(updatedPaquetes)
      setFilteredPaquetes(updatedPaquetes)
    } catch (error) {
      console.error("Error al eliminar el paquete:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getNombreProfesionalSeleccionado = () => {
    const profesional = profesionales.find((p) => p.id.toString() === profesionalSeleccionado)
    return profesional ? `${profesional.nombre} ${profesional.apellido}` : ""
  }

  const getNombreEquipoSeleccionado = () => {
    const equipo = equipos.find((e) => e.id.toString() === equipoSeleccionado)
    return equipo ? equipo.nombre : ""
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>
  }

  return (
    <div className="container mx-auto py-6">
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
                    <SelectContent>
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
                  <Button onClick={() => setActiveTab("horarios")}>
                    Ver Paquetes
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="horarios">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="h-5 w-5" />
                    <span className="font-semibold">{getNombreEquipoSeleccionado()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-5 w-5" />
                    <span className="font-semibold">{getNombreProfesionalSeleccionado()}</span>
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
                  <Button onClick={() => handleOpenModal()}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Agregar Paquete
                  </Button>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Escuela</TableHead>
                        <TableHead>Lunes</TableHead>
                        <TableHead>Martes</TableHead>
                        <TableHead>Miércoles</TableHead>
                        <TableHead>Jueves</TableHead>
                        <TableHead>Viernes</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPaquetes.map((paquete) => (
                        <TableRow key={paquete.id}>
                          <TableCell>{paquete.tipo}</TableCell>
                          <TableCell>{paquete.cantidad} horas</TableCell>
                          <TableCell>{paquete.escuela?.nombre || "-"}</TableCell>
                          <TableCell>{paquete.dias.lunes || "-"}</TableCell>
                          <TableCell>{paquete.dias.martes || "-"}</TableCell>
                          <TableCell>{paquete.dias.miercoles || "-"}</TableCell>
                          <TableCell>{paquete.dias.jueves || "-"}</TableCell>
                          <TableCell>{paquete.dias.viernes || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenModal(paquete)}
                            >
                              <FilePenIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(paquete.id)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
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
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad de Horas</Label>
                <Input
                  id="cantidad"
                  name="cantidad"
                  type="number"
                  min="1"
                  value={formData.cantidad}
                  onChange={handleInputChange}
                  required
                />
              </div>
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
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {escuelas.map((escuela) => (
                      <SelectItem key={escuela.id} value={escuela.id.toString()}>
                        {escuela.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Días de la semana</Label>
                <div className="grid grid-cols-2 gap-4">
                  {["lunes", "martes", "miercoles", "jueves", "viernes"].map((dia) => (
                    <div className="space-y-2" key={dia}>
                      <Label htmlFor={`dias.${dia}`}>{dia.charAt(0).toUpperCase() + dia.slice(1)}</Label>
                      <Input
                        id={`dias.${dia}`}
                        name={`dias.${dia}`}
                        type="text"
                        placeholder="Ej: 8:00 - 12:00"
                        value={formData.dias[dia]}
                        onChange={handleInputChange}
                      />
                    </div>
                  ))}
                </div>
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
  )
} 