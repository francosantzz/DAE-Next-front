"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Save, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSession } from "next-auth/react"
import { usePermissions } from "@/hooks/usePermissions"

interface ObservacionesEditorProps {
  escuelaId: number
  observaciones: string | undefined
  onObservacionesUpdated: (newObservaciones: string) => void
}

export function ObservacionesEditor({
  escuelaId,
  observaciones,
  onObservacionesUpdated,
}: ObservacionesEditorProps) {
  const { data: session } = useSession()
  const { hasPermission } = usePermissions()
  const [isEditing, setIsEditing] = useState(false)
  const [editedObservaciones, setEditedObservaciones] = useState(observaciones || "")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Verificar si el usuario puede editar observaciones de escuelas
  // Nota: El rol "equipo" tiene permiso "escuela.update" pero solo puede editar observaciones,
  // no otros campos de la escuela (esto se maneja en el frontend)
  const canEditObservaciones = hasPermission("escuela", "update")

  const handleEdit = () => {
    setEditedObservaciones(observaciones || "")
    setIsEditing(true)
    setError(null)
    setSuccessMessage(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
  }

  const handleSave = async () => {
    if (!session?.user?.accessToken) {
      setError("No tienes permisos para realizar esta acción")
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/escuelas/${escuelaId}/observaciones`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify({ observaciones: editedObservaciones }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al guardar las observaciones")
      }

      onObservacionesUpdated(editedObservaciones)
      setIsEditing(false)
      setSuccessMessage("Observaciones actualizadas correctamente")

      // Ocultar el mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (error) {
      console.error("Error al guardar las observaciones:", error)
      setError(error instanceof Error ? error.message : "Error al guardar las observaciones")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Estado del Espacio Físico</CardTitle>
        {canEditObservaciones && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              placeholder="Registre problemas edilicios, disponibilidad de espacio, mobiliario, etc."
              className="min-h-[150px]"
              value={editedObservaciones}
              onChange={(e) => setEditedObservaciones(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  "Guardando..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Guardar
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="min-h-[100px]">
            {observaciones ? (
              <div className="whitespace-pre-wrap">{observaciones}</div>
            ) : (
              <p className="text-gray-500 italic">No hay observaciones registradas sobre el espacio físico.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
