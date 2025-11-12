// components/profesional/dialogs/EditPerfilWithExistingForm.tsx
'use client'
import ProfesionalForm from "@/components/ui/profesional/ProfesionalFormModal"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import type { Profesional } from "@/types/Profesional.interface"

export default function EditPerfilWithExistingForm({
  open, onOpenChange, profesional, onSaved
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  profesional: Profesional
  onSaved: (p: Profesional) => void
}) {
  const { data: session } = useSession()
  const [equipos, setEquipos] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [currentProfesional, setCurrentProfesional] = useState<Profesional | null>(profesional)
  const [isDialogOpen, setIsDialogOpen] = useState(open)

  useEffect(() => setIsDialogOpen(open), [open])
  useEffect(() => setCurrentProfesional(profesional), [profesional])

  useEffect(() => {
    const load = async () => {
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
    load()
  }, [session?.user?.accessToken])

  const createOrUpdate = async (payload: any, id?: number) => {
    if (!session?.user?.accessToken) return
    const url = id
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${id}`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals`
    const method = id ? "PATCH" : "POST"
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.user.accessToken}` },
      body: JSON.stringify(payload),
    })
    if (!r.ok) throw new Error("No se pudo guardar")
    const updated = await r.json()
    onSaved(updated)
    setIsDialogOpen(false)
    onOpenChange(false)
  }

  // bridge: cuando el form cambie su open, también avisamos al padre
  const setOpenBridged = (v: boolean) => { setIsDialogOpen(v); onOpenChange(v) }

  const vm = {
    equipos,
    departamentos,
    currentProfesional,
    isDialogOpen,
    setIsDialogOpen: setOpenBridged,
    setCurrentProfesional,
    createOrUpdate,
  }

  // 👇 sin Dialog externo
  return <ProfesionalForm vm={vm as any} />
}
