'use client'

import { useEffect, useRef, useState } from 'react'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building, X } from 'lucide-react'
import type { Escuela } from '@/types/equipos'

type Props = {
  accessToken: string
  seleccionadas: Escuela[]
  onAdd: (e: Escuela) => void
  onRemove: (id: number) => void
  minLength?: number
  limit?: number
}

export default function EscuelasSelector({
  accessToken,
  seleccionadas,
  onAdd,
  onRemove,
  minLength = 1,
  limit = 20,
}: Props) {
  const [search, setSearch] = useState('')
  const [resultados, setResultados] = useState<Escuela[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!accessToken) {
      console.debug('[EscuelasSelector] no accessToken, skipping search', { search })
      return
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (!search || search.trim().length < minLength) {
      setResultados([])
      return
    }

    timeoutRef.current = setTimeout(async () => {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas?page=1&limit=${limit}&search=${encodeURIComponent(search)}`
      try {
        console.debug('[EscuelasSelector] fetching', { url })
        const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
        console.debug('[EscuelasSelector] response status', res.status)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const arr: Escuela[] = Array.isArray(json) ? json : (json?.data ?? [])
        console.debug('[EscuelasSelector] fetched count', arr.length)
        const filtrados = arr.filter(e => !seleccionadas.some(s => s.id === e.id))
        setResultados(filtrados)
      } catch (err) {
        console.error('[EscuelasSelector] Error buscando escuelas:', err)
        setResultados([])
      }
    }, 400)

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [search, accessToken, seleccionadas, minLength, limit])

  return (
    <div>
      <Label htmlFor="escSearch">Buscar escuelas</Label>
      <Input
        id="escSearch"
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
        placeholder="Ej.: Alberdi, 43, Mundo de Chanti…"
      />

      {/* Dropdown con SCROLL: altura fija + stopPropagation para wheel/touch */}
      {search && (
        <ScrollArea
          className="mt-2 h-56 border rounded-md"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className="p-2 space-y-1">
            {resultados.length > 0 ? (
              resultados.map(e => (
                <button
                  type="button"
                  key={e.id}
                  className="w-full text-left p-2 rounded hover:bg-gray-100"
                  onClick={() => { onAdd(e); setSearch('') }}
                >
                  {e.nombre} {e.Numero && <>Nº {e.Numero}</>}
                </button>
              ))
            ) : (
              <div className="text-sm text-gray-500 px-2 py-1">Sin resultados</div>
            )}
          </div>
        </ScrollArea>
      )}

      <Label className="mt-3 block">Escuelas seleccionadas</Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {seleccionadas.map(e => (
          <Badge key={e.id} variant="secondary" className="px-3 py-1">
            <Building className="h-3 w-3 mr-1" />
            {e.nombre} {e.Numero && <>Nº {e.Numero}</>}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-2"
              onClick={() => onRemove(e.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  )
}
