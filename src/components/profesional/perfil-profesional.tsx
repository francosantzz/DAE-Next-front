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
import { PlusCircle, Pencil, Trash2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Layout from "./LayoutProf"

// Interfaces (unchanged)
interface Departamento {
  id: number
  nombre: string
  region: {
    id: number
    nombre: string
  }
}

interface Direccion {
  id: number
  calle: string
  numero: number
  departamento: Departamento
}

interface Escuela {
  id: number
  nombre: string
}

interface PaqueteHoras {
  id: number
  tipo: string
  cantidad: number
  profesional: {
    id: number
    nombre: string
    apellido: string
  }
  escuela: {
    id: number
    nombre: string
  }
  dias: {
    lunes: string | null
    martes: string | null
    miercoles: string | null
    jueves: string | null
    viernes: string | null
  }
  
  equipo: {
    id: number
    nombre: string
  }
}

interface Equipo {
  id: number
  nombre: string
  profesionales: Array<{
    id: number
    nombre: string
    apellido: string
  }>
  seccion: string
}

interface Profesional {
  id: number
  nombre: string
  apellido: string
  cuil: number
  profesion: string
  matricula: string
  telefono: number
  direccion: Direccion
  equipos: Array<{
    id: number
    nombre: string
    profesionales: Array<{
      id: number
      nombre: string
      apellido: string
    }>
    seccion: string
  }>
  totalHoras: number
}

export default function PerfilProfesional({ params }: { params: { id: string } }) {
  const [profesional, setProfesional] = useState<Profesional | null>(null)
  const [paquetes, setPaquetes] = useState<PaqueteHoras[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [tiposPaquete, setTiposPaquete] = useState<string[]>([
    "Escuela",
    "Carga en GEI",
    "Trabajo Interdisciplinario"
  ])
  const router = useRouter()

  // Estados para el formulario de paquete de horas
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentPaquete, setCurrentPaquete] = useState<PaqueteHoras | null>(null)
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
    } as Record<string, string>
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [paqueteToDelete, setPaqueteToDelete] = useState<PaqueteHoras | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [profesionalRes, paquetesRes, escuelasRes, equiposRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${params.id}`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${params.id}/paquetes`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`),
        ])

        if (!profesionalRes.ok || !paquetesRes.ok || !escuelasRes.ok || !equiposRes.ok) {
          throw new Error("Error al cargar los datos.")
        }

        const [profesionalData, paquetesData, escuelasData, equiposData] = await Promise.all([
          profesionalRes.json(),
          paquetesRes.json(),
          escuelasRes.json(),
          equiposRes.json(),
        ])

        setProfesional(profesionalData)
        setPaquetes(paquetesData)
        setEscuelas(escuelasData)
        setEquipos(equiposData)
      } catch (error) {
        console.error("Error al obtener los datos:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  const handleOpenDialog = (paquete?: PaqueteHoras) => {
    if (paquete) {
      setCurrentPaquete(paquete)
      setFormData({
        tipo: paquete.tipo,
        cantidad: paquete.cantidad.toString(),
        escuelaId: paquete.escuela ? paquete.escuela.id.toString() : "",
        equipoId: paquete.equipo ? paquete.equipo.id.toString() : "",
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
        equipoId: "",
        dias: {
          lunes: "",
          martes: "",
          miercoles: "",
          jueves: "",
          viernes: ""
        }
      })
    }
    setFormError(null)
    setIsDialogOpen(true)
  }

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
    setFormError(null)
    setIsSubmitting(true)

    // Validación básica
    if (!formData.tipo || !formData.cantidad || Number.parseInt(formData.cantidad) <= 0) {
      setFormError("Por favor complete todos los campos requeridos correctamente.")
      setIsSubmitting(false)
      return
    }

    try {
      const url = currentPaquete
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${params.id}/paquetes/${currentPaquete.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${params.id}/paquetes`

      const method = currentPaquete ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: formData.tipo,
          cantidad: Number.parseInt(formData.cantidad),
          escuelaId: formData.tipo === "Escuela" ? Number.parseInt(formData.escuelaId) : null,
          equipoId: Number.parseInt(formData.equipoId),
          dias: {
            lunes: formData.dias.lunes || null,
            martes: formData.dias.martes || null,
            miercoles: formData.dias.miercoles || null,
            jueves: formData.dias.jueves || null,
            viernes: formData.dias.viernes || null
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al guardar el paquete de horas")
      }

      // Actualizar la lista de paquetes
      const updatedPaquetesRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${params.id}/paquetes`,
      )
      if (!updatedPaquetesRes.ok) {
        throw new Error("Error al actualizar la lista de paquetes")
      }

      const updatedPaquetes = await updatedPaquetesRes.json()
      setPaquetes(updatedPaquetes)

      // Actualizar el profesional para obtener el total de horas actualizado
      const updatedProfesionalRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${params.id}`)
      if (!updatedProfesionalRes.ok) {
        throw new Error("Error al actualizar los datos del profesional")
      }

      const updatedProfesional = await updatedProfesionalRes.json()
      setProfesional(updatedProfesional)

      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error al guardar el paquete de horas:", error)
      setFormError(error instanceof Error ? error.message : "Error al guardar el paquete de horas")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenDeleteDialog = (paquete: PaqueteHoras) => {
    setPaqueteToDelete(paquete)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!paqueteToDelete) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${params.id}/paquetes/${paqueteToDelete.id}`,
        { method: "DELETE" },
      )

      if (!response.ok) {
        throw new Error("Error al eliminar el paquete de horas")
      }

      // Actualizar la lista de paquetes
      setPaquetes(paquetes.filter((p) => p.id !== paqueteToDelete.id))

      // Actualizar el profesional para obtener el total de horas actualizado
      const updatedProfesionalRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${params.id}`)
      if (!updatedProfesionalRes.ok) {
        throw new Error("Error al actualizar los datos del profesional")
      }

      const updatedProfesional = await updatedProfesionalRes.json()
      setProfesional(updatedProfesional)

      setIsDeleteDialogOpen(false)
      setPaqueteToDelete(null)
    } catch (error) {
      console.error("Error al eliminar el paquete de horas:", error)
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </CardContent>
        </Card>
      </Layout>
    )
  }

  if (!profesional) {
    return (
      <Layout>
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent>
            <p className="text-center py-4">Profesional no encontrado</p>
          </CardContent>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Perfil de {profesional.nombre} {profesional.apellido}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Información Personal</h3>
              <p>
                <strong>CUIL:</strong> {profesional.cuil}
              </p>
              <p>
                <strong>Profesión:</strong> {profesional.profesion}
              </p>
              <p>
                <strong>Matrícula:</strong> {profesional.matricula}
              </p>
              <p>
                <strong>Teléfono:</strong> {profesional.telefono}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Dirección</h3>
              <p>
                {profesional.direccion.calle} {profesional.direccion.numero}
              </p>
              <p>Departamento: {profesional.direccion.departamento.nombre}</p>
              <p>Región: {profesional.direccion.departamento.region.nombre}</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">Equipos</h3>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              {profesional.equipos && profesional.equipos.map((equipo) => (
                <Card key={equipo.id} className="mb-4 last:mb-0">
                  <CardContent className="p-4">
                    <p className="font-semibold">{equipo.nombre}</p>
                    <p>
                      <strong>Sección:</strong> {equipo.seccion}
                    </p>
                    <div className="mt-2">
                      {equipo.profesionales && equipo.profesionales.map((prof, index) => (
                        <Badge key={index} variant="secondary" className="mr-1 mb-1">
                          {`${prof.nombre} ${prof.apellido}`}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!profesional.equipos || profesional.equipos.length === 0) && (
                <p className="text-center text-gray-500">No hay equipos asignados</p>
              )}
            </ScrollArea>
          </section>

          <section>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Paquetes de Horas</h3>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <PlusCircle className="h-4 w-4 mr-2" /> Agregar Paquete
              </Button>
            </div>
            <ScrollArea className="h-[250px] rounded-md border p-4">
              {paquetes && paquetes.map((paquete) => (
                <Card key={paquete.id} className="mb-4 last:mb-0">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{paquete.tipo}</p>
                        <p>
                          <strong>{paquete.cantidad} horas</strong>
                        </p>
                        {paquete.escuela && (
                          <p>
                            <strong>Escuela:</strong> {paquete.escuela.nombre}
                          </p>
                        )}
                        {paquete.equipo && (
                          <p>
                            <strong>Equipo:</strong> {paquete.equipo.nombre}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenDialog(paquete)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleOpenDeleteDialog(paquete)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!paquetes || paquetes.length === 0) && (
                <p className="text-center text-gray-500">No hay paquetes de horas asignados</p>
              )}
            </ScrollArea>
          </section>

          <section className="flex justify-between items-center">
            <p className="text-lg font-semibold">
              Total de horas: <span className="text-2xl">{profesional.totalHoras}</span>
            </p>
            <Button onClick={() => router.back()}>Volver</Button>
          </section>
        </CardContent>
      </Card>

      {/* Diálogo para agregar/editar paquete de horas */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{currentPaquete ? "Editar" : "Agregar"} Paquete de Horas</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="equipoId">Equipo</Label>
                <Select
                  name="equipoId"
                  value={formData.equipoId}
                  onValueChange={(value) => handleSelectChange("equipoId", value)}
                  required
                >
                  <SelectTrigger id="equipoId">
                    <SelectValue placeholder="Seleccione un equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {profesional.equipos?.map((equipo) => (
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
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>¿Está seguro de que desea eliminar este paquete de horas?</p>
            {paqueteToDelete && (
              <div className="mt-2 p-3 bg-gray-100 rounded-md">
                <p>
                  <strong>Tipo:</strong> {paqueteToDelete.tipo}
                </p>
                <p>
                  <strong>Cantidad:</strong> {paqueteToDelete.cantidad} horas
                </p>
                {paqueteToDelete.escuela && (
                  <p>
                    <strong>Escuela:</strong> {paqueteToDelete.escuela.nombre}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
