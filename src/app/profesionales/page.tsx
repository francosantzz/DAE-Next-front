'use client'

import { useEffect, useState } from 'react'
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
  id: number;
  tipo: string;
  cantidad: number;
  escuela: {
    id: number;
    nombre: string;
  };
}

interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
  cuil: number;
  profesion: string;
  matricula: string;
  telefono: number;
  direccion: {
    id: number;
    calle: string;
    numero: number;
    departamento: {
      id: number;
      nombre: string;
      region: {
        id: number;
        nombre: string;
      }
    }
  };
  paquetesHoras: PaqueteHoras[];
  equipos: {
    id: number;
    nombre: string;
    seccion: string;
    profesionales: string[];
  }[];
}

export default function ListaProfesionales() {
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos')
  const [filtroSeccion, setFiltroSeccion] = useState('todas')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Obtener los datos desde la API
  useEffect(() => {
    setIsLoading(true) // Mostrar indicador de carga
    const fetchProfesionales = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals`)
        const data = await response.json()
        setProfesionales(data)
      } catch (error) {
        console.error("Error al obtener profesionales:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfesionales()
  }, [])

  // Filtrado
  const profesionalesFiltrados = profesionales.filter(profesional => 
    `${profesional.nombre} ${profesional.apellido}`.toLowerCase().includes(filtroNombre.toLowerCase()) &&
    (filtroDepartamento === 'todos' || profesional.direccion.departamento.nombre === filtroDepartamento) &&
    (filtroSeccion === 'todas' || profesional.equipos.some(equipo => equipo.seccion === filtroSeccion))
  )

  const departamentos = Array.from(new Set(profesionales.map(p => p.direccion.departamento.nombre)))
  const secciones = Array.from(new Set(profesionales.flatMap(p => p.equipos.map(equipo => equipo.seccion))))

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
                <AccordionItem key={profesional.id} value={String(profesional.id)}>
                  <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between w-full">
                      <span className="font-medium">{`${profesional.nombre} ${profesional.apellido}`}</span>
                      <span className="text-sm text-gray-500">{profesional.profesion}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4">
                    <div className="space-y-4">
                      <p><strong>Profesión:</strong> {profesional.profesion}</p>
                      <p><strong>Departamento:</strong> {profesional.direccion.departamento.nombre}</p>
                      <p><strong>Equipo:</strong> {profesional.equipos.map(equipo => equipo.nombre).join(', ')}</p>
                      <p><strong>Sección:</strong> {profesional.equipos.map(equipo => equipo.seccion).join(', ')}</p>
                      <div>
                        <strong>Paquetes de Horas:</strong>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          {profesional.paquetesHoras.map((paquete, index) => (
                            <li key={index}>
                              {paquete.cantidad} horas en {paquete.escuela.nombre}
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
