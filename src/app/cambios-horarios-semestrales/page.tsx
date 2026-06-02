"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  Eye,
  Key,
  Mail,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/genericos/alert-dialog";
import { Badge } from "@/components/ui/genericos/badge";
import { Button } from "@/components/ui/genericos/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/genericos/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/genericos/dialog";
import { Input } from "@/components/ui/genericos/input";
import { Label } from "@/components/ui/genericos/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/genericos/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/genericos/table";
import { equiposCambiosSemestralesMock } from "./mock-data";
import type {
  EstadoCambioSemestral,
  ProfesionalCambioSemestral,
} from "./types";
import {
  ModalCoberturaEscuelas,
  type EscuelaCobertura,
} from "./modal-coberturas-escuelas";
import type { FormularioHorariosTipoRotacion } from "../horarios-form/components/types";

type TablaFiltro =
  | "todos"
  | "rechazados"
  | "confirmados"
  | "pendientes"
  | "no-enviaron";
type PeriodoFiltro = "semestral-jul-26" | "semestral-dec-26";

type EditFormData = Pick<
  ProfesionalCambioSemestral,
  "nombre" | "apellido" | "dni" | "correo"
>;
type BulkMailRow = {
  id: number;
  profesionalId: number;
  nombreCompleto: string;
  correo: string;
};
type EquipoSelectOption = {
  id: number;
  nombre: string;
};
type FeedbackState = {
  type: "success" | "error";
  message: string;
};
type FormularioHorarioListadoRegistro = {
  id?: number;
  profesionalId?: number;
  nombre?: string | null;
  apellido?: string | null;
  dni?: string | null;
  correo?: string | null;
  cargosHoras?: unknown;
  cargoHoras?: unknown;
  totalHorasCargo?: number | string | null;
  totalHoras?: number | string | null;
  horasCargo?: number | string | null;
  cargaHoraria?: number | string | null;
  estadoPeriodo?: string | null;
  estadoRevision?: string | null;
  observacion?: string | null;
  observacionesRevision?: string | null;
  ultimoEnvio?: string | null;
  fechaEnvio?: string | null;
  ultimaActualizacion?: string | null;
  fechaRevision?: string | null;
};
type FormularioReenvioPayload = {
  correo: string;
};
type FormularioContrasenaPayload = {
  nuevaContrasena: string;
};
type FormularioDeleteResponse = {
  id: number;
  message: string;
};
type FormularioHorariosEnvioHistorialPaquete = {
  id?: number;
  tipo?: string | null;
  cantidad?: number | null;
  equipoId: number | null;
  equipoNombre: string | null;
  escuelaId: number | null;
  escuelaNombre: string | null;
  diaSemana: number | null;
  horaInicio: string | null;
  horaFin: string | null;
  rotativo: boolean | null;
  semanas: number[] | null;
  tipoRotacion?: FormularioHorariosTipoRotacion | null;
  fechas?: string[] | null;
  cicloSemanas: number | null;
};
type FormularioHorariosEnvioHistorial = {
  id: number;
  envioNumero: number;
  fechaEnvio: string | null;
  estadoRevision: string | null;
  observacionesRevision: string | null;
  fechaRevision: string | null;
  paquetesGuardados: number;
  totalHoras: number;
  paquetesHoras: FormularioHorariosEnvioHistorialPaquete[];
};
type CoberturaEscuelaApiItem = {
  id?: number;
  escuelaId?: number;
  nombre?: string | null;
  escuelaNombre?: string | null;
  cobertura?: number | null;
};
type CoberturaEscuelasApiResponse = {
  tipoFormulario?: string | null;
  equipoId?: number | null;
  equipoNombre?: string | null;
  escuelas?: CoberturaEscuelaApiItem[];
  coberturaTotal?: number | null;
  cargaEnGeiHoras?: number | null;
  cargaGeiHoras?: number | null;
  geiHoras?: number | null;
  horasGei?: number | null;
  horasCargaGei?: number | null;
  trabajoInterdisciplinarioHoras?: number | null;
  interdisciplinarioHoras?: number | null;
  horasInterdisciplinario?: number | null;
  trabajoInterdisciplinario?: number | null;
  horasTrabajoInterdisciplinario?: number | null;
};
type FormularioHorarioCargoHorasItem = {
  tipo?: string | null;
  cantidadHoras?: number | string | null;
  cantidad?: number | string | null;
  horas?: number | string | null;
};

const actionButtons = [
  "Enviar Formulario a todo el equipo",
  "Confirmar todos los envios",
  "Ver cobertura por escuela",
];

const tablaFiltroLabels: Record<TablaFiltro, string> = {
  todos: "Ver todos",
  confirmados: "Ver confirmados",
  rechazados: "Ver rechazados",
  pendientes: "Ver pendientes",
  "no-enviaron": "Ver no enviaron",
};

const estadoStyles: Record<
  EstadoCambioSemestral,
  { label: string; className: string }
> = {
  "sin-enviar": {
    label: "No enviado",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  confirmado: {
    label: "Confirmado",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  rechazado: {
    label: "Rechazado",
    className: "bg-rose-100 text-rose-800 border-rose-200",
  },
  enviado: {
    label: "Enviado",
    className: "bg-sky-100 text-sky-800 border-sky-200",
  },
};

const countByEstado = (
  profesionales: ProfesionalCambioSemestral[],
  estado: EstadoCambioSemestral,
) =>
  profesionales.filter((profesional) => profesional.estado === estado).length;

const normalizeEstadoPeriodo = (
  estadoPeriodo: string | null | undefined,
  estadoRevision: string | null | undefined,
): EstadoCambioSemestral => {
  const normalizedEstadoPeriodo = (estadoPeriodo ?? "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .trim();
  const normalizedEstadoRevision = (estadoRevision ?? "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .trim();

  if (
    normalizedEstadoPeriodo === "no_enviado" ||
    normalizedEstadoPeriodo === "sin_enviar"
  ) {
    return "sin-enviar";
  }

  if (normalizedEstadoRevision.includes("rechaz")) return "rechazado";
  if (
    normalizedEstadoRevision.includes("confirm") ||
    normalizedEstadoRevision.includes("aprob")
  ) {
    return "confirmado";
  }
  if (
    normalizedEstadoRevision.includes("pendiente") ||
    normalizedEstadoRevision.includes("revision")
  ) {
    return "pendiente";
  }

  if (normalizedEstadoPeriodo.includes("pendiente")) return "pendiente";
  if (
    normalizedEstadoPeriodo.includes("confirm") ||
    normalizedEstadoPeriodo.includes("aprob")
  ) {
    return "confirmado";
  }
  if (normalizedEstadoPeriodo.includes("rechaz")) return "rechazado";
  if (normalizedEstadoPeriodo.includes("enviado")) return "enviado";

  return "sin-enviar";
};

const parseHorasNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatCargoTipo = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatCargoHoras = (registro: FormularioHorarioListadoRegistro): string => {
  const source = registro.cargosHoras ?? registro.cargoHoras;
  const sourceObject =
    source && typeof source === "object"
      ? (source as Record<string, unknown>)
      : null;
  const sourceArray = Array.isArray(source)
    ? source
    : Array.isArray(sourceObject?.cargosHoras)
      ? sourceObject.cargosHoras
      : Array.isArray(sourceObject?.cargoHoras)
        ? sourceObject.cargoHoras
        : Array.isArray(sourceObject?.items)
          ? sourceObject.items
          : null;

  if (Array.isArray(sourceArray)) {
    const parts = sourceArray
      .map((rawCargo) => {
        if (!rawCargo || typeof rawCargo !== "object") return null;

        const cargo = rawCargo as FormularioHorarioCargoHorasItem;
        const tipo = String(cargo.tipo ?? "").trim();
        const horas = parseHorasNumber(
          cargo.cantidadHoras ?? cargo.cantidad ?? cargo.horas,
        );

        if (!tipo && horas === null) return null;
        if (!tipo) return `${horas ?? 0} hs`;
        if (horas === null) return formatCargoTipo(tipo);

        return `${formatCargoTipo(tipo)} + ${horas} hs`;
      })
      .filter((part): part is string => Boolean(part));

    if (parts.length > 0) return parts.join(" | ");
  }

  const totalHoras = parseHorasNumber(
    registro.totalHorasCargo ??
      registro.totalHoras ??
      registro.horasCargo ??
      registro.cargaHoraria,
  );

  if (totalHoras !== null) return `${totalHoras} hs`;
  return "-";
};

const formatDateCell = (value: string | null | undefined) => {
  if (!value?.trim()) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const formatEstadoRevision = (value: string | null) => {
  if (!value) return "Sin revision";

  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const getEstadoRevisionClassName = (value: string | null) => {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "aprobado" || normalized === "aprobada") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (normalized === "rechazado" || normalized === "rechazada") {
    return "bg-red-100 text-red-700";
  }

  if (
    normalized === "pendiente" ||
    normalized === "en_revision" ||
    normalized === "en revision"
  ) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-700";
};

const getEquipoNombreList = (
  paquetesHoras: FormularioHorariosEnvioHistorialPaquete[],
) => {
  const names = paquetesHoras
    .map((paquete) => paquete.equipoNombre?.trim())
    .filter((name): name is string => Boolean(name));

  return [...new Set(names)];
};

const weekDays = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

const formatDiaSemana = (value: number | null) => {
  if (value == null || value < 0 || value >= weekDays.length) return "-";

  return weekDays[value];
};

const formatHoraCorta = (value: string | null) => {
  if (!value?.trim()) return "-";

  return value.slice(0, 5);
};

const formatHorario = (horaInicio: string | null, horaFin: string | null) => {
  if (!horaInicio?.trim() && !horaFin?.trim()) return "-";
  if (!horaInicio?.trim()) return formatHoraCorta(horaFin);
  if (!horaFin?.trim()) return formatHoraCorta(horaInicio);

  return `${formatHoraCorta(horaInicio)} - ${formatHoraCorta(horaFin)}`;
};

const formatFechaRotativa = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("es-AR", { timeZone: "UTC" });
};

const formatConfiguracionRotativa = (
  rotativo: boolean | null,
  tipoRotacion: FormularioHorariosTipoRotacion | null | undefined,
  semanas: number[] | null,
  fechas: string[] | null | undefined,
  cicloSemanas: number | null,
) => {
  if (!rotativo) return "No";
  const resolvedTipoRotacion =
    tipoRotacion ??
    (Array.isArray(fechas) && fechas.length > 0
      ? "fechas"
      : Array.isArray(semanas) && semanas.length > 0
        ? "semanas"
        : null);

  if (
    resolvedTipoRotacion === "fechas" &&
    Array.isArray(fechas) &&
    fechas.length > 0
  ) {
    return `Si - Fechas ${fechas.map(formatFechaRotativa).join(", ")}`;
  }

  if (Array.isArray(semanas) && semanas.length > 0) {
    return `Si - Semanas ${semanas.join(", ")}${cicloSemanas ? ` de ${cicloSemanas}` : ""}`;
  }

  return cicloSemanas ? `Si - Ciclo de ${cicloSemanas} semanas` : "Si";
};

const sortPaquetesHoras = (
  paquetes: FormularioHorariosEnvioHistorialPaquete[],
) =>
  [...paquetes].sort((a, b) => {
    const dayA = a.diaSemana ?? Number.MAX_SAFE_INTEGER;
    const dayB = b.diaSemana ?? Number.MAX_SAFE_INTEGER;

    if (dayA !== dayB) return dayA - dayB;

    const startA = a.horaInicio ?? "";
    const startB = b.horaInicio ?? "";

    return startA.localeCompare(startB);
  });

const actionButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-full text-base transition-colors";

const initialEditData: EditFormData = {
  nombre: "",
  apellido: "",
  dni: "",
  correo: "",
};

const getBackendErrorMessage = async (
  response: Response,
  fallback: string,
) => {
  const text = await response.text().catch(() => "");

  if (!text.trim()) return fallback;

  try {
    const payload = JSON.parse(text) as { message?: unknown };
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
  } catch {
    return text;
  }

  return text || fallback;
};

export default function CambiosHorariosSemestralesPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const apiV1 = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  const apiV1Normalized = apiV1.replace(/\/+$/, "");
  const apiBase = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(
    /\/api\/v1\/?$/,
    "",
  );

  const [equipos, setEquipos] = useState(equiposCambiosSemestralesMock);
  const [equiposSelectOptions, setEquiposSelectOptions] = useState<
    EquipoSelectOption[]
  >([]);
  const [selectedEquipoId, setSelectedEquipoId] = useState("");
  const [modalCoberturaOpen, setModalCoberturaOpen] = useState(false);
  const [coberturaEscuelas, setCoberturaEscuelas] = useState<EscuelaCobertura[]>(
    [],
  );
  const [coberturaTotal, setCoberturaTotal] = useState(0);
  const [coberturaGeiHoras, setCoberturaGeiHoras] = useState(0);
  const [coberturaInterdisciplinarioHoras, setCoberturaInterdisciplinarioHoras] =
    useState(0);
  const [coberturaEquipoNombre, setCoberturaEquipoNombre] = useState("");
  const [isLoadingCobertura, setIsLoadingCobertura] = useState(false);
  const [coberturaError, setCoberturaError] = useState<string | null>(null);
  const [isBulkMailDialogOpen, setIsBulkMailDialogOpen] = useState(false);
  const [bulkMailRows, setBulkMailRows] = useState<BulkMailRow[]>([]);
  const [isSubmittingBulkMail, setIsSubmittingBulkMail] = useState(false);
  const [bulkMailSubmitError, setBulkMailSubmitError] = useState<string | null>(
    null,
  );
  const [isConfirmingAllEnvios, setIsConfirmingAllEnvios] = useState(false);
  const [tablaFiltro, setTablaFiltro] = useState<TablaFiltro>("todos");
  const [periodoFiltro, setPeriodoFiltro] =
    useState<PeriodoFiltro>("semestral-jul-26");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isLoadingRegistros, setIsLoadingRegistros] = useState(false);
  const [registrosError, setRegistrosError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] =
    useState<ProfesionalCambioSemestral | null>(null);
  const [enviosHistorial, setEnviosHistorial] = useState<
    FormularioHorariosEnvioHistorial[]
  >([]);
  const [isLoadingEnvios, setIsLoadingEnvios] = useState(false);
  const [enviosError, setEnviosError] = useState<string | null>(null);
  const [isPackagesDialogOpen, setIsPackagesDialogOpen] = useState(false);
  const [selectedEnvio, setSelectedEnvio] =
    useState<FormularioHorariosEnvioHistorial | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectObservacion, setRejectObservacion] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [editingProfesional, setEditingProfesional] =
    useState<ProfesionalCambioSemestral | null>(null);
  const [editData, setEditData] = useState<EditFormData>(initialEditData);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingProfesional, setDeletingProfesional] =
    useState<ProfesionalCambioSemestral | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isResendDialogOpen, setIsResendDialogOpen] = useState(false);
  const [resendingProfesional, setResendingProfesional] =
    useState<ProfesionalCambioSemestral | null>(null);
  const [resendCorreo, setResendCorreo] = useState("");
  const [isSubmittingResend, setIsSubmittingResend] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordProfesional, setPasswordProfesional] =
    useState<ProfesionalCambioSemestral | null>(null);
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [isRetryDialogOpen, setIsRetryDialogOpen] = useState(false);
  const [retryProfesional, setRetryProfesional] =
    useState<ProfesionalCambioSemestral | null>(null);
  const [retryingRegistroId, setRetryingRegistroId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!token || !apiV1) return;

    let cancelled = false;

    const fetchEquiposShort = async () => {
      try {
        const res = await fetch(
          `${apiV1}/equipos/short?page=1&limit=200`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) return;

        const payload = (await res.json()) as
          | { data?: EquipoSelectOption[] }
          | EquipoSelectOption[];

        const source = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.data)
            ? payload.data
            : [];

        const options = source
          .map((equipo) => ({
            id: Number(equipo.id),
            nombre: String(equipo.nombre ?? "").trim(),
          }))
          .filter((equipo) => Number.isFinite(equipo.id) && equipo.nombre);

        if (!cancelled) {
          setEquiposSelectOptions(options);
          setSelectedEquipoId((prev) => {
            if (options.length === 0) return prev;
            if (prev && options.some((equipo) => String(equipo.id) === prev)) {
              return prev;
            }

            return String(options[0].id);
          });
        }
      } catch (error) {
        console.error("Error al cargar equipos/short", error);
      }
    };

    void fetchEquiposShort();

    return () => {
      cancelled = true;
    };
  }, [apiV1, token]);

  useEffect(() => {
    if (!feedback) return;

    const timeout = window.setTimeout(() => {
      setFeedback(null);
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const selectedEquipo = useMemo(
    () => equipos.find((equipo) => String(equipo.id) === selectedEquipoId) ?? null,
    [equipos, selectedEquipoId],
  );

  const equiposForSelect = useMemo(() => equiposSelectOptions, [equiposSelectOptions]);

  const selectedEquipoNombre = useMemo(
    () =>
      equiposForSelect.find((equipo) => String(equipo.id) === selectedEquipoId)
        ?.nombre ??
      selectedEquipo?.nombre ??
      "Sin equipo",
    [equiposForSelect, selectedEquipo?.nombre, selectedEquipoId],
  );

  useEffect(() => {
    if (!token || !apiBase || !selectedEquipoId) {
      return;
    }

    let cancelled = false;

    const fetchRegistrosPeriodo = async () => {
      setIsLoadingRegistros(true);
      setRegistrosError(null);

      try {
        const params = new URLSearchParams();
        params.set("tipoFormulario", periodoFiltro);
        params.set("equipoId", selectedEquipoId);

        const res = await fetch(
          `${apiBase}/api/v1/profesionals/formulario-horarios?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) {
          throw new Error(
            `No se pudieron cargar los profesionales del periodo (status ${res.status}).`,
          );
        }

        const payload = (await res.json()) as
          | { data?: FormularioHorarioListadoRegistro[] }
          | FormularioHorarioListadoRegistro[];
        const source = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.data)
            ? payload.data
            : [];

        const mapped: ProfesionalCambioSemestral[] = source.map((item, index) => {
          const rawId = item.id ?? item.profesionalId;
          const id =
            typeof rawId === "number" && Number.isFinite(rawId)
              ? rawId
              : -1 * (index + 1);
          const profesionalId =
            typeof item.profesionalId === "number" &&
            Number.isFinite(item.profesionalId)
              ? item.profesionalId
              : id;

          return {
            id,
            profesionalId,
            nombre: String(item.nombre ?? "").trim() || "-",
            apellido: String(item.apellido ?? "").trim() || "-",
            dni: String(item.dni ?? "").trim() || "-",
            correo: String(item.correo ?? "").trim() || "-",
            cargoHoras: formatCargoHoras(item),
            estado: normalizeEstadoPeriodo(item.estadoPeriodo, item.estadoRevision),
            fechaEnvio: formatDateCell(item.ultimoEnvio ?? item.fechaEnvio),
            ultimaActualizacion: formatDateCell(
              item.ultimaActualizacion ?? item.fechaRevision,
            ),
            observacion:
              String(item.observacion ?? item.observacionesRevision ?? "").trim() ||
              undefined,
          };
        });

        if (cancelled) return;

        setEquipos((prev) => {
          const existingIndex = prev.findIndex(
            (equipo) => String(equipo.id) === selectedEquipoId,
          );

          if (existingIndex === -1) {
            return [
              ...prev,
              {
                id: Number(selectedEquipoId),
                nombre:
                  equiposForSelect.find(
                    (equipo) => String(equipo.id) === selectedEquipoId,
                  )?.nombre ?? `Equipo ${selectedEquipoId}`,
                semestre: periodoFiltro,
                profesionales: mapped,
              },
            ];
          }

          return prev.map((equipo, index) =>
            index === existingIndex
              ? { ...equipo, semestre: periodoFiltro, profesionales: mapped }
              : equipo,
          );
        });
      } catch (error) {
        if (cancelled) return;
        setRegistrosError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el listado de profesionales del periodo.",
        );
      } finally {
        if (!cancelled) setIsLoadingRegistros(false);
      }
    };

    void fetchRegistrosPeriodo();

    return () => {
      cancelled = true;
    };
  }, [
    apiBase,
    equiposForSelect,
    periodoFiltro,
    reloadTick,
    selectedEquipoId,
    token,
  ]);

  const profesionalesEquipo = useMemo(
    () => selectedEquipo?.profesionales ?? [],
    [selectedEquipo],
  );

  const profesionales = useMemo(() => {
    if (tablaFiltro === "todos") return profesionalesEquipo;

    if (tablaFiltro === "rechazados") {
      return profesionalesEquipo.filter(
        (profesional) => profesional.estado === "rechazado",
      );
    }

    if (tablaFiltro === "confirmados") {
      return profesionalesEquipo.filter(
        (profesional) => profesional.estado === "confirmado",
      );
    }

    if (tablaFiltro === "pendientes") {
      return profesionalesEquipo.filter(
        (profesional) => profesional.estado === "pendiente",
      );
    }

    return profesionalesEquipo.filter(
      (profesional) => profesional.estado === "sin-enviar",
    );
  }, [profesionalesEquipo, tablaFiltro]);

  const paquetesAgrupadosPorDia = useMemo(() => {
    if (!selectedEnvio) return [];

    const grouped = new Map<
      string,
      {
        diaSemana: number | null;
        diaNombre: string;
        paquetes: FormularioHorariosEnvioHistorialPaquete[];
      }
    >();

    sortPaquetesHoras(selectedEnvio.paquetesHoras).forEach((paquete) => {
      const diaNombre = formatDiaSemana(paquete.diaSemana);
      const key = `${paquete.diaSemana ?? "sin-dia"}-${diaNombre}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.paquetes.push(paquete);
        return;
      }

      grouped.set(key, {
        diaSemana: paquete.diaSemana,
        diaNombre,
        paquetes: [paquete],
      });
    });

    return Array.from(grouped.values()).sort((a, b) => {
      const dayA = a.diaSemana ?? Number.MAX_SAFE_INTEGER;
      const dayB = b.diaSemana ?? Number.MAX_SAFE_INTEGER;

      return dayA - dayB;
    });
  }, [selectedEnvio]);

  const totalProfesionales = profesionalesEquipo.length;
  const faltanEnviar = countByEstado(profesionalesEquipo, "sin-enviar");
  const confirmados = countByEstado(profesionalesEquipo, "confirmado");
  const rechazados = countByEstado(profesionalesEquipo, "rechazado");

  const handleViewClick = async (profesional: ProfesionalCambioSemestral) => {
    if (!token || !apiBase) {
      setFeedback({
        type: "error",
        message:
          "No se pudo consultar el historial porque la sesion no esta disponible.",
      });
      return;
    }

    setSelectedRegistro(profesional);
    setIsHistoryDialogOpen(true);
    setEnviosHistorial([]);
    setEnviosError(null);
    setIsLoadingEnvios(true);

    try {
      const response = await fetch(
        `${apiBase}/api/v1/profesionals/formulario-horarios/${profesional.id}/envios`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          await getBackendErrorMessage(
            response,
            `Error al traer historial de envios (status ${response.status}).`,
          ),
        );
      }

      const payload = (await response.json()) as unknown;
      const source = Array.isArray(payload)
        ? (payload as FormularioHorariosEnvioHistorial[])
        : [];

      setEnviosHistorial(source);
    } catch (error) {
      setEnviosError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el historial de envios.",
      );
    } finally {
      setIsLoadingEnvios(false);
    }
  };

  const handleHistoryDialogChange = (open: boolean) => {
    setIsHistoryDialogOpen(open);

    if (!open) {
      setSelectedRegistro(null);
      setEnviosHistorial([]);
      setEnviosError(null);
      setIsLoadingEnvios(false);
      setIsPackagesDialogOpen(false);
      setSelectedEnvio(null);
    }
  };

  const handlePackagesDialogChange = (open: boolean) => {
    setIsPackagesDialogOpen(open);

    if (!open) {
      setSelectedEnvio(null);
      setIsRejectDialogOpen(false);
      setRejectObservacion("");
      setIsSubmittingReject(false);
      setRejectError(null);
      setIsConfirmDialogOpen(false);
      setIsSubmittingConfirm(false);
      setConfirmError(null);
    }
  };

  const handleOpenPackagesDialog = (
    envio: FormularioHorariosEnvioHistorial,
  ) => {
    setSelectedEnvio(envio);
    setIsPackagesDialogOpen(true);
  };

  const handleRejectDialogChange = (open: boolean) => {
    setIsRejectDialogOpen(open);
    if (!open) {
      setRejectObservacion("");
      setRejectError(null);
      setIsSubmittingReject(false);
    }
  };

  const handleRejectSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token || !apiBase) {
      setRejectError("No hay una sesion activa para rechazar el envio.");
      return;
    }

    if (!selectedEnvio) {
      setRejectError("No se encontro el envio a rechazar.");
      return;
    }

    setIsSubmittingReject(true);
    setRejectError(null);

    try {
      const response = await fetch(
        `${apiBase}/api/v1/profesionals/formulario-horarios/envios/${selectedEnvio.id}/rechazar`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ observacion: rejectObservacion.trim() }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getBackendErrorMessage(
            response,
            `Error al rechazar el envio (status ${response.status}).`,
          ),
        );
      }

      handleRejectDialogChange(false);
      setReloadTick((prev) => prev + 1);

      if (selectedRegistro) {
        await handleViewClick(selectedRegistro);
      }

      setFeedback({
        type: "success",
        message: "Envio rechazado correctamente.",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Ocurrio un error al rechazar el envio.";
      setRejectError(message);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleConfirmDialogChange = (open: boolean) => {
    setIsConfirmDialogOpen(open);
    if (!open) {
      setConfirmError(null);
      setIsSubmittingConfirm(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!token || !apiBase) {
      setConfirmError("No hay una sesion activa para confirmar el envio.");
      return;
    }

    if (!selectedEnvio) {
      setConfirmError("No se encontro el envio a confirmar.");
      return;
    }

    setIsSubmittingConfirm(true);
    setConfirmError(null);

    try {
      const response = await fetch(
        `${apiBase}/api/v1/profesionals/formulario-horarios/envios/${selectedEnvio.id}/confirmar`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          await getBackendErrorMessage(
            response,
            `Error al confirmar el envio (status ${response.status}).`,
          ),
        );
      }

      const responsePayload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      handleConfirmDialogChange(false);
      handlePackagesDialogChange(false);
      setReloadTick((prev) => prev + 1);

      if (selectedRegistro) {
        await handleViewClick(selectedRegistro);
      }

      setFeedback({
        type: "success",
        message:
          responsePayload?.message?.trim() || "Envio confirmado correctamente.",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Ocurrio un error al confirmar el envio.";
      setConfirmError(message);
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  const handleResendDialogChange = (open: boolean) => {
    setIsResendDialogOpen(open);
    if (!open) {
      setResendingProfesional(null);
      setResendCorreo("");
      setResendError(null);
      setIsSubmittingResend(false);
    }
  };

  const handleResendClick = (profesional: ProfesionalCambioSemestral) => {
    setResendingProfesional(profesional);
    setResendCorreo(profesional.correo ?? "");
    setResendError(null);
    setIsResendDialogOpen(true);
  };

  const handlePasswordDialogChange = (open: boolean) => {
    setIsPasswordDialogOpen(open);
    if (!open) {
      setPasswordProfesional(null);
      setNuevaContrasena("");
      setPasswordError(null);
      setIsSubmittingPassword(false);
    }
  };

  const handlePasswordClick = (profesional: ProfesionalCambioSemestral) => {
    setPasswordProfesional(profesional);
    setNuevaContrasena("");
    setPasswordError(null);
    setIsPasswordDialogOpen(true);
  };

  const handleResendSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token || !apiBase) {
      setResendError("No hay una sesion activa para reenviar el formulario.");
      setFeedback({
        type: "error",
        message:
          "No se pudo reenviar el formulario porque la sesion no esta disponible.",
      });
      return;
    }

    if (!resendingProfesional) {
      setResendError("No se encontro el registro a reenviar.");
      return;
    }

    const payload: FormularioReenvioPayload = {
      correo: resendCorreo.trim(),
    };

    if (!payload.correo) {
      setResendError("El correo es obligatorio.");
      return;
    }

    setIsSubmittingResend(true);
    setResendError(null);
    setFeedback(null);

    try {
      const response = await fetch(
        `${apiBase}/api/v1/profesionals/formulario-horarios/${resendingProfesional.id}/reenvio`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getBackendErrorMessage(
            response,
            `Error al reenviar formulario (status ${response.status}).`,
          ),
        );
      }

      const responsePayload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      handleResendDialogChange(false);
      setReloadTick((prev) => prev + 1);
      setFeedback({
        type: "success",
        message:
          responsePayload?.message?.trim() ||
          "Formulario reenviado correctamente.",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Ocurrio un error al reenviar el formulario.";
      setResendError(message);
      setFeedback({
        type: "error",
        message,
      });
    } finally {
      setIsSubmittingResend(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token || !apiBase) {
      setPasswordError("No hay una sesion activa para cambiar la contrasena.");
      setFeedback({
        type: "error",
        message:
          "No se pudo cambiar la contrasena porque la sesion no esta disponible.",
      });
      return;
    }

    if (!passwordProfesional) {
      setPasswordError("No se encontro el registro para cambiar la contrasena.");
      return;
    }

    const payload: FormularioContrasenaPayload = {
      nuevaContrasena: nuevaContrasena.trim(),
    };

    if (!payload.nuevaContrasena) {
      setPasswordError("La nueva contrasena es obligatoria.");
      return;
    }

    setIsSubmittingPassword(true);
    setPasswordError(null);
    setFeedback(null);

    try {
      const response = await fetch(
        `${apiBase}/api/v1/profesionals/formulario-horarios/${passwordProfesional.id}/contrasena`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getBackendErrorMessage(
            response,
            `Error al cambiar contrasena (status ${response.status}).`,
          ),
        );
      }

      const responsePayload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      handlePasswordDialogChange(false);
      setReloadTick((prev) => prev + 1);
      setFeedback({
        type: "success",
        message:
          responsePayload?.message?.trim() || "Contrasena actualizada correctamente.",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Ocurrio un error al cambiar la contrasena.";

      setPasswordError(message);
      setFeedback({
        type: "error",
        message,
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleRetryDialogChange = (open: boolean) => {
    setIsRetryDialogOpen(open);
    if (!open && retryingRegistroId === null) {
      setRetryProfesional(null);
    }
  };

  const handleEnableRetryClick = (profesional: ProfesionalCambioSemestral) => {
    setRetryProfesional(profesional);
    setIsRetryDialogOpen(true);
  };

  const handleEnableRetryConfirm = async () => {
    if (!retryProfesional) return;

    if (!token || !apiBase) {
      setFeedback({
        type: "error",
        message:
          "No se pudo habilitar el reintento porque la sesion no esta disponible.",
      });
      return;
    }

    setRetryingRegistroId(retryProfesional.id);
    setFeedback(null);

    try {
      const response = await fetch(
        `${apiBase}/api/v1/profesionals/formulario-horarios/${retryProfesional.id}/habilitar-reintento`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          await getBackendErrorMessage(
            response,
            "No se pudo habilitar el reintento del formulario.",
          ),
        );
      }

      const responsePayload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      setReloadTick((prev) => prev + 1);
      setFeedback({
        type: "success",
        message:
          responsePayload?.message?.trim() ||
          `Se habilito un nuevo reintento para el registro ${retryProfesional.id}.`,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Ocurrio un error al habilitar el reintento.";
      setFeedback({
        type: "error",
        message,
      });
    } finally {
      setRetryingRegistroId(null);
      setIsRetryDialogOpen(false);
      setRetryProfesional(null);
    }
  };

  const handleDeleteDialogChange = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setDeletingProfesional(null);
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (profesional: ProfesionalCambioSemestral) => {
    setDeletingProfesional(profesional);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!token || !apiBase) {
      setFeedback({
        type: "error",
        message:
          "No se pudo eliminar el formulario porque la sesion no esta disponible.",
      });
      return;
    }

    if (!deletingProfesional) return;

    setIsDeleting(true);
    setFeedback(null);

    try {
      const response = await fetch(
        `${apiBase}/api/v1/profesionals/formulario-horarios/${deletingProfesional.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          await getBackendErrorMessage(
            response,
            `Error al eliminar formulario (status ${response.status}).`,
          ),
        );
      }

      const responsePayload =
        (await response.json().catch(() => null)) as FormularioDeleteResponse | null;

      handleDeleteDialogChange(false);
      setReloadTick((prev) => prev + 1);
      setFeedback({
        type: "success",
        message:
          responsePayload?.message?.trim() || "Formulario eliminado correctamente.",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Ocurrio un error al eliminar el formulario.";
      setFeedback({
        type: "error",
        message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingProfesional(null);
      setEditData(initialEditData);
      setEditError(null);
      setIsSubmittingEdit(false);
    }
  };

  const handleEditClick = (profesional: ProfesionalCambioSemestral) => {
    setEditingProfesional(profesional);
    setEditData({
      nombre: profesional.nombre,
      apellido: profesional.apellido,
      dni: profesional.dni,
      correo: profesional.correo,
    });
    setEditError(null);
    setIsEditDialogOpen(true);
  };

  const handleEditInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token || !apiBase) {
      setEditError("No hay una sesion activa para editar el formulario.");
      setFeedback({
        type: "error",
        message:
          "No se pudo editar el formulario porque la sesion no esta disponible.",
      });
      return;
    }

    if (!editingProfesional) {
      setEditError("No se encontro el registro a editar.");
      return;
    }

    setIsSubmittingEdit(true);
    setEditError(null);
    setFeedback(null);

    const payload = {
      nombre: editData.nombre.trim(),
      apellido: editData.apellido.trim(),
      dni: editData.dni.trim(),
      correo: editData.correo.trim(),
      tipoFormulario: periodoFiltro,
    };

    try {
      const response = await fetch(
        `${apiBase}/api/v1/profesionals/formulario-horarios/${editingProfesional.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getBackendErrorMessage(
            response,
            `Error al editar formulario (status ${response.status}).`,
          ),
        );
      }

      handleEditDialogChange(false);
      setReloadTick((prev) => prev + 1);
      setFeedback({
        type: "success",
        message: "Formulario actualizado correctamente.",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Ocurrio un error al editar el formulario.";
      setEditError(message);
      setFeedback({
        type: "error",
        message,
      });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenBulkMailDialog = () => {
    const rows = profesionalesEquipo.map((profesional) => ({
      id: profesional.id,
      profesionalId: profesional.profesionalId ?? profesional.id,
      nombreCompleto: `${profesional.apellido}, ${profesional.nombre}`,
      correo: profesional.correo ?? "",
    }));

    setBulkMailRows(rows);
    setBulkMailSubmitError(null);
    setIsBulkMailDialogOpen(true);
  };

  const handleBulkMailCorreoChange = (id: number, correo: string) => {
    setBulkMailRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, correo } : row)),
    );
  };

  const handleBulkMailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !apiBase || bulkMailRows.length === 0) return;

    setIsSubmittingBulkMail(true);
    setBulkMailSubmitError(null);

    const requests = bulkMailRows.map(async (row) => {
      const correo = row.correo.trim();
      const body: {
        profesionalId: number;
        tipoFormulario: PeriodoFiltro;
        correo?: string;
      } = {
        profesionalId: row.profesionalId,
        tipoFormulario: periodoFiltro,
      };

      if (correo) {
        body.correo = correo;
      }

      const candidateUrls = [
        `${apiV1Normalized}/profesionals/formulario-horarios/envio-inicial-semestral`,
        `${apiBase}/api/v1/profesionals/formulario-horarios/envio-inicial-semestral`,
        `${apiBase}/profesionals/formulario-horarios/envio-inicial-semestral`,
      ].filter((url, index, arr) => Boolean(url) && arr.indexOf(url) === index);

      let lastStatus: number | null = null;
      let lastErrorMessage = "";

      for (const url of candidateUrls) {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          return;
        }

        lastStatus = res.status;
        lastErrorMessage = await res.text().catch(() => "");
        if (res.status !== 404) {
          break;
        }
      }

      throw new Error(
        lastErrorMessage.trim() ||
          `No se pudo enviar formulario para profesional ${row.profesionalId} (status ${lastStatus ?? "desconocido"}).`,
      );
    });

    const results = await Promise.allSettled(requests);
    const successCount = results.filter((result) => result.status === "fulfilled")
      .length;
    const errorResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    if (errorResults.length > 0) {
      setBulkMailSubmitError(
        errorResults[0]?.reason instanceof Error
          ? errorResults[0].reason.message
          : "Ocurrieron errores durante el envio masivo.",
      );
    }

    if (successCount > 0) {
      setFeedback({
        type: "success",
        message: `Envio inicial semestral ejecutado: ${successCount} ok, ${errorResults.length} con error.`,
      });
      setIsBulkMailDialogOpen(false);
      setBulkMailRows([]);
      setReloadTick((prev) => prev + 1);
    }

    setIsSubmittingBulkMail(false);
  };

  const handleOpenCoberturaEscuelas = async () => {
    if (!token || !apiBase || !selectedEquipoId) {
      setFeedback({
        type: "error",
        message:
          "No se pudo obtener la cobertura porque falta sesión o equipo seleccionado.",
      });
      return;
    }

    setModalCoberturaOpen(true);
    setIsLoadingCobertura(true);
    setCoberturaError(null);
    setCoberturaEscuelas([]);
    setCoberturaTotal(0);
    setCoberturaGeiHoras(0);
    setCoberturaInterdisciplinarioHoras(0);
    setCoberturaEquipoNombre(selectedEquipoNombre);

    try {
      const params = new URLSearchParams();
      params.set("tipoFormulario", periodoFiltro);
      params.set("equipoId", selectedEquipoId);

      const response = await fetch(
        `${apiBase}/api/v1/profesionals/formulario-horarios/cobertura-escuelas?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          await getBackendErrorMessage(
            response,
            `No se pudo obtener cobertura por escuela (status ${response.status}).`,
          ),
        );
      }

      const payload = (await response.json()) as CoberturaEscuelasApiResponse;
      const escuelas = Array.isArray(payload.escuelas) ? payload.escuelas : [];

      const mapped: EscuelaCobertura[] = escuelas.map((escuela, index) => {
        const idRaw = escuela.id ?? escuela.escuelaId;
        const id =
          typeof idRaw === "number" && Number.isFinite(idRaw)
            ? idRaw
            : -1 * (index + 1);
        const coberturaRaw = Number(escuela.cobertura ?? 0);

        return {
          id,
          nombre:
            String(escuela.nombre ?? escuela.escuelaNombre ?? "").trim() ||
            `Escuela ${id}`,
          cobertura: Number.isFinite(coberturaRaw) ? coberturaRaw : 0,
        };
      });

      const coberturaTotalValue = Number(payload.coberturaTotal ?? 0);
      const geiHorasValue = Number(
        payload.horasCargaGei ??
          payload.cargaEnGeiHoras ??
          payload.cargaGeiHoras ??
          payload.geiHoras ??
          payload.horasGei ??
          0,
      );
      const interdisciplinarioHorasValue = Number(
        payload.horasTrabajoInterdisciplinario ??
          payload.trabajoInterdisciplinarioHoras ??
          payload.interdisciplinarioHoras ??
          payload.horasInterdisciplinario ??
          payload.trabajoInterdisciplinario ??
          0,
      );
      setCoberturaEscuelas(mapped);
      setCoberturaTotal(
        Number.isFinite(coberturaTotalValue) ? coberturaTotalValue : 0,
      );
      setCoberturaGeiHoras(Number.isFinite(geiHorasValue) ? geiHorasValue : 0);
      setCoberturaInterdisciplinarioHoras(
        Number.isFinite(interdisciplinarioHorasValue)
          ? interdisciplinarioHorasValue
          : 0,
      );
      setCoberturaEquipoNombre(
        String(payload.equipoNombre ?? "").trim() || selectedEquipoNombre,
      );
    } catch (error) {
      setCoberturaError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la cobertura por escuela.",
      );
    } finally {
      setIsLoadingCobertura(false);
    }
  };

  const handleGlobalAction = async (label: string) => {
    if (!selectedEquipoId) return;

    if (label === "Enviar Formulario a todo el equipo") {
      handleOpenBulkMailDialog();
      return;
    }

    if (label === "Confirmar todos los envios") {
      if (!token || !apiBase) {
        setFeedback({
          type: "error",
          message:
            "No se pudo confirmar los envios porque la sesion no esta disponible.",
        });
        return;
      }

      if (isConfirmingAllEnvios) return;

      setIsConfirmingAllEnvios(true);

      try {
        const params = new URLSearchParams();
        params.set("tipoFormulario", periodoFiltro);
        const endpointPath = `/profesionals/formulario-horarios/equipos/${selectedEquipoId}/confirmar-envios?${params.toString()}`;
        const candidateUrls = [
          `${apiV1Normalized}${endpointPath}`,
          `${apiBase}/api/v1${endpointPath}`,
          `${apiBase}${endpointPath}`,
        ].filter((url, index, arr) => Boolean(url) && arr.indexOf(url) === index);

        let lastStatus: number | null = null;
        let lastErrorMessage = "";

        for (const url of candidateUrls) {
          const response = await fetch(url, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            setReloadTick((prev) => prev + 1);
            setFeedback({
              type: "success",
              message: "Se confirmaron los envios del equipo correctamente.",
            });
            return;
          }

          lastStatus = response.status;
          lastErrorMessage = await getBackendErrorMessage(
            response,
            `No se pudieron confirmar los envios (status ${response.status}).`,
          );

          if (response.status !== 404) break;
        }

        throw new Error(
          lastErrorMessage ||
            `No se pudieron confirmar los envios (status ${lastStatus ?? "desconocido"}).`,
        );
      } catch (error) {
        setFeedback({
          type: "error",
          message:
            error instanceof Error && error.message
              ? error.message
              : "Ocurrio un error al confirmar los envios del equipo.",
        });
      } finally {
        setIsConfirmingAllEnvios(false);
      }

      return;
    }

    if (label === "Ver cobertura por escuela") {
      void handleOpenCoberturaEscuelas();
      return;
    }
  };

  const handleEquipoChange = (value: string) => {
    setSelectedEquipoId(value);
    setTablaFiltro("todos");
    setFeedback(null);
    setIsBulkMailDialogOpen(false);
    setBulkMailRows([]);
    setBulkMailSubmitError(null);
    setIsSubmittingBulkMail(false);
  };

  const renderActionButtons = (profesional: ProfesionalCambioSemestral) => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={`${actionButtonClass} bg-emerald-100 text-emerald-700 hover:bg-emerald-200`}
        aria-label={`Ver registro ${profesional.id}`}
        title="Ver"
        onClick={() => void handleViewClick(profesional)}
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`${actionButtonClass} bg-sky-100 text-sky-700 hover:bg-sky-200`}
        aria-label={`Reenviar formulario ${profesional.id}`}
        title="Reenviar formulario"
        onClick={() => handleResendClick(profesional)}
      >
        <Mail className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`${actionButtonClass} bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-60`}
        aria-label={`Habilitar reintento del registro ${profesional.id}`}
        title="Habilitar reintento"
        onClick={() => handleEnableRetryClick(profesional)}
        disabled={retryingRegistroId === profesional.id}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`${actionButtonClass} bg-red-100 text-red-700 hover:bg-red-200`}
        aria-label={`Eliminar registro ${profesional.id}`}
        title="Eliminar"
        onClick={() => handleDeleteClick(profesional)}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`${actionButtonClass} bg-amber-100 text-amber-700 hover:bg-amber-200`}
        aria-label={`Editar registro ${profesional.id}`}
        title="Editar"
        onClick={() => handleEditClick(profesional)}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`${actionButtonClass} bg-slate-100 text-slate-700 hover:bg-slate-200`}
        aria-label={`Cambiar contrasena del registro ${profesional.id}`}
        title="Cambiar contrasena"
        onClick={() => handlePasswordClick(profesional)}
      >
        <Key className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="space-y-1">
                <CardTitle className="text-2xl text-slate-900">
                  Cambios semestrales de horarios
                </CardTitle>
                <CardDescription className="max-w-2xl text-sm text-slate-600">
                  Vista independiente para centralizar envios, estados y
                  seguimiento por equipo.
                </CardDescription>
              </div>
            </div>

            <div className="w-full max-w-sm space-y-2">
              <label
                htmlFor="equipo-semestral"
                className="text-sm font-medium text-slate-700"
              >
                Equipo
              </label>
              <Select value={selectedEquipoId} onValueChange={handleEquipoChange}>
                <SelectTrigger id="equipo-semestral" className="h-11 bg-white">
                  <SelectValue placeholder="Seleccione un equipo" />
                </SelectTrigger>
                <SelectContent>
                  {equiposForSelect.map((equipo) => (
                    <SelectItem key={equipo.id} value={String(equipo.id)}>
                      {equipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="flex items-start justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">
                  Total profesionales
                </p>
                <p className="text-3xl font-semibold text-slate-900">
                  {totalProfesionales}
                </p>
              </div>
              <Users className="h-8 w-8 text-slate-400" />
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/70 shadow-sm">
            <CardContent className="flex items-start justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-700">
                  Falta enviar Formulario
                </p>
                <p className="text-3xl font-semibold text-amber-950">
                  {faltanEnviar}
                </p>
              </div>
              <Mail className="h-8 w-8 text-amber-500" />
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/70 shadow-sm">
            <CardContent className="flex items-start justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-emerald-700">
                  Confirmados
                </p>
                <p className="text-3xl font-semibold text-emerald-950">
                  {confirmados}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </CardContent>
          </Card>

          <Card className="border-rose-200 bg-rose-50/70 shadow-sm">
            <CardContent className="flex items-start justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-rose-700">Rechazados</p>
                <p className="text-3xl font-semibold text-rose-950">
                  {rechazados}
                </p>
              </div>
              <ShieldAlert className="h-8 w-8 text-rose-500" />
            </CardContent>
          </Card>
        </section>

        <div>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">
                Acciones globales
              </CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Botonera de acciones operativas y filtro de visualizacion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="filtro-profesionales">Filtro de tabla</Label>
                  <Select
                    value={tablaFiltro}
                    onValueChange={(value) => setTablaFiltro(value as TablaFiltro)}
                  >
                    <SelectTrigger
                      id="filtro-profesionales"
                      className="h-11 bg-white"
                    >
                      <SelectValue placeholder="Seleccionar filtro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Ver todos</SelectItem>
                      <SelectItem value="confirmados">
                        Ver confirmados
                      </SelectItem>
                      <SelectItem value="rechazados">Ver rechazados</SelectItem>
                      <SelectItem value="pendientes">Ver pendientes</SelectItem>
                      <SelectItem value="no-enviaron">
                        Ver no enviaron
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtro-periodo">Periodo</Label>
                  <Select
                    value={periodoFiltro}
                    onValueChange={(value) =>
                      setPeriodoFiltro(value as PeriodoFiltro)
                    }
                  >
                    <SelectTrigger id="filtro-periodo" className="h-11 bg-white">
                      <SelectValue placeholder="Seleccionar periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semestral-jul-26">
                        semestral-jul-26
                      </SelectItem>
                      <SelectItem value="semestral-dec-26">
                        semestral-dec-26
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {actionButtons.map((label, index) => {
                  const isConfirmAllAction = label === "Confirmar todos los envios";
                  return (
                    <Button
                      key={label}
                      type="button"
                      variant={index < 2 ? "default" : "outline"}
                      className="h-auto min-h-11 justify-start whitespace-normal py-3 text-left"
                      onClick={() => void handleGlobalAction(label)}
                      disabled={isConfirmAllAction && isConfirmingAllEnvios}
                    >
                      {isConfirmAllAction && isConfirmingAllEnvios
                        ? "Confirmando envios..."
                        : label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
            <ModalCoberturaEscuelas
              open={modalCoberturaOpen}
              onOpenChange={(open) => {
                setModalCoberturaOpen(open);
                if (!open) {
                  setCoberturaError(null);
                }
              }}
              equipoNombre={coberturaEquipoNombre}
              coberturaTotal={coberturaTotal}
              cargaGeiHoras={coberturaGeiHoras}
              trabajoInterdisciplinarioHoras={
                coberturaInterdisciplinarioHoras
              }
              escuelas={coberturaEscuelas}
              isLoading={isLoadingCobertura}
              errorMsg={coberturaError}
            />
          </Card>
        </div>

        {feedback && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg text-slate-900">
                Profesionales del equipo
              </CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {tablaFiltro !== "todos" && (
                <Badge
                  variant="outline"
                  className="w-fit border-sky-200 bg-sky-50 text-sky-700"
                >
                  Filtro activo: {tablaFiltroLabels[tablaFiltro]}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="w-fit border-slate-200 bg-slate-50 text-slate-700"
              >
                {selectedEquipoNombre}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[220px]">Profesional</TableHead>
                  <TableHead className="w-[120px]">DNI</TableHead>
                  <TableHead className="w-[260px]">Cargo horas</TableHead>
                  <TableHead className="w-[260px]">Correo</TableHead>
                  <TableHead className="w-[140px]">Estado</TableHead>
                  <TableHead className="w-[180px]">Ultimo envio</TableHead>
                  <TableHead className="w-[200px]">Ultima actualizacion</TableHead>
                  <TableHead>Observaciones</TableHead>
                  <TableHead className="w-[260px] text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingRegistros ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      Cargando profesionales del periodo...
                    </TableCell>
                  </TableRow>
                ) : registrosError ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-sm text-rose-700"
                    >
                      {registrosError}
                    </TableCell>
                  </TableRow>
                ) : profesionales.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      No hay profesionales para el filtro seleccionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  profesionales.map((profesional) => (
                    <TableRow key={profesional.id}>
                      <TableCell>
                        <div className="font-medium text-slate-900">
                          {profesional.apellido}, {profesional.nombre}
                        </div>
                        <div className="text-xs text-slate-500">
                          ID {profesional.id}
                        </div>
                      </TableCell>
                      <TableCell>{profesional.dni}</TableCell>
                      <TableCell className="max-w-[320px] whitespace-normal text-slate-700">
                        {profesional.cargoHoras ?? "-"}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {profesional.correo}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={estadoStyles[profesional.estado].className}
                        >
                          {estadoStyles[profesional.estado].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{profesional.fechaEnvio ?? "-"}</TableCell>
                      <TableCell>{profesional.ultimaActualizacion}</TableCell>
                      <TableCell className="text-slate-600">
                        {profesional.observacion ?? "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          {renderActionButtons(profesional)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog
          open={isBulkMailDialogOpen}
          onOpenChange={(open) => {
            setIsBulkMailDialogOpen(open);
            if (!open) {
              setBulkMailRows([]);
            }
          }}
        >
          <DialogContent className="max-w-[95vw] sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enviar Formulario a todo el equipo</DialogTitle>
              <DialogDescription>
                Nombre fijo por profesional y correo editable antes de enviar.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleBulkMailSubmit} className="space-y-4">
              <div className="max-h-[55vh] overflow-y-auto rounded-md border border-slate-200">
                <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-[1fr_1.2fr] sm:p-4">
                  {bulkMailRows.length === 0 ? (
                    <p className="col-span-full text-sm text-slate-500">
                      No hay profesionales en el equipo seleccionado.
                    </p>
                  ) : (
                    bulkMailRows.map((row) => (
                      <div
                        key={row.id}
                        className="col-span-full grid grid-cols-1 gap-2 rounded-md border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[1fr_1.2fr]"
                      >
                        <div className="text-sm font-medium text-slate-800">
                          {row.nombreCompleto}
                        </div>
                        <Input
                          type="email"
                          value={row.correo}
                          onChange={(e) =>
                            handleBulkMailCorreoChange(row.id, e.target.value)
                          }
                          placeholder="correo@dominio.com"
                          disabled={isSubmittingBulkMail}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {bulkMailSubmitError && (
                <p className="text-sm text-rose-700">{bulkMailSubmitError}</p>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmittingBulkMail}
                  onClick={() => {
                    setIsBulkMailDialogOpen(false);
                    setBulkMailRows([]);
                    setBulkMailSubmitError(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={bulkMailRows.length === 0 || isSubmittingBulkMail}
                >
                  {isSubmittingBulkMail ? "Enviando..." : "Enviar Formulario"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isHistoryDialogOpen}
          onOpenChange={handleHistoryDialogChange}
        >
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>Historial de envios</DialogTitle>
              <DialogDescription>
                {selectedRegistro
                  ? `${selectedRegistro.nombre} ${selectedRegistro.apellido} - DNI ${selectedRegistro.dni || "-"}`
                  : "Detalle de los envios realizados desde el formulario de horarios."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-auto min-h-0">
              {isLoadingEnvios ? (
                <p className="py-6 text-center text-sm text-slate-600">
                  Cargando historial de envios...
                </p>
              ) : enviosError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {enviosError}
                </p>
              ) : enviosHistorial.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-600">
                  No hay envios registrados para este formulario.
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-3 sm:hidden">
                    {enviosHistorial.map((envio) => {
                      const equipos = getEquipoNombreList(envio.paquetesHoras);
                      return (
                        <div
                          key={`${envio.envioNumero}-${envio.fechaEnvio ?? "sin-fecha"}`}
                          className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs text-slate-500">
                              {formatDateTime(envio.fechaEnvio)}
                            </p>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium shrink-0 ${getEstadoRevisionClassName(envio.estadoRevision)}`}
                            >
                              {formatEstadoRevision(envio.estadoRevision)}
                            </span>
                          </div>
                          {envio.observacionesRevision?.trim() && (
                            <p className="text-xs text-slate-600">
                              {envio.observacionesRevision.trim()}
                            </p>
                          )}
                          {equipos.length > 0 && (
                            <p className="text-xs text-slate-500">
                              {equipos.join(", ")}
                            </p>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleOpenPackagesDialog(envio)}
                          >
                            Ver paquetes
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="hidden sm:block overflow-x-auto">
                    <Table className="min-w-[720px] table-auto text-xs sm:text-sm [&_th]:whitespace-nowrap">
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-[180px]">
                            Fecha envios
                          </TableHead>
                          <TableHead className="w-[160px]">Estado</TableHead>
                          <TableHead>Observaciones</TableHead>
                          <TableHead className="w-[260px]">
                            Equipo nombre
                          </TableHead>
                          <TableHead className="w-[140px] text-center">
                            Acciones
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enviosHistorial.map((envio) => {
                          const equipos = getEquipoNombreList(
                            envio.paquetesHoras,
                          );

                          return (
                            <TableRow
                              key={`${envio.envioNumero}-${envio.fechaEnvio ?? "sin-fecha"}`}
                            >
                              <TableCell className="text-slate-700">
                                {formatDateTime(envio.fechaEnvio)}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getEstadoRevisionClassName(envio.estadoRevision)}`}
                                >
                                  {formatEstadoRevision(envio.estadoRevision)}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-[320px] whitespace-normal text-slate-700">
                                {envio.observacionesRevision?.trim() || "-"}
                              </TableCell>
                              <TableCell className="max-w-[260px] whitespace-normal text-slate-700">
                                {equipos.length > 0 ? equipos.join(", ") : "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenPackagesDialog(envio)
                                  }
                                >
                                  Ver paquetes
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isPackagesDialogOpen}
          onOpenChange={handlePackagesDialogChange}
        >
          <DialogContent className="max-w-[95vw] overflow-hidden border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-0 sm:max-w-5xl max-h-[90vh] flex flex-col">
            <div className="border-b border-sky-100 bg-white/70 px-4 py-4 sm:px-6 sm:py-5 backdrop-blur shrink-0">
              <DialogHeader className="gap-2">
                <DialogTitle className="text-slate-900 text-base sm:text-lg">
                  {selectedEnvio
                    ? `Paquetes horas del envio #${selectedEnvio.envioNumero}`
                    : "Paquetes horas"}
                </DialogTitle>
                <DialogDescription className="text-slate-600 text-xs sm:text-sm">
                  {selectedEnvio
                    ? `Enviado el ${formatDateTime(selectedEnvio.fechaEnvio)}. Total de paquetes: ${selectedEnvio.paquetesGuardados}.`
                    : "Detalle de los paquetes horas incluidos en el envio."}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent to-white/40 px-4 py-4 sm:px-6 sm:py-6 min-h-0">
              {!selectedEnvio || selectedEnvio.paquetesHoras.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-sky-200 bg-white/80 px-6 py-12 text-center text-sm text-slate-600 shadow-sm">
                  No hay paquetes horas registrados para este envio.
                </div>
              ) : (
                <div className="space-y-5">
                  {paquetesAgrupadosPorDia.map((grupo) => (
                    <Card
                      key={`${grupo.diaSemana ?? "sin-dia"}-${grupo.diaNombre}`}
                      className="overflow-hidden border border-sky-100 bg-white/85 shadow-[0_10px_30px_-20px_rgba(14,116,144,0.45)]"
                    >
                      <CardHeader className="border-b border-sky-100/80 bg-gradient-to-r from-sky-100 via-cyan-50 to-emerald-50 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <CardTitle className="text-base font-semibold text-slate-900">
                            {grupo.diaNombre}
                          </CardTitle>
                          <span className="inline-flex w-fit rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm">
                            {grupo.paquetes.length}{" "}
                            {grupo.paquetes.length === 1
                              ? "paquete"
                              : "paquetes"}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 bg-white/70 p-3 sm:p-4">
                        {grupo.paquetes.map((paquete, index) => (
                          <div
                            key={`${selectedEnvio.envioNumero}-${paquete.id ?? index}-${paquete.equipoId ?? "sin-equipo"}-${paquete.escuelaId ?? "sin-escuela"}`}
                            className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white to-slate-50 p-3 sm:p-4 shadow-sm transition-colors hover:border-sky-200"
                          >
                            <div className="flex flex-col gap-3">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-slate-900">
                                    {paquete.equipoNombre?.trim() ||
                                      "Sin equipo"}
                                  </p>
                                  <p className="text-sm text-slate-600">
                                    {paquete.escuelaNombre?.trim() ||
                                      paquete.tipo?.trim() ||
                                      "Sin escuela"}
                                  </p>
                                </div>
                                <div className="inline-flex w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
                                  {formatHorario(
                                    paquete.horaInicio,
                                    paquete.horaFin,
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                                <div className="rounded-xl bg-amber-50 px-3 py-2">
                                  <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">
                                    Dia
                                  </p>
                                  <p className="mt-1 text-sm text-slate-700">
                                    {formatDiaSemana(paquete.diaSemana)}
                                  </p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 px-3 py-2">
                                  <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                                    Rotativo
                                  </p>
                                  <p className="mt-1 text-sm text-slate-700">
                                    {formatConfiguracionRotativa(
                                      paquete.rotativo,
                                      paquete.tipoRotacion,
                                      paquete.semanas,
                                      paquete.fechas,
                                      paquete.cicloSemanas,
                                    )}
                                  </p>
                                </div>
                                <div className="rounded-xl bg-sky-50 px-3 py-2">
                                  <p className="text-[11px] font-medium uppercase tracking-wide text-sky-700">
                                    Cantidad
                                  </p>
                                  <p className="mt-1 text-sm text-slate-700">
                                    {paquete.cantidad ?? "-"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Dialog
              open={isRejectDialogOpen}
              onOpenChange={handleRejectDialogChange}
            >
              <DialogContent className="max-w-[95vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Rechazar envio</DialogTitle>
                  <DialogDescription>
                    {selectedEnvio
                      ? `Estas rechazando el envio #${selectedEnvio.envioNumero}. Ingresa el motivo del rechazo.`
                      : "Ingresa el motivo del rechazo."}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleRejectSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="reject-observacion">Motivo del rechazo</Label>
                    <textarea
                      id="reject-observacion"
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 min-h-[100px] resize-y"
                      placeholder="Describe el motivo del rechazo..."
                      value={rejectObservacion}
                      onChange={(e) => setRejectObservacion(e.target.value)}
                      required
                    />
                  </div>

                  {rejectError && (
                    <p className="text-sm text-red-600">{rejectError}</p>
                  )}

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRejectDialogChange(false)}
                      disabled={isSubmittingReject}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-red-500 text-white hover:bg-red-600"
                      disabled={isSubmittingReject}
                    >
                      {isSubmittingReject ? "Rechazando..." : "Confirmar rechazo"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <AlertDialog
              open={isConfirmDialogOpen}
              onOpenChange={handleConfirmDialogChange}
            >
              <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar envio</AlertDialogTitle>
                  <AlertDialogDescription>
                    {selectedEnvio
                      ? `Estas por confirmar el envio #${selectedEnvio.envioNumero}. Los paquetes de horas del profesional seran reemplazados por los del formulario. Esta accion no se puede deshacer.`
                      : "Los paquetes de horas del profesional seran reemplazados. Esta accion no se puede deshacer."}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                {confirmError && (
                  <p className="px-1 text-sm text-red-600">{confirmError}</p>
                )}

                <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                  <AlertDialogCancel disabled={isSubmittingConfirm}>
                    Cancelar
                  </AlertDialogCancel>
                  <Button
                    type="button"
                    className="bg-green-500 text-white hover:bg-green-600"
                    onClick={() => void handleConfirmSubmit()}
                    disabled={isSubmittingConfirm}
                  >
                    {isSubmittingConfirm ? "Confirmando..." : "Confirmar envio"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {selectedEnvio?.estadoRevision !== "pendiente" ? (
              <p className="my-4 text-center text-sm text-slate-500">
                El estado del envio es {selectedEnvio?.estadoRevision}.
              </p>
            ) : (
              <div className="shrink-0 border-t border-sky-100 bg-white/70 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handlePackagesDialogChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="bg-red-500 text-white hover:bg-red-600"
                    type="button"
                    onClick={() => setIsRejectDialogOpen(true)}
                  >
                    Rechazar envio
                  </Button>
                  <Button
                    className="bg-green-500 text-white hover:bg-green-600"
                    type="button"
                    onClick={() => setIsConfirmDialogOpen(true)}
                  >
                    Confirmar envio
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isResendDialogOpen} onOpenChange={handleResendDialogChange}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reenviar formulario</DialogTitle>
              <DialogDescription>
                {resendingProfesional
                  ? `${resendingProfesional.apellido}, ${resendingProfesional.nombre}`
                  : "Editar correo para reenviar el formulario."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleResendSubmit} className="space-y-4">
              <div>
                <Label htmlFor="resend-correo">Correo</Label>
                <Input
                  id="resend-correo"
                  type="email"
                  value={resendCorreo}
                  onChange={(e) => setResendCorreo(e.target.value)}
                  placeholder="correo@dominio.com"
                  required
                />
              </div>

              {resendError && <p className="text-sm text-rose-700">{resendError}</p>}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmittingResend}
                  onClick={() => handleResendDialogChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmittingResend}>
                  {isSubmittingResend ? "Reenviando..." : "Reenviar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isPasswordDialogOpen}
          onOpenChange={handlePasswordDialogChange}
        >
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cambiar contrasena</DialogTitle>
              <DialogDescription>
                {passwordProfesional
                  ? `${passwordProfesional.apellido}, ${passwordProfesional.nombre}`
                  : "Defini una nueva contrasena para el profesional."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password-nueva-contrasena">
                  Nueva contrasena
                </Label>
                <Input
                  id="password-nueva-contrasena"
                  type="password"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  placeholder="NuevaClave123"
                  required
                />
              </div>

              {passwordError && (
                <p className="text-sm text-rose-700">{passwordError}</p>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmittingPassword}
                  onClick={() => handlePasswordDialogChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmittingPassword}>
                  {isSubmittingPassword ? "Guardando..." : "Cambiar contrasena"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogChange}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar profesional</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="edit-nombre">Nombre</Label>
                  <Input
                    id="edit-nombre"
                    name="nombre"
                    value={editData.nombre}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-apellido">Apellido</Label>
                  <Input
                    id="edit-apellido"
                    name="apellido"
                    value={editData.apellido}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-dni">DNI</Label>
                  <Input
                    id="edit-dni"
                    name="dni"
                    value={editData.dni}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-correo">Correo</Label>
                  <Input
                    id="edit-correo"
                    name="correo"
                    type="email"
                    value={editData.correo}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>

              {editError && <p className="text-sm text-rose-700">{editError}</p>}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmittingEdit}
                  onClick={() => handleEditDialogChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmittingEdit}>
                  {isSubmittingEdit ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogChange}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar profesional</AlertDialogTitle>
              <AlertDialogDescription>
                {deletingProfesional
                  ? `Se eliminara el registro de ${deletingProfesional.apellido}, ${deletingProfesional.nombre}. Esta accion no se puede deshacer.`
                  : "Esta accion no se puede deshacer."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isRetryDialogOpen} onOpenChange={handleRetryDialogChange}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Habilitar reintento</AlertDialogTitle>
              <AlertDialogDescription>
                {retryProfesional
                  ? `Se habilitara un nuevo intento para ${retryProfesional.apellido}, ${retryProfesional.nombre}.`
                  : "Se habilitara un nuevo intento para este formulario."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
              <AlertDialogCancel disabled={retryingRegistroId !== null}>
                Cancelar
              </AlertDialogCancel>
              <Button
                type="button"
                onClick={() => void handleEnableRetryConfirm()}
                disabled={retryingRegistroId !== null}
              >
                {retryingRegistroId !== null ? "Habilitando..." : "Confirmar"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
