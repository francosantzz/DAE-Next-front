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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Escuela {
  id: number;
  nombre: string;
}

interface Equipo {
  nombre: string;
  profesionales: string[];
}

interface Seccion {
  id: number;
  nombre: string;
  equipo: Equipo;
  escuelas: Escuela[];
  totalHorasseccion: number;
  departamento: string;
}

export default function ListaSecciones() {
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroNivel, setFiltroNivel] = useState('todos')
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSecciones = async () => {
      setIsLoading(true) // Mostrar indicador de carga
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/seccions`)
        if (!response.ok) throw new Error('Error al obtener las secciones')

        const data: Seccion[] = await response.json()
        setSecciones(data)
      } catch (error) {
        console.error('Error al obtener secciones:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSecciones()
  }, [])

  const seccionesFiltradas = secciones.filter(seccion => 
    seccion.nombre.toLowerCase().includes(filtroNombre.toLowerCase()) &&
    (filtroNivel === 'todos' || seccion.departamento === filtroNivel)
  )

  const departamentos = Array.from(new Set(secciones.map(s => s.departamento)))

  return (
    <>
      <div className='bg-gray-100'>
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Secciones</h1>
          </div>
        </header>
      </div>

      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="filtroNombre">Filtrar por nombre</Label>
                <Input
                  id="filtroNombre"
                  placeholder="Nombre de la sección"
                  value={filtroNombre}
                  onChange={(e) => setFiltroNombre(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filtroNivel">Filtrar por departamento</Label>
                <Select onValueChange={setFiltroNivel} value={filtroNivel}>
                  <SelectTrigger id="filtroNivel">
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los departamentos</SelectItem>
                    {departamentos.map((departamento) => (
                      <SelectItem key={departamento} value={departamento}>{departamento}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {isLoading ? (
              <p className="text-center py-4">Cargando secciones...</p>
            ) : seccionesFiltradas.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {seccionesFiltradas.map((seccion) => (
                  <AccordionItem key={seccion.id} value={String(seccion.id)}>
                    <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex justify-between w-full">
                        <span className="font-medium">{seccion.nombre}</span>
                        <span className="text-sm text-gray-500">Departamento: {seccion.departamento}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2">Equipo:</h3>
                          <p>{seccion.equipo.nombre}</p>
                          <ul className="list-disc pl-5 space-y-1">
                            {seccion.equipo.profesionales.map((profesional, index) => (
                              <li key={index}>{profesional}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">Escuelas:</h3>
                          <ul className="list-disc pl-5 space-y-1">
                            {seccion.escuelas.map((escuela) => (
                              <li key={escuela.id}>{escuela.nombre}</li>
                            ))}
                          </ul>
                        </div>
                        <p><strong>Horas totales de la sección:</strong> {seccion.totalHorasseccion}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-center py-4">No se encontraron secciones con los filtros aplicados.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
