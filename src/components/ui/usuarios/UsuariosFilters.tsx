"use client"

import { Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import { Input } from "@/components/ui/genericos/input"
import { Label } from "@/components/ui/genericos/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/genericos/select"
import { Role, roleLabels } from "@/types/roles"

type Props = {
  busquedaInput: string
  setBusquedaInput: (v: string) => void
  filtroRol: string
  setFiltroRol: (v: string) => void
}

export default function UsuariosFilters({
  busquedaInput,
  setBusquedaInput,
  filtroRol,
  setFiltroRol,
}: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800">
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="busqueda" className="text-xs font-medium text-slate-700">
            Búsqueda
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="busqueda"
              placeholder="Username o email..."
              className="pl-8 text-sm"
              value={busquedaInput}
              onChange={(e) => setBusquedaInput(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="filtroRol" className="text-xs font-medium text-slate-700">
            Rol
          </Label>
          <Select value={filtroRol} onValueChange={setFiltroRol}>
            <SelectTrigger id="filtroRol" className="text-sm">
              <SelectValue placeholder="Todos los roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los roles</SelectItem>
              {Object.values(Role).map((role) => (
                <SelectItem key={role} value={role}>
                  {roleLabels[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
