"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Eye, Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/genericos/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/genericos/alert-dialog";
import { Button } from "@/components/ui/genericos/button";
import {
  Card,
  CardContent,
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
import { Paginator } from "@/components/ui/genericos/Paginator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/genericos/table";
import type {
  FormularioHorariosEnvioInicialResponse,
  FormularioHorariosTipoRotacion,
} from "../horarios-form/components/types";

type FormularioHorariosRegistro = {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  correo: string;
  intentosPermitidos: number | null;
  intentosRealizados: number | null;
  ultimoEnvio: string | null;
  ultimaActualizacion: string | null;
};

type FormularioEnvioPayload = {
  nombre: string;
  apellido: string;
  dni: string;
  correo: string;
};

type FormularioReenvioPayload = {
  correo: string;
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

type FormularioDeleteResponse = {
  id: number;
  message: string;
};

const actionButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-full text-base transition-colors";

const initialFormularioState: FormularioEnvioPayload = {
  nombre: "",
  apellido: "",
  dni: "",
  correo: "",
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

const formatEstadoRevision = (value: string | null) => {
  if (!value) return "Sin revisión";

  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
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
    normalized === "en revisión"
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
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
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
    return `Sí · Fechas ${fechas.map(formatFechaRotativa).join(", ")}`;
  }

  if (Array.isArray(semanas) && semanas.length > 0) {
    return `Sí · Semanas ${semanas.join(", ")}${cicloSemanas ? ` de ${cicloSemanas}` : ""}`;
  }

  return cicloSemanas ? `Sí · Ciclo de ${cicloSemanas} semanas` : "Sí";
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

export default function HorariosAltaPage() {
  const { data: session } = useSession();
  const apiBase = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(
    /\/api\/v1\/?$/,
    "",
  );

  const [items, setItems] = useState<FormularioHorariosRegistro[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [isFormularioOpen, setIsFormularioOpen] = useState(false);
  const [formularioData, setFormularioData] = useState<FormularioEnvioPayload>(
    initialFormularioState,
  );
  const [isSubmittingFormulario, setIsSubmittingFormulario] = useState(false);
  const [formularioError, setFormularioError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] =
    useState<FormularioHorariosRegistro | null>(null);
  const [editData, setEditData] = useState<FormularioEnvioPayload>(
    initialFormularioState,
  );
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isResendDialogOpen, setIsResendDialogOpen] = useState(false);
  const [resendingRegistro, setResendingRegistro] =
    useState<FormularioHorariosRegistro | null>(null);
  const [resendCorreo, setResendCorreo] = useState("");
  const [isSubmittingResend, setIsSubmittingResend] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingRegistro, setDeletingRegistro] =
    useState<FormularioHorariosRegistro | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [retryingRegistroId, setRetryingRegistroId] = useState<number | null>(
    null,
  );
  const [isRetryDialogOpen, setIsRetryDialogOpen] = useState(false);
  const [retryRegistro, setRetryRegistro] =
    useState<FormularioHorariosRegistro | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] =
    useState<FormularioHorariosRegistro | null>(null);
  const [enviosHistorial, setEnviosHistorial] = useState<
    FormularioHorariosEnvioHistorial[]
  >([]);
  const [isLoadingEnvios, setIsLoadingEnvios] = useState(false);
  const [enviosError, setEnviosError] = useState<string | null>(null);
  const [isPackagesDialogOpen, setIsPackagesDialogOpen] = useState(false);
  const [selectedEnvio, setSelectedEnvio] =
    useState<FormularioHorariosEnvioHistorial | null>(null);
  const [formularioAlert, setFormularioAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectObservacion, setRejectObservacion] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const fetchRegistros = useCallback(async () => {
    if (!session?.user?.accessToken) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const query = params.toString();
      const url = `${apiBase}/api/v1/profesionals/formulario-horarios${query ? `?${query}` : ""}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Error al traer formulario horarios", res.status, text);
        const error = new Error(
          `Error al traer formulario horarios (status ${res.status})`,
        );
        (error as Error & { status?: number }).status = res.status;
        throw error;
      }

      const payload = (await res.json()) as unknown;
      const nextItems = Array.isArray(payload)
        ? (payload as FormularioHorariosRegistro[])
        : [];

      setItems(nextItems);
    } catch (err) {
      const status = (err as { status?: number })?.status;

      if (status === 401) {
        setErrorMsg("No autorizado. Revisá la sesión actual.");
      } else if (status === 403) {
        setErrorMsg(
          "Sin permisos para ver el listado del formulario de horarios.",
        );
      } else {
        setErrorMsg("Error al traer los registros del formulario de horarios.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiBase, search, session?.user?.accessToken]);

  useEffect(() => {
    fetchRegistros();
  }, [fetchRegistros]);

  useEffect(() => {
    if (!formularioAlert) return;

    const timeout = window.setTimeout(() => {
      setFormularioAlert(null);
      setFormularioError(null);
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [formularioAlert]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * limit;
    return items.slice(start, start + limit);
  }, [items, page, limit]);

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

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleFormularioDialogChange = (open: boolean) => {
    setIsFormularioOpen(open);

    if (!open) {
      setFormularioData(initialFormularioState);
      setFormularioError(null);
    }
  };

  const handleFormularioInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormularioData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open);

    if (!open) {
      setEditingRegistro(null);
      setEditData(initialFormularioState);
      setEditError(null);
    }
  };

  const handleEditClick = (item: FormularioHorariosRegistro) => {
    setEditingRegistro(item);
    setEditData({
      nombre: item.nombre ?? "",
      apellido: item.apellido ?? "",
      dni: item.dni ?? "",
      correo: item.correo ?? "",
    });
    setEditError(null);
    setIsEditDialogOpen(true);
  };

  const handleResendDialogChange = (open: boolean) => {
    setIsResendDialogOpen(open);

    if (!open) {
      setResendingRegistro(null);
      setResendCorreo("");
      setResendError(null);
      setIsSubmittingResend(false);
    }
  };

  const handleResendClick = (item: FormularioHorariosRegistro) => {
    setResendingRegistro(item);
    setResendCorreo(item.correo ?? "");
    setResendError(null);
    setIsResendDialogOpen(true);
  };

  const handleEditInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResendSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!session?.user?.accessToken) {
      setResendError("No hay una sesion activa para reenviar el formulario.");
      setFormularioAlert({
        type: "error",
        message:
          "No se pudo reenviar el formulario porque la sesion no esta disponible.",
      });
      return;
    }

    if (!resendingRegistro) {
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
    setFormularioAlert(null);

    try {
      const res = await fetch(
        `${apiBase}/api/v1/profesionals/formulario-horarios/${resendingRegistro.id}/reenvio`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.accessToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(
          "Error al reenviar formulario de horarios",
          res.status,
          text,
        );

        let backendMessage = "";
        if (text.trim()) {
          try {
            const errorPayload = JSON.parse(text) as { message?: unknown };
            backendMessage =
              typeof errorPayload.message === "string" &&
              errorPayload.message.trim()
                ? errorPayload.message
                : text;
          } catch {
            backendMessage = text;
          }
        }

        throw new Error(
          backendMessage ||
            `Error al reenviar formulario de horarios (status ${res.status})`,
        );
      }

      const response = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;

      handleResendDialogChange(false);
      await fetchRegistros();
      setFormularioAlert({
        type: "success",
        message:
          response?.message?.trim() || "Formulario reenviado correctamente.",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Ocurrio un error al reenviar el formulario.";

      setResendError(message);
      setFormularioAlert({
        type: "error",
        message,
      });
    } finally {
      setIsSubmittingResend(false);
    }
  };

  const handleDeleteDialogChange = (open: boolean) => {
    setIsDeleteDialogOpen(open);

    if (!open) {
      setDeletingRegistro(null);
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (item: FormularioHorariosRegistro) => {
    setDeletingRegistro(item);
    setIsDeleteDialogOpen(true);
  };

  const handleRetryDialogChange = (open: boolean) => {
    setIsRetryDialogOpen(open);

    if (!open && retryingRegistroId === null) {
      setRetryRegistro(null);
    }
  };

  const handleEnableRetryClick = (item: FormularioHorariosRegistro) => {
    setRetryRegistro(item);
    setIsRetryDialogOpen(true);
  };

  const handleEnableRetryConfirm = async () => {
    if (!retryRegistro) return;
    const item = retryRegistro;

    if (!session?.user?.accessToken) {
      setFormularioAlert({
        type: "error",
        message:
          "No se pudo habilitar el reintento porque la sesión no está disponible.",
      });
      return;
    }

    setRetryingRegistroId(retryRegistro.id);
    setFormularioAlert(null);

    try {
      const res = await fetch(
        `${apiBase}/api/v1/profesionals/formulario-horarios/${retryRegistro.id}/habilitar-reintento`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.accessToken}`,
          },
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(
          "Error al habilitar reintento del formulario de horarios",
          res.status,
          text,
        );

        let backendMessage = "";
        if (text.trim()) {
          try {
            const errorPayload = JSON.parse(text) as { message?: unknown };
            backendMessage =
              typeof errorPayload.message === "string" &&
              errorPayload.message.trim()
                ? errorPayload.message
                : text;
          } catch {
            backendMessage = text;
          }
        }

        throw new Error(
          backendMessage || "No se pudo habilitar el reintento del formulario.",
        );
      }

      const response = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;

      await fetchRegistros();
      setFormularioAlert({
        type: "success",
        message:
          response?.message?.trim() ||
          `Se habilitó un nuevo reintento para el registro ${item.id}.`,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Ocurrió un error al habilitar el reintento.";

      setFormularioAlert({
        type: "error",
        message,
      });
    } finally {
      setRetryingRegistroId(null);
      setIsRetryDialogOpen(false);
      setRetryRegistro(null);
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
    }
  };

  const handleOpenPackagesDialog = (
    envio: FormularioHorariosEnvioHistorial,
  ) => {
    setSelectedEnvio(envio);
    setIsPackagesDialogOpen(true);
  };

  const handleViewClick = async (item: FormularioHorariosRegistro) => {
    if (!session?.user?.accessToken) {
      setFormularioAlert({
        type: "error",
        message:
          "No se pudo consultar el historial porque la sesión no está disponible.",
      });
      return;
    }

    setSelectedRegistro(item);
    setIsHistoryDialogOpen(true);
    setIsLoadingEnvios(true);
    setEnviosError(null);
    setEnviosHistorial([]);

    try {
      const res = await fetch(
        `${apiBase}/api/v1/profesionals/formulario-horarios/${item.id}/envios`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.accessToken}`,
          },
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Error al traer historial de envíos", res.status, text);
        const error = new Error(
          `Error al traer historial de envíos (status ${res.status})`,
        );
        (error as Error & { status?: number }).status = res.status;
        throw error;
      }

      const payload = (await res.json()) as unknown;
      const nextItems = Array.isArray(payload)
        ? (payload as FormularioHorariosEnvioHistorial[])
        : [];

      setEnviosHistorial(nextItems);
    } catch (err) {
      const status = (err as { status?: number })?.status;

      if (status === 401) {
        setEnviosError("No autorizado. Revisá la sesión actual.");
      } else if (status === 403) {
        setEnviosError("Sin permisos para ver el historial de envíos.");
      } else {
        setEnviosError("Error al traer el historial de envíos.");
      }
    } finally {
      setIsLoadingEnvios(false);
    }
  };

  const handleFormularioSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!session?.user?.accessToken) {
      setFormularioError("No hay una sesión activa para enviar el formulario.");
      setFormularioAlert({
        type: "error",
        message:
          "No se pudo enviar el formulario porque la sesión no está disponible.",
      });
      return;
    }

    setIsSubmittingFormulario(true);
    setFormularioError(null);
    setFormularioAlert(null);

    const payload: FormularioEnvioPayload = {
      nombre: formularioData.nombre.trim(),
      apellido: formularioData.apellido.trim(),
      dni: formularioData.dni.trim(),
      correo: formularioData.correo.trim(),
    };

    try {
      const res = await fetch(
        `${apiBase}/api/v1/profesionals/formulario-horarios/envio-inicial`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.accessToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(
          "Error al enviar formulario de horarios",
          res.status,
          text,
        );
        let backendMessage = "";
        if (text.trim()) {
          try {
            const errorPayload = JSON.parse(text) as { message?: unknown };
            backendMessage =
              typeof errorPayload.message === "string" &&
              errorPayload.message.trim()
                ? errorPayload.message
                : text;
          } catch {
            backendMessage = text;
          }
        }
        throw new Error(
          backendMessage ||
            `Error al enviar formulario de horarios (status ${res.status})`,
        );
      }

      const response =
        (await res.json()) as FormularioHorariosEnvioInicialResponse;

      handleFormularioDialogChange(false);
      fetchRegistros();
      setFormularioAlert({
        type: response.emailEnviado ? "success" : "error",
        message: response.message,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Ocurrió un error al enviar el formulario.";

      setFormularioError(message);
      setFormularioAlert({
        type: "error",
        message,
      });
    } finally {
      setIsSubmittingFormulario(false);
    }
  };

  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!session?.user?.accessToken) {
      setEditError("No hay una sesión activa para editar el formulario.");
      setFormularioAlert({
        type: "error",
        message:
          "No se pudo editar el formulario porque la sesión no está disponible.",
      });
      return;
    }

    if (!editingRegistro) {
      setEditError("No se encontró el registro a editar.");
      return;
    }

    setIsSubmittingEdit(true);
    setEditError(null);
    setFormularioAlert(null);

    const payload: FormularioEnvioPayload = {
      nombre: editData.nombre.trim(),
      apellido: editData.apellido.trim(),
      dni: editData.dni.trim(),
      correo: editData.correo.trim(),
    };

    try {
      const res = await fetch(
        `${apiBase}/api/v1/profesionals/formulario-horarios/${editingRegistro.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.accessToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(
          "Error al editar formulario de horarios",
          res.status,
          text,
        );

        let backendMessage = "";
        if (text.trim()) {
          try {
            const errorPayload = JSON.parse(text) as { message?: unknown };
            backendMessage =
              typeof errorPayload.message === "string" &&
              errorPayload.message.trim()
                ? errorPayload.message
                : text;
          } catch {
            backendMessage = text;
          }
        }

        throw new Error(
          backendMessage ||
            `Error al editar formulario de horarios (status ${res.status})`,
        );
      }

      handleEditDialogChange(false);
      await fetchRegistros();
      setFormularioAlert({
        type: "success",
        message: "Formulario actualizado correctamente.",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Ocurrió un error al editar el formulario.";

      setEditError(message);
      setFormularioAlert({
        type: "error",
        message,
      });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!session?.user?.accessToken) {
      setFormularioAlert({
        type: "error",
        message:
          "No se pudo eliminar el formulario porque la sesión no está disponible.",
      });
      return;
    }

    if (!deletingRegistro) return;

    setIsDeleting(true);
    setFormularioAlert(null);

    try {
      const res = await fetch(
        `${apiBase}/api/v1/profesionals/formulario-horarios/${deletingRegistro.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
          },
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(
          "Error al eliminar formulario de horarios",
          res.status,
          text,
        );

        let backendMessage = "";
        if (text.trim()) {
          try {
            const errorPayload = JSON.parse(text) as { message?: unknown };
            backendMessage =
              typeof errorPayload.message === "string" &&
              errorPayload.message.trim()
                ? errorPayload.message
                : text;
          } catch {
            backendMessage = text;
          }
        }

        throw new Error(
          backendMessage ||
            `Error al eliminar formulario de horarios (status ${res.status})`,
        );
      }

      const response = (await res.json()) as FormularioDeleteResponse;

      handleDeleteDialogChange(false);
      await fetchRegistros();
      setFormularioAlert({
        type: "success",
        message: response.message,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Ocurrió un error al eliminar el formulario.";

      setFormularioAlert({
        type: "error",
        message,
      });
    } finally {
      setIsDeleting(false);
    }
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

    if (!session?.user?.accessToken) {
      setRejectError("No hay una sesión activa para rechazar el envío.");
      return;
    }

    if (!selectedEnvio) {
      setRejectError("No se encontró el envío a rechazar.");
      return;
    }

    setIsSubmittingReject(true);
    setRejectError(null);

    try {
      const res = await fetch(
        `${apiBase}/api/v1/profesionals/formulario-horarios/envios/${selectedEnvio.id}/rechazar`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.accessToken}`,
          },
          body: JSON.stringify({ observacion: rejectObservacion.trim() }),
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let backendMessage = "";
        if (text.trim()) {
          try {
            const errorPayload = JSON.parse(text) as { message?: unknown };
            backendMessage =
              typeof errorPayload.message === "string" &&
              errorPayload.message.trim()
                ? errorPayload.message
                : text;
          } catch {
            backendMessage = text;
          }
        }
        throw new Error(
          backendMessage || `Error al rechazar el envío (status ${res.status})`,
        );
      }

      handleRejectDialogChange(false);

      // Refrescar el historial de envíos si el registro sigue abierto
      if (selectedRegistro) {
        await handleViewClick(selectedRegistro);
      }

      setFormularioAlert({
        type: "success",
        message: "Envío rechazado correctamente.",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Ocurrió un error al rechazar el envío.";
      setRejectError(message);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // ─── Shared action buttons renderer ────────────────────────────────────────
  const renderActionButtons = (item: FormularioHorariosRegistro) => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={`${actionButtonClass} bg-emerald-100 text-emerald-700 hover:bg-emerald-200`}
        aria-label={`Ver registro ${item.id}`}
        title="Ver"
        onClick={() => void handleViewClick(item)}
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`${actionButtonClass} bg-sky-100 text-sky-700 hover:bg-sky-200`}
        aria-label={`Reenviar formulario ${item.id}`}
        title="Reenviar formulario"
        onClick={() => handleResendClick(item)}
      >
        <Mail className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`${actionButtonClass} bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-60`}
        aria-label={`Habilitar reintento del registro ${item.id}`}
        title="Habilitar reintento"
        onClick={() => handleEnableRetryClick(item)}
        disabled={retryingRegistroId === item.id}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`${actionButtonClass} bg-red-100 text-red-700 hover:bg-red-200`}
        aria-label={`Eliminar registro ${item.id}`}
        title="Eliminar"
        onClick={() => handleDeleteClick(item)}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`${actionButtonClass} bg-amber-100 text-amber-700 hover:bg-amber-200`}
        aria-label={`Editar registro ${item.id}`}
        title="Editar"
        onClick={() => handleEditClick(item)}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">
                Formularios de horarios
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 mt-0.5">
                Listado administrativo de registros enviados para el formulario
                de carga horaria.
              </p>
            </div>
            <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
              <Button
                type="button"
                className="bg-white text-slate-900 hover:bg-slate-100 text-sm"
                onClick={() => handleFormularioDialogChange(true)}
              >
                Enviar formulario
              </Button>
              <div className="text-xs sm:text-sm text-slate-300">
                Total: <span className="font-semibold text-white">{total}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 overflow-x-hidden">
        {formularioAlert && (
          <Alert
            variant={
              formularioAlert.type === "error" ? "destructive" : "default"
            }
            className={
              formularioAlert.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : undefined
            }
          >
            <AlertDescription>{formularioAlert.message}</AlertDescription>
          </Alert>
        )}

        {errorMsg && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {errorMsg}
          </p>
        )}

        {/* ── Stats cards: 1 col mobile, 3 cols sm+ ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <Card className="border-slate-200">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-slate-600">
                En esta página
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">
                {paginatedItems.length}
              </div>
              <div className="text-xs text-slate-500">Registros visibles</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-slate-600">Página</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">
                {page}
              </div>
              <div className="text-xs text-slate-500">de {totalPages}</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-slate-600">
                Estado de carga
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-slate-800">
                {isLoading ? "Actualizando datos..." : "Datos listos"}
              </div>
              <div className="text-xs text-slate-500">
                {search ? `Filtro: ${search}` : "Sin filtro de búsqueda"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Search ── */}
        <Card className="border-slate-200">
          <CardHeader className="py-4">
            <CardTitle className="text-base sm:text-lg">Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_auto_auto]"
            >
              <div>
                <Label
                  htmlFor="filtro-busqueda"
                  className="text-xs sm:text-sm text-slate-600"
                >
                  Buscar por nombre, apellido o DNI
                </Label>
                <Input
                  id="filtro-busqueda"
                  placeholder="Ej: Juan o 12345678"
                  className="h-10 text-xs sm:text-sm bg-white"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <div className="flex gap-3 sm:contents">
                <Button
                  type="submit"
                  className="flex-1 sm:flex-none sm:self-end"
                  disabled={isLoading}
                >
                  Buscar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-none sm:self-end"
                  onClick={handleClearSearch}
                  disabled={isLoading && !search}
                >
                  Limpiar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Registros table ── */}
        <Card className="border-slate-200">
          <CardHeader className="py-4">
            <CardTitle className="text-base sm:text-lg">
              Registros del formulario
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-6 text-slate-600">
                Cargando registros del formulario...
              </p>
            ) : items.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">
                No hay registros del formulario para mostrar.
              </p>
            ) : (
              <>
                {/* Mobile: card list */}
                <div className="flex flex-col gap-3 md:hidden">
                  {paginatedItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {item.nombre || "-"} {item.apellido || ""}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            DNI: {item.dni || "-"}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {item.correo || "-"}
                          </p>
                        </div>
                        <span className="text-xs font-mono text-slate-400 shrink-0">
                          #{item.id}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span>
                          Permitidos:{" "}
                          <strong>{item.intentosPermitidos ?? "-"}</strong>
                        </span>
                        <span>
                          Realizados:{" "}
                          <strong>{item.intentosRealizados ?? "-"}</strong>
                        </span>
                        <span className="col-span-2">
                          Último envío: {formatDateTime(item.ultimoEnvio)}
                        </span>
                        <span className="col-span-2">
                          Actualización:{" "}
                          {formatDateTime(item.ultimaActualizacion)}
                        </span>
                      </div>

                      <div className="pt-1">{renderActionButtons(item)}</div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table className="min-w-max table-auto text-xs sm:text-sm [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead className="w-[140px]">DNI</TableHead>
                        <TableHead className="w-[180px]">Nombre</TableHead>
                        <TableHead className="w-[180px]">Apellido</TableHead>
                        <TableHead className="w-[260px]">Correo</TableHead>
                        <TableHead className="w-[130px]">
                          Intentos permitidos
                        </TableHead>
                        <TableHead className="w-[130px]">
                          Intentos realizados
                        </TableHead>
                        <TableHead className="w-[180px]">
                          Último envío
                        </TableHead>
                        <TableHead className="w-[180px]">
                          Última actualización
                        </TableHead>
                        <TableHead className="w-[260px] text-center">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.map((item) => (
                        <TableRow
                          key={item.id}
                          className="hover:bg-slate-50/70"
                        >
                          <TableCell className="font-mono">{item.id}</TableCell>
                          <TableCell className="font-mono">
                            {item.dni || "-"}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900">
                            {item.nombre || "-"}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900">
                            {item.apellido || "-"}
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {item.correo || "-"}
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {item.intentosPermitidos ?? "-"}
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {item.intentosRealizados ?? "-"}
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {formatDateTime(item.ultimoEnvio)}
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {formatDateTime(item.ultimaActualizacion)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              {renderActionButtons(item)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Paginator
          page={page}
          totalItems={total}
          pageSize={limit}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={isLoading}
        />

        {/* ── Enviar formulario dialog ── */}
        <Dialog
          open={isFormularioOpen}
          onOpenChange={handleFormularioDialogChange}
        >
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enviar formulario</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleFormularioSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formularioData.nombre}
                    onChange={handleFormularioInputChange}
                    placeholder="Nombre"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    name="apellido"
                    value={formularioData.apellido}
                    onChange={handleFormularioInputChange}
                    placeholder="Apellido"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dni">DNI</Label>
                  <Input
                    id="dni"
                    name="dni"
                    value={formularioData.dni}
                    onChange={handleFormularioInputChange}
                    placeholder="12345678"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="correo">Correo</Label>
                  <Input
                    id="correo"
                    name="correo"
                    type="email"
                    value={formularioData.correo}
                    onChange={handleFormularioInputChange}
                    placeholder="correo@dominio.com"
                    required
                  />
                </div>
              </div>

              {formularioError && (
                <p className="text-sm text-red-600">{formularioError}</p>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleFormularioDialogChange(false)}
                  disabled={isSubmittingFormulario}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmittingFormulario}>
                  {isSubmittingFormulario ? "Enviando..." : "Enviar formulario"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Reenviar formulario dialog ── */}
        <Dialog
          open={isResendDialogOpen}
          onOpenChange={handleResendDialogChange}
        >
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reenviar formulario</DialogTitle>
              <DialogDescription>
                {resendingRegistro
                  ? `Reenvio del formulario para ${resendingRegistro.nombre} ${resendingRegistro.apellido}.`
                  : "Reenvio del formulario al profesional."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleResendSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="reenvio-correo">Correo</Label>
                  <Input
                    id="reenvio-correo"
                    name="correo"
                    type="email"
                    value={resendCorreo}
                    onChange={(e) => setResendCorreo(e.target.value)}
                    placeholder="correo@dominio.com"
                    required
                  />
                </div>
              </div>

              {resendError && (
                <p className="text-sm text-red-600">{resendError}</p>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleResendDialogChange(false)}
                  disabled={isSubmittingResend}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmittingResend}>
                  {isSubmittingResend ? "Reenviando..." : "Reenviar formulario"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Historial de envíos dialog ── */}
        <Dialog
          open={isHistoryDialogOpen}
          onOpenChange={handleHistoryDialogChange}
        >
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>Historial de envíos</DialogTitle>
              <DialogDescription>
                {selectedRegistro
                  ? `${selectedRegistro.nombre} ${selectedRegistro.apellido} - DNI ${selectedRegistro.dni || "-"}`
                  : "Detalle de los envíos realizados desde el formulario de horarios."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-auto min-h-0">
              {isLoadingEnvios ? (
                <p className="py-6 text-center text-sm text-slate-600">
                  Cargando historial de envíos...
                </p>
              ) : enviosError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {enviosError}
                </p>
              ) : enviosHistorial.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-600">
                  No hay envíos registrados para este formulario.
                </p>
              ) : (
                <>
                  {/* Mobile: cards */}
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

                  {/* Desktop: table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table className="min-w-[720px] table-auto text-xs sm:text-sm [&_th]:whitespace-nowrap">
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-[180px]">
                            Fecha envíos
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

        {/* ── Paquetes horas dialog ── */}
        <Dialog
          open={isPackagesDialogOpen}
          onOpenChange={handlePackagesDialogChange}
        >
          <DialogContent className="max-w-[95vw] overflow-hidden border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-0 sm:max-w-5xl max-h-[90vh] flex flex-col">
            <div className="border-b border-sky-100 bg-white/70 px-4 py-4 sm:px-6 sm:py-5 backdrop-blur shrink-0">
              <DialogHeader className="gap-2">
                <DialogTitle className="text-slate-900 text-base sm:text-lg">
                  {selectedEnvio
                    ? `Paquetes horas del envío #${selectedEnvio.envioNumero}`
                    : "Paquetes horas"}
                </DialogTitle>
                <DialogDescription className="text-slate-600 text-xs sm:text-sm">
                  {selectedEnvio
                    ? `Enviado el ${formatDateTime(selectedEnvio.fechaEnvio)}. Total de paquetes: ${selectedEnvio.paquetesGuardados}.`
                    : "Detalle de los paquetes horas incluidos en el envío."}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent to-white/40 px-4 py-4 sm:px-6 sm:py-6 min-h-0">
              {!selectedEnvio || selectedEnvio.paquetesHoras.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-sky-200 bg-white/80 px-6 py-12 text-center text-sm text-slate-600 shadow-sm">
                  No hay paquetes horas registrados para este envío.
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
                                    Día
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
                                    Tipo
                                  </p>
                                  <p className="mt-1 text-sm text-slate-700">
                                    {paquete.tipo?.trim() || "No informado"}
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

            {/* ── Rechazar envío dialog ── */}
            <Dialog
              open={isRejectDialogOpen}
              onOpenChange={handleRejectDialogChange}
            >
              <DialogContent className="max-w-[95vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Rechazar envío</DialogTitle>
                  <DialogDescription>
                    {selectedEnvio
                      ? `Estás rechazando el envío #${selectedEnvio.envioNumero}. Ingresá el motivo del rechazo.`
                      : "Ingresá el motivo del rechazo."}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleRejectSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="reject-observacion">
                      Motivo del rechazo
                    </Label>
                    <textarea
                      id="reject-observacion"
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 min-h-[100px] resize-y"
                      placeholder="Describí el motivo del rechazo..."
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
                      {isSubmittingReject
                        ? "Rechazando..."
                        : "Confirmar rechazo"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Footer: stacks vertically on mobile */}
            {selectedEnvio?.estadoRevision !== "pendiente" ? (
              <>
                <p className="text-sm text-slate-500 text-center my-4">
                  El estado del envio es {selectedEnvio?.estadoRevision}.
                </p>
              </>
            ) : (
              <div className="border-t border-sky-100 bg-white/70 px-4 py-3 sm:px-6 sm:py-4 backdrop-blur shrink-0">
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
                    Rechazar envío
                  </Button>
                  <Button
                    className="bg-green-500 text-white hover:bg-green-600"
                    type="button"
                  >
                    Confirmar envío
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Editar formulario dialog ── */}
        <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogChange}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar formulario</DialogTitle>
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
                    placeholder="Nombre"
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
                    placeholder="Apellido"
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
                    placeholder="12345678"
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
                    placeholder="correo@dominio.com"
                    required
                  />
                </div>
              </div>

              {editError && <p className="text-sm text-red-600">{editError}</p>}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleEditDialogChange(false)}
                  disabled={isSubmittingEdit}
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

        {/* ── Eliminar dialog ── */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={handleDeleteDialogChange}
        >
          <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar formulario</AlertDialogTitle>
              <AlertDialogDescription>
                {deletingRegistro
                  ? `Se eliminará el formulario de ${deletingRegistro.nombre} ${deletingRegistro.apellido} y sus relaciones asociadas. Esta acción no se puede deshacer.`
                  : "Esta acción no se puede deshacer."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
              <AlertDialogCancel disabled={isDeleting}>
                Cancelar
              </AlertDialogCancel>
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

        {/* ── Habilitar reintento dialog ── */}
        <AlertDialog
          open={isRetryDialogOpen}
          onOpenChange={handleRetryDialogChange}
        >
          <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Habilitar reintento</AlertDialogTitle>
              <AlertDialogDescription>
                {retryRegistro
                  ? `Se habilitará un nuevo intento para ${retryRegistro.nombre} ${retryRegistro.apellido}. Las credenciales actuales se mantienen.`
                  : "Se habilitará un nuevo intento para este formulario."}
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
