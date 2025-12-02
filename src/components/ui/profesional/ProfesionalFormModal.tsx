// components/profesionales/ProfesionalForm.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/genericos/dialog'
import { Button } from '@/components/ui/genericos/button'
import { Input } from '@/components/ui/genericos/input'
import { Label } from '@/components/ui/genericos/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/genericos/select'
import { Badge } from '@/components/ui/genericos/badge'
import { X as XIcon, Plus } from 'lucide-react'
import type { Profesional as ProfesionalType } from '@/types/Profesional.interface'

type VM = ReturnType<typeof import('@/hooks/useProfesional').useProfesional>

type Props = {
  vm: VM
}

interface CargoHoras {
  id?: number;
  tipo: 'comunes' | 'investigacion' | 'mision_especial_primaria' | 'mision_especial_secundaria' | 'regimen_27';
  cantidadHoras: number;
}

export default function ProfesionalForm({ vm }: Props) {
  const {
    equipos,
    departamentos,
    currentProfesional,
    isDialogOpen,
    setIsDialogOpen,
    setCurrentProfesional,
    createOrUpdate,
  } = vm as any

  const emptyForm = {
    nombre: '',
    apellido: '',
    profesion: '',
    cuil: '',
    dni: '',
    telefono: '',
    fechaNacimiento: '',
    fechaVencimientoPsicofisico: '',
    fechaVencimientoMatricula: '',    
    matricula: '',
    correoElectronico: '',
    equiposIds: [] as number[],
    cargosHoras: [] as CargoHoras[],
    direccion: { calle: '', numero: '', departamentoId: '' },
  }
  

  const [form, setForm] = useState<any>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Inicializar form cuando currentProfesional cambie o se abra/cierre modal
  useEffect(() => {
    if (currentProfesional) {
      setForm({
        nombre: currentProfesional.nombre ?? '',
        apellido: currentProfesional.apellido ?? '',
        profesion: currentProfesional.profesion ?? '',
        cuil: currentProfesional.cuil ?? '',
        dni: currentProfesional.dni ?? '',
        telefono: currentProfesional.telefono ?? '',
        fechaNacimiento: currentProfesional.fechaNacimiento ?? '',
        fechaVencimientoPsicofisico: currentProfesional.fechaVencimientoPsicofisico ?? '',
        fechaVencimientoMatricula: currentProfesional.fechaVencimientoMatricula ?? '',
        matricula: currentProfesional.matricula ?? '',
        correoElectronico: currentProfesional.correoElectronico ?? '',
        equiposIds: (currentProfesional.equipos ?? []).map((e: any) => e.id),
        cargosHoras: currentProfesional.cargosHoras ?? [],
        direccion: {
          calle: currentProfesional.direccion?.calle ?? '',
          numero: currentProfesional.direccion?.numero ?? '',
          departamentoId: currentProfesional.direccion?.departamento?.id ? String(currentProfesional.direccion.departamento.id) : '',
        }
      })
    } else {
      setForm(emptyForm)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProfesional, isDialogOpen])

  const close = () => {
    setIsDialogOpen(false)
    setCurrentProfesional(null)
    setError('')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleDireccionChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, direccion: { ...prev.direccion, [field]: value } }))
  }

  const handleEquipoAddFromSelect = (value: string) => {
    // value viene como string id; si no es parseable, ignorar
    const id = parseInt(value)
    if (!id) return
    setForm((prev: any) => {
      if (!prev.equiposIds) prev.equiposIds = []
      if (prev.equiposIds.includes(id)) return prev
      return { ...prev, equiposIds: [...prev.equiposIds, id] }
    })
  }

  const handleEquipoRemove = (id: number) => {
    setForm((prev: any) => ({ ...prev, equiposIds: prev.equiposIds.filter((eid: number) => eid !== id) }))
  }

  const handleCargoHorasChange = (index: number, field: keyof CargoHoras, value: string | number) => {
    const updated = [...(form.cargosHoras ?? [])]
    updated[index] = { ...updated[index], [field]: value }
    setForm((prev: any) => ({ ...prev, cargosHoras: updated }))
  }

  const addCargoHoras = () => {
    setForm((prev: any) => ({ ...prev, cargosHoras: [...(prev.cargosHoras ?? []), { tipo: 'comunes', cantidadHoras: 0 }] }))
  }

  const removeCargoHoras = (index: number) => {
    setForm((prev: any) => ({ ...prev, cargosHoras: prev.cargosHoras.filter((_: any, i: number) => i !== index) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const payload = {
        nombre: form.nombre,
        apellido: form.apellido,
        profesion: form.profesion,
        ...(form.cuil && { cuil: form.cuil }),
        ...(form.dni && { dni: form.dni }),
        ...(form.telefono && { telefono: form.telefono }),
        ...(form.fechaNacimiento && { fechaNacimiento: form.fechaNacimiento }),
        ...(form.fechaVencimientoPsicofisico && { fechaVencimientoPsicofisico: form.fechaVencimientoPsicofisico }),
        ...(form.fechaVencimientoMatricula && { fechaVencimientoMatricula: form.fechaVencimientoMatricula }),
        ...(form.matricula && { matricula: form.matricula }),
        ...(form.correoElectronico && { correoElectronico: form.correoElectronico }),
        equiposIds: form.equiposIds || [],
        cargosHoras: form.cargosHoras || [],
        ...(form.direccion?.calle && {
          direccion: {
            calle: form.direccion.calle,
            numero: form.direccion.numero,
            departamentoId: form.direccion.departamentoId ? parseInt(form.direccion.departamentoId) : undefined
          }
        })
      }

      const id = currentProfesional?.id
      console.log("PAYLOAD: ",payload);
      
      await createOrUpdate(payload, id)
      // cerrar modal (hook también lo hace pero por seguridad lo hacemos aquí)
      close()
    } catch (err: any) {
      console.error('Error al guardar profesional:', err)
      setError(err?.message || 'Error al guardar')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtrar equipos mostrados en el select para no mostrar los ya seleccionados
  const equiposDisponibles = (equipos ?? []).filter((eq: any) => !((form.equiposIds ?? []).includes(eq.id)))

  return (
    <Dialog open={!!isDialogOpen} onOpenChange={(o) => { if (!o) close(); else setIsDialogOpen(true) }}>
      {/* DialogContent con padding y max-height para móviles; overflow-y para scroll */}
      <DialogContent className="w-[95vw] sm:max-w-[1000px] max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>{currentProfesional ? 'Editar Profesional' : 'Agregar Profesional'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <h3 className="font-semibold mb-2 text-sm text-gray-700">Datos personales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="min-w-0">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" name="nombre" className="w-full min-w-0" value={form.nombre} onChange={handleChange} required />
              </div>
              <div className="min-w-0">
                <Label htmlFor="apellido">Apellido</Label>
                <Input id="apellido" name="apellido" className="w-full min-w-0" value={form.apellido} onChange={handleChange} required />
              </div>
              <div className="min-w-0">
                <Label htmlFor="profesion">Profesión</Label>
                <Input id="profesion" name="profesion" className="w-full min-w-0" value={form.profesion} onChange={handleChange} required />
              </div>
              <div className="min-w-0">
                <Label htmlFor="cuil">CUIL</Label>
                <Input id="cuil" name="cuil" className="w-full min-w-0" value={form.cuil} onChange={handleChange} />
              </div>
              <div className="min-w-0">
                <Label htmlFor="dni">DNI</Label>
                <Input id="dni" name="dni" className="w-full min-w-0" value={form.dni} onChange={handleChange} />
              </div>
              <div className="min-w-0">
                <Label htmlFor="correoElectronico">Correo Electrónico</Label>
                <Input id="correoElectronico" name="correoElectronico" className="w-full min-w-0" value={form.correoElectronico} onChange={handleChange} />
              </div>
              <div className="min-w-0">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" name="telefono" className="w-full min-w-0" value={form.telefono} onChange={handleChange} />
              </div>
              <div className="min-w-0">
                <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                <Input id="fechaNacimiento" name="fechaNacimiento" type="date" className="w-full min-w-0" value={form.fechaNacimiento} onChange={handleChange} />
              </div>
              <div className="min-w-0">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input id="matricula" name="matricula" className="w-full min-w-0" value={form.matricula} onChange={handleChange} />
              </div>
              <div className="min-w-0">
                <Label htmlFor="fechaVencimientoMatricula">Vto. Matrícula</Label>
                <Input id="fechaVencimientoMatricula" name="fechaVencimientoMatricula" type="date" className="w-full min-w-0" value={form.fechaVencimientoMatricula || ''} onChange={(e) => setForm((p:any)=>({...p, fechaVencimientoMatricula: e.target.value}))} />
              </div>
              <div className="min-w-0">
                <Label htmlFor="fechaVencimientoPsicofisico">Vto. Psicofísico</Label>
                <Input id="fechaVencimientoPsicofisico" name="fechaVencimientoPsicofisico" type="date" className="w-full min-w-0" value={form.fechaVencimientoPsicofisico} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <h3 className="font-semibold mb-2 text-sm text-gray-700">Dirección</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="min-w-0">
                <Label htmlFor="direccion.calle">Calle</Label>
                <Input id="direccion.calle" name="direccion.calle" className="w-full min-w-0" value={form.direccion.calle} onChange={(e) => handleDireccionChange('calle', e.target.value)} />
              </div>
              <div className="min-w-0">
                <Label htmlFor="direccion.numero">Número</Label>
                <Input id="direccion.numero" name="direccion.numero" className="w-full min-w-0" value={form.direccion.numero} onChange={(e) => handleDireccionChange('numero', e.target.value)} />
              </div>
              <div className="min-w-0">
                <Label htmlFor="direccion.departamentoId">Departamento</Label>
                <Select
                  onValueChange={(value) => handleDireccionChange('departamentoId', value)}
                  value={form.direccion.departamentoId}
                >
                  <SelectTrigger id="direccion.departamentoId" className="w-full min-w-0"><SelectValue placeholder="Seleccione" /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {departamentos.map((d: any) => <SelectItem key={d.id} value={d.id.toString()}>{d.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Cargos de horas + Equipos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label>Cargos de Horas</Label>
              <div className="space-y-3">
                {(form.cargosHoras ?? []).map((cargo: CargoHoras, index: number) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end border p-3 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <Label>Tipo de Cargo</Label>
                      <Select value={cargo.tipo} onValueChange={(v) => handleCargoHorasChange(index, 'tipo', v as any)}>
                        <SelectTrigger className="w-full min-w-0"><SelectValue placeholder="Seleccione tipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comunes">Comunes</SelectItem>
                          <SelectItem value="investigacion">Investigación</SelectItem>
                          <SelectItem value="mision_especial_primaria">Misión Especial Primaria</SelectItem>
                          <SelectItem value="mision_especial_secundaria">Misión Especial Secundaria</SelectItem>
                          <SelectItem value="regimen_27">Régimen 27</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label>Cantidad de Horas</Label>
                      <Input type="number" className="w-full min-w-0" value={cargo.cantidadHoras} min={0} onChange={(e) => handleCargoHorasChange(index, 'cantidadHoras', parseInt((e.target as HTMLInputElement).value) || 0)} />
                    </div>
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeCargoHoras(index)} className="sm:self-end">
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addCargoHoras} className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Agregar Cargo de Horas
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="equiposIds">Equipos</Label>

              <Select
                onValueChange={(v) => handleEquipoAddFromSelect(v)}
                value={undefined as unknown as string} // mantenemos value vacío para mostrar placeholder
              >
                <SelectTrigger id="equiposIds" className="w-full min-w-0"><SelectValue placeholder="Seleccione equipos" /></SelectTrigger>
                <SelectContent>
                  { (equiposDisponibles ?? []).map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-2 flex flex-wrap gap-2">
                { (form.equiposIds ?? []).map((id: number) => {
                  const eq = (equipos ?? []).find((x: any) => x.id === id)
                  return eq ? (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                      {eq.nombre}
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => handleEquipoRemove(id)}>
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          </div>

          {error && <div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded">{error}</div>}

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
