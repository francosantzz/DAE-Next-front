// components/ui/DetallesModificacion.tsx
import React from "react"
import { Badge } from "@/components/ui/genericos/badge"
import { Code } from "lucide-react"

interface DetallesModificacionProps {
  detalles: any // puede venir string o ya objeto
  entidad: string
}

interface AuditMeta {
  path?: string
  method?: string
  ip?: string
  userAgent?: string
  cantidadCambios?: number
  changedFields?: string[]
}

interface Cambio {
  campo: string
  nuevo?: any
  anterior?: any
}

const DetallesModificacion: React.FC<DetallesModificacionProps> = ({ detalles, entidad }) => {
  if (!detalles) return null

  let datos: any = detalles

  try {
    if (typeof detalles === "string") {
      datos = JSON.parse(detalles)
    }
  } catch {
    // Si no se puede parsear, mostramos el texto crudo
    return (
      <div className="text-xs text-gray-700 whitespace-pre-wrap break-all">
        {String(detalles)}
      </div>
    )
  }

  const meta: AuditMeta | undefined = datos?.meta
  const cambios: Cambio[] | undefined = Array.isArray(datos?.cambios) ? datos.cambios : undefined

  // Si no tiene la estructura nueva, mostramos un modo genérico
  if (!meta && !cambios) {
    return (
      <div className="space-y-1 text-xs">
        <p className="font-semibold text-gray-700 mb-1">
          Detalles sin formato específico para <span className="capitalize">{entidad}</span>
        </p>
        <pre className="bg-muted rounded-md p-2 text-[11px] overflow-x-auto max-h-64">
          {JSON.stringify(datos, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="space-y-3 text-xs">
      {/* Meta / contexto */}
      {meta && (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {meta.method && (
                <Badge
                  variant="outline"
                  className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                >
                  {meta.method}
                </Badge>
              )}
              {meta.path && (
                <span className="font-mono text-[11px] text-gray-700 truncate max-w-[220px] sm:max-w-xs">
                  {meta.path}
                </span>
              )}
            </div>
            {typeof meta.cantidadCambios === "number" && (
              <span className="text-[11px] text-muted-foreground">
                {meta.cantidadCambios} cambio
                {meta.cantidadCambios === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-0.5 text-[11px] text-gray-500">
            {meta.changedFields && meta.changedFields.length > 0 && (
              <span>
                Campos tocados:{" "}
                <span className="font-mono">
                  {meta.changedFields.join(", ")}
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Lista de cambios */}
      {cambios && cambios.length > 0 && (
        <div className="space-y-1">
          <p className="font-semibold text-gray-700 text-xs mb-1">
            Cambios aplicados ({cambios.length})
          </p>
          <div className="space-y-1.5">
            {cambios.map((cambio, idx) => (
              <div
                key={`${cambio.campo}-${idx}`}
                className="flex flex-col rounded-md border bg-white px-2 py-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] text-gray-700">
                      {cambio.campo}
                    </span>
                    <Badge
                      variant="outline"
                      className="px-1 py-0 text-[9px] uppercase tracking-wide"
                    >
                      {entidad}
                    </Badge>
                  </div>
                </div>

                <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {cambio.anterior !== undefined && (
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-0.5">
                        Valor anterior
                      </span>
                      <ValorCampo valor={cambio.anterior} muted />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">
                      Valor nuevo
                    </span>
                    <ValorCampo valor={cambio.nuevo} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botón para ver JSON crudo por si hace falta debugear */}
      <details className="mt-2">
        <summary className="flex items-center gap-1 cursor-pointer text-[11px] text-muted-foreground hover:text-gray-700">
          <Code className="h-3 w-3" />
          Ver JSON completo
        </summary>
        <pre className="mt-1 bg-muted rounded-md p-2 text-[11px] overflow-x-auto max-h-64">
          {JSON.stringify(datos, null, 2)}
        </pre>
      </details>
    </div>
  )
}

interface ValorCampoProps {
  valor: any
  muted?: boolean
}

const ValorCampo: React.FC<ValorCampoProps> = ({ valor, muted }) => {
  const baseClass =
    "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] max-w-full break-all"

  if (valor === null || valor === undefined) {
    return (
      <span className={`${baseClass} bg-gray-50 text-gray-400 border border-dashed border-gray-200`}>
        (sin valor)
      </span>
    )
  }

  if (typeof valor === "boolean") {
    return (
      <span
        className={`${baseClass} ${
          valor
            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
            : "bg-rose-50 text-rose-700 border border-rose-100"
        }`}
      >
        {valor ? "true" : "false"}
      </span>
    )
  }

  if (typeof valor === "number") {
    return (
      <span
        className={`${baseClass} ${
          muted ? "bg-gray-50 text-gray-600 border border-gray-100" : "bg-slate-50 text-slate-700 border border-slate-100"
        } font-mono`}
      >
        {valor}
      </span>
    )
  }

  if (typeof valor === "string") {
    const isLong = valor.length > 60
    return (
      <span
        className={`${baseClass} ${
          muted ? "bg-gray-50 text-gray-700 border border-gray-100" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
        }`}
        title={isLong ? valor : undefined}
      >
        {isLong ? `${valor.slice(0, 60)}…` : valor}
      </span>
    )
  }

  // objetos / arrays
  return (
    <span
      className={`${baseClass} ${
        muted ? "bg-gray-50 text-gray-700 border border-gray-100" : "bg-amber-50 text-amber-800 border border-amber-100"
      }`}
    >
      {JSON.stringify(valor)}
    </span>
  )
}

export default DetallesModificacion
