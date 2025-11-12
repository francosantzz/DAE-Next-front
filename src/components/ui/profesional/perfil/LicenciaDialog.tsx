'use client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/genericos/dialog"
import { Label } from "@/components/ui/genericos/label"
import { Input } from "@/components/ui/genericos/input"
import { Button } from "@/components/ui/genericos/button"
import { Alert, AlertDescription } from "@/components/ui/genericos/alert"
import { AlertCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { useState } from "react"
import type { Profesional } from "@/types/Profesional.interface"

export default function LicenciaDialog({
  open, onOpenChange, profesional, onSaved
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  profesional: Profesional
  onSaved: (p: Profesional) => void
}) {
  const { data: session } = useSession()
  const [form, setForm] = useState({
    tipoLicencia: profesional.tipoLicencia ?? "",
    fechaInicioLicencia: profesional.fechaInicioLicencia ?? "",
    fechaFinLicencia: profesional.fechaFinLicencia ?? "",
    licenciaActiva: !!profesional.licenciaActiva,
  })
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.accessToken) return
    setSaving(true)
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${profesional.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.user.accessToken}` },
        body: JSON.stringify(form),
      })
      if (!r.ok) throw new Error("Error al actualizar la licencia")
      onSaved(await r.json())
    } catch (e) {
      alert("No se pudo actualizar la licencia")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{profesional.licenciaActiva ? "Editar Licencia" : "Agregar Licencia"}</DialogTitle>
          <DialogDescription>
            {profesional.licenciaActiva ? "Modifique los datos de la licencia" : "Registre una nueva licencia"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Tipo de Licencia">
            <Input value={form.tipoLicencia} onChange={e => setForm(s => ({ ...s, tipoLicencia: e.target.value }))} placeholder="Ej: Enfermedad, Maternidad, Vacaciones..." />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Fecha Inicio">
              <Input type="date" value={form.fechaInicioLicencia} onChange={e => setForm(s => ({ ...s, fechaInicioLicencia: e.target.value }))} />
            </Field>
            <Field label="Fecha Fin">
              <Input type="date" value={form.fechaFinLicencia} onChange={e => setForm(s => ({ ...s, fechaFinLicencia: e.target.value }))} />
            </Field>
          </div>

          <div className="flex items-center gap-2">
            <input id="lic_act" type="checkbox" checked={form.licenciaActiva} onChange={e => setForm(s => ({ ...s, licenciaActiva: e.target.checked }))} />
            <Label htmlFor="lic_act">Licencia activa</Label>
          </div>

          {form.licenciaActiva && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700">Al activar la licencia, el profesional será marcado como No disponible</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label>{label}</Label>{children}</div>
}
