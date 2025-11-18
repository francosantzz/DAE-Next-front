// hooks/useUsuarios.ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useDebounce } from "@/hooks/useDebounce"
import { Role, Usuario, Permission } from "@/types/roles"

export function useUsuarios() {
  const { data: session } = useSession()

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [permisos, setPermisos] = useState<Permission | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [busquedaInput, setBusquedaInput] = useState("")
  const busqueda = useDebounce(busquedaInput, 800)
  const [filtroRol, setFiltroRol] = useState("todos")

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [currentUsuario, setCurrentUsuario] = useState<Usuario | null>(null)
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
    if (!session?.user?.accessToken) return
    setIsLoading(true)
    try {
      const queryRole = filtroRol !== "todos" ? `&role=${filtroRol}` : ""
      const usuariosRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users?page=${currentPage}&limit=${itemsPerPage}&search=${busqueda}${queryRole}`,
        { headers: { Authorization: `Bearer ${session.user.accessToken}` } }
      )

      const permisosRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/permissions`,
        { headers: { Authorization: `Bearer ${session.user.accessToken}` } }
      )

      if (!usuariosRes.ok || !permisosRes.ok) {
        throw new Error("Error al obtener los datos")
      }

      const usuariosData = await usuariosRes.json()
      const permisosData = await permisosRes.json()

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
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setCurrentPage(1)
  }, [busqueda, filtroRol])

  // --------- Handlers principales ---------

  const openCreateForm = () => {
    setCurrentUsuario(null)
    setFormData({
      name: "",
      email: "",
      password: "",
      role: Role.USER,
    })
    setFormError(null)
    setIsFormOpen(true)
  }

  const openEditForm = (usuario: Usuario) => {
    setCurrentUsuario(usuario)
    setFormData({
      name: usuario.name,
      email: usuario.email,
      password: "",
      role: usuario.role,
    })
    setFormError(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value as Role }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    if (!formData.name || !formData.email || (!currentUsuario && !formData.password)) {
      setFormError("Por favor complete todos los campos requeridos.")
      setIsSubmitting(false)
      return
    }

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

      if (!currentUsuario || formData.password) {
        body.password = formData.password
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.accessToken}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al guardar el usuario")
      }

      await fetchData()
      setIsFormOpen(false)
    } catch (error) {
      console.error("Error al guardar el usuario:", error)
      setFormError(error instanceof Error ? error.message : "Error al guardar el usuario")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openPermissionsDialog = (usuario: Usuario) => {
    setCurrentUsuario(usuario)
    setIsPermissionsDialogOpen(true)
  }

  const closePermissionsDialog = () => {
    setIsPermissionsDialogOpen(false)
  }

  const openDeleteDialog = (usuario: Usuario) => {
    setUsuarioToDelete(usuario)
    setIsDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setUsuarioToDelete(null)
  }

  const handleDelete = async () => {
    if (!usuarioToDelete || !session?.user?.accessToken) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${usuarioToDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
        }
      )

      if (!response.ok) throw new Error("Error al eliminar el usuario")

      setUsuarios((prev) => prev.filter((u) => u.id !== usuarioToDelete.id))
      closeDeleteDialog()
    } catch (error) {
      console.error("Error al eliminar el usuario:", error)
    }
  }

  return {
    // datos
    usuarios,
    permisos,
    isLoading,
    // filtros
    busquedaInput,
    setBusquedaInput,
    filtroRol,
    setFiltroRol,
    // paginación
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    // formulario
    isFormOpen,
    openCreateForm,
    openEditForm,
    closeForm,
    currentUsuario,
    formData,
    formError,
    isSubmitting,
    handleInputChange,
    handleRoleChange,
    handleSubmit,
    // permisos dialog
    isPermissionsDialogOpen,
    openPermissionsDialog,
    closePermissionsDialog,
    // delete dialog
    isDeleteDialogOpen,
    openDeleteDialog,
    closeDeleteDialog,
    usuarioToDelete,
    handleDelete,
  }
}
