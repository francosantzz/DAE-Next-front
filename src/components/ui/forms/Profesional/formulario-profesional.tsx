'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/genericos/button"
import { Input } from "@/components/ui/genericos/input"
import { Label } from "@/components/ui/genericos/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/genericos/select"
import { XIcon } from "lucide-react"; // Icono de la cruz para cerrar

interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  departamento: Departamento;
  equipos: Equipo[];
}

interface Equipo {
  id: number;
  nombre: string;
  departamento: Departamento;
}

interface Departamento {
  id: number;
  nombre: string;
}

interface FormularioProfesionalProps {
  onClose: () => void;
}

export function FormularioProfesionalComponent({ onClose }: FormularioProfesionalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    departamentoId: "",
    equipoId: "",
  })
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [departamentosRes, equiposRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`),
        ])

        if (!departamentosRes.ok || !equiposRes.ok)
          throw new Error("Error al obtener los datos")

        const [departamentosData, equiposData] = await Promise.all([
          departamentosRes.json(),
          equiposRes.json(),
        ])

        setDepartamentos(departamentosData)
        setEquipos(equiposData)
      } catch (error) {
        console.error("Error al obtener datos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          telefono: formData.telefono,
          departamentoId: Number.parseInt(formData.departamentoId),
          equipoId: Number.parseInt(formData.equipoId),
        }),
      })

      if (!response.ok) throw new Error("Error al crear el profesional")

      onClose()
    } catch (error) {
      console.error("Error al crear el profesional:", error)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departamentoId">Departamento</Label>
              <Select
                name="departamentoId"
                onValueChange={(value) => handleSelectChange("departamentoId", value)}
                value={formData.departamentoId}
                required
              >
                <SelectTrigger id="departamentoId">
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

            <div className="space-y-2">
              <Label htmlFor="equipoId">Equipo</Label>
              <Select
                name="equipoId"
                onValueChange={(value) => handleSelectChange("equipoId", value)}
                value={formData.equipoId}
                required
              >
                <SelectTrigger id="equipoId">
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

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Crear Profesional</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
