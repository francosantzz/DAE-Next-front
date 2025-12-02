// components/ui/profesional/ProfesionalActions.tsx
"use client";

import { useState } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import { PermissionButton } from "@/components/ui/genericos/PermissionButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/genericos/alert-dialog";
import { cn } from "@/lib/utils";
import type { Profesional } from "@/types/Profesional.interface";

export type ProfesionalActionsProps = {
  profesional: Profesional;
  onView: (p: Profesional) => void;
  onEdit: (p: Profesional) => void;
  onDelete: (id: number) => Promise<void> | void;
  className?: string;
  /** Si true, usa botones chicos y apila en mobile */
  compact?: boolean;
  home?:boolean;
};

export default function ProfesionalActions({
  profesional,
  onView,
  onEdit,
  onDelete,
  className,
  compact,
  home
}: ProfesionalActionsProps) {
  const [openConfirm, setOpenConfirm] = useState(false);

  const stackClasses = compact
    ? "flex  justify-end gap-2"
    : "flex  justify-end gap-2";

  const nombreVisible = `${profesional.apellido} ${profesional.nombre} - ${profesional.profesion}`;

  return (
    <div className={cn(stackClasses, className)}>
      {/* Ver */}
      <PermissionButton
        requiredPermission={{ entity: "profesional", action: "read" }}
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={() => onView(profesional)}
        className={`${home && 'hidden'} hover:bg-green-50 hover:border-green-300 text-green-600`}
      >
        <Eye className="mr-1 h-3 w-3" />
        Ver
      </PermissionButton>
      {/* Editar */}
      <PermissionButton
        requiredPermission={{ entity: "profesional", action: "update" }}
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={() => onEdit(profesional)}
      >
        <Edit className="h-4 w-4" />
      </PermissionButton>

      {/* Eliminar con confirmación */}
      <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <AlertDialogTrigger asChild>
          <PermissionButton
            requiredPermission={{ entity: "profesional", action: "delete" }}
            variant="destructive"
            size={compact ? "sm" : "default"}
            onClick={() => setOpenConfirm(true)}
          >
            <Trash2 className=" h-4 w-4" />
          </PermissionButton>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {nombreVisible}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente y eliminará al profesional seleccionado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                await onDelete(Number(profesional.id));
                setOpenConfirm(false);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
