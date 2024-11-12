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
import { Card, CardContent } from "@/components/ui/card"

interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
}

interface Anexo {
    id: number;
    nombre: string;
    matricula: number;
}

interface Direccion {
    id: number;
    calle: string;
    numero: number;
    departamento: string;
}

interface PaqueteHoras {
  id: number;
  cantidad: number;
  profesional: Profesional;
}

interface Seccion {
  id: number;
  nombre: string;
}

interface Escuela {
  id: number;
  nombre: string;
  direccion: Direccion;
  seccion: Seccion;
  anexos: Anexo[];
  paquetesHoras: PaqueteHoras[];
}

export default function ListaEscuelas() {
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroSeccion, setFiltroSeccion] = useState('todas')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [escuelasRes, seccionesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/seccions`)
        ])
        
        if (!escuelasRes.ok || !seccionesRes.ok) 
          throw new Error('Error al obtener los datos')

        const [escuelasData, seccionesData] = await Promise.all([
          escuelasRes.json(),
          seccionesRes.json()
        ])

        setEscuelas(escuelasData)
        setSecciones(seccionesData)
      } catch (error) {
        console.error('Error al obtener datos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const escuelasFiltradas = escuelas.filter(escuela => 
    escuela.nombre.toLowerCase().includes(filtroNombre.toLowerCase()) &&
    (filtroSeccion === 'todas' || escuela.seccion.id.toString() === filtroSeccion)
  )

  return (
    <>
    <div className='bg-gray-100'>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Escuelas</h1>
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
              placeholder="Nombre de la escuela"
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
                  <SelectItem key={seccion.id} value={seccion.id.toString()}>{seccion.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {isLoading ? (
          <p className="text-center py-4">Cargando escuelas...</p>
        ) : escuelasFiltradas.length > 0 ? (
          <Accordion type="multiple" collapsible className="w-full">
            {escuelasFiltradas.map((escuela) => (
              <AccordionItem key={escuela.id} value={String(escuela.id)}>
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between w-full">
                    <span>{escuela.nombre}</span>
                    <span className="text-sm text-gray-500">
                        {escuela.seccion ? `Sección: ${escuela.seccion.nombre}` : 'Sin sección asignada'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4">
                  <div className="space-y-4">
                    <p><strong>Dirección:</strong> {escuela.direccion.calle} {escuela.direccion.numero}</p>
                    <div>
                      <strong>Anexos:</strong>
                      {escuela.anexos.length > 0 ? (
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          {escuela.anexos.map((anexo) => (
                            <li key={anexo.id}>
                              {anexo.nombre} - Matrícula: {anexo.matricula}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>Sin anexos.</p>
                      )}
                    </div>
                    <div>
                      <strong>Paquetes de Horas:</strong>
                      {escuela.paquetesHoras.length > 0 ? (
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          {escuela.paquetesHoras.map((paquete) => (
                            <li key={paquete.id}>
                              {paquete.cantidad} horas - {paquete.profesional.nombre} {paquete.profesional.apellido}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No hay paquetes de horas asignados.</p>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-center py-4 bg-white rounded-lg shadow">No se encontraron escuelas con los filtros aplicados.</p>
        )}
      </div>
    </div>
    </>
  )
}
