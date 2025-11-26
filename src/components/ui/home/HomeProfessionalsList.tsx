// File: src/components/HomeProfessionalsList.tsx
import React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/genericos/table";
import { Avatar, AvatarFallback } from "@/components/ui/genericos/avatar";
import { Badge } from "@/components/ui/genericos/badge";
import { Button } from "@/components/ui/genericos/button";
import { FilePenIcon, TrashIcon, UsersIcon, PhoneIcon } from "lucide-react";
import ProfesionalActions from '@/components/ui/profesional/ProfesionalActions'
import { Profesional } from "@/types/Profesional.interface";
import { Paginator } from "../genericos/Paginator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../genericos/alert-dialog";
import { PermissionButton } from "../genericos/PermissionButton";

export function HomeProfessionalsList({
  professionals,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  setCurrentPage,
}: {
  professionals: Profesional[];
  onEdit: (p: Profesional) => void;
  onDelete: (id: number) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (n: number) => void;
}) {
  return (
    <div>
      <div className="hidden md:block overflow-x-auto">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700 w-[220px]">
                Profesional
              </TableHead>
              <TableHead className="font-semibold text-gray-700 w-[140px]">
                Profesión
              </TableHead>
              <TableHead className="font-semibold text-gray-700 w-[160px]">
                Equipo
              </TableHead>
              <TableHead className="text-center font-semibold text-gray-700 w-[100px]">
                Horas
              </TableHead>
              <TableHead className="font-semibold text-gray-700 w-[200px]">
                Correo
              </TableHead>
              <TableHead className="text-right font-semibold text-gray-700 w-[120px]">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professionals.map((professional) => (
              <TableRow
                key={professional.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                        {professional.nombre?.[0]}
                        {professional.apellido?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 break-words">
                        {professional.apellido} {professional.nombre}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <PhoneIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                        {professional.telefono}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col space-y-1">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 break-words text-xs"
                    >
                      {professional.profesion}
                    </Badge>
                    <div className="text-xs text-gray-500 break-words">
                      Mat: {professional.matricula}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    {professional.equipos?.length ? (
                      professional.equipos.map((equipo) => (
                        <div
                          key={equipo.id}
                          className="flex items-center gap-2"
                        >
                          <div className="bg-green-50 rounded-full p-1 flex-shrink-0">
                            <UsersIcon className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 break-words">
                            {equipo.nombre || "Sin nombre"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="bg-gray-50 rounded-full p-1 flex-shrink-0">
                          <UsersIcon className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-sm">Sin equipo</span>
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <div className="bg-blue-50 rounded-lg p-2 mx-auto w-fit">
                    <div className="font-bold text-lg text-blue-700">
                      {professional.totalHoras}
                    </div>
                    <div className="text-xs text-blue-600">horas</div>
                  </div>
                </TableCell>

                <TableCell className="break-words">
                  <span className="break-words">
                    {professional.correoElectronico}
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <ProfesionalActions home={true} profesional={professional} onView={() => {}} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* mobile cards (kept simple) */}
      <div className="md:hidden divide-y">
        {professionals.map((p) => (
          <div key={p.id} className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                  {p.nombre?.[0]}
                  {p.apellido?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-semibold text-gray-900">
                  {p.apellido} {p.nombre}
                </div>
                <div className="text-xs text-gray-500 flex items-center mt-0.5">
                  <PhoneIcon className="w-3 h-3 mr-1" />
                  {p.telefono || "—"}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="col-span-2">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  {p.profesion}
                </Badge>
              </div>
              <div>
                <span className="block text-xs text-gray-500">Horas</span>
                <span className="inline-flex items-center gap-1 font-semibold">
                  {p.totalHoras}
                  <span className="text-xs text-gray-500">h</span>
                </span>
              </div>
              <div className="truncate">
                <span className="block text-xs text-gray-500">Correo</span>
                <span className="text-gray-700 break-words">
                  {p.correoElectronico || "—"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-xs text-gray-500">Equipos</span>
                {p.equipos?.length ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.equipos.map((e) => (
                      <Badge
                        key={e.id}
                        variant="secondary"
                        className="text-[11px]"
                      >
                        {e.nombre}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">Sin equipo</span>
                )}
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <ProfesionalActions profesional={p} onView={() => {}} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </div>
        ))}
      </div>

      

      {/* pagination */}
 
      <Paginator
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
