// components/ui/usuarios/UsuariosTable.tsx
"use client"

import { Edit, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/genericos/table"
import { ScrollArea } from "@/components/ui/genericos/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/genericos/alert"
import { Button } from "@/components/ui/genericos/button"
import { Badge } from "@/components/ui/genericos/badge"
import { PermissionButton } from "@/components/ui/genericos/PermissionButton"
import { Usuario, roleColors, roleLabels } from "@/types/roles"

type Props = {
  usuarios: Usuario[]
  totalItems: number
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onEdit: (u: Usuario) => void
  onDelete: (u: Usuario) => void
  onViewPermissions: (u: Usuario) => void
}

export default function UsuariosTable({
  usuarios,
  totalItems,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  onViewPermissions,
}: Props) {
  const handlePrev = () => onPageChange(Math.max(currentPage - 1, 1))
  const handleNext = () => onPageChange(Math.min(currentPage + 1, totalPages))

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800">
          Lista de Usuarios
        </CardTitle>
      </CardHeader>
      <CardContent>
        {usuarios.length === 0 ? (
          <Alert>
            <AlertDescription>
              No se encontraron usuarios con los filtros aplicados.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* 📌 Desktop / tablet: tabla clásica */}
            <div className="hidden md:block">
              <ScrollArea className="h-[420px] rounded-md border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-[60px]">ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="w-[120px]">Permisos</TableHead>
                      <TableHead className="w-[130px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {usuario.id}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {usuario.name}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">
                          {usuario.email}
                        </TableCell>
                        <TableCell>
                          <Badge className={roleColors[usuario.role]}>
                            {roleLabels[usuario.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => onViewPermissions(usuario)}
                          >
                            Ver permisos
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <PermissionButton
                              requiredPermission={{ entity: "user", action: "update" }}
                              variant="outline"
                              size="icon"
                              onClick={() => onEdit(usuario)}
                            >
                              <Edit className="h-4 w-4" />
                            </PermissionButton>
                            <PermissionButton
                              requiredPermission={{ entity: "user", action: "delete" }}
                              variant="outline"
                              size="icon"
                              onClick={() => onDelete(usuario)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </PermissionButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {/* 📱 Mobile: tarjetas apiladas */}
            <div className="grid gap-3 md:hidden">
              {usuarios.map((usuario) => (
                <div
                  key={usuario.id}
                  className="rounded-lg border bg-white p-3 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-mono text-slate-400">ID #{usuario.id}</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {usuario.name}
                      </p>
                      <p className="text-xs text-slate-700">{usuario.email}</p>
                    </div>
                    <Badge className={`${roleColors[usuario.role]} text-[10px]`}>
                      {roleLabels[usuario.role]}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[11px]"
                      onClick={() => onViewPermissions(usuario)}
                    >
                      Ver permisos
                    </Button>
                  </div>

                  <div className="mt-2 flex gap-2">
                    <PermissionButton
                      requiredPermission={{ entity: "user", action: "update" }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onEdit(usuario)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Editar
                    </PermissionButton>
                    <PermissionButton
                      requiredPermission={{ entity: "user", action: "delete" }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onDelete(usuario)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Eliminar
                    </PermissionButton>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            <div className="mt-4 flex flex-col items-center justify-between gap-3 text-xs text-slate-600 sm:flex-row sm:text-sm">
              <div>
                Mostrando {usuarios.length} de {totalItems} usuarios
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span>
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
