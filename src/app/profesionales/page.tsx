'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Layout from '../../components/Layout'

interface PaqueteHoras {
  horas: number;
  escuela: string;
}

interface Profesional {
  id: string;
  nombre: string;
  apellido: string;
  edad: number;
  direccion: string;
  dni: string;
  email: string;
  ocupacion: string;
  departamento: string;
  equipo: string;
  seccion: string;
  paquetesHoras: PaqueteHoras[];
}

const profesionalesMock: Profesional[] = [
  {
    id: "1",
    nombre: "Ana",
    apellido: "García",
    edad: 35,
    direccion: "Calle Principal 123, Ciudad",
    dni: "12345678A",
    email: "ana.garcia@email.com",
    ocupacion: "Profesora de Matemáticas",
    departamento: "Ciencias",
    equipo: "Equipo Alfa",
    seccion: "Secundaria",
    paquetesHoras: [
      { horas: 20, escuela: "Escuela A" },
      { horas: 10, escuela: "Escuela B" },
    ],
  },
  {
    id: "2",
    nombre: "Carlos",
    apellido: "López",
    edad: 42,
    direccion: "Avenida Central 456, Ciudad",
    dni: "87654321B",
    email: "carlos.lopez@email.com",
    ocupacion: "Profesor de Literatura",
    departamento: "Humanidades",
    equipo: "Equipo Beta",
    seccion: "Bachillerato",
    paquetesHoras: [
      { horas: 15, escuela: "Escuela C" },
      { horas: 15, escuela: "Escuela D" },
    ],
  },
  {
    id: "3",
    nombre: "Elena",
    apellido: "Martínez",
    edad: 38,
    direccion: "Plaza Mayor 789, Ciudad",
    dni: "23456789C",
    email: "elena.martinez@email.com",
    ocupacion: "Profesora de Biología",
    departamento: "Ciencias",
    equipo: "Equipo Gamma",
    seccion: "Secundaria",
    paquetesHoras: [
      { horas: 25, escuela: "Escuela A" },
      { horas: 5, escuela: "Escuela E" },
    ],
  },
]

export default function ListaProfesionales() {
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos')
  const [filtroSeccion, setFiltroSeccion] = useState('todas')
  const router = useRouter()

  const profesionalesFiltrados = profesionalesMock.filter(profesional => 
    `${profesional.nombre} ${profesional.apellido}`.toLowerCase().includes(filtroNombre.toLowerCase()) &&
    (filtroDepartamento === 'todos' || profesional.departamento === filtroDepartamento) &&
    (filtroSeccion === 'todas' || profesional.seccion === filtroSeccion)
  )

  const departamentos = Array.from(new Set(profesionalesMock.map(p => p.departamento)))
  const secciones = Array.from(new Set(profesionalesMock.map(p => p.seccion)))

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="filtroNombre">Filtrar por nombre</Label>
              <Input
                id="filtroNombre"
                placeholder="Nombre del profesional"
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filtroDepartamento">Filtrar por departamento</Label>
              <Select onValueChange={setFiltroDepartamento} value={filtroDepartamento}>
                <SelectTrigger id="filtroDepartamento">
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los departamentos</SelectItem>
                  {departamentos.map((dep) => (
                    <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filtroSeccion">Filtrar por sección</Label>
              <Select onValueChange={setFiltroSeccion} value={filtroSeccion}>
                <SelectTrigger id="filtroSeccion">
                  <SelectValue placeholder="Selecciona una sección" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las secciones</SelectItem>
                  {secciones.map((sec) => (
                    <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {profesionalesFiltrados.length > 0 ? (
            <Accordion type="multiple" collapsible className="w-full">
              {profesionalesFiltrados.map((profesional) => (
                <AccordionItem key={profesional.id} value={profesional.id}>
                  <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between w-full">
                      <span className="font-medium">{`${profesional.nombre} ${profesional.apellido}`}</span>
                      <span className="text-sm text-gray-500">{profesional.ocupacion}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4">
                    <div className="space-y-4">
                      <p><strong>Departamento:</strong> {profesional.departamento}</p>
                      <p><strong>Equipo:</strong> {profesional.equipo}</p>
                      <p><strong>Sección:</strong> {profesional.seccion}</p>
                      <div>
                        <strong>Paquetes de Horas:</strong>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          {profesional.paquetesHoras.map((paquete, index) => (
                            <li key={index}>
                              {paquete.horas} horas en {paquete.escuela}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button onClick={() => router.push(`/perfil/${profesional.id}`)}>
                        Ver Perfil Detallado
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center py-4">No se encontraron profesionales con los filtros aplicados.</p>
          )}
        </div>
      </div>
    </Layout>
  )
}