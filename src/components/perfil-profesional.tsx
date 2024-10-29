'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import Layout from './Layout'

// Interfaces (unchanged)
interface Departamento {
  id: number;
  nombre: string;
  region: {
    id: number;
    nombre: string;
  };
}

interface Direccion {
  id: number;
  calle: string;
  numero: number;
  departamento: Departamento;
}

interface Escuela {
  id: number;
  nombre: string;
}

interface PaqueteHoras {
  id: number;
  tipo: string;
  cantidad: number;
  escuela: Escuela;
}

interface Equipo {
  id: number;
  nombre: string;
  profesionales: string[];
  seccion: string;
}

interface Profesional {
  id: number;
  nombre: string;
  apellido: string;
  cuil: number;
  profesion: string;
  matricula: string;
  telefono: number;
  direccion: Direccion;
  paquetesHoras: PaqueteHoras[];
  equipos: Equipo[];
  totalHoras: number;
}

export default function PerfilProfesional({ params }: { params: { id: string } }) {
  const [profesional, setProfesional] = useState<Profesional | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchProfesional = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${params.id}`)
        if (!response.ok) throw new Error("Error al cargar el perfil del profesional.")
        const data = await response.json()
        setProfesional(data)
      } catch (error) {
        console.error("Error al obtener el profesional:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfesional()
  }, [params.id])

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
              <p><strong>CUIL:</strong> {profesional.cuil}</p>
              <p><strong>Profesión:</strong> {profesional.profesion}</p>
              <p><strong>Matrícula:</strong> {profesional.matricula}</p>
              <p><strong>Teléfono:</strong> {profesional.telefono}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Dirección</h3>
              <p>{profesional.direccion.calle} {profesional.direccion.numero}</p>
              <p>Departamento: {profesional.direccion.departamento.nombre}</p>
              <p>Región: {profesional.direccion.departamento.region.nombre}</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">Paquetes de Horas</h3>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              {profesional.paquetesHoras.map((paquete) => (
                <Card key={paquete.id} className="mb-4 last:mb-0">
                  <CardContent className="p-4">
                    <p className="font-semibold">{paquete.escuela.nombre}</p>
                    <p>{paquete.tipo}: <strong>{paquete.cantidad} horas</strong></p>
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">Equipos</h3>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              {profesional.equipos.map((equipo) => (
                <Card key={equipo.id} className="mb-4 last:mb-0">
                  <CardContent className="p-4">
                    <p className="font-semibold">{equipo.nombre}</p>
                    <p><strong>Sección:</strong> {equipo.seccion}</p>
                    <div className="mt-2">
                      {equipo.profesionales.map((prof, index) => (
                        <Badge key={index} variant="secondary" className="mr-1 mb-1">
                          {prof}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
    </Layout>
  )
}