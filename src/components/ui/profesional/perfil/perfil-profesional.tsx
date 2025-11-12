"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Layout from "@/components/ui/profesional/LayoutProf"
import ErrorBoundary from "@/components/ui/genericos/ErrorBoundary"
import { ProtectedRoute } from "@/components/ui/genericos/ProtectedRoute"
import { Alert, AlertDescription } from "@/components/ui/genericos/alert"
import { AlertCircle, Pencil } from "lucide-react"
import { Button } from "@/components/ui/genericos/button"
import { Skeleton } from "@/components/ui/genericos/skeleton"
import { useSession } from "next-auth/react"

import PersonalInfoCard from "@/components/ui/profesional/perfil/PersonalInfoCard"

import type { Profesional } from "@/types/Profesional.interface"
import type { PaqueteHoras } from "@/types/PaqueteHoras.interface"
import type { EquipoProfesionalDTO } from "@/types/dto/EquipoProfesional.dto"
import type { Departamento } from "@/types/Departamento.interface"
import type { Escuela } from "@/types/equipos"
import CargosHorasCard from "./CargosHorasCard"
import EquiposCard from "./EquiposCard"
import LicenciaCard from "./LicenciaCard"
import LicenciaDialog from "./LicenciaDialog"
import PaqueteDialog from "./PaqueteDialog"
import PaquetesCard from "./PaquetesCard"
import EditPerfilWithExistingForm from "./EditPerfilWithExistingForm"
import { PaqueteHorasPerfil } from "@/types/dto/PaqueteHorasPerfil.dto"

export default function PerfilProfesionalPage() {
  const { data: session } = useSession()
  const params = useParams()
  const id = params?.id as string | undefined
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [profesional, setProfesional] = useState<Profesional | null>(null)

  // diálogos
  const [openEdit, setOpenEdit] = useState(false)
  const [openLic, setOpenLic] = useState(false)
  const [openPack, setOpenPack] = useState(false)

  // ediciones
  const [equipos, setEquipos] = useState<EquipoProfesionalDTO[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [escuelasFiltradas, setEscuelasFiltradas] = useState<Escuela[]>([])

  const [currentPaquete, setCurrentPaquete] = useState<PaqueteHorasPerfil | null>(null)

  // ======= FETCH PROFESIONAL (inicial) =======
  useEffect(() => {
    const run = async () => {
      if (!session?.user?.accessToken || !id) return
      setIsLoading(true)
      try {
        const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}`, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
        })
        if (!r.ok) throw new Error("Error al obtener el profesional")
        const data = await r.json()
        // sin normalizadores: uso tal cual lo que venga del backend
        setProfesional(data)
      } catch (e) {
        console.error(e)
        setProfesional(null)
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [id, session?.user?.accessToken])

  // ======= UTILS INPLACE (sin helpers externos) =======
  const recalcTotales = (p: Profesional) => {
    const total = (p.paquetesHoras ?? []).reduce((a, ph: any) => a + Number(ph?.cantidad ?? 0), 0)
    return { ...p, totalHoras: total }
  }

  const cargarEquiposYDeptos = async () => {
    if (!session?.user?.accessToken) return
    const [re, rd] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/short?page=1&limit=200`, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` },
      }),
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/departamentos`, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` },
      }),
    ])
    if (re.ok) {
      const ej = await re.json()
      setEquipos(ej?.data ?? ej)
    }
    if (rd.ok) setDepartamentos(await rd.json())
  }

  const cargarEscuelasPorEquipo = async (equipoId: string) => {
    if (!session?.user?.accessToken || !equipoId) {
      setEscuelasFiltradas([])
      return
    }
    const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/por-equipo/${equipoId}`, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    })
    if (r.ok) setEscuelasFiltradas(await r.json())
    else setEscuelasFiltradas([])
  }

  // ======= HANDLERS =======
  const onOpenEditPerfil = async () => {
    await cargarEquiposYDeptos()
    setOpenEdit(true)
  }
  const onPerfilGuardado = (p: Profesional) => {
    // sin normalizador: confío en backend; solo recalculo total
    setProfesional(recalcTotales(p))
    setOpenEdit(false)
  }

  const onOpenLicencia = () => setOpenLic(true)
  const onLicenciaGuardada = (p: Profesional) => {
    setProfesional(recalcTotales(p))
    setOpenLic(false)
  }

  const onAgregarPaquete = () => {
    setCurrentPaquete(null)
    setEscuelasFiltradas([])
    setOpenPack(true)
  }
  const onEditarPaquete = async (ph: PaqueteHorasPerfil) => {
    setCurrentPaquete(ph)
    await cargarEscuelasPorEquipo(String(ph?.equipo?.id ?? ""))
    setOpenPack(true)
  }
  const onEliminarPaquete = async (paqueteId: number) => {
    if (!confirm("¿Eliminar paquete?")) return
    if (!session?.user?.accessToken || !id) return
    const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}/paquetes/${paqueteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    })
    if (!r.ok) {
      const e = await r.json().catch(() => ({}))
      alert(e?.message ?? "No se pudo eliminar")
      return
    }
    if (!profesional) return
    const updated = {
      ...profesional,
      paquetesHoras: (profesional.paquetesHoras ?? []).filter(p => p.id !== paqueteId),
    }
    setProfesional(recalcTotales(updated))
  }
  const onPaqueteGuardado = (p: Profesional) => {
    setProfesional(recalcTotales(p))
    setOpenPack(false)
    setCurrentPaquete(null)
  }

  // ======= RENDER =======
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!profesional) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            No se encontró el profesional solicitado.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredPermission={{ entity: "profesional", action: "read" }}>
      <ErrorBoundary>
        <Layout>
          <div className="container mx-auto py-8 bg-gray-50 space-y-6">
            <PersonalInfoCard profesional={profesional} onEditClick={onOpenEditPerfil} />

            <EquiposCard equipos={profesional.equipos ?? []} />

            <LicenciaCard profesional={profesional} onOpenDialog={onOpenLicencia} />

            <PaquetesCard
              profesional={profesional}
              onAgregar={onAgregarPaquete}
              onEditar={onEditarPaquete}
              onEliminar={onEliminarPaquete}
            />

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" onClick={() => router.push("/profesionales")}>
                Volver a la lista
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onOpenEditPerfil}>
                <Pencil className="mr-2 h-4 w-4" /> Editar Perfil
              </Button>
            </div>
          </div>

          {/* Diálogos */}
          <EditPerfilWithExistingForm
            open={openEdit}
            onOpenChange={setOpenEdit}
            profesional={profesional}
            onSaved={(p) => { setProfesional(p); setOpenEdit(false); }}
          />

          <LicenciaDialog
            open={openLic}
            onOpenChange={setOpenLic}
            profesional={profesional}
            onSaved={onLicenciaGuardada}
          />

          <PaqueteDialog
            open={openPack}
            onOpenChange={setOpenPack}
            profesional={profesional}
            currentPaquete={currentPaquete}
            onSaved={onPaqueteGuardado}
            cargarEscuelasPorEquipo={cargarEscuelasPorEquipo}
            escuelasFiltradas={escuelasFiltradas}
          />
        </Layout>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
