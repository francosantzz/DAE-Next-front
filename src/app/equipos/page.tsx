'use client'

import { useState } from 'react'
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
  rol: string;
}

interface Equipo {
  id: string;
  nombre: string;
  seccion: string;
  profesionales: Profesional[];
  numeroEscuelas: number;
}

const equiposMock: Equipo[] = [
  {
    id: "1",
    nombre: "Equipo Alfa",
    seccion: "Desarrollo",
    profesionales: [
      { nombre: "Ana García", rol: "Desarrollador Frontend" },
      { nombre: "Carlos López", rol: "Desarrollador Backend" },
    ],
    numeroEscuelas: 5,
  },
  {
    id: "2",
    nombre: "Equipo Beta",
    seccion: "Diseño",
    profesionales: [
      { nombre: "Elena Martínez", rol: "Diseñador UX" },
      { nombre: "David Rodríguez", rol: "Diseñador UI" },
    ],
    numeroEscuelas: 3,
  },
  {
    id: "3",
    nombre: "Equipo Gamma",
    seccion: "Marketing",
    profesionales: [
      { nombre: "Isabel Fernández", rol: "Especialista en Marketing Digital" },
      { nombre: "Javier Sánchez", rol: "Analista de Datos" },
    ],
    numeroEscuelas: 7,
  },
]

export function ListaEquiposPantallaCompleta() {
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroSeccion, setFiltroSeccion] = useState('todas')

  const equiposFiltrados = equiposMock.filter(equipo => 
    equipo.nombre.toLowerCase().includes(filtroNombre.toLowerCase()) &&
    (filtroSeccion === 'todas' || equipo.seccion === filtroSeccion)
  )

  const secciones = Array.from(new Set(equiposMock.map(equipo => equipo.seccion)))

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
              <AccordionItem key={equipo.id} value={equipo.id}>
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between w-full">
                    <span>{equipo.nombre}</span>
                    <span className="text-sm text-gray-500">{equipo.seccion}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4">
                  <div className="space-y-4">
                    <p><strong>Sección:</strong> {equipo.seccion}</p>
                    <p><strong>Número de escuelas:</strong> {equipo.numeroEscuelas}</p>
                    <div>
                      <strong>Profesionales:</strong>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        {equipo.profesionales.map((profesional, index) => (
                          <li key={index}>
                            {profesional.nombre} - <span className="text-gray-600">{profesional.rol}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
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