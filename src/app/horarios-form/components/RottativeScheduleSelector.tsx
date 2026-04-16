"use client"

import { useState } from "react"
import { Label } from "@/components/ui/genericos/label"
import { Input } from "@/components/ui/genericos/input"
import { Button } from "@/components/ui/genericos/button"
import { Badge } from "@/components/ui/genericos/badge"

type RottativeScheduleSelectorProps = {
  tipo: "porSemana" | "porCalendario" | undefined
  semanas?: number[]
  fechas?: string[]
  diaSemana?: string
  onTipoChange: (tipo: "porSemana" | "porCalendario") => void
  onSemanasChange: (semanas: number[]) => void
  onFechasChange: (fechas: string[]) => void
}

const SEMANAS = [
  { value: 1, label: "Semana 1" },
  { value: 2, label: "Semana 2" },
  { value: 3, label: "Semana 3" },
  { value: 4, label: "Semana 4" },
]

export function RottativeScheduleSelector({
  tipo,
  semanas = [],
  fechas = [],
  diaSemana = "",
  onTipoChange,
  onSemanasChange,
  onFechasChange,
}: RottativeScheduleSelectorProps) {
  const [mesActual, setMesActual] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

  const toggleSemana = (numeroSemana: number) => {
    if (semanas.includes(numeroSemana)) {
      onSemanasChange(semanas.filter((s) => s !== numeroSemana))
    } else {
      onSemanasChange([...semanas, numeroSemana].sort())
    }
  }

  const toggleFecha = (fecha: string) => {
    if (fechas.includes(fecha)) {
      onFechasChange(fechas.filter((f) => f !== fecha))
    } else {
      onFechasChange([...fechas, fecha].sort())
    }
  }

  const obtenerDiasDelMes = () => {
    const año = mesActual.getFullYear()
    const mes = mesActual.getMonth()
    const primerDia = new Date(año, mes, 1)
    const ultimoDia = new Date(año, mes + 1, 0)
    const diasMes: (string | null)[] = []

    // Agregar días vacíos del mes anterior
    const diaSemanaInicio = primerDia.getDay()
    for (let i = 0; i < diaSemanaInicio; i++) {
      diasMes.push(null)
    }

    // Agregar días del mes actual con formato YYYY-MM-DD en zona horaria local
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fechaObj = new Date(año, mes, dia)
      const diaFormato = String(dia).padStart(2, "0")
      const mesFormato = String(mes + 1).padStart(2, "0")
      const fechaFormato = `${año}-${mesFormato}-${diaFormato}`
      diasMes.push(fechaFormato)
    }

    return diasMes
  }

  const esFinDeSemana = (fecha: string | null): boolean => {
    if (!fecha) return false
    const dateObj = new Date(fecha + "T00:00:00")
    const diaSemana = dateObj.getDay()
    return diaSemana === 0 || diaSemana === 6 // 0 = domingo, 6 = sábado
  }

  const obtenerDiaSemanaDeTexto = (fecha: string | null): number => {
    if (!fecha) return -1
    const dateObj = new Date(fecha + "T00:00:00")
    return dateObj.getDay()
  }

  const esDiaSeleccionado = (fecha: string | null): boolean => {
    if (!fecha || !diaSemana) return true // Si no hay día seleccionado, permitir todos
    const fechaDiaSemana = obtenerDiaSemanaDeTexto(fecha)
    const diaSemanaNumerico = parseInt(diaSemana, 10)
    return fechaDiaSemana === diaSemanaNumerico
  }

  const irMesAnterior = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1))
  }

  const irMesSiguiente = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1))
  }

  const nombreMes = mesActual.toLocaleDateString("es-AR", { month: "long", year: "numeric" })
  const diasDelMes = obtenerDiasDelMes()
  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sab"]

  return (
    <div className="space-y-4 mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-50 rounded-md border border-slate-200">
      <div>
        <Label className="text-sm font-medium">Tipo de rotativo</Label>
        <div className="flex flex-col gap-2 mt-2 sm:flex-row sm:gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="porSemana"
              checked={tipo === "porSemana"}
              onChange={(e) => onTipoChange(e.target.value as "porSemana" | "porCalendario")}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-700">Por semana</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="porCalendario"
              checked={tipo === "porCalendario"}
              onChange={(e) => onTipoChange(e.target.value as "porSemana" | "porCalendario")}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-700">Por calendario</span>
          </label>
        </div>
      </div>

      {tipo === "porSemana" && (
        <div>
          <Label className="text-sm font-medium">Seleccione las semanas</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {SEMANAS.map((semana) => (
              <button
                key={semana.value}
                onClick={() => toggleSemana(semana.value)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  semanas.includes(semana.value)
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {semana.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tipo === "porCalendario" && (
        <div className="space-y-4">
          {diaSemana && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                ℹ️ Solo puedes seleccionar fechas del <span className="font-semibold">{
                  ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][parseInt(diaSemana, 10)]
                }</span>
              </p>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={irMesAnterior}
                className="px-2"
              >
                ←
              </Button>
              <h3 className="text-sm font-semibold text-slate-800 capitalize">{nombreMes}</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={irMesSiguiente}
                className="px-2"
              >
                →
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {diasSemana.map((dia) => (
                <div key={dia} className="text-center text-[10px] sm:text-xs font-semibold text-slate-600 py-2">
                  {dia}
                </div>
              ))}

              {diasDelMes.map((fecha, index) => {
                const esFinSemana = esFinDeSemana(fecha)
                const esDelDiaSeleccionado = esDiaSeleccionado(fecha)
                const esSeleccionada = fecha && fechas.includes(fecha)
                const puedeSeleccionar = !!fecha && !esFinSemana && esDelDiaSeleccionado
                
                return (
                  <button
                    key={index}
                    onClick={() => puedeSeleccionar && toggleFecha(fecha)}
                    disabled={!puedeSeleccionar}
                    className={`
                      aspect-square text-xs font-medium rounded transition-colors
                      ${
                        !fecha || esFinSemana
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-50"
                          : !esDelDiaSeleccionado
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-50"
                            : esSeleccionada
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-white border border-slate-300 text-slate-700 hover:bg-blue-50"
                      }
                    `}
                  >
                    {fecha ? new Date(fecha + "T00:00:00").getDate() : ""}
                  </button>
                )
              })}
            </div>
          </div>

          {fechas.length > 0 && (
            <div className="pt-3 border-t border-slate-200">
              <p className="text-xs text-slate-600 mb-2">
                {fechas.length} fecha{fechas.length !== 1 ? "s" : ""} seleccionada{fechas.length !== 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {fechas.map((fecha) => (
                  <Badge
                    key={fecha}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-900 hover:bg-blue-200 cursor-pointer"
                    onClick={() => toggleFecha(fecha)}
                  >
                    {new Date(fecha).toLocaleDateString("es-AR")}
                    <span>✕</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
