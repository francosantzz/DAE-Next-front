'use client'
import React, { useState } from "react"
import { UsersIcon, UserIcon, PlusIcon, FilePenIcon, TrashIcon, SearchIcon } from "lucide-react"
import { Input } from "../genericos/input"
import { PermissionButton } from "../genericos/PermissionButton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../genericos/table"
import { Badge } from "../genericos/badge"

// AlertDialog (ajusta la ruta si la tienes en otro lugar)
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "../genericos/alert-dialog"

function HeaderInfo({ getNombreEquipoSeleccionado, getNombreProfesionalSeleccionado, getTotalHoras, verAnteriores, licenciaActiva }: any) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-6 min-w-0">
        <div className="flex items-center space-x-2 min-w-0">
          <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-semibold text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">{getNombreEquipoSeleccionado()}</span>
        </div>
        <div className="flex items-center space-x-2 min-w-0">
          <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-semibold text-sm sm:text-base max-w-[150px] sm:max-w-none">{getNombreProfesionalSeleccionado()}</span>
          {licenciaActiva && (
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">⚠️ En Licencia</Badge>
          )}
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 px-2 py-1 rounded-lg">
          <span className="text-xs sm:text-sm font-medium text-blue-700">Total:</span>
          <span className="text-sm sm:text-lg font-bold text-blue-800">{getTotalHoras()}h</span>
        </div>
      </div>
      {verAnteriores && <Badge variant="destructive" className="text-xs self-start sm:self-auto">Vista histórica (sólo lectura)</Badge>}
    </div>
  )
}

export default function PaquetesTable({
  sortedPaquetes, searchTerm, setSearchTerm,
  onOpenModal, onDelete, getNombreEquipoSeleccionado,
  getNombreProfesionalSeleccionado, getTotalHoras, verAnteriores, profesionalesFiltrados, profesionalSeleccionado
}: any) {
  // estado para el dialogo de confirmación
  const [openConfirm, setOpenConfirm] = useState(false)
  const [selectedPaquete, setSelectedPaquete] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const openDeleteDialog = (paquete: any) => {
    setSelectedPaquete(paquete)
    setOpenConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedPaquete) return
    setIsDeleting(true)
    try {
      await onDelete(Number(selectedPaquete.id))
    } catch (err) {
      console.error('Error eliminando paquete:', err)
    } finally {
      setIsDeleting(false)
      setOpenConfirm(false)
      setSelectedPaquete(null)
    }
  }

  return (
    <div className="space-y-4 w-full overflow-x-hidden max-w-[100vw] min-w-0">
      <HeaderInfo
        getNombreEquipoSeleccionado={getNombreEquipoSeleccionado}
        getNombreProfesionalSeleccionado={getNombreProfesionalSeleccionado}
        getTotalHoras={getTotalHoras}
        verAnteriores={verAnteriores}
        licenciaActiva={profesionalesFiltrados.find((p:any)=>p.id.toString()===profesionalSeleccionado)?.licenciaActiva}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
        <div className="relative w-full sm:w-64 min-w-0">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input placeholder="Buscar..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="pl-8 text-sm sm:text-base" />
        </div>

        <PermissionButton requiredPermission={{ entity: 'paquetehoras', action: 'create'}} onClick={()=>onOpenModal()} disabled={verAnteriores} className="w-full sm:w-auto text-sm">
          <PlusIcon className="h-4 w-4 mr-2" /> Agregar Paquete
        </PermissionButton>
      </div>

      <div className="w-full rounded-lg border">
        <div className="overflow-x-auto md:overflow-visible [-webkit-overflow-scrolling:touch]">
          <div className="inline-block align-top min-w-[760px] md:min-w-0 md:w-full">
            <Table className="w-full table-fixed md:table-auto">
              <colgroup>
                <col className="md:w-[10%]" />
                <col className="md:w-[8%]" />
                <col className="md:w-[45%]" />
                <col className="md:w-[10%]" />
                <col className="md:w-[7%]" />
                <col className="md:w-[7%]" />
                <col className="md:w-[6%]" />
                <col className="md:w-[7%]" />
                <col className="md:w-[10%]" />
              </colgroup>

              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm whitespace-nowrap">Tipo</TableHead>
                  <TableHead className="text-xs md:text-sm whitespace-nowrap">Cantidad</TableHead>
                  <TableHead className="text-xs md:text-sm">Escuela</TableHead>
                  <TableHead className="text-xs md:text-sm whitespace-nowrap">Día</TableHead>
                  <TableHead className="text-xs md:text-sm whitespace-nowrap">Inicio</TableHead>
                  <TableHead className="text-xs md:text-sm whitespace-nowrap">Fin</TableHead>
                  <TableHead className="text-xs md:text-sm whitespace-nowrap">Rotativo</TableHead>
                  <TableHead className="text-xs md:text-sm whitespace-nowrap">Semanas</TableHead>
                  <TableHead className="text-xs md:text-sm text-right whitespace-nowrap">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedPaquetes.map((paquete: any) => {
                  let tipoBorder = "", tipoBadge = ""
                  if (paquete.tipo === "Escuela") {
                    tipoBorder = "border-l-4 border-l-green-400 bg-green-50"
                    tipoBadge  = "bg-green-100 text-green-800"
                  } else if (paquete.tipo === "Carga en GEI") {
                    tipoBorder = "border-l-4 border-l-violet-400 bg-violet-50"
                    tipoBadge  = "bg-violet-100 text-violet-800"
                  } else if (paquete.tipo === "Trabajo Interdisciplinario") {
                    tipoBorder = "border-l-4 border-l-blue-400 bg-blue-100"
                    tipoBadge  = "bg-blue-200 text-blue-800"
                  }

                  return (
                    <TableRow key={paquete.id} className={paquete.rotativo ? "font-semibold" : ""}>
                      <TableCell className={tipoBorder}>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${tipoBadge}`}>{paquete.tipo}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{paquete.cantidad} h</TableCell>
                      <TableCell>
                        <div className="max-w-[240px] md:max-w-none whitespace-nowrap md:whitespace-normal truncate md:truncate-none md:break-words" title={paquete.escuela?.nombre ? `${paquete.escuela.nombre}${paquete.escuela?.Numero ? ` • N° ${paquete.escuela.Numero}` : ""}` : "-" } style={{ wordBreak: "break-word", hyphens: "auto" }}>
                          <div className="font-medium md:leading-snug">{paquete.escuela?.nombre || "-"}</div>
                          {paquete.escuela?.Numero && <div className="text-xs text-gray-500 md:leading-tight">N° {paquete.escuela.Numero}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][paquete.diaSemana] || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{paquete.horaInicio}</TableCell>
                      <TableCell className="whitespace-nowrap">{paquete.horaFin}</TableCell>
                      <TableCell className={`whitespace-nowrap ${paquete.rotativo ? "bg-yellow-100 text-yellow-800 font-semibold" : ""}`}>{paquete.rotativo ? "Sí" : "No"}</TableCell>
                      <TableCell className="whitespace-nowrap">{paquete.rotativo && paquete.semanas?.length ? paquete.semanas.join(", ") : "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <PermissionButton requiredPermission={{ entity: "paquetehoras", action: "update" }} variant="ghost" size="icon" onClick={()=>onOpenModal(paquete)} className="h-8 w-8">
                            <FilePenIcon className="h-4 w-4" />
                          </PermissionButton>

                          {/* ahora abrimos dialogo en lugar de llamar directamente a onDelete */}
                          <PermissionButton requiredPermission={{ entity: "paquetehoras", action: "delete" }} variant="ghost" size="icon" onClick={()=>openDeleteDialog(paquete)} className="h-8 w-8">
                            <TrashIcon className="h-4 w-4" />
                          </PermissionButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {sortedPaquetes.length === 0 && (
        <div className="text-center py-8 text-gray-500">No se encontraron paquetes de horas</div>
      )}

      {/* AlertDialog único para confirmación de eliminación */}
      <AlertDialog open={openConfirm} onOpenChange={(o)=>{ if (!o) { setOpenConfirm(false); setSelectedPaquete(null) } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar paquete{selectedPaquete ? ` — ${selectedPaquete.tipo || ''}` : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente y eliminará el paquete seleccionado.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={()=>{ setOpenConfirm(false); setSelectedPaquete(null) }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700" disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
