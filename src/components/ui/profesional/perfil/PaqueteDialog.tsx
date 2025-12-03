// components/ui/profesional/perfil/PaqueteDialog.tsx
'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/genericos/dialog"
import { Label } from "@/components/ui/genericos/label"
import { Input } from "@/components/ui/genericos/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/genericos/select"
import { Button } from "@/components/ui/genericos/button"
import { Alert, AlertDescription } from "@/components/ui/genericos/alert"
import { AlertCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useMemo, useState } from "react"
import type { Profesional } from "@/types/Profesional.interface"
import type { PaqueteHorasPerfil } from "@/types/dto/PaqueteHorasPerfil.dto"
import type { Escuela } from "@/types/equipos"

const TIPOS = ["Escuela", "Trabajo Interdisciplinario", "Carga en Gei"]

export default function PaqueteDialog({
  open, onOpenChange, profesional, currentPaquete, onSaved,
  cargarEscuelasPorEquipo, escuelasFiltradas
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  profesional: Profesional
  currentPaquete: PaqueteHorasPerfil | null
  onSaved: (p: Profesional) => void
  cargarEscuelasPorEquipo: (equipoId: string) => Promise<void>
  escuelasFiltradas: Escuela[]
}) {
  const { data: session } = useSession()
  const [form, setForm] = useState<{
    tipo?: string
    equipoId?: string
    escuelaId?: string // "none" cuando no hay
    diaSemana?: string // "1".."5"
    horaInicio?: string
    horaFin?: string
    rotativo: boolean
    semanas: number[]
  }>({ rotativo: false, semanas: [] })

  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // precarga
  useEffect(() => {
    if (!currentPaquete) {
      setForm({ rotativo: false, semanas: [] })
      return
    }
    const d = currentPaquete.dias
    const dia = (d?.diaSemana ?? currentPaquete.diaSemana)
    setForm({
      tipo: currentPaquete.tipo,
      equipoId: currentPaquete.equipo?.id ? String(currentPaquete.equipo.id) : undefined,
      escuelaId: currentPaquete.escuela?.id ? String(currentPaquete.escuela.id) : "none",
      diaSemana: dia != null ? String(dia) : undefined,
      horaInicio: (d?.horaInicio ?? currentPaquete.horaInicio)?.slice(0,5),
      horaFin: (d?.horaFin ?? currentPaquete.horaFin)?.slice(0,5),
      rotativo: d?.rotativo ?? !!currentPaquete.rotativo,
      semanas: (d?.semanas ?? currentPaquete.semanas ?? []) as number[],
    })
  }, [currentPaquete])

  // si abro edición con equipo ya seteado, cargo escuelas
  useEffect(() => {
    if (open && form.equipoId) cargarEscuelasPorEquipo(form.equipoId)
  }, [open]) // eslint-disable-line

  const titulo = useMemo(() => currentPaquete ? "Editar Paquete" : "Agregar Paquete", [currentPaquete])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.accessToken || !form.tipo || !form.equipoId || !form.diaSemana || !form.horaInicio || !form.horaFin) {
      setError("Completá los campos requeridos.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        tipo: form.tipo,
        equipoId: Number(form.equipoId),
        escuelaId: form.tipo === "Escuela"
          ? (form.escuelaId && form.escuelaId !== "none" ? Number(form.escuelaId) : null)
          : null,
        diaSemana: Number(form.diaSemana),
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
        rotativo: form.rotativo,
        semanas: form.rotativo ? (form.semanas ?? []) : null,
      }

      const url = currentPaquete
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${profesional.id}/paquetes/${currentPaquete.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals/${profesional.id}/paquetes`
      const method = currentPaquete ? "PATCH" : "POST"

      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.user.accessToken}` },
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        const e = await r.json().catch(()=> ({}))
        throw new Error(e?.message ?? "No se pudo guardar el paquete")
      }
      onSaved(await r.json()) // el backend devuelve el Profesional actualizado
    } catch (e: any) {
      setError(e?.message ?? "Error al guardar el paquete")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader><DialogTitle>{titulo}</DialogTitle></DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Field label="Tipo de Paquete" required>
              <Select value={form.tipo} onValueChange={v => setForm(s => ({ ...s, tipo: v, escuelaId: v !== "Escuela" ? "none" : s.escuelaId }))}>
                <SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger>
                <SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>

            <Field label="Equipo" required>
              <Select value={form.equipoId} onValueChange={async v => {
                setForm(s => ({ ...s, equipoId: v, escuelaId: "none" }))
                await cargarEscuelasPorEquipo(v)
              }}>
                <SelectTrigger><SelectValue placeholder="Seleccione un equipo" /></SelectTrigger>
                <SelectContent>
                  {profesional.equipos?.map(eq => (
                    <SelectItem key={eq.id} value={String(eq.id)}>{eq.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Escuela">
              <Select
                value={form.escuelaId}
                onValueChange={v => setForm(s => ({ ...s, escuelaId: v }))}
                disabled={form.tipo !== "Escuela" || !form.equipoId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!form.equipoId ? "Primero seleccione un equipo" : "Seleccione una escuela"} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">Ninguna</SelectItem>
                  {escuelasFiltradas?.map(es => (
                    <SelectItem key={es.id} value={String(es.id)}>
                      {es.nombre}{es.Numero ? ` (${es.Numero})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Día de la semana" required>
                <Select value={form.diaSemana} onValueChange={v => setForm(s => ({ ...s, diaSemana: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccione un día" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Lunes</SelectItem>
                    <SelectItem value="2">Martes</SelectItem>
                    <SelectItem value="3">Miércoles</SelectItem>
                    <SelectItem value="4">Jueves</SelectItem>
                    <SelectItem value="5">Viernes</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Hora inicio" required>
                  <Input type="time" value={form.horaInicio ?? ""} onChange={e => setForm(s => ({ ...s, horaInicio: e.target.value }))} />
                </Field>
                <Field label="Hora fin" required>
                  <Input type="time" value={form.horaFin ?? ""} onChange={e => setForm(s => ({ ...s, horaFin: e.target.value }))} />
                </Field>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input id="rot" type="checkbox" checked={form.rotativo} onChange={e => setForm(s => ({ ...s, rotativo: e.target.checked }))} />
                <Label htmlFor="rot">Horario rotativo</Label>
              </div>
              {form.rotativo && (
                <div>
                  <Label>Semanas del ciclo (1-4)</Label>
                  <div className="flex gap-3 mt-1">
                    {[1,2,3,4].map(s => (
                      <label key={s} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={form.semanas.includes(s)}
                          onChange={() =>
                            setForm(prev => ({
                              ...prev,
                              semanas: prev.semanas.includes(s)
                                ? prev.semanas.filter(x=>x!==s)
                                : [...prev.semanas, s]
                            }))
                          }
                        />
                        <span>{s}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" disabled={saving} onClick={submit}>{saving ? "Guardando..." : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div className="space-y-1"><Label>{label}{required && " *"}</Label>{children}</div>
}
