"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/genericos/badge";
import { Button } from "@/components/ui/genericos/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/genericos/card";
import { Input } from "@/components/ui/genericos/input";
import { Label } from "@/components/ui/genericos/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/genericos/select";
import { Checkbox } from "@/components/ui/genericos/checkbox";
import { RottativeScheduleSelector } from "./RottativeScheduleSelector";
import {
  validarSolapamientos,
  obtenerConflictosDelPaquete,
} from "./validateScheduleOverlap";
import { getWeeklyWorkloadStatus } from "./weeklyWorkload";
import type { Dispatch, SetStateAction } from "react";
import type {
  Equipo,
  Escuela,
  HorariosFormData,
  PaquetesEquipo,
} from "./types";
import type { WeeklyWorkload } from "./weeklyWorkload";

const EQUIPO_DAE_ID = 62;
const EMPTY_SLOT = { diaSemana: "", horaInicio: "", horaFin: "" };

const getHoursFromSlot = (inicio: string, fin: string) => {
  if (!inicio || !fin) return null;
  const [hIni, mIni] = inicio.split(":").map(Number);
  const [hFin, mFin] = fin.split(":").map(Number);
  if ([hIni, mIni, hFin, mFin].some((v) => Number.isNaN(v))) return null;
  const inicioMin = hIni * 60 + mIni;
  const finMin = hFin * 60 + mFin;
  if (finMin <= inicioMin) return null;
  const diff = finMin - inicioMin;
  if (diff % 60 !== 0) return null;
  return diff / 60;
};

const getDurationError = (inicio: string, fin: string, horas: number) => {
  if (!inicio || !fin) return null;
  if (!Number.isFinite(horas) || horas <= 0) return null;
  const [hIni, mIni] = inicio.split(":").map(Number);
  const [hFin, mFin] = fin.split(":").map(Number);
  if ([hIni, mIni, hFin, mFin].some((v) => Number.isNaN(v))) return null;
  const inicioMin = hIni * 60 + mIni;
  const finMin = hFin * 60 + mFin;
  if (finMin <= inicioMin)
    return "La hora fin debe ser mayor a la hora inicio.";
  const diff = finMin - inicioMin;
  const minutosRequeridos = horas * 60;
  if (diff !== minutosRequeridos) {
    const horasRequeridas = (minutosRequeridos / 60).toFixed(2);
    return `Debe cumplir con ${horasRequeridas} horas reloj.`;
  }
  return null;
};

const getCargoTipoLabel = (tipo: string) => {
  switch (tipo) {
    case "investigacion":
      return "Investigación";
    case "mision-especial-primaria":
      return "Misión especial Primaria";
    case "mision-especial-secundaria":
      return "Misión especial Secundaria";
    case "mision-especial":
      return "Misión especial";
    case "regimen-27":
      return "Régimen 27";
    case "regimen-5":
      return "Régimen 5";
    case "horas-comunes":
      return "Horas comunes";
    default:
      return tipo || "Cargo";
  }
};

type DiaSemana = { value: string; label: string };

type Step3CargaHorariaProps = {
  formData: HorariosFormData;
  setFormData: Dispatch<SetStateAction<HorariosFormData>>;
  diasSemana: DiaSemana[];
  equipos: Equipo[];
  escuelasDisponibles: Map<number, Escuela[]>;
  escuelasSinPaquetes: Map<number, Escuela[]>;
  weeklyWorkloadMap: Record<number, WeeklyWorkload>;
  getGeiHorasForEquipo: (id: number) => number;
  getInterdisciplinarioHorasForEquipo: (id: number) => number;
};

// ─── Sub-component: block for a single equipo ────────────────────────────────

type EquipoBlockProps = {
  equipoId: number;
  equipoNombre: string;
  paquetes: PaquetesEquipo;
  isDAE: boolean;
  geiHoras: number;
  interdisciplinarioHoras: number;
  diasSemana: DiaSemana[];
  escuelasDelEquipo: Escuela[];
  escuelasSinPaquetesDelEquipo: Escuela[];
  workload: WeeklyWorkload;
  onChange: (next: PaquetesEquipo) => void;
};

function EquipoBlock({
  equipoId,
  equipoNombre,
  paquetes,
  isDAE,
  geiHoras,
  interdisciplinarioHoras,
  diasSemana,
  escuelasDelEquipo,
  escuelasSinPaquetesDelEquipo,
  workload,
  onChange,
}: EquipoBlockProps) {
  const [escuelaQuery, setEscuelaQuery] = useState("");

  const escuelasFiltradas = escuelasDelEquipo.filter((esc) => {
    const q = escuelaQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      esc.nombre.toLowerCase().includes(q) ||
      (esc.Numero ? esc.Numero.toString().toLowerCase().includes(q) : false)
    );
  });

  const geiSlots = Array.isArray(paquetes.gei) ? paquetes.gei : [];
  const geiCargadasHoras = geiSlots.reduce((acc, slot) => {
    const h = getHoursFromSlot(slot.horaInicio, slot.horaFin);
    return acc + (h ?? 0);
  }, 0);
  const geiFaltanHoras = Math.max(0, geiHoras - geiCargadasHoras);
  const geiExcedenHoras = Math.max(0, geiCargadasHoras - geiHoras);
  const puedeAgregarDiaGei = !isDAE && geiHoras > 0 && geiFaltanHoras > 0;

  const escuelasNombreMap = useMemo(() => {
    const m = new Map<string, string>();
    escuelasDelEquipo.forEach((esc) => {
      m.set(
        esc.id.toString(),
        `${esc.nombre}${esc.Numero ? ` N° ${esc.Numero}` : ""}`,
      );
    });
    return m;
  }, [escuelasDelEquipo]);

  const conflictos = useMemo(() => {
    return validarSolapamientos(
      isDAE ? EMPTY_SLOT : paquetes.interdisciplinario,
      isDAE ? [] : geiSlots,
      paquetes.escuelas,
      escuelasNombreMap,
    );
  }, [paquetes, escuelasNombreMap, isDAE, geiSlots]);

  const workloadStatus = getWeeklyWorkloadStatus(workload);
  const workloadStatusClass =
    workloadStatus.tone === "error"
      ? "text-xs text-rose-600 mt-1"
      : workloadStatus.tone === "warn"
        ? "text-xs text-amber-700 mt-1"
        : "text-xs text-slate-600 mt-1";

  const errorInterdisciplinario = isDAE
    ? null
    : getDurationError(
        paquetes.interdisciplinario.horaInicio,
        paquetes.interdisciplinario.horaFin,
        3,
      );

  // helpers to update nested paquetes
  const updateInter = (patch: Partial<typeof paquetes.interdisciplinario>) =>
    onChange({
      ...paquetes,
      interdisciplinario: { ...paquetes.interdisciplinario, ...patch },
    });

  const updateGeiSlot = (
    index: number,
    patch: Partial<(typeof geiSlots)[0]>,
  ) => {
    const next = [...geiSlots];
    next[index] = { ...next[index], ...patch };
    onChange({ ...paquetes, gei: next });
  };

  const removeGeiSlot = (index: number) => {
    const next = geiSlots.filter((_, i) => i !== index);
    onChange({
      ...paquetes,
      gei: next.length > 0 ? next : [{ ...EMPTY_SLOT }],
    });
  };

  const addGeiSlot = () =>
    onChange({ ...paquetes, gei: [...geiSlots, { ...EMPTY_SLOT }] });

  const updateEscuela = (
    index: number,
    patch: Partial<PaquetesEquipo["escuelas"][0]>,
  ) => {
    const next = [...paquetes.escuelas];
    next[index] = { ...next[index], ...patch };
    onChange({ ...paquetes, escuelas: next });
  };

  const removeEscuela = (index: number) =>
    onChange({
      ...paquetes,
      escuelas: paquetes.escuelas.filter((_, i) => i !== index),
    });

  const addEscuela = () =>
    onChange({
      ...paquetes,
      escuelas: [
        ...paquetes.escuelas,
        {
          escuelaId: "",
          horas: "",
          diaSemana: "",
          horaInicio: "",
          horaFin: "",
        },
      ],
    });

  return (
    <Card className="border-slate-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-800">
          {equipoNombre}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-5">
        {/* Escuelas sin cubrir */}
        {escuelasSinPaquetesDelEquipo.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3 space-y-2">
            <div className="text-sm font-semibold text-amber-900">
              Escuelas sin cubrir
            </div>
            <p className="text-sm text-amber-900">
              Es fundamental priorizar la cobertura en estas escuelas, sino la
              probabilidad de rechazo puede ser alta.
            </p>
            <div className="flex flex-wrap gap-2">
              {escuelasSinPaquetesDelEquipo.map((esc) => (
                <Badge key={`sin-paquetes-${esc.id}`} variant="secondary">
                  {esc.nombre} {esc.Numero ? `N° ${esc.Numero}` : ""}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* DAE notice */}
        {isDAE && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm text-slate-700">
              Para{" "}
              <span className="font-medium">
                DAE - Dirección de Acompañamiento Escolar
              </span>{" "}
              no corresponde cargar{" "}
              <span className="font-medium">Trabajo Interdisciplinario</span> ni{" "}
              <span className="font-medium">Carga en GEI</span>.
            </p>
          </div>
        )}

        {/* Interdisciplinario */}
        {!isDAE && (
          <div className="rounded-md border border-slate-200 p-3 sm:p-4 space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="font-medium text-slate-800">
                Trabajo Interdisciplinario
              </div>
              <div className="text-sm text-slate-600">Horas: 3</div>
            </div>
            {errorInterdisciplinario && (
              <p className="text-xs text-rose-600">{errorInterdisciplinario}</p>
            )}
            {conflictos.filter(
              (c) =>
                c.tipo1 === "Trabajo Interdisciplinario" ||
                c.tipo2 === "Trabajo Interdisciplinario",
            ).length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-2">
                <div className="text-sm font-semibold text-amber-900">
                  ⚠️ Conflictos de horario
                </div>
                {conflictos
                  .filter(
                    (c) =>
                      c.tipo1 === "Trabajo Interdisciplinario" ||
                      c.tipo2 === "Trabajo Interdisciplinario",
                  )
                  .map((c, idx) => (
                    <p key={idx} className="text-xs text-amber-800">
                      {c.tipo === "error" ? "❌" : "⚠️"} Solapamiento entre{" "}
                      <strong>{c.tipo1}</strong> y <strong>{c.tipo2}</strong>
                    </p>
                  ))}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <Label>Horas</Label>
                <Input value="3" readOnly disabled />
              </div>
              <div>
                <Label>Día</Label>
                <Select
                  value={paquetes.interdisciplinario.diaSemana}
                  onValueChange={(v) => updateInter({ diaSemana: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un día" />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemana.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hora inicio</Label>
                <Input
                  type="time"
                  value={paquetes.interdisciplinario.horaInicio}
                  onChange={(e) => updateInter({ horaInicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora fin</Label>
                <Input
                  type="time"
                  value={paquetes.interdisciplinario.horaFin}
                  onChange={(e) => updateInter({ horaFin: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* GEI */}
        {!isDAE && (
          <div className="rounded-md border border-slate-200 p-3 sm:p-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="font-medium text-slate-800">Carga en GEI</div>
              <div className="text-sm text-slate-600">
                Requeridas: {geiHoras} hs · Cargadas: {geiCargadasHoras} hs
                {geiFaltanHoras > 0 ? ` · Faltan: ${geiFaltanHoras} hs` : ""}
                {geiExcedenHoras > 0 ? ` · Exceden: ${geiExcedenHoras} hs` : ""}
              </div>
            </div>
            {conflictos.filter(
              (c) => c.tipo1 === "Carga en GEI" || c.tipo2 === "Carga en GEI",
            ).length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-2">
                <div className="text-sm font-semibold text-amber-900">
                  ⚠️ Conflictos de horario
                </div>
                {conflictos
                  .filter(
                    (c) =>
                      c.tipo1 === "Carga en GEI" || c.tipo2 === "Carga en GEI",
                  )
                  .map((c, idx) => (
                    <p key={idx} className="text-xs text-amber-800">
                      {c.tipo === "error" ? "❌" : "⚠️"} Solapamiento entre{" "}
                      <strong>{c.tipo1}</strong> y <strong>{c.tipo2}</strong>
                    </p>
                  ))}
              </div>
            )}
            {geiSlots.map((slot, index) => {
              const horasSlot = getHoursFromSlot(slot.horaInicio, slot.horaFin);
              const errorSlot =
                slot.horaInicio && slot.horaFin && horasSlot === null
                  ? "La hora fin debe ser mayor y la duración en horas completas."
                  : null;
              return (
                <div
                  key={`gei-${equipoId}-${index}`}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-800">
                      Día GEI {index + 1}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeGeiSlot(index)}
                    >
                      Quitar día
                    </Button>
                  </div>
                  {errorSlot && (
                    <p className="text-xs text-rose-600">{errorSlot}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <Label>Horas</Label>
                      <Input
                        value={horasSlot === null ? "" : String(horasSlot)}
                        placeholder="-"
                        readOnly
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Día</Label>
                      <Select
                        value={slot.diaSemana}
                        onValueChange={(v) =>
                          updateGeiSlot(index, { diaSemana: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un día" />
                        </SelectTrigger>
                        <SelectContent>
                          {diasSemana.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Hora inicio</Label>
                      <Input
                        type="time"
                        value={slot.horaInicio}
                        onChange={(e) =>
                          updateGeiSlot(index, { horaInicio: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Hora fin</Label>
                      <Input
                        type="time"
                        value={slot.horaFin}
                        onChange={(e) =>
                          updateGeiSlot(index, { horaFin: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {puedeAgregarDiaGei && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGeiSlot}
              >
                Agregar día carga GEI
              </Button>
            )}
          </div>
        )}

        {/* PAQUETES POR ESCUELA */}
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Paquetes por escuela
          </h3>
          <p className={workloadStatusClass}>{workloadStatus.text}</p>
        </div>

        {paquetes.escuelas.length === 0 && (
          <p className="text-sm text-slate-500">
            Aún no hay paquetes de tipo Escuela.
          </p>
        )}

        {paquetes.escuelas.map((paquete, index) => {
          const errorEscuela = getDurationError(
            paquete.horaInicio,
            paquete.horaFin,
            Number(paquete.horas || 0),
          );
          const esRotativo = paquete.rotativo?.esRotativo || false;
          const tipoRotativo = paquete.rotativo?.tipo;
          const semanasRotativo = paquete.rotativo?.semanas || [];
          const fechasRotativo = paquete.rotativo?.fechas || [];
          const conflictosDelPaquete = obtenerConflictosDelPaquete(
            conflictos,
            index,
          );

          return (
            <div
              key={`escuela-paquete-${equipoId}-${index}`}
              className="rounded-md border border-slate-200 p-3 sm:p-4 space-y-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-medium text-slate-800">Escuela</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => removeEscuela(index)}
                >
                  Eliminar
                </Button>
              </div>

              {conflictosDelPaquete.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <div className="text-sm font-semibold text-amber-900">
                    ⚠️ Conflictos de horario detectados
                  </div>
                  {conflictosDelPaquete.map((c, idx) => (
                    <p key={idx} className="text-xs text-amber-800">
                      {c.tipo === "error" ? "❌" : "⚠️"} Solapamiento entre{" "}
                      <strong>{c.tipo1}</strong> y <strong>{c.tipo2}</strong>
                    </p>
                  ))}
                </div>
              )}

              {errorEscuela && (
                <p className="text-xs text-rose-600">{errorEscuela}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>Escuela</Label>
                  <Select
                    value={paquete.escuelaId}
                    onValueChange={(v) => {
                      updateEscuela(index, { escuelaId: v });
                      setEscuelaQuery("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una escuela" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <div className="px-2 py-1.5">
                        <Input
                          placeholder="Buscar escuela..."
                          value={escuelaQuery}
                          onChange={(e) => setEscuelaQuery(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="h-8"
                        />
                      </div>
                      {escuelasFiltradas.length === 0 ? (
                        <div className="px-2 py-2 text-xs text-slate-500">
                          Sin resultados.
                        </div>
                      ) : (
                        escuelasFiltradas.map((esc) => (
                          <SelectItem key={esc.id} value={esc.id.toString()}>
                            {esc.nombre} {esc.Numero ? `N° ${esc.Numero}` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Horas</Label>
                  <Input
                    type="number"
                    min="0"
                    value={paquete.horas}
                    onChange={(e) =>
                      updateEscuela(index, { horas: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label>Día</Label>
                  <Select
                    value={paquete.diaSemana}
                    onValueChange={(v) =>
                      updateEscuela(index, { diaSemana: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un día" />
                    </SelectTrigger>
                    <SelectContent>
                      {diasSemana.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hora inicio</Label>
                  <Input
                    type="time"
                    value={paquete.horaInicio}
                    onChange={(e) =>
                      updateEscuela(index, { horaInicio: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Hora fin</Label>
                  <Input
                    type="time"
                    value={paquete.horaFin}
                    onChange={(e) =>
                      updateEscuela(index, { horaFin: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border border-slate-200">
                <Checkbox
                  id={`rotativo-${equipoId}-${index}`}
                  checked={esRotativo}
                  onCheckedChange={(checked) =>
                    updateEscuela(index, {
                      rotativo: {
                        esRotativo: !!checked,
                        tipo: checked ? "porSemana" : undefined,
                        semanas: checked ? [] : undefined,
                        fechas: checked ? [] : undefined,
                      },
                    })
                  }
                />
                <Label
                  htmlFor={`rotativo-${equipoId}-${index}`}
                  className="cursor-pointer text-sm font-medium text-slate-700"
                >
                  Rotativo
                </Label>
              </div>

              {esRotativo && (
                <RottativeScheduleSelector
                  tipo={tipoRotativo}
                  semanas={semanasRotativo}
                  fechas={fechasRotativo}
                  diaSemana={paquete.diaSemana}
                  onTipoChange={(nuevoTipo) =>
                    updateEscuela(index, {
                      rotativo: {
                        ...paquete.rotativo!,
                        tipo: nuevoTipo,
                        semanas: nuevoTipo === "porSemana" ? [] : undefined,
                        fechas: nuevoTipo === "porCalendario" ? [] : undefined,
                      },
                    })
                  }
                  onSemanasChange={(semanas) =>
                    updateEscuela(index, {
                      rotativo: { ...paquete.rotativo!, semanas },
                    })
                  }
                  onFechasChange={(fechas) =>
                    updateEscuela(index, {
                      rotativo: { ...paquete.rotativo!, fechas },
                    })
                  }
                />
              )}
            </div>
          );
        })} 
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={addEscuela}
            >
              <span className="sm:hidden">Agregar paquete</span>
              <span className="hidden sm:inline">Agregar paquete horas</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Step3CargaHoraria({
  formData,
  setFormData,
  diasSemana,
  equipos,
  escuelasDisponibles,
  escuelasSinPaquetes,
  weeklyWorkloadMap,
  getGeiHorasForEquipo,
  getInterdisciplinarioHorasForEquipo,
}: Step3CargaHorariaProps) {
  const horasCatedraEnabled = formData.horasCatedra.enabled;
  const selectedCargoIndexes = formData.horasCatedra.cargoIndexes ?? [];

  const cargosParaHorasCatedra = useMemo(() => {
    return formData.cargos
      .map((cargo, index) => {
        const cantidad = Number(cargo.cantidad || 0);
        return {
          index,
          tipo: cargo.tipo,
          cantidad,
          label: getCargoTipoLabel(cargo.tipo),
        };
      })
      .filter((c) => c.tipo && Number.isFinite(c.cantidad) && c.cantidad > 0);
  }, [formData.cargos]);

  const horasCatedraSelectionValid = useMemo(() => {
    if (!horasCatedraEnabled) return true;
    return (
      selectedCargoIndexes.length > 0 &&
      selectedCargoIndexes.every((idx) =>
        cargosParaHorasCatedra.some((c) => c.index === idx),
      )
    );
  }, [cargosParaHorasCatedra, horasCatedraEnabled, selectedCargoIndexes]);

  const equiposSeleccionados = equipos.filter((eq) =>
    formData.equiposIds.includes(eq.id),
  );

  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Carga horaria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Horas cátedra — global */}
          <div className="rounded-md border border-slate-200 p-3 sm:p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="horas-catedra"
                checked={horasCatedraEnabled}
                onCheckedChange={(checked) =>
                  setFormData((p) => {
                    const enabled = !!checked;
                    if (!enabled)
                      return {
                        ...p,
                        horasCatedra: { enabled: false, cargoIndexes: [] },
                      };
                    return {
                      ...p,
                      horasCatedra: {
                        enabled: true,
                        cargoIndexes: p.horasCatedra.cargoIndexes ?? [],
                      },
                    };
                  })
                }
              />
              <Label
                htmlFor="horas-catedra"
                className="cursor-pointer text-sm font-medium text-slate-700"
              >
                Declaro cumplir horas cátedra
              </Label>
            </div>

            {horasCatedraEnabled && (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  Seleccioná los cargos en los que aplican horas cátedra (1 hora
                  cátedra = 40 minutos reloj).
                </p>
                {cargosParaHorasCatedra.length === 0 ? (
                  <p className="text-xs text-rose-600">
                    No hay cargos cargados en el Paso 2 para seleccionar.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {cargosParaHorasCatedra.map((cargo) => {
                      const isChecked = selectedCargoIndexes.includes(
                        cargo.index,
                      );
                      return (
                        <label
                          key={`horas-catedra-cargo-${cargo.index}`}
                          className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <Checkbox
                            id={`horas-catedra-cargo-${cargo.index}`}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              setFormData((p) => {
                                const prev = p.horasCatedra.cargoIndexes ?? [];
                                const next = checked
                                  ? [...prev, cargo.index]
                                  : prev.filter((i) => i !== cargo.index);
                                return {
                                  ...p,
                                  horasCatedra: {
                                    ...p.horasCatedra,
                                    cargoIndexes: next,
                                  },
                                };
                              })
                            }
                          />
                          <span className="text-sm text-slate-700 flex-1">
                            {cargo.label}
                          </span>
                          <Badge
                            variant={isChecked ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {cargo.cantidad} hs
                          </Badge>
                        </label>
                      );
                    })}
                    {!horasCatedraSelectionValid && (
                      <p className="text-xs text-rose-600">
                        Seleccioná al menos un cargo para continuar.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* One block per equipo */}
      {equiposSeleccionados.length === 0 && (
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">
              No hay secciones seleccionadas. Volvé al Paso 2 y agregá al menos
              una sección.
            </p>
          </CardContent>
        </Card>
      )}

      {equiposSeleccionados.map((equipo) => {
        const key = String(equipo.id);
        const paquetes = formData.paquetes[key];
        if (!paquetes) return null;
        const isDAE = equipo.id === EQUIPO_DAE_ID;
        const geiHoras = getGeiHorasForEquipo(equipo.id);
        const interdisciplinarioHoras = getInterdisciplinarioHorasForEquipo(
          equipo.id,
        );
        const workload = weeklyWorkloadMap[equipo.id] ?? {
          limit: 0,
          totalsByWeek: { 1: 0, 2: 0, 3: 0, 4: 0 },
          excessByWeek: { 1: 0, 2: 0, 3: 0, 4: 0 },
          missingByWeek: { 1: 0, 2: 0, 3: 0, 4: 0 },
          weeksExceeding: [],
          weeksMissing: [],
          isWithinLimit: true,
          isComplete: false,
        };

        return (
          <EquipoBlock
            key={key}
            equipoId={equipo.id}
            equipoNombre={equipo.nombre}
            paquetes={paquetes}
            isDAE={isDAE}
            geiHoras={geiHoras}
            interdisciplinarioHoras={interdisciplinarioHoras}
            diasSemana={diasSemana}
            escuelasDelEquipo={escuelasDisponibles.get(equipo.id) ?? []}
            escuelasSinPaquetesDelEquipo={
              escuelasSinPaquetes.get(equipo.id) ?? []
            }
            workload={workload}
            onChange={(nextPaquetes) =>
              setFormData((p) => ({
                ...p,
                paquetes: { ...p.paquetes, [key]: nextPaquetes },
              }))
            }
          />
        );
      })}
    </div>
  );
}
