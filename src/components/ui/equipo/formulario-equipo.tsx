'use client'

import { useState, useEffect } from 'react'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { EquipoFormData, EquipoFormProps } from "@/types/formulario-equipo-props.types"
import { Escuela, Profesional } from '@/types/equipos'

// IMPORTS CORRECTOS de los selectores (no desde /types)
import ProfesionalesSelector from '@/components/ui/equipo/profesionales-selector'
import EscuelasSelector from '@/components/ui/equipo/escuelas-selector'

export default function EquipoForm({
  accessToken,
  departamentos,
  equipo,
  onSaved,
  onCancel,
}: EquipoFormProps) {

  const isEditing = !!equipo?.id

  // ---- estado del form (IDs para el submit)
  const [formData, setFormData] = useState<EquipoFormData>({
    id: equipo?.id ?? 0,
    nombre: equipo?.nombre ?? '',
    departamentoId: equipo?.departamento?.id ?? 0,
    profesionalesIds: (equipo?.profesionales ?? []).map(p => p.id),
    escuelasIds: (equipo?.escuelas ?? []).map(e => e.id),
  })

  // ---- estado visual (objetos para chips y dropdowns)
  const [profesionalesSeleccionados, setProfesionalesSeleccionados] = useState<Profesional[]>(equipo?.profesionales ?? [])
  const [escuelasSeleccionadas, setEscuelasSeleccionadas] = useState<Escuela[]>(equipo?.escuelas ?? [])

  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // si cambia el equipo (abrís editar otro), reseteamos TODO consistente
  useEffect(() => {
    setFormData({
      id: equipo?.id ?? 0,
      nombre: equipo?.nombre ?? '',
      departamentoId: equipo?.departamento?.id ?? 0,
      profesionalesIds: (equipo?.profesionales ?? []).map(p => p.id),
      escuelasIds: (equipo?.escuelas ?? []).map(e => e.id),
    })
    setProfesionalesSeleccionados(equipo?.profesionales ?? [])
    setEscuelasSeleccionadas(equipo?.escuelas ?? [])
    setErrorMessage('')
  }, [equipo])

  // ==== helpers UI
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  const handleSelectChange = (name: keyof EquipoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: Number(value) }))
  }

  // ==== PROFESIONALES (sincronizar objetos + IDs)
  const handleProfesionalAdd = (p: Profesional) => {
    if (formData.profesionalesIds.includes(p.id)) return
    setProfesionalesSeleccionados(prev => [...prev, p])
    setFormData(prev => ({ ...prev, profesionalesIds: [...prev.profesionalesIds, p.id] }))
  }
  const handleProfesionalRemove = (id: number) => {
    setProfesionalesSeleccionados(prev => prev.filter(x => x.id !== id))
    setFormData(prev => ({ ...prev, profesionalesIds: prev.profesionalesIds.filter(x => x !== id) }))
  }

  // ==== ESCUELAS (sincronizar objetos + IDs)
  const handleEscuelaAdd = (e: Escuela) => {
    if (formData.escuelasIds.includes(e.id)) return
    setEscuelasSeleccionadas(prev => [...prev, e])
    setFormData(prev => ({ ...prev, escuelasIds: [...prev.escuelasIds, e.id] }))
  }
  const handleEscuelaRemove = (id: number) => {
    setEscuelasSeleccionadas(prev => prev.filter(x => x.id !== id))
    setFormData(prev => ({ ...prev, escuelasIds: prev.escuelasIds.filter(x => x !== id) }))
  }

  // ==== SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/${formData.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`
      const method = isEditing ? 'PATCH' : 'POST'

      const resp = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData)
      })

      const body = await resp.json()
      if (!resp.ok) {
        if (resp.status === 404 && body?.message?.includes('escuelas ya pertenecen')) {
          throw new Error(body.message)
        }
        throw new Error(body?.message || 'Error al guardar el equipo')
      }

      onSaved() // ← avisa al padre para cerrar y refrescar
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar el equipo')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* NOMBRE + DEPTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
        </div>

        <div>
          <Label htmlFor="departamento">Departamento</Label>
          <Select
            onValueChange={(v) => handleSelectChange('departamentoId', v)}
            value={formData.departamentoId ? String(formData.departamentoId) : ''}
          >
            <SelectTrigger id="departamento">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {departamentos.map((d) => (
                <SelectItem key={d.id} value={d.id.toString()}>{d.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SELECTORES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfesionalesSelector
          accessToken={accessToken}
          seleccionados={profesionalesSeleccionados}
          onAdd={handleProfesionalAdd}
          onRemove={handleProfesionalRemove}
        />

        <EscuelasSelector
          accessToken={accessToken}
          seleccionadas={escuelasSeleccionadas}
          onAdd={handleEscuelaAdd}
          onRemove={handleEscuelaRemove}
        />
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
