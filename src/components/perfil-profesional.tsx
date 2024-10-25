'use client'

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import Layout from './Layout'

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

// Nota: En una aplicación real, obtendrías estos datos de una API o base de datos
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
  // ... (mismo array de profesionales que en ListaProfesionales)
]

export default function PerfilProfesional({ params }: { params: { id: string } }) {
  const router = useRouter()
  const profesional = profesionalesMock.find(p => p.id === params.id)

  if (!profesional) {
    return <Layout><p>Profesional no encontrado</p></Layout>
  }

  return (
    <Layout>
      <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
        <h2 className="text-2xl font-bold mb-4">Perfil de {profesional.nombre} {profesional.apellido}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p><strong>Edad:</strong> {profesional.edad}</p>
          <p><strong>DNI:</strong> {profesional.dni}</p>
          <p><strong>Email:</strong> {profesional.email}</p>
          <p><strong>Ocupación:</strong> {profesional.ocupacion}</p>
          <p><strong>Departamento:</strong> {profesional.departamento}</p>
          <p><strong>Equipo:</strong> {profesional.equipo}</p>
          <p><strong>Sección:</strong> {profesional.seccion}</p>
        </div>
        <div>
          <p><strong>Dirección:</strong> {profesional.direccion}</p>
        </div>
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
        <Button onClick={() => router.push('/profesionales')}>Volver a la lista</Button>
      </div>
    </Layout>
  )
}