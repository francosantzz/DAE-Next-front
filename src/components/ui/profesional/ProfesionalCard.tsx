// components/profesionales/ProfesionalCard.tsx
"use client";

import { Badge } from "@/components/ui/genericos/badge";
import { useRouter } from "next/navigation";

// importa el tipo desde tu fichero de tipos (no desde el hook)
import type { Profesional as ProfesionalType } from "@/types/Profesional.interface";
import { useState } from "react";
import ProfesionalActions from "./ProfesionalActions";

// VM type correcto apuntando al hook real
type VM = ReturnType<typeof import("@/hooks/useProfesional").useProfesional>;

type Props = {
  profesional: ProfesionalType;
  vm: VM;
};

export default function ProfesionalCard({ profesional, vm }: Props) {
  const { remove } = vm;
  const router = useRouter();
  const [verPaqutesHoras, setVerPaquetesHoras] = useState<boolean>(false);
  const [faltanDatos, setFaltanDatos] = useState<boolean>(false);

  const handleViewPaquetesHoras = () => {
    if (verPaqutesHoras) {
      setVerPaquetesHoras(false);
    } else {
      setVerPaquetesHoras(true);
    }
  };

  const handleFaltanDatos = () => {
    const campos = [
      profesional.cuil,
      profesional.dni,
      profesional.direccion,
      profesional.correoElectronico,
      profesional.telefono,
      profesional.matricula,
      profesional.fechaNacimiento,
      profesional.fechaVencimientoMatricula,
    ];

    const faltantes = campos.filter((c) => !c);

    return faltantes.length;
  };

  const getPsicofisicoEstado = (p: ProfesionalType) => {
    if (!p.fechaVencimientoPsicofisico) return "FALTA";
    const vto = new Date(p.fechaVencimientoPsicofisico);
    const hoy = new Date();
    return vto < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
      ? "VENCIDO"
      : "OK";
  };

  const handleEditClick = () => {
    console.log("EDIT");

    vm.handleEdit(profesional);

    // 2) fallback seguro: setear currentProfesional y abrir dialog con setters separados
    const setCurrent = (vm as any).setCurrentProfesional;
    const setOpen = (vm as any).setIsDialogOpen;

    if (typeof setCurrent === "function") {
      setCurrent(profesional);
    }

    if (typeof setOpen === "function") {
      setOpen(true);
      return;
    }

    // 3) si ninguno existe, avisamos en consola (no cambié más la UI)
    console.warn(
      "Edit handler not found on vm. Implement vm.handleEdit or vm.setCurrentProfesional & vm.setIsDialogOpen."
    );
  };
  // ---------- fin modificación ----------

  return (
    <div className="px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {`${profesional.apellido} ${profesional.nombre}`} -{" "}
            {profesional.profesion}
          </span>
          {!profesional.disponible && (
            <Badge variant="destructive">En Licencia</Badge>
          )}
        </div>

        {handleFaltanDatos() > 0 && (
          <div className="bg-yellow-200 w-[12rem] text-center font-bold rounded p-1 text-xs text-[#000] mt-2">
            <p>⚠️ Faltan {handleFaltanDatos()} datos</p>
          </div>
        )}

        {/* Estado psicofísico pequeño (opcional) */}
        <div
          className={`${
            getPsicofisicoEstado(profesional) === "FALTA"
              ? "bg-orange-500"
              : getPsicofisicoEstado(profesional) === "VENCIDO"
              ? "bg-red-500"
              : "hidden"
          } text-xs text-[#fff] font-semibold max-w-[8rem] text-center p-1 rounded-full`}
        >
          Psicofísico: {getPsicofisicoEstado(profesional)}
        </div>
      </div>

              <div>
          {profesional.equipos.map((e) => (
            <>
              <Badge variant="outline" className="w-fit mt-2 gap-2 border-green-500 text-green-700 bg-green-50">
                <p className="font-bold">Equipos: </p>
                <p>{e.nombre}, {e.departamento.nombre}</p>
              </Badge>
            </>
          ))}
        </div>

      <div className="mt-3 text-sm text-gray-600">
        <div className="mt-2">
          <strong>Cargos de horas:</strong>
          {profesional.cargosHoras?.length > 0 ? (
            profesional.cargosHoras.map((c, i) => (
              <span key={i} className="inline-block ml-2 text-xs">
                {c.tipo} ({c.cantidadHoras})
              </span>
            ))
          ) : (
            <span className="ml-2 text-sm text-gray-500">No hay cargos</span>
          )}
        </div>


        <div className="flex flex-col gap-2 mt-2">
          {/*<h3
            onClick={handleViewPaquetesHoras}
            className="flex gap-1 items-center font-bold uppercase hover:underline cursor-pointer"
          >
            Paquetes horas <ChevronDown />
          </h3>
           {verPaqutesHoras &&
            profesional.paquetesHoras.map((ph) => (
              <div className="flex gap-2" key={ph.id}>
                <p className="font-semibold">- {ph.escuela ? ph.escuela.nombre : ph.tipo} {`(${ph.equipo?.nombre})`}: </p>
                <p>{ph.cantidad} hs</p>
              </div>
            ))} */}

          <div className="flex gap-2 mb-2">
            <p className="font-semibold">
              Paquetes horas activos:{" "}
              {profesional.paquetesHoras.length > 0 ? "SI" : "NO"}
            </p>
          </div>
        </div>
        <ProfesionalActions
          profesional={profesional}
          onView={(p) => router.push(`/profesionales/${p.id}`)}
          onEdit={(p) =>
            vm.handleEdit?.(p) ??
            (vm.setCurrentProfesional?.(p), vm.setIsDialogOpen?.(true))
          }
          onDelete={(id) => vm.remove(id)}
          compact
        />
      </div>
    </div>
  );
}
