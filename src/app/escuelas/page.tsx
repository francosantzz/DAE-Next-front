'use client'

import { PlusCircle } from 'lucide-react'
import ErrorBoundary from '@/components/ui/genericos/ErrorBoundary'
import { PermissionButton } from '@/components/ui/genericos/PermissionButton'
import { Paginator } from '@/components/ui/genericos/Paginator'
import { EscuelasList } from '@/components/ui/escuela/EscuelasList'
import { EscuelasFilters } from '@/components/ui/escuela/EscuelasFilters'
import { DetalleEscuelaDialog } from '@/components/ui/escuela/detalle-escuela-dialog'
import { EscuelaFormDialog } from '@/components/ui/escuela/EscuelaFormDialog'
import { useEscuelas } from '@/hooks/useEscuelas'
import { AnexoDialog } from '@/components/ui/escuela/AnexoDialog'

export default function PageEscuelas() {
  const vm = useEscuelas() // ← único lugar donde usamos el hook

  return (
    <ErrorBoundary>
      <div className="bg-gray-100 min-h-screen">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Escuelas</h1>
            <PermissionButton
              requiredPermission={{ entity: 'escuela', action: 'create' }}
              onClick={vm.openCreateDialog}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Escuela
            </PermissionButton>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {/* Filtros */}
          <EscuelasFilters
            busqueda={vm.busquedaInput}
            setBusqueda={vm.setBusquedaInput}
            equipos={vm.equipos}
            filtroEquipo={vm.filtroEquipo}
            setFiltroEquipo={vm.setFiltroEquipo}
            filtroSinPaquetes={vm.filtroSinPaquetes}
            setFiltroSinPaquetes={vm.setFiltroSinPaquetes}
          />

          {/* Lista */}
          <EscuelasList
            isLoading={vm.isLoading}
            escuelas={vm.escuelas}
            onView={vm.handleViewDetails}     // <- acepta Escuela (list) y resuelve
            onEdit={vm.handleEdit}
            onDelete={vm.handleDelete}
          />

          {/* Paginación */}
          <Paginator
            page={vm.currentPage}
            totalPages={vm.totalPages}
            onPageChange={vm.setCurrentPage}
          />
        </div>

        {/* Dialogs controlados por el hook */}
        <EscuelaFormDialog
          open={vm.isDialogOpen}
          onOpenChange={(open) => {
            vm.setIsDialogOpen(open)
            if (!open) vm.resetForm()
          }}
          departamentos={vm.departamentos}
          equipos={vm.equipos}
          formData={vm.formData}
          setFormData={vm.setFormData}
          onSubmit={vm.handleSubmit}
          isEditing={!!vm.currentEscuela}
        />

        <DetalleEscuelaDialog
          escuela={vm.selectedDetallada}
          isOpen={vm.isDetailDialogOpen}
          onClose={() => vm.setIsDetailDialogOpen(false)}
          isLoading={vm.isDetailLoading}
          onObservacionesUpdated={(newObs) => {
            if (vm.selectedDetallada?.id) vm.updateObservacionesLocal(vm.selectedDetallada.id, newObs)
          }}
          onAddAnexo={() => vm.openAddAnexo()}
          onEditAnexo={(a) => vm.openEditAnexo(a)}
          onDeleteAnexo={(anexoId) => {
            if (vm.selectedDetallada?.id) vm.deleteAnexo(vm.selectedDetallada.id, anexoId)
          }}
        />

        <AnexoDialog
          open={vm.isAnexoDialogOpen}
          onOpenChange={vm.setIsAnexoDialogOpen}
          isEditing={vm.isEditingAnexo}
          formData={vm.anexoFormData}
          setFormData={vm.setAnexoFormData}
          onSubmit={vm.submitAnexoDialog}
        />
      </div>
    </ErrorBoundary>
  )
}
