'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import { Alert, AlertDescription } from "@/components/ui/genericos/alert"
import { PermissionButton } from "@/components/ui/genericos/PermissionButton"
import { CalendarIcon, AlertCircle, ClockIcon, UserCheckIcon, Edit, PlusCircle } from "lucide-react"
import type { Profesional } from "@/types/Profesional.interface"

export default function LicenciaCard({
  profesional,
  onOpenDialog,
}: {
  profesional: Profesional
  onOpenDialog: () => void
}) {
  // Normalizamos fechas a medianoche para evitar líos de horas
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const fechaFin = parseLocalDateFromYMD(profesional.fechaFinLicencia);
  const fechaInicio = parseLocalDateFromYMD(profesional.fechaInicioLicencia);

  // 1) ¿Hay alguna licencia cargada?
  const tieneLicencia = !!(
    profesional.tipoLicencia ||
    profesional.fechaInicioLicencia ||
    profesional.fechaFinLicencia
  )

  // 2) ¿La licencia está vigente hoy?
  const licenciaVigente = !!(
    profesional.licenciaActiva &&
    fechaFin &&
    fechaFin >= hoy
  );

  // 3) Días restantes solo si está vigente
  const diasRest = licenciaVigente && fechaFin
  ? Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  : null;

    function parseLocalDateFromYMD(dateStr?: string | null): Date | null {
      if (!dateStr) return null;
      const [y, m, d] = dateStr.split("-").map(Number);
      if (!y || !m || !d) return null;
      return new Date(y, m - 1, d); // 👈 esto crea la fecha en TU zona horaria
    }
    

  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${licenciaVigente ? "bg-red-50" : "bg-green-50"}`}>
              <CalendarIcon className={`w-5 h-5 ${licenciaVigente ? "text-red-600" : "text-green-600"}`} />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-800">
              Estado de Licencia
            </CardTitle>
          </div>
          <PermissionButton
            requiredPermission={{ entity: "profesional", action: "update" }}
            className={`${
              tieneLicencia
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
            onClick={onOpenDialog}
          >
            {tieneLicencia ? (
              <>
                <Edit className="mr-2 h-4 w-4" /> Editar Licencia
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" /> Agregar Licencia
              </>
            )}
          </PermissionButton>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {!tieneLicencia ? (
          // 🔹 Caso 1: nunca cargaron licencia
          <div className="text-center py-8">
            <div className="bg-green-50 rounded-full p-3 inline-flex mb-3">
              <UserCheckIcon className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-gray-600 mb-2">
              El profesional se encuentra disponible
            </p>
            <p className="text-sm text-gray-500">
              No hay licencias registradas
            </p>
          </div>
        ) : (
          // 🔹 Caso 2: hay licencia (vigente o vencida) → siempre mostramos los datos
          <div className="space-y-4">
            {licenciaVigente ? (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  ❌ Profesional en licencia - No disponible
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-green-50 border-green-200">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  ✅ Licencia finalizada. El profesional se encuentra disponible
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="Tipo de Licencia"
                value={profesional.tipoLicencia || "No especificado"}
              />
              <Field
                label="Fecha Inicio"
                value={
                  fechaInicio
                    ? fechaInicio.toLocaleDateString("es-ES")
                    : "—"
                }
              />
              <Field
                label="Fecha Fin"
                value={
                  fechaFin
                    ? fechaFin.toLocaleDateString("es-ES")
                    : "—"
                }
              />
            </div>

            {licenciaVigente && diasRest !== null && diasRest >= 0 && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <ClockIcon className="w-4 h-4" />
                <span>La licencia vence en {diasRest} días</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-base font-semibold text-gray-800">{value}</p>
    </div>
  )
}
