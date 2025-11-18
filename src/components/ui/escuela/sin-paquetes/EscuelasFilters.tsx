// components/ui/escuelas/EscuelasFilters.tsx
"use client"

import { Badge } from "@/components/ui/genericos/badge"
import { Button } from "@/components/ui/genericos/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import { Input } from "@/components/ui/genericos/input"
import { Label } from "@/components/ui/genericos/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/genericos/select"
import { cn } from "@/lib/utils"
import type { useEscuelasSinPaquetes } from "@/hooks/useEscuelasSinPaquetes"

type Props = {
  state: ReturnType<typeof useEscuelasSinPaquetes>
}

export default function EscuelasFilters({ state }: Props) {
  const {
    isLoading,
    escuelas,
    totalItems,
    searchInput,
    setSearchInput,
    filtroDepartamento,
    setFiltroDepartamento,
    filtroEquipo,
    setFiltroEquipo,
    filtroRegion,
    setFiltroRegion,
    regiones,
    departamentos,
    equipos,
    limit,
    setLimit,
    soloSinPaquetes,
    setSoloSinPaquetes,
    soloEquiposBajo4,
    setSoloEquiposBajo4,
  } = state

  const limpiarFiltros = () => {
    setSearchInput("")
    setFiltroRegion("todas")
    setFiltroDepartamento("todos")
    setFiltroEquipo("todos")
    setLimit(150)
    setSoloSinPaquetes(true)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
            Escuelas sin paquetes de horas
            <Badge className="px-2.5 py-1.5 text-sm sm:text-base">
              Listado
            </Badge>
          </CardTitle>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              {isLoading ? (
                "Cargando…"
              ) : (
                <>
                  Mostrando{" "}
                  <strong className="text-primary">{escuelas.length}</strong>
                  {typeof totalItems === "number" && (
                    <>
                      {" "}
                      de <strong>{totalItems}</strong>
                    </>
                  )}
                </>
              )}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={limpiarFiltros}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Grid filtros */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-6">
          <div className="col-span-2 md:col-span-2">
            <Label htmlFor="search" className="text-xs">
              Buscar
            </Label>
            <Input
              id="search"
              className="h-9 text-sm"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Nombre o Nº de escuela"
            />
          </div>

          <div>
            <Label htmlFor="region" className="text-xs">
              Región
            </Label>
            <Select
              value={filtroRegion}
              onValueChange={setFiltroRegion}
            >
              <SelectTrigger id="region" className="h-9 text-sm">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="todas">Todas</SelectItem>
                {regiones.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="departamento" className="text-xs">
              Departamento
            </Label>
            <Select
              value={filtroDepartamento}
              onValueChange={setFiltroDepartamento}
            >
              <SelectTrigger id="departamento" className="h-9 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="todos">Todos</SelectItem>
                {departamentos.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="equipo" className="text-xs">
              Equipo / Sección
            </Label>
            <Select
              value={filtroEquipo}
              onValueChange={setFiltroEquipo}
            >
              <SelectTrigger id="equipo" className="h-9 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="todos">Todos</SelectItem>
                {equipos.map((eq) => (
                  <SelectItem key={eq.id} value={String(eq.id)}>
                    {eq.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="limit" className="text-xs">
              Resultados
            </Label>
            <Select
              value={String(limit)}
              onValueChange={(v) => setLimit(Number(v))}
            >
              <SelectTrigger id="limit" className="h-9 text-sm">
                <SelectValue placeholder="Cantidad" />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100, 150].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <input
              type="checkbox"
              id="soloSinPaquetes"
              checked={soloSinPaquetes}
              onChange={(e) => setSoloSinPaquetes(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary"
            />
            <Label
              htmlFor="soloSinPaquetes"
              className="text-xs leading-tight"
            >
              Solo SIN paquetes
            </Label>
          </div>
        </div>

        {/* extra: solo equipos < 4h */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="soloEquiposBajo4"
            checked={soloEquiposBajo4}
            onChange={(e) => setSoloEquiposBajo4(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary"
          />
          <Label htmlFor="soloEquiposBajo4" className="text-xs">
            Solo equipos &lt; 4h
          </Label>
        </div>

        {/* chips filtros activos */}
        {(filtroRegion !== "todas" ||
          filtroDepartamento !== "todos" ||
          filtroEquipo !== "todos" ||
          searchInput) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {searchInput && (
              <Badge variant="outline" className="text-xs">
                Buscar: “{searchInput}”
              </Badge>
            )}
            {filtroRegion !== "todas" && (
              <Badge variant="outline" className="text-xs">
                Región:{" "}
                {regiones.find((r) => String(r.id) === filtroRegion)?.nombre ||
                  filtroRegion}
              </Badge>
            )}
            {filtroDepartamento !== "todos" && (
              <Badge variant="outline" className="text-xs">
                Depto:{" "}
                {departamentos.find(
                  (d) => String(d.id) === filtroDepartamento,
                )?.nombre || filtroDepartamento}
              </Badge>
            )}
            {filtroEquipo !== "todos" && (
              <Badge variant="outline" className="text-xs">
                Equipo:{" "}
                {equipos.find((e) => String(e.id) === filtroEquipo)?.nombre ||
                  filtroEquipo}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
