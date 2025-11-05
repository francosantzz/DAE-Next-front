'use client'

import { useEffect, useRef, useState } from 'react'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserCheck, X } from 'lucide-react'
import type { Profesional } from '@/types/equipos'

type Props = {
  accessToken: string
  seleccionados: Profesional[]
  onAdd: (p: Profesional) => void
  onRemove: (id: number) => void
  minLength?: number
  limit?: number
}

export default function ProfesionalesSelector({
  accessToken,
  seleccionados,
  onAdd,
  onRemove,
  minLength = 2,
  limit = 20,
}: Props) {
  const [search, setSearch] = useState('')
  const [resultados, setResultados] = useState<Profesional[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!accessToken) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (!search || search.trim().length < minLength) {
      setResultados([])
      return
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/profesionals?page=1&limit=${limit}&search=${encodeURIComponent(search)}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        const arr: Profesional[] = Array.isArray(data) ? data : (data?.data ?? [])
        const faltantes = seleccionados.filter(sel => !arr.some((p) => p.id === sel.id))
        const mezclados = [...faltantes, ...arr]
        const filtrados = mezclados.filter(p => !seleccionados.some(s => s.id === p.id))
        setResultados(filtrados)
      } catch {
        setResultados([])
      }
    }, 400)

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [search, accessToken, seleccionados, minLength, limit])

  return (
    <div>
      <Label htmlFor="profSearch">Buscar profesionales</Label>
      <Input id="profSearch" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar..." />

      {/* Dropdown con SCROLL: altura fija + stopPropagation para wheel/touch */}
      {search && (
        <ScrollArea
          className="mt-2 h-56 border rounded-md"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className="p-2 space-y-1">
            {resultados.length ? resultados.map(p => (
              <button
                type="button"
                key={p.id}
                className="w-full text-left p-2 rounded hover:bg-gray-100"
                onClick={() => onAdd(p)}
              >
                {p.nombre} {p.apellido}
              </button>
            )) : <div className="text-sm text-gray-500 px-2 py-1">Sin resultados</div>}
          </div>
        </ScrollArea>
      )}

      <Label className="mt-3 block">Profesionales seleccionados</Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {seleccionados.map(p => (
          <Badge key={p.id} variant="secondary" className="px-3 py-1">
            <UserCheck className="h-3 w-3 mr-1" />
            {p.nombre} {p.apellido}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-2"
              onClick={() => onRemove(p.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  )
}
