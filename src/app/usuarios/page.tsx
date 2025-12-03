"use client"

import ErrorBoundary from "@/components/ui/genericos/ErrorBoundary"
import { useUsuarios } from "@/hooks/useUsuarios"

import UsuariosHeader from "@/components/ui/usuarios/UsuariosHeader"
import UsuariosFilters from "@/components/ui/usuarios/UsuariosFilters"
import UsuariosStats from "@/components/ui/usuarios/UsuariosStats"
import UsuariosTable from "@/components/ui/usuarios/UsuariosTable"
import UserFormDialog from "@/components/ui/usuarios/UserFormDialog"
import UserPermissionsDialog from "@/components/ui/usuarios/UserPermissionsDialog"
import UserDeleteDialog from "@/components/ui/usuarios/UserDeleteDialog"

export default function ListaUsuarios() {
  const u = useUsuarios()

  if (u.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
          <p className="text-sm text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <UsuariosHeader onAddUser={u.openCreateForm} />

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-3 pb-8 pt-4 sm:px-6 lg:px-8">
          <UsuariosFilters
            busquedaInput={u.busquedaInput}
            setBusquedaInput={u.setBusquedaInput}
            filtroRol={u.filtroRol}
            setFiltroRol={u.setFiltroRol}
          />

          <UsuariosStats usuarios={u.usuarios} totalItems={u.totalItems} />

          <UsuariosTable
            usuarios={u.usuarios}
            totalItems={u.totalItems}
            currentPage={u.currentPage}
            totalPages={u.totalPages}
            onPageChange={u.setCurrentPage}
            onEdit={u.openEditForm}
            onDelete={u.openDeleteDialog}
            onViewPermissions={u.openPermissionsDialog}
          />
        </main>

        <UserFormDialog
          open={u.isFormOpen}
          onOpenChange={(open) => (open ? u.openCreateForm() : u.closeForm())}
          currentUsuario={u.currentUsuario}
          formData={u.formData}
          formError={u.formError}
          isSubmitting={u.isSubmitting}
          onInputChange={u.handleInputChange}
          onRoleChange={u.handleRoleChange}
          onSubmit={u.handleSubmit}
        />

        <UserPermissionsDialog
          open={u.isPermissionsDialogOpen}
          onOpenChange={(open) => (open ? undefined : u.closePermissionsDialog())}
          currentUsuario={u.currentUsuario}
          permisos={u.permisos}
        />

        <UserDeleteDialog
          open={u.isDeleteDialogOpen}
          onOpenChange={(open) => (open ? undefined : u.closeDeleteDialog())}
          usuarioToDelete={u.usuarioToDelete}
          onConfirm={u.handleDelete}
        />
      </div>
    </ErrorBoundary>
  )
}
