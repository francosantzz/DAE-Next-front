// components/equipo/EquipoFormDialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/genericos/dialog";
import { Label } from "@/components/ui/genericos/label";
import { Input } from "@/components/ui/genericos/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/genericos/select";
import { ScrollArea } from "@/components/ui/genericos/scroll-area";
import { Badge } from "@/components/ui/genericos/badge";
import { Button } from "@/components/ui/genericos/button";
import { UserCheck, Building, X } from "lucide-react";
import ProfesionalesSelector from "./profesionales-selector";
import EscuelasSelector from "./escuelas-selector";
import { useSession } from "next-auth/react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vm: ReturnType<typeof import("@/hooks/useEquipo").useEquipos>;
};

export default function EquipoFormDialog({ open, onOpenChange, vm }: Props) {
  const {
    departamentos,
    isEditing,
    formData,
    setFormData,
    profesionalesSeleccionados,
    setProfesionalesSeleccionados,
    escuelasSeleccionadas,
    setEscuelasSeleccionadas,
    profesionalSearch,
    setProfesionalSearch,
    escuelaSearch,
    setEscuelaSearch,
    profesionalesFiltrados,
    escuelasFiltradas,
    errorMessage,
    handleSubmit,
    resetForm,
  } = vm;

  const { data: session } = useSession();
  const accessToken = session?.user?.accessToken;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: Number(value) });
  };
  const handleProfesionalSelect = (p: any) => {
    setProfesionalesSeleccionados((prev) => [...prev, p]);
    setFormData((prev) => ({
      ...prev,
      profesionalesIds: [...prev.profesionalesIds, p.id],
    }));
    setProfesionalSearch("");
  };
  const handleProfesionalRemove = (id: number) => {
    setProfesionalesSeleccionados((prev) => prev.filter((x) => x.id !== id));
    setFormData((prev) => ({
      ...prev,
      profesionalesIds: prev.profesionalesIds.filter((pid) => pid !== id),
    }));
  };
  const handleEscuelaSelect = (e: any) => {
    setEscuelasSeleccionadas((prev) => [...prev, e]);
    setFormData((prev) => ({
      ...prev,
      escuelasIds: [...prev.escuelasIds, e.id],
    }));
    setEscuelaSearch("");
  };
  const handleEscuelaRemove = (id: number) => {
    setEscuelasSeleccionadas((prev) => prev.filter((x) => x.id !== id));
    setFormData((prev) => ({
      ...prev,
      escuelasIds: prev.escuelasIds.filter((eid) => eid !== id),
    }));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) resetForm();
      }}
    >
      <DialogContent className="w-[95vw] h-[90vh] sm:max-w-[1000px] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar" : "Agregar"} Equipo</DialogTitle>
          <DialogDescription>
            Complete los detalles del equipo y guarde los cambios.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="departamento">Departamento</Label>
              <Select
                onValueChange={(v) => handleSelectChange("departamentoId", v)}
                value={formData.departamentoId.toString()}
              >
                <SelectTrigger id="departamento">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {departamentos.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            {/* SELECTORES */}
            <div className="w-full">
              <ProfesionalesSelector
                accessToken={accessToken!}
                seleccionados={profesionalesSeleccionados}
                onAdd={handleProfesionalSelect}
                onRemove={handleProfesionalRemove}
              />

              <EscuelasSelector
                accessToken={accessToken!}
                seleccionadas={escuelasSeleccionadas}
                onAdd={handleEscuelaSelect}
                onRemove={handleEscuelaRemove}
              />
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button type="submit" className="w-full sm:w-auto">
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
