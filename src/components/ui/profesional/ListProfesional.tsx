// components/profesionales/ListProfesionales.tsx
"use client";

import type { useProfesional } from "@/hooks/useProfesional";
import ProfesionalCard from "./ProfesionalCard";
import ProfesionalFormModal from "./ProfesionalFormModal";

type Props = { vm: ReturnType<typeof useProfesional> };

export default function ListProfesionales({ vm }: Props) {
  const {
    profesionales,
    isLoading,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
  } = vm;

  return (
    <div>
      {/* <-- AÑADIR EL MODAL AQUÍ, que usa el mismo vm */}
      <ProfesionalFormModal vm={vm} />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {isLoading ? (
          <p className="text-center py-4">Cargando profesionales...</p>
        ) : profesionales.length > 0 ? (
          <>
            <div className="divide-y">
              {profesionales.map((p) => (
                <ProfesionalCard key={p.id} profesional={p} vm={vm} />
              ))}
            </div>

            {/* paginación comentada */}
          </>
        ) : (
          <p className="text-center py-4">
            No se encontraron profesionales con los filtros aplicados.
          </p>
        )}
      </div>
    </div>
  );
}
