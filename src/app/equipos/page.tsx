// app/.../equipos/page.tsx
'use client'

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useEquipos } from "@/hooks/useEquipo"
import ErrorBoundary from "@/components/ui/ErrorBoundary"
import { PermissionButton } from "@/components/ui/PermissionButton"
import EquiposList from "@/components/ui/equipo/EquipoList"
import EquipoFormDialog from "@/components/ui/equipo/EquipoFormDialog"
import { DetalleEquipoDialog } from "@/components/ui/equipo/detalle-equipo-dialog"

export default function PageEquipos() {
  const vm = useEquipos()  // ← SOLO acá

  return (
    <ErrorBoundary>
      <div className="bg-gray-100 min-h-screen">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Equipos</h1>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {/* Filtros */}
          <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <Label htmlFor="filtroNombre">Filtrar por nombre</Label>
                <Input
                  id="filtroNombre"
                  value={vm.busquedaInput}
                  onChange={(e) => vm.setBusquedaInput(e.target.value)}
                  placeholder="Nombre del equipo"
                  className="h-10"
                />
              </div>
              <div>
                <Label htmlFor="filtroDepartamento">Filtrar por departamento</Label>
                <Select value={vm.filtroDepartamento} onValueChange={vm.setFiltroDepartamento}>
                  <SelectTrigger id="filtroDepartamento" className="h-10">
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="todos">Todos</SelectItem>
                    {vm.departamentos.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex sm:items-end">
                <PermissionButton
                  requiredPermission={{ entity: 'equipo', action: 'create' }}
                  onClick={vm.openCreateDialog}
                  className="w-full sm:w-auto"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar Equipo
                </PermissionButton>
              </div>
            </div>
          </div>

          {/* Lista */}
          <EquiposList
            isLoading={vm.isLoading}
            equipos={vm.equipos}
            onView={vm.handleViewDetails}
            onEdit={vm.handleEdit}
            onDelete={vm.handleDelete}
          />

          {/* Paginación */}
          <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => vm.setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={vm.currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600">Página {vm.currentPage} de {vm.totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => vm.setCurrentPage(p => Math.min(p + 1, vm.totalPages))}
              disabled={vm.currentPage === vm.totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>

        {/* Dialog: Form (controlado por el estado del hook) */}
        <EquipoFormDialog
          open={vm.isDialogOpen}
          onOpenChange={(open) => {
            vm.setIsDialogOpen(open)
            if (!open) vm.resetForm()
          }}
          vm={vm}
        />

        {/* Dialog: Detalle (controlado por el estado del hook) */}
        <DetalleEquipoDialog
          equipo={vm.selectedEquipo}
          isOpen={vm.isDetailDialogOpen}
          onClose={() => vm.setIsDetailDialogOpen(false)}
          isLoading={vm.isDetailLoading}
        />
      </div>
    </ErrorBoundary>
  )
}
