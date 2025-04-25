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

interface HorarioProfesional {
  id: number;
  profesionalId: number;
  profesionalNombre: string;
  tipoTrabajoId: number;
  tipoTrabajoNombre: string;
  escuelaId: number;
  escuelaNombre: string;
  lunes: string;
  martes: string;
  miercoles: string;
  jueves: string;
  viernes: string;
}

export default function GrillaHorarios() {
  const [horarios, setHorarios] = useState<HorarioProfesional[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [profesionalesFiltrados, setProfesionalesFiltrados] = useState<Profesional[]>([])
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [currentHorario, setCurrentHorario] = useState<HorarioProfesional | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredHorarios, setFilteredHorarios] = useState<HorarioProfesional[]>([])
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string>("")
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState<string>("")
  const [horariosCargados, setHorariosCargados] = useState(false)
  const [activeTab, setActiveTab] = useState<"seleccion" | "horarios">("seleccion")


  const tiposTrabajo = [
    { id: 1, nombre: "Escuela" },
    { id: 2, nombre: "Carga en GEI" },
    { id: 3, nombre: "Trabajo interdisciplinario" },
  ]

  const [formData, setFormData] = useState({
    profesionalId: "",
    tipoTrabajoId: "",
    escuelaId: "",
    lunes: "",
    martes: "",
    miercoles: "",
    jueves: "",
    viernes: "",
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
        setHorariosCargados(false)
      } catch (error) {
        console.error("Error fetching profesionales:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfesionales()
  }, [equipoSeleccionado])

  // Cargar horarios cuando se selecciona un profesional
  useEffect(() => {
    const fetchHorarios = async () => {
      if (!profesionalSeleccionado) {
        setHorarios([])
        setFilteredHorarios([])
        setHorariosCargados(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/horarios?profesionalId=${profesionalSeleccionado}`
        )
        
        if (!response.ok) throw new Error('Error al obtener horarios')
        
        const horariosData = await response.json()
        setHorarios(horariosData)
        setFilteredHorarios(horariosData)
        setHorariosCargados(true)
      } catch (error) {
        console.error("Error fetching horarios:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHorarios()
  }, [profesionalSeleccionado])

  // Filtrar horarios cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredHorarios(horarios)
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase()
      const filtered = horarios.filter(
        (horario) =>
          (horario.escuelaNombre?.toLowerCase() || '').includes(lowerSearchTerm) ||
          horario.tipoTrabajoNombre.toLowerCase().includes(lowerSearchTerm)
      )
      setFilteredHorarios(filtered)
    }
  }, [searchTerm, horarios])

  const handleOpenModal = (horario?: HorarioProfesional) => {
    if (horario) {
      setCurrentHorario(horario)
      setFormData({
        profesionalId: horario.profesionalId.toString(),
        tipoTrabajoId: horario.tipoTrabajoId.toString(),
        escuelaId: horario.escuelaId?.toString() || "",
        lunes: horario.lunes || "",
        martes: horario.martes || "",
        miercoles: horario.miercoles || "",
        jueves: horario.jueves || "",
        viernes: horario.viernes || "",
      })
    } else {
      setCurrentHorario(null)
      setFormData({
        profesionalId: profesionalSeleccionado,
        tipoTrabajoId: "",
        escuelaId: "",
        lunes: "",
        martes: "",
        miercoles: "",
        jueves: "",
        viernes: "",
      })
    }
    setOpenModal(true)
  }

  const handleCloseModal = () => setOpenModal(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === "tipoTrabajoId") {
      // Si el tipo de trabajo no es "Escuela", resetear el valor de escuela
      if (value !== "1") {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          escuelaId: ""
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const profesional = profesionales.find((p) => p.id.toString() === formData.profesionalId)
      const tipoTrabajo = tiposTrabajo.find((t) => t.id.toString() === formData.tipoTrabajoId)
      const escuela = escuelas.find((e) => e.id.toString() === formData.escuelaId)

      if (!profesional || !tipoTrabajo) {
        throw new Error("Datos incompletos")
      }

      // Solo requerir escuela si el tipo de trabajo es "Escuela"
      if (tipoTrabajo.nombre === "Escuela" && !escuela) {
        throw new Error("Debe seleccionar una escuela para el tipo de trabajo 'Escuela'")
      }

      const url = currentHorario
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/horarios/${currentHorario.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/horarios`

      const requestBody = {
        profesionalId: parseInt(formData.profesionalId),
        profesionalNombre: `${profesional.nombre} ${profesional.apellido}`,
        tipoTrabajoId: parseInt(formData.tipoTrabajoId),
        tipoTrabajoNombre: tipoTrabajo.nombre,
        escuelaId: tipoTrabajo.nombre === "Escuela" ? parseInt(formData.escuelaId) : null,
        escuelaNombre: tipoTrabajo.nombre === "Escuela" ? escuela?.nombre : null,
        lunes: formData.lunes || null,
        martes: formData.martes || null,
        miercoles: formData.miercoles || null,
        jueves: formData.jueves || null,
        viernes: formData.viernes || null
      }

      console.log('Tipo de trabajo:', tipoTrabajo.nombre)
      console.log('Escuela seleccionada:', escuela?.nombre)
      console.log('Request body completo:', JSON.stringify(requestBody, null, 2))

      const response = await fetch(url, {
        method: currentHorario ? 'PATCH' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al guardar el horario')
      }

      const nuevoHorario = await response.json()
      
      if (currentHorario) {
        setHorarios(prev => prev.map(h => h.id === currentHorario.id ? nuevoHorario : h))
      } else {
        setHorarios(prev => [...prev, nuevoHorario])
      }

      handleCloseModal()
    } catch (error) {
      console.error("Error al guardar el horario:", error)
      alert("Error al guardar el horario: " + error)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro que desea eliminar este horario?")) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/horarios/${id}`, {
          method: 'DELETE'
        })

        if (!response.ok) throw new Error('Error al eliminar el horario')

        setHorarios(prev => prev.filter(h => h.id !== id))
      } catch (error) {
        console.error("Error al eliminar el horario:", error)
        alert("Error al eliminar el horario: " + error)
      }
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
    <div className="flex flex-col w-full min-h-screen bg-background">
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-bold">Grilla de Horarios Semanales</CardTitle>
          </CardHeader>
          <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="seleccion">Selección</TabsTrigger>
                <TabsTrigger value="horarios" disabled={!horariosCargados}>
                  Horarios
                </TabsTrigger>
              </TabsList>

              <TabsContent value="seleccion" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Selector de Equipo */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md flex items-center">
                        <UsersIcon className="w-5 h-5 mr-2" />
                        Seleccionar Equipo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select value={equipoSeleccionado} onValueChange={setEquipoSeleccionado}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un equipo" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {equipos.map((equipo) => (
                            <SelectItem key={equipo.id} value={equipo.id.toString()}>
                              {equipo.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* Selector de Profesional */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md flex items-center">
                        <UserIcon className="w-5 h-5 mr-2" />
                        Seleccionar Profesional
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={profesionalSeleccionado}
                        onValueChange={setProfesionalSeleccionado}
                        disabled={!equipoSeleccionado}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              equipoSeleccionado ? "Selecciona un profesional" : "Primero selecciona un equipo"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {profesionalesFiltrados.map((profesional) => (
                            <SelectItem key={profesional.id} value={profesional.id.toString()}>
                              {profesional.nombre} {profesional.apellido}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>

                {profesionalSeleccionado && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      Mostrando horarios de <strong>{getNombreProfesionalSeleccionado()}</strong> del equipo{" "}
                      <strong>{getNombreEquipoSeleccionado()}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                {profesionalSeleccionado && (
                  <div className="flex justify-end mt-4">
                    <Button onClick={() => setActiveTab("horarios")}>
                        Ver Horarios
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="horarios" className="space-y-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold">
                      Horarios de {getNombreProfesionalSeleccionado()} - {getNombreEquipoSeleccionado()}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative max-w-sm">
                      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Buscar por escuela o tipo..."
                        className="pl-8 w-[200px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => handleOpenModal()}>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Agregar Horario
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo de Trabajo</TableHead>
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
                      {filteredHorarios.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-4">
                            No se encontraron horarios para este profesional
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredHorarios.map((horario) => (
                          <TableRow key={horario.id}>
                            <TableCell>{horario.tipoTrabajoNombre}</TableCell>
                            <TableCell>{horario.escuelaNombre}</TableCell>
                            <TableCell>{horario.lunes || "-"}</TableCell>
                            <TableCell>{horario.martes || "-"}</TableCell>
                            <TableCell>{horario.miercoles || "-"}</TableCell>
                            <TableCell>{horario.jueves || "-"}</TableCell>
                            <TableCell>{horario.viernes || "-"}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenModal(horario)}>
                                <FilePenIcon className="w-4 h-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(horario.id)}>
                                <TrashIcon className="w-4 h-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setActiveTab("seleccion")}>
                    Volver a Selección
                </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentHorario ? "Editar" : "Agregar"} Horario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="profesionalId">Profesional</Label>
              <Select
                name="profesionalId"
                onValueChange={(value) => handleSelectChange("profesionalId", value)}
                value={formData.profesionalId}
                disabled={!currentHorario && !!profesionalSeleccionado}
                required
              >
                <SelectTrigger id="profesionalId">
                  <SelectValue placeholder="Selecciona un profesional" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {profesionales.map((profesional) => (
                      <SelectItem key={profesional.id} value={profesional.id.toString()}>
                        {profesional.nombre} {profesional.apellido}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tipoTrabajoId">Tipo de Trabajo</Label>
              <Select
                name="tipoTrabajoId"
                onValueChange={(value) => handleSelectChange("tipoTrabajoId", value)}
                value={formData.tipoTrabajoId}
                required
              >
                <SelectTrigger id="tipoTrabajoId">
                  <SelectValue placeholder="Selecciona un tipo de trabajo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposTrabajo.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id.toString()}>
                      {tipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="escuelaId">Escuela</Label>
              <Select
                name="escuelaId"
                onValueChange={(value) => handleSelectChange("escuelaId", value)}
                value={formData.escuelaId}
                disabled={formData.tipoTrabajoId !== "1"}
                required={formData.tipoTrabajoId === "1"}
              >
                <SelectTrigger id="escuelaId">
                  <SelectValue placeholder={"Selecciona una escuela"} />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {escuelas.map((escuela) => (
                      <SelectItem key={escuela.id} value={escuela.id.toString()}>
                        {escuela.nombre}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lunes">Lunes</Label>
                <Input
                  id="lunes"
                  name="lunes"
                  placeholder="Ej: 09:00 a 13:00"
                  value={formData.lunes}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="martes">Martes</Label>
                <Input
                  id="martes"
                  name="martes"
                  placeholder="Ej: 09:00 a 13:00"
                  value={formData.martes}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="miercoles">Miércoles</Label>
                <Input
                  id="miercoles"
                  name="miercoles"
                  placeholder="Ej: 09:00 a 13:00"
                  value={formData.miercoles}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="jueves">Jueves</Label>
                <Input
                  id="jueves"
                  name="jueves"
                  placeholder="Ej: 09:00 a 13:00"
                  value={formData.jueves}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="viernes">Viernes</Label>
                <Input
                  id="viernes"
                  name="viernes"
                  placeholder="Ej: 09:00 a 13:00"
                  value={formData.viernes}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 