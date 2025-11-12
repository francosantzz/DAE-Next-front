// components/ui/profesional/perfil/PersonalInfoCard.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import { Badge } from "@/components/ui/genericos/badge"
import { Button } from "@/components/ui/genericos/button"
import { CalendarIcon, FilePenIcon, MapPinIcon, PhoneIcon, UserCheckIcon, Copy, ClockIcon } from "lucide-react"
import { PermissionButton } from "@/components/ui/genericos/PermissionButton"
import type { Profesional } from "@/types/Profesional.interface"
import { useState, Fragment } from "react"

export default function PersonalInfoCard({
  profesional,
  onEditClick,
}: {
  profesional: Profesional
  onEditClick: () => void
}) {
  const [copied, setCopied] = useState(false)
  const copy = (txt: string) => navigator.clipboard.writeText(txt).then(() => {
    setCopied(true); setTimeout(()=>setCopied(false), 1200)
  })

  const cargos = (profesional as any)?.cargosHoras ?? []
  const totalCargos = cargos.reduce((a: number, c: any) => a + Number(c?.cantidadHoras ?? 0), 0)

  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="p-0">
      <div className="flex items-center justify-between p-6 border-b bg-white">
        <div className="flex gap-3 items-center">
          <div className="bg-blue-50 rounded-full p-2">
            <UserCheckIcon className="w-5 h-5 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-800">Información Personal</CardTitle>
        </div>
        <PermissionButton
          requiredPermission={{ entity: "profesional", action: "update" }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onEditClick}
        >
          Editar Perfil
        </PermissionButton>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* Columna izquierda */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {profesional.profesion}
            </Badge>
            <div className="flex items-center gap-1 text-gray-700">
              <span className="font-medium">Matrícula:</span>
              <span>{profesional.matricula || "—"}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Row icon={<UserCheckIcon className="w-4 h-4 text-gray-600" />} label="Nombre">
              {profesional.nombre} {profesional.apellido}
            </Row>

            <Row icon={<FilePenIcon className="w-4 h-4 text-gray-600" />} label="DNI">
              <span>{profesional.dni}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copy(profesional.dni)}>
                <Copy className="w-4 h-4" />
              </Button>
              {copied && <span className="text-xs text-green-600 ml-1">Copiado</span>}
            </Row>

            <Row icon={<FilePenIcon className="w-4 h-4 text-gray-600" />} label="CUIL">
              {profesional.cuil || "—"}
            </Row>

            <Row icon={<PhoneIcon className="w-4 h-4 text-gray-600" />} label="Teléfono">
              {profesional.telefono || "—"}
            </Row>

            <Row icon={<FilePenIcon className="w-4 h-4 text-gray-600" />} label="Correo">
              {profesional.correoElectronico || "—"}
            </Row>

            <Row icon={<CalendarIcon className="w-4 h-4 text-gray-600" />} label="Fecha Nacimiento">
              {profesional.fechaNacimiento || "—"}
            </Row>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          <Row icon={<MapPinIcon className="w-5 h-5 text-orange-600" />} label="Dirección">
            <div>
              {(profesional.direccion?.calle || profesional.direccion?.numero) ? (
                <p className="text-gray-700">
                  {profesional.direccion?.calle} {profesional.direccion?.numero}
                </p>
              ) : <span className="text-gray-500 italic">No registrada</span>}
              {profesional.direccion?.departamento?.nombre && (
                <p className="text-gray-600">
                  {profesional.direccion?.departamento?.nombre}
                  {profesional.direccion?.departamento?.region?.nombre && `, ${profesional.direccion?.departamento?.region?.nombre}`}
                </p>
              )}
            </div>
          </Row>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Row icon={<CalendarIcon className="w-4 h-4 text-gray-600" />} label="Venc. Matrícula">
              {profesional.fechaVencimientoMatricula || "—"}
            </Row>

            <Row icon={<CalendarIcon className="w-4 h-4 text-gray-600" />} label="Venc. Psicofísico">
              {(!profesional.fechaVencimientoPsicofisico ||
                new Date(profesional.fechaVencimientoPsicofisico) < new Date()) ? (
                <Badge variant="destructive">
                  {!profesional.fechaVencimientoPsicofisico ? "No cargado" :
                    `Vencido: ${new Date(profesional.fechaVencimientoPsicofisico).toLocaleDateString()}`}
                </Badge>
              ) : (
                <Badge className="bg-green-500 hover:bg-green-600 text-white">
                  Válido hasta: {new Date(profesional.fechaVencimientoPsicofisico).toLocaleDateString()}
                </Badge>
              )}
            </Row>
          </div>

          {/* Cargos de horas integrado */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-50 rounded-full p-2">
                  <ClockIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="font-semibold text-gray-800">Cargos de Horas</span>
              </div>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                Total: {totalCargos} h
              </Badge>
            </div>

            {cargos?.length ? (
              <div className="flex flex-wrap gap-2">
                {cargos.map((c: any, i: number) => {
                  const label = (c?.tipo ?? '').replace(/_/g, ' ')
                  return (
                    <Fragment key={i}>
                      <Badge className="capitalize bg-gray-100 text-gray-800 border border-gray-200">
                        {label}: <span className="ml-1 font-semibold">{Number(c?.cantidadHoras ?? 0)}</span> h
                      </Badge>
                    </Fragment>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay cargos de horas</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="bg-gray-100 p-2 rounded-full">{icon}</div>
      <p className="text-gray-700"><span className="font-medium">{label}:</span> {children}</p>
    </div>
  )
}
