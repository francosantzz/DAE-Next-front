"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Pencil, Trash2, AlertCircle, Edit, XIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Layout from "./LayoutProf"
import ErrorBoundary from "../ErrorBoundary"
import { useSession } from "next-auth/react"

// Interfaces (unchanged)
interface Departamento {
  id: number
  nombre: string
}

interface Region {
  id: number
  nombre: string
}

interface Direccion {
  id: number
  calle: string
  numero: string
  departamento: Departamento
  region: Region
}

interface Escuela {
  id: number
  nombre: string
}

interface Equipo {
  id: number
  nombre: string
  departamento: Departamento
}

interface Dias {
  lunes: string | null
  martes: string | null
  miercoles: string | null
  jueves: string | null
  viernes: string | null
}

interface PaqueteHoras {
  id: number
  tipo: string
  cantidad: number
  equipo: Equipo
  escuela: Escuela
  dias: Dias
}

interface Profesional {
  id: number
  nombre: string
  apellido: string
  cuil: string
  profesion: string
  matricula: string
  telefono: string
  equipos: Equipo[]
  paquetesHoras: PaqueteHoras[]
  direccion: Direccion
  totalHorasProfesional: number
}

export default function PerfilProfesional({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const [profesional, setProfesional] = useState<Profesional | null>(null)
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPaqueteDialogOpen, setIsPaqueteDialogOpen] = useState(false)
  const [currentPaquete, setCurrentPaquete] = useState<PaqueteHoras | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cuil: "",
    profesion: "",
    matricula: "",
    telefono: "",
    equiposIds: [] as number[],
    direccion: {
      calle: "",
      numero: "",
      departamentoId: ""
    }
  })
  const [paqueteFormData, setPaqueteFormData] = useState({
    id: 0,
    tipo: "",
    cantidad: "",
    equipoId: "",
    escuelaId: "",
    dias: {
      lunes: "",
      martes: "",
      miercoles: "",
      jueves: "",
      viernes: "",
    },
  })
  const router = useRouter()

  const tiposPaquete = ["Escuela", "Trabajo Interdisciplinario", "Carga en Gei"]

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [profesionalRes, equiposRes, departamentosRes, escuelasRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${params.id}`, {
            headers: {Authorization: `Bearer ${session?.user?.accessToken}`}
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas`, {
            headers: { Authorization: `Bearer ${session?.user?.accessToken}`}
          }),
        ])

        if (!profesionalRes.ok || !equiposRes.ok || !departamentosRes.ok || !escuelasRes.ok)
          throw new Error("Error al obtener los datos")

        const [profesionalData, equiposData, departamentosData, escuelasData] = await Promise.all([
          profesionalRes.json(),
          equiposRes.json(),
          departamentosRes.json(),
          escuelasRes.json(),
        ])

        setProfesional(profesionalData)
        setEquipos(equiposData)
        setDepartamentos(departamentosData)
        setEscuelas(escuelasData.data || [])

        // Cargar los datos del profesional en el formulario
        setFormData({
          nombre: profesionalData.nombre,
          apellido: profesionalData.apellido,
          cuil: profesionalData.cuil,
          profesion: profesionalData.profesion,
          matricula: profesionalData.matricula,
          telefono: profesionalData.telefono,
          equiposIds: profesionalData.equipos.map((e: Equipo) => e.id),
          direccion: {
            calle: profesionalData.direccion.calle,
            numero: profesionalData.direccion.numero,
            departamentoId: profesionalData.direccion.departamento.id.toString()
          }
        })
      } catch (error) {
        console.error("Error al obtener datos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${params.id}`, {
        method: "PATCH",
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.accessToken}`
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          cuil: formData.cuil,
          profesion: formData.profesion,
          matricula: formData.matricula,
          telefono: formData.telefono,
          equiposIds: formData.equiposIds,
          direccion: {
            calle: formData.direccion.calle,
            numero: parseInt(formData.direccion.numero),
            departamentoId: parseInt(formData.direccion.departamentoId)
          }
        }),
      })

      if (!response.ok) throw new Error("Error al actualizar el profesional")

      const updatedProfesional = await response.json()
      setProfesional(updatedProfesional)
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error al actualizar el profesional:", error)
    }
  }

  const handlePaqueteEdit = (paquete: PaqueteHoras) => {
    setCurrentPaquete(paquete)
    setPaqueteFormData({
      id: paquete.id,
      tipo: paquete.tipo,
      cantidad: paquete.cantidad.toString(),
      equipoId: paquete.equipo.id.toString(),
      escuelaId: paquete.escuela.id.toString(),
      dias: {
        lunes: paquete.dias.lunes || "",
        martes: paquete.dias.martes || "",
        miercoles: paquete.dias.miercoles || "",
        jueves: paquete.dias.jueves || "",
        viernes: paquete.dias.viernes || "",
      },
    })
    setIsPaqueteDialogOpen(true)
  }

  const handlePaqueteDelete = async (paqueteId: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este paquete de horas?")) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${params.id}/paquetes/${paqueteId}`,
          {
            method: "DELETE",
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Error al eliminar el paquete de horas")
        }

        // Actualizar el estado local inmediatamente
        if (profesional) {
          const updatedPaquetes = profesional.paquetesHoras.filter((p) => p.id !== paqueteId)
          setProfesional({
            ...profesional,
            paquetesHoras: updatedPaquetes,
            totalHorasProfesional: updatedPaquetes.reduce((sum, p) => sum + p.cantidad, 0),
          })
        }
      } catch (error) {
        console.error("Error al eliminar el paquete de horas:", error)
        alert(error instanceof Error ? error.message : "Error al eliminar el paquete de horas")
      }
    }
  }

  const handlePaqueteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    try {
      // Validar que si el tipo no es Escuela, no se envíe escuelaId
      const requestData = {
        tipo: paqueteFormData.tipo,
        cantidad: Number(paqueteFormData.cantidad),
        equipoId: Number(paqueteFormData.equipoId),
        escuelaId: paqueteFormData.tipo === "Escuela" ? Number(paqueteFormData.escuelaId) : null,
        dias: paqueteFormData.dias,
      }

      const url = currentPaquete
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${params.id}/paquetes/${currentPaquete.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${params.id}/paquetes`
      const method = currentPaquete ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json",
          'Authorization': `Bearer ${session?.user?.accessToken}`
         },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al guardar el paquete de horas")
      }

      const updatedProfesional = await response.json()
      
      // Encontrar el paquete actualizado en la respuesta
      const updatedPaquete = updatedProfesional.paquetesHoras.find(
        (p: PaqueteHoras) => p.id === (currentPaquete?.id || updatedProfesional.paquetesHoras[updatedProfesional.paquetesHoras.length - 1].id)
      )

      // Encontrar el equipo correspondiente
      const equipo = equipos.find(e => e.id === Number(paqueteFormData.equipoId))

      // Construir el paquete actualizado con la información completa
      const paqueteCompleto = {
        ...updatedPaquete,
        equipo: equipo || { id: Number(paqueteFormData.equipoId), nombre: "Equipo no encontrado" },
        dias: updatedPaquete.dias || {
          lunes: "",
          martes: "",
          miercoles: "",
          jueves: "",
          viernes: ""
        }
      }

      // Actualizar el estado local inmediatamente
      if (profesional) {
        const updatedPaquetes = currentPaquete
          ? profesional.paquetesHoras.map((p) => (p.id === currentPaquete.id ? paqueteCompleto : p))
          : [...profesional.paquetesHoras, paqueteCompleto]

        setProfesional({
          ...profesional,
          paquetesHoras: updatedPaquetes,
          totalHorasProfesional: updatedPaquetes.reduce((sum, p) => sum + p.cantidad, 0),
        })
      }

      setIsPaqueteDialogOpen(false)
      setCurrentPaquete(null)
      setPaqueteFormData({
        id: 0,
        tipo: "",
        cantidad: "",
        equipoId: "",
        escuelaId: "",
        dias: {
          lunes: "",
          martes: "",
          miercoles: "",
          jueves: "",
          viernes: "",
        },
      })
    } catch (error) {
      console.error("Error al guardar el paquete de horas:", error)
      setFormError(error instanceof Error ? error.message : "Error al guardar el paquete de horas")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaqueteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name.startsWith("dias.")) {
      const dia = name.split(".")[1]
      setPaqueteFormData((prev) => ({
        ...prev,
        dias: {
          ...prev.dias,
          [dia]: value,
        },
      }))
    } else {
      setPaqueteFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handlePaqueteSelectChange = (name: string, value: string) => {
    setPaqueteFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!profesional) {
    return <div>No se encontró el profesional</div>
  }

  return (
    <ErrorBoundary>
    <Layout>
      <div className="container mx-auto py-8">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : profesional ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {profesional.nombre} {profesional.apellido}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
                    <div className="space-y-2">
                      <p><strong>CUIL:</strong> {profesional.cuil}</p>
                      <p><strong>Profesión:</strong> {profesional.profesion}</p>
                      <p><strong>Matrícula:</strong> {profesional.matricula}</p>
                      <p><strong>Teléfono:</strong> {profesional.telefono}</p>
                      <p><strong>Dirección:</strong> {profesional.direccion.calle} {profesional.direccion.numero}</p>
                      <p><strong>Departamento:</strong> {profesional.direccion.departamento.nombre}</p>
                      <p><strong>Región:</strong> {profesional.direccion.region.nombre}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Equipos</h3>
                    {profesional.equipos && profesional.equipos.length > 0 ? (
                      <div className="space-y-4">
                        {profesional.equipos.map((equipo) => (
                          <div key={equipo.id} className="p-4 border rounded-lg">
                            <h4 className="font-semibold">{equipo.nombre}</h4>
                            <p>Departamento: {equipo.departamento.nombre}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No hay equipos asignados</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Paquetes de Horas</CardTitle>
                <Button onClick={() => {
                  setCurrentPaquete(null)
                  setPaqueteFormData({
                    id: 0,
                    tipo: "",
                    cantidad: "",
                    equipoId: "",
                    escuelaId: "",
                    dias: {
                      lunes: "",
                      martes: "",
                      miercoles: "",
                      jueves: "",
                      viernes: "",
                    },
                  })
                  setIsPaqueteDialogOpen(true)
                }}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Agregar Paquete
                </Button>
              </CardHeader>
              <CardContent>
                {profesional.paquetesHoras && profesional.paquetesHoras.length > 0 ? (
                  <div className="space-y-4">
                    {profesional.paquetesHoras.map((paquete) => (
                      <div key={paquete.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{paquete.tipo}</h4>
                            <p>Cantidad: {paquete.cantidad} horas</p>
                            <p>Equipo: {paquete.equipo.nombre}</p>
                            {paquete.escuela && <p>Escuela: {paquete.escuela.nombre}</p>}
                            <div className="mt-2">
                              <p className="font-semibold">Días:</p>
                              <ul className="list-disc pl-5">
                                {Object.entries(paquete.dias).map(([dia, horario]) => (
                                  horario && (
                                    <li key={dia}>
                                      {dia.charAt(0).toUpperCase() + dia.slice(1)}: {horario}
                                    </li>
                                  )
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handlePaqueteEdit(paquete)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handlePaqueteDelete(paquete.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No hay paquetes de horas asignados</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Resumen de Horas</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  <strong>Horas totales:</strong> {profesional.paquetesHoras.reduce((sum, p) => sum + p.cantidad, 0)}
                </p>
              </CardContent>
            </Card>

            <section className="flex justify-between items-center">
              <Button variant="outline" onClick={() => router.push('/profesionales')}>
                Volver a la lista
              </Button>
              {session?.user?.role === 'admin' && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Editar Perfil
              </Button>
              )}
            </section>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se encontró el profesional solicitado.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="cuil">CUIL</Label>
              <Input
                id="cuil"
                name="cuil"
                value={formData.cuil}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="profesion">Profesión</Label>
              <Input
                id="profesion"
                name="profesion"
                value={formData.profesion}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                name="matricula"
                value={formData.matricula}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="direccion.calle">Calle</Label>
              <Input
                id="direccion.calle"
                name="direccion.calle"
                value={formData.direccion.calle}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  direccion: { ...prev.direccion, calle: e.target.value }
                }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="direccion.numero">Número</Label>
              <Input
                id="direccion.numero"
                name="direccion.numero"
                type="number"
                value={formData.direccion.numero}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  direccion: { ...prev.direccion, numero: e.target.value }
                }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="direccion.departamentoId">Departamento</Label>
              <Select
                name="direccion.departamentoId"
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  direccion: { ...prev.direccion, departamentoId: value }
                }))}
                value={formData.direccion.departamentoId}
                required
              >
                <SelectTrigger id="direccion.departamentoId">
                  <SelectValue placeholder="Seleccione un departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departamentos.map((departamento) => (
                    <SelectItem key={departamento.id} value={departamento.id.toString()}>
                      {departamento.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="equiposIds">Equipos</Label>
              <Select
                name="equiposIds"
                onValueChange={(value) => {
                  const equipoId = parseInt(value);
                  setFormData(prev => ({
                    ...prev,
                    equiposIds: prev.equiposIds.includes(equipoId)
                      ? prev.equiposIds.filter(id => id !== equipoId)
                      : [...prev.equiposIds, equipoId]
                  }))
                }}
                value=""
              >
                <SelectTrigger id="equiposIds">
                  <SelectValue placeholder="Seleccione equipos" />
                </SelectTrigger>
                <SelectContent>
                  {equipos.map((equipo) => (
                    <SelectItem key={equipo.id} value={equipo.id.toString()}>
                      {equipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.equiposIds.map(id => {
                  const equipo = equipos.find(e => e.id === id);
                  return equipo ? (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                      {equipo.nombre}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          equiposIds: prev.equiposIds.filter(eid => eid !== id)
                        }))}
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaqueteDialogOpen} onOpenChange={setIsPaqueteDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{currentPaquete ? "Editar" : "Agregar"} Paquete de Horas</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <form onSubmit={handlePaqueteSubmit} className="space-y-4">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Paquete</Label>
                <Select
                  name="tipo"
                  value={paqueteFormData.tipo}
                  onValueChange={(value) => {
                    setPaqueteFormData(prev => ({
                      ...prev,
                      tipo: value,
                      escuelaId: value !== "Escuela" ? "" : prev.escuelaId
                    }))
                  }}
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
                  value={paqueteFormData.cantidad}
                  onChange={handlePaqueteInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="escuelaId">Escuela</Label>
                <Select
                  name="escuelaId"
                  value={paqueteFormData.escuelaId}
                  onValueChange={(value) => handlePaqueteSelectChange("escuelaId", value)}
                  disabled={paqueteFormData.tipo !== "Escuela"}
                >
                  <SelectTrigger id="escuelaId">
                    <SelectValue placeholder="Seleccione una escuela" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="none">Ninguna</SelectItem>
                    {escuelas?.map((escuela) => (
                      <SelectItem key={escuela.id} value={escuela.id.toString()}>
                        {escuela.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipoId">Equipo</Label>
                <Select
                  name="equipoId"
                  value={paqueteFormData.equipoId}
                  onValueChange={(value) => handlePaqueteSelectChange("equipoId", value)}
                  required
                >
                  <SelectTrigger id="equipoId">
                    <SelectValue placeholder="Seleccione un equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {profesional?.equipos?.map((equipo) => (
                      <SelectItem key={equipo.id} value={equipo.id.toString()}>
                        {equipo.nombre}
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
                        value={paqueteFormData.dias[dia as keyof typeof paqueteFormData.dias]}
                        onChange={handlePaqueteInputChange}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsPaqueteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} onClick={handlePaqueteSubmit}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
    </ErrorBoundary>
  )
}
