"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  PlusCircle,
  Edit,
  Trash2,
  Search,
  User,
  Shield,
  Mail,
  AlertCircle,
  Eye,
  Plus,
  Pencil,
  Trash,
  X,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ErrorBoundary from "@/components/ErrorBoundary"
import { useDebounce } from "@/hooks/useDebounce"

// Enum de roles
export enum Role {
  ADMIN = "admin",
  EQUIPO = "equipo",
  TECNICO = "tecnico",
  OBSERVATORIO = "observatorio",
  DIRECTORA = "directora",
  USER = "user",
}

// Interfaces
interface Permission {
  [key: string]: {
    entity: string;
    permissions: string;
  }[];
}

interface Usuario {
  id: number
  name: string
  email: string
  role: Role
  createdAt: string
  updatedAt: string
}

// Labels para roles
const roleLabels = {
  [Role.ADMIN]: "Administrador",
  [Role.EQUIPO]: "Equipo",
  [Role.TECNICO]: "Técnico",
  [Role.OBSERVATORIO]: "Observatorio",
  [Role.DIRECTORA]: "Directora",
  [Role.USER]: "Usuario",
}

// Colores para roles
const roleColors = {
  [Role.ADMIN]: "bg-red-100 text-red-800",
  [Role.EQUIPO]: "bg-blue-100 text-blue-800",
  [Role.TECNICO]: "bg-green-100 text-green-800",
  [Role.OBSERVATORIO]: "bg-purple-100 text-purple-800",
  [Role.DIRECTORA]: "bg-yellow-100 text-yellow-800",
  [Role.USER]: "bg-gray-100 text-gray-800",
}

export default function ListaUsuarios() {
  const { data: session } = useSession()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [permisos, setPermisos] = useState<Permission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [busquedaInput, setBusquedaInput] = useState("")
  const busqueda = useDebounce(busquedaInput, 1000)
  const [filtroRol, setFiltroRol] = useState("todos")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [currentUsuario, setCurrentUsuario] = useState<Usuario | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: Role.USER as Role,
  })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [usuariosRes, permisosRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users?page=${currentPage}&limit=${itemsPerPage}&search=${busqueda}${filtroRol !== 'todos' ? `&role=${filtroRol}` : ''}`, {
          headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/permissions`, {
          headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
        })
      ])

      if (!usuariosRes.ok || !permisosRes.ok) {
        throw new Error("Error al obtener los datos")
      }

      const [usuariosData, permisosData] = await Promise.all([
        usuariosRes.json(),
        permisosRes.json()
      ])

      setUsuarios(usuariosData.data)
      setTotalPages(usuariosData.meta.totalPages)
      setTotalItems(usuariosData.meta.total)
      setPermisos(permisosData)
    } catch (error) {
      console.error("Error al obtener datos:", error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.accessToken, currentPage, busqueda, filtroRol])

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchData()
    }
  }, [fetchData, session?.user?.accessToken])

  const handleOpenDialog = (usuario?: Usuario) => {
    if (usuario) {
      setCurrentUsuario(usuario)
      setFormData({
        name: usuario.name,
        email: usuario.email,
        password: "", // No mostrar contraseña existente
        role: usuario.role,
      })
    } else {
      setCurrentUsuario(null)
      setFormData({
        name: "",
        email: "",
        password: "",
        role: Role.USER,
      })
    }
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handleOpenPermissionsDialog = (usuario: Usuario) => {
    setCurrentUsuario(usuario)
    setIsPermissionsDialogOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    // Validación básica
    if (!formData.name || !formData.email || (!currentUsuario && !formData.password)) {
      setFormError("Por favor complete todos los campos requeridos.")
      setIsSubmitting(false)
      return
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setFormError("Por favor ingrese un email válido.")
      setIsSubmitting(false)
      return
    }

    try {
      const url = currentUsuario
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${currentUsuario.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/users`

      const method = currentUsuario ? "PATCH" : "POST"

      const body: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      }

      // Solo incluir contraseña si se está creando un usuario nuevo o si se proporcionó una nueva
      if (!currentUsuario || formData.password) {
        body.password = formData.password
      }

      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.accessToken}`
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al guardar el usuario")
      }

      // Actualizar la lista de usuarios
      await fetchData()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error al guardar el usuario:", error)
      setFormError(error instanceof Error ? error.message : "Error al guardar el usuario")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenDeleteDialog = (usuario: Usuario) => {
    setUsuarioToDelete(usuario)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!usuarioToDelete) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${usuarioToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
      })

      if (!response.ok) {
        throw new Error("Error al eliminar el usuario")
      }

      setUsuarios(usuarios.filter((u) => u.id !== usuarioToDelete.id))
      setIsDeleteDialogOpen(false)
      setUsuarioToDelete(null)
    } catch (error) {
      console.error("Error al eliminar el usuario:", error)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "read":
        return <Eye className="h-3 w-3" />
      case "create":
        return <Plus className="h-3 w-3" />
      case "update":
        return <Pencil className="h-3 w-3" />
      case "delete":
        return <Trash className="h-3 w-3" />
      default:
        return null
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "read":
        return "bg-blue-100 text-blue-800"
      case "create":
        return "bg-green-100 text-green-800"
      case "update":
        return "bg-yellow-100 text-yellow-800"
      case "delete":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando usuarios...</div>
  }

  return (
    <ErrorBoundary>
      <div className="bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <Button onClick={() => handleOpenDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Usuario
              </Button>
            </div>
          </div>
        </header>
      </div>

      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="busqueda">Búsqueda</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="busqueda"
                    placeholder="Username o email..."
                    className="pl-8"
                    value={busquedaInput}
                    onChange={(e) => setBusquedaInput(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="filtroRol">Rol</Label>
                <Select value={filtroRol} onValueChange={setFiltroRol}>
                  <SelectTrigger id="filtroRol">
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
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <User className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-bold">{totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Administradores</p>
                  <p className="text-2xl font-bold">{usuarios.filter((u) => u.role === Role.ADMIN).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Usuarios Regulares</p>
                  <p className="text-2xl font-bold">{usuarios.filter((u) => u.role === Role.USER).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de usuarios */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            {usuarios.length === 0 ? (
              <Alert>
                <AlertDescription>No se encontraron usuarios con los filtros aplicados.</AlertDescription>
              </Alert>
            ) : (
              <>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Permisos</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuarios.map((usuario) => (
                        <TableRow key={usuario.id}>
                          <TableCell className="font-mono">{usuario.id}</TableCell>
                          <TableCell className="font-medium">{usuario.name}</TableCell>
                          <TableCell>{usuario.email}</TableCell>
                          <TableCell>
                            <Badge className={roleColors[usuario.role]}>{roleLabels[usuario.role]}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleOpenPermissionsDialog(usuario)}>
                              Ver Permisos
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="icon" onClick={() => handleOpenDialog(usuario)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={() => handleOpenDeleteDialog(usuario)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="flex-1 text-sm text-muted-foreground">
                    Mostrando {usuarios.length} de {totalItems} usuarios
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <div className="text-sm">
                      Página {currentPage} de {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
      </div>

      {/* Diálogo para agregar/editar usuario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentUsuario ? "Editar" : "Agregar"} Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Username *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña {currentUsuario ? "(dejar vacío para mantener actual)" : "*"}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!currentUsuario}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                name="role"
                value={formData.role}
                onValueChange={(value) => handleSelectChange("role", value)}
                required
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Role).map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de permisos */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Permisos de {currentUsuario?.name} - {currentUsuario && roleLabels[currentUsuario.role]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {permisos && currentUsuario && permisos[currentUsuario.role]?.map((permiso) => {
              const permisosArray = JSON.parse(permiso.permissions);
              return (
                <Card key={permiso.entity}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{permiso.entity}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {permisosArray.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {permisosArray.map((action: string) => (
                          <Badge key={action} className={`${getActionColor(action)} flex items-center gap-1`}>
                            {getActionIcon(action)}
                            {action}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500">
                        <X className="h-4 w-4 mr-2" />
                        Sin permisos para esta entidad
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPermissionsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>¿Está seguro de que desea eliminar este usuario?</p>
            {usuarioToDelete && (
              <div className="mt-2 p-3 bg-gray-100 rounded-md">
                <p>
                  <strong>Username:</strong> {usuarioToDelete.name}
                </p>
                <p>
                  <strong>Email:</strong> {usuarioToDelete.email}
                </p>
                <p>
                  <strong>Rol:</strong> {roleLabels[usuarioToDelete.role]}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  )
}
