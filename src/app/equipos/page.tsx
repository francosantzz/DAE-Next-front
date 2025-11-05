'use client'

import { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useEquipos } from '@/hooks/useEquipo'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { PermissionButton } from '@/components/ui/PermissionButton'
import { PlusCircle } from 'lucide-react'
import EquiposList from '@/components/ui/equipo/EquipoList'
import EquipoFormDialog from '@/components/ui/equipo/EquipoFormDialog'
import { DetalleEquipoDialog } from '@/components/ui/equipo/detalle-equipo-dialog'

export default function PageEquipos() {
  const {
    busquedaInput, setBusquedaInput,
    filtroDepartamento, setFiltroDepartamento,
    departamentos,
    isLoading,
    equipos, currentPage, totalPages, setCurrentPage,
    openCreateDialog,
    isDetailDialogOpen, setIsDetailDialogOpen, selectedEquipo, isDetailLoading,
  } = useEquipos()

  return (
    <ErrorBoundary>
      <div className='bg-gray-100 min-h-screen'>
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Equipos</h1>
          </div>
        </header>

        {/* Filtros */}
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <Label htmlFor="filtroNombre">Filtrar por nombre</Label>
                <Input
                  id="filtroNombre"
                  placeholder="Nombre del equipo"
                  value={busquedaInput}
                  onChange={(e) => setBusquedaInput(e.target.value)}
                  className="h-10"
                />
              </div>

              <div>
                <Label htmlFor="filtroDepartamento">Filtrar por departamento</Label>
                <Select onValueChange={setFiltroDepartamento} value={filtroDepartamento}>
                  <SelectTrigger id="filtroDepartamento" className="h-10">
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="todos">Todos</SelectItem>
                    {departamentos.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex sm:items-end">
                <PermissionButton
                  requiredPermission={{ entity: 'equipo', action: 'create'}}
                  onClick={openCreateDialog}
                  className="w-full sm:w-auto"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Agregar Equipo
                </PermissionButton>
              </div>
            </div>
          </div>

          {/* Lista */}
          <EquiposList isLoading={isLoading} equipos={equipos} />

          {/* Paginación */}
          <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600">Página {currentPage} de {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>

        {/* Dialogs “globales” */}
        <EquipoFormDialog />
        <DetalleEquipoDialog
          equipo={selectedEquipo}
          isOpen={isDetailDialogOpen}
          onClose={() => setIsDetailDialogOpen(false)}
          isLoading={isDetailLoading}
        />
      </div>
    </ErrorBoundary>
  )
}
