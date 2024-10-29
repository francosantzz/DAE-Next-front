'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface Profesional {
  nombre: string;
}

interface Equipo {
  id: number;
  nombre: string;
  seccion: string;
  profesionales: string[];
  totalHorasEquipo: number;
}

export function ListaEquiposPantallaCompleta() {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroSeccion, setFiltroSeccion] = useState('todas')
  const [isLoading, setIsLoading] = useState(true)

  // Carga los equipos desde la API
  useEffect(() => {
    setIsLoading(true) // Mostrar indicador de carga
    const fetchEquipos = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`)
        const data = await response.json()
        setEquipos(data)
      } catch (error) {
        console.error("Error al cargar los equipos:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEquipos()
  }, [])

  // Filtra los equipos según el filtro de nombre y sección
  const equiposFiltrados = equipos.filter(equipo => 
    equipo.nombre.toLowerCase().includes(filtroNombre.toLowerCase()) &&
    (filtroSeccion === 'todas' || equipo.seccion === filtroSeccion)
  )

  const secciones = Array.from(new Set(equipos.map(equipo => equipo.seccion)))

  return (
    <>
    <div className='bg-gray-100'>
    <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Equipos</h1>
        </div>
      </header>
    </div>
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="filtroNombre">Filtrar por nombre</Label>
              <Input
                id="filtroNombre"
                placeholder="Nombre del equipo"
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filtroSeccion">Filtrar por sección</Label>
              <Select onValueChange={setFiltroSeccion} value={filtroSeccion}>
                <SelectTrigger id="filtroSeccion">
                  <SelectValue placeholder="Selecciona una sección" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las secciones</SelectItem>
                  {secciones.map((seccion) => (
                    <SelectItem key={seccion} value={seccion}>
                      {seccion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <Accordion type="multiple" collapsible className="w-full">
            {equiposFiltrados.map((equipo) => (
              <AccordionItem key={equipo.id} value={String(equipo.id)}>
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between w-full">
                    <span>{equipo.nombre}</span>
                    <span className="text-sm text-gray-500">{equipo.seccion}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4">
                  <div className="space-y-4">
                    <p><strong>Sección:</strong> {equipo.seccion}</p>
                    <div>
                      <strong>Profesionales:</strong>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        {equipo.profesionales.map((profesional, index) => (
                          <li key={index}>{profesional}</li>
                        ))}
                      </ul>
                    </div>
                    <p><strong>Horas totales del Equipo:</strong> {equipo.totalHorasEquipo}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      </>
  )
};

export default ListaEquiposPantallaCompleta;
