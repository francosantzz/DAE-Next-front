"use client"

import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/genericos/alert"
import { Button } from "@/components/ui/genericos/button"
import { Card, CardContent } from "@/components/ui/genericos/card"
import FormularioHorariosLogin from "./components/FormularioHorariosLogin"
import Stepper from "./components/Stepper"
import Step1Info from "./components/Step1Info"
import Step2DatosPersonales from "./components/Step2DatosPersonales"
import Step3CargaHoraria from "./components/Step3CargaHoraria"
import Step4Resumen from "./components/Step4Resumen"
import type {
  Departamento,
  Equipo,
  Escuela,
  FormularioHorariosEnvioPaquete,
  FormularioHorariosEnvioPayload,
  FormularioHorariosEnvioResponse,
  FormularioHorariosLoginResponse,
  FormularioHorariosProfesional,
  FormularioHorariosSession,
  HorariosFormData,
  PaquetesEquipo,
} from "./components/types"
import { computeWeeklyWorkload } from "./components/weeklyWorkload"

const EQUIPO_DAE_ID = 62
const HORA_RELOJ_MIN = 60
const HORA_CATEDRA_MIN = 40
const HORARIOS_FORM_SESSION_KEY = "horarios-form-session"
const ROTATIVO_CICLO_SEMANAS = 4

const EMPTY_SLOT = { diaSemana: "", horaInicio: "", horaFin: "" }
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

type FormSubmitFeedback = {
  type: "success" | "error"
  message: string
}

const emptyPaquetesEquipo = (): PaquetesEquipo => ({
  interdisciplinario: { ...EMPTY_SLOT },
  gei: [{ ...EMPTY_SLOT }],
  escuelas: [{ escuelaId: "", horas: "", diaSemana: "", horaInicio: "", horaFin: "" }],
})

const createEmptyFormData = (
  profesional?: FormularioHorariosProfesional,
): HorariosFormData => ({
  nombre: profesional?.nombre ?? "",
  apellido: profesional?.apellido ?? "",
  profesion: "",
  cuil: "",
  dni: profesional?.dni ?? "",
  correo: profesional?.correo ?? "",
  telefono: "",
  fechaNacimiento: "",
  cargos: [{ tipo: "", cantidad: "", equipoId: "" }],
  horasCatedra: { enabled: false, cargoIndexes: [] },
  paquetes: {},
  equiposIds: [],
  direccion: {
    calle: "",
    numero: "",
    departamentoId: "",
  },
})

const isWeekNumber = (value: number): value is 1 | 2 | 3 | 4 =>
  value === 1 || value === 2 || value === 3 || value === 4

const normalizeWeeks = (weeks: number[]) =>
  Array.from(new Set(weeks.filter(isWeekNumber))).sort((a, b) => a - b)

const isIsoDate = (value: string) => {
  if (!ISO_DATE_PATTERN.test(value)) return false

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(`${value}T00:00:00`)

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  )
}

const normalizeDates = (dates: string[]) =>
  Array.from(new Set(dates.filter(isIsoDate))).sort((a, b) => a.localeCompare(b))

const parseDiaSemana = (value: string, label: string) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed)) {
    throw new Error(`No se pudo interpretar el día cargado para ${label}.`)
  }
  return parsed
}

const resolveTipoRotacion = (
  rotativo?: PaquetesEquipo["escuelas"][number]["rotativo"],
): "porSemana" | "porCalendario" | null => {
  if (!rotativo?.esRotativo) return null

  if (rotativo.tipo === "porSemana" || rotativo.tipo === "porCalendario") {
    return rotativo.tipo
  }

  const hasWeeks = Array.isArray(rotativo.semanas) && rotativo.semanas.length > 0
  const hasDates = Array.isArray(rotativo.fechas) && rotativo.fechas.length > 0

  if (hasWeeks && !hasDates) return "porSemana"
  if (hasDates && !hasWeeks) return "porCalendario"

  return null
}

const buildRotativoPayload = (
  rotativo: PaquetesEquipo["escuelas"][number]["rotativo"] | undefined,
  label: string,
): Pick<
  FormularioHorariosEnvioPaquete,
  "rotativo" | "tipoRotacion" | "semanas" | "fechas" | "cicloSemanas"
> => {
  if (!rotativo?.esRotativo) {
    return { rotativo: false }
  }

  const tipoRotacion = resolveTipoRotacion(rotativo)

  if (tipoRotacion === "porSemana") {
    const semanas = normalizeWeeks(Array.isArray(rotativo.semanas) ? rotativo.semanas : [])

    if (semanas.length === 0) {
      throw new Error(`${label} requiere semanas válidas para enviarse.`)
    }

    return {
      rotativo: true,
      tipoRotacion: "semanas",
      semanas,
      cicloSemanas: ROTATIVO_CICLO_SEMANAS,
    }
  }

  if (tipoRotacion === "porCalendario") {
    const fechas = normalizeDates(Array.isArray(rotativo.fechas) ? rotativo.fechas : [])

    if (fechas.length === 0) {
      throw new Error(`${label} requiere fechas válidas para enviarse.`)
    }

    return {
      rotativo: true,
      tipoRotacion: "fechas",
      fechas,
    }
  }

  throw new Error(`${label} requiere definir un tipo de rotación válido.`)
}

const buildFormularioEnvioPayload = (formData: HorariosFormData): FormularioHorariosEnvioPayload => {
  const paquetesHoras: FormularioHorariosEnvioPaquete[] = []

  formData.equiposIds.forEach((equipoId) => {
    const paquetes = formData.paquetes[String(equipoId)]
    if (!paquetes) return

    if (equipoId !== EQUIPO_DAE_ID) {
      paquetesHoras.push({
        tipo: "Trabajo Interdisciplinario",
        equipoId,
        escuelaId: null,
        diaSemana: parseDiaSemana(paquetes.interdisciplinario.diaSemana, "Trabajo Interdisciplinario"),
        horaInicio: paquetes.interdisciplinario.horaInicio,
        horaFin: paquetes.interdisciplinario.horaFin,
        rotativo: false,
      })

      ;(Array.isArray(paquetes.gei) ? paquetes.gei : []).forEach((slot, index) => {
        paquetesHoras.push({
          tipo: "Carga en GEI",
          equipoId,
          escuelaId: null,
          diaSemana: parseDiaSemana(slot.diaSemana, `Carga en GEI ${index + 1}`),
          horaInicio: slot.horaInicio,
          horaFin: slot.horaFin,
          rotativo: false,
        })
      })
    }

    paquetes.escuelas.forEach((paquete, index) => {
      const rotativoPayload = buildRotativoPayload(
        paquete.rotativo,
        `El paquete de Escuela ${index + 1} del equipo ${equipoId}`,
      )

      paquetesHoras.push({
        tipo: "Escuela",
        equipoId,
        escuelaId: Number.parseInt(paquete.escuelaId, 10),
        diaSemana: parseDiaSemana(paquete.diaSemana, `Escuela ${index + 1}`),
        horaInicio: paquete.horaInicio,
        horaFin: paquete.horaFin,
        ...rotativoPayload,
      })
    })
  })

  return { paquetesHoras }
}

export default function HorariosFormIntroPage() {
  const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [isEquiposLoading, setIsEquiposLoading] = useState(false)
  const [equiposErrorMsg, setEquiposErrorMsg] = useState<string | null>(null)
  const [infoLeida, setInfoLeida] = useState(false)
  const [authSession, setAuthSession] = useState<FormularioHorariosSession | null>(null)
  const [isAuthResolved, setIsAuthResolved] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null)
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)
  const [submitFeedback, setSubmitFeedback] = useState<FormSubmitFeedback | null>(null)
  const [loginData, setLoginData] = useState({ correo: "", contrasena: "" })

  const [formData, setFormData] = useState<HorariosFormData>(createEmptyFormData())

  const steps = [
    { id: 1, label: "Información" },
    { id: 2, label: "Datos personales" },
    { id: 3, label: "Carga horaria" },
    { id: 4, label: "Resumen" },
  ]
  const [currentStep, setCurrentStep] = useState(1)
  const [escuelasDisponibles, setEscuelasDisponibles] = useState<Map<number, Escuela[]>>(new Map())
  const [escuelasSinPaquetes, setEscuelasSinPaquetes] = useState<Map<number, Escuela[]>>(new Map())

  const resetFormularioState = (profesional?: FormularioHorariosProfesional) => {
    setCurrentStep(1)
    setInfoLeida(false)
    setFormData(createEmptyFormData(profesional))
    setEscuelasDisponibles(new Map())
    setEscuelasSinPaquetes(new Map())
  }

  const clearProfessionalSession = (message?: string, correo?: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(HORARIOS_FORM_SESSION_KEY)
    }

    setAuthSession(null)
    setAuthErrorMsg(message ?? null)
    setSubmitFeedback(null)
    setLoginData({
      correo: correo ?? "",
      contrasena: "",
    })
    resetFormularioState()
  }

  const saveProfessionalSession = (session: FormularioHorariosSession) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(HORARIOS_FORM_SESSION_KEY, JSON.stringify(session))
    }

    setAuthSession(session)
    setAuthErrorMsg(null)
    setSubmitFeedback(null)
    setLoginData({
      correo: session.profesional.correo,
      contrasena: "",
    })
    resetFormularioState(session.profesional)
  }

  const diasSemana = [
    { value: "1", label: "Lunes" },
    { value: "2", label: "Martes" },
    { value: "3", label: "Miércoles" },
    { value: "4", label: "Jueves" },
    { value: "5", label: "Viernes" },
  ]

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const storedSessionRaw = window.localStorage.getItem(HORARIOS_FORM_SESSION_KEY)
      if (!storedSessionRaw) {
        setIsAuthResolved(true)
        return
      }

      const storedSession = JSON.parse(storedSessionRaw) as FormularioHorariosSession
      const expiresAt = Number(storedSession?.expiresAt ?? 0)

      if (!storedSession?.accessToken || !storedSession?.profesional || expiresAt <= Date.now()) {
        window.localStorage.removeItem(HORARIOS_FORM_SESSION_KEY)
        setLoginData({
          correo: storedSession?.profesional?.correo ?? "",
          contrasena: "",
        })
        setAuthErrorMsg("Tu sesión del formulario venció. Volvé a ingresar para continuar.")
        setIsAuthResolved(true)
        return
      }

      setAuthSession(storedSession)
      setLoginData({
        correo: storedSession.profesional.correo,
        contrasena: "",
      })
      resetFormularioState(storedSession.profesional)
    } catch {
      window.localStorage.removeItem(HORARIOS_FORM_SESSION_KEY)
      setAuthErrorMsg("No se pudo recuperar la sesión del formulario. Ingresá nuevamente.")
    } finally {
      setIsAuthResolved(true)
    }
  }, [])

  useEffect(() => {
    if (!authSession) return

    if (authSession.expiresAt <= Date.now()) {
      clearProfessionalSession(
        "Tu sesión del formulario venció. Volvé a ingresar para continuar.",
        authSession.profesional.correo,
      )
      return
    }

    const timeout = window.setTimeout(() => {
      clearProfessionalSession(
        "Tu sesión del formulario venció. Volvé a ingresar para continuar.",
        authSession.profesional.correo,
      )
    }, authSession.expiresAt - Date.now())

    return () => window.clearTimeout(timeout)
  }, [authSession])

  useEffect(() => {
    if (!submitFeedback) return

    const timeout = window.setTimeout(() => {
      setSubmitFeedback(null)
    }, 2000)

    return () => window.clearTimeout(timeout)
  }, [submitFeedback])

  // Keep paquetes in sync with equiposIds: add missing, remove stale
  useEffect(() => {
    setFormData((prev) => {
      const existingKeys = new Set(Object.keys(prev.paquetes))
      const currentKeys = new Set(prev.equiposIds.map(String))

      let changed = false
      const next = { ...prev.paquetes }

      // Add new equipos
      prev.equiposIds.forEach((id) => {
        const key = String(id)
        if (!existingKeys.has(key)) {
          next[key] = emptyPaquetesEquipo()
          changed = true
        }
      })

      // Remove stale equipos
      existingKeys.forEach((key) => {
        if (!currentKeys.has(key)) {
          delete next[key]
          changed = true
        }
      })

      if (!changed) return prev
      return { ...prev, paquetes: next }
    })
  }, [formData.equiposIds])

  // Clear interdisciplinario+GEI for DAE equipo when it is added
  useEffect(() => {
    const daeKey = String(EQUIPO_DAE_ID)
    if (!formData.equiposIds.includes(EQUIPO_DAE_ID)) return
    setFormData((prev) => {
      const daePaquetes = prev.paquetes[daeKey]
      if (!daePaquetes) return prev
      const tieneInter = Boolean(
        daePaquetes.interdisciplinario.diaSemana ||
          daePaquetes.interdisciplinario.horaInicio ||
          daePaquetes.interdisciplinario.horaFin,
      )
      const tieneGei = Boolean(
        daePaquetes.gei.some((s) => s.diaSemana || s.horaInicio || s.horaFin),
      )
      if (!tieneInter && !tieneGei) return prev
      return {
        ...prev,
        paquetes: {
          ...prev.paquetes,
          [daeKey]: {
            ...daePaquetes,
            interdisciplinario: { ...EMPTY_SLOT },
            gei: [{ ...EMPTY_SLOT }],
          },
        },
      }
    })
  }, [formData.equiposIds])

  // ─── Per-equipo derived data ───────────────────────────────────────────────

  const toMinutes = (value: string) => {
    if (!value) return null
    const [h, m] = value.split(":").map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return null
    return h * 60 + m
  }

  const isValidDuration = (inicio: string, fin: string, horas: number) => {
    if (!Number.isFinite(horas) || horas <= 0) return false
    const ini = toMinutes(inicio)
    const fi = toMinutes(fin)
    if (ini === null || fi === null) return false
    if (fi <= ini) return false
    return fi - ini === horas * 60
  }

  const getHoursFromSlot = (inicio: string, fin: string) => {
    const ini = toMinutes(inicio)
    const fi = toMinutes(fin)
    if (ini === null || fi === null) return null
    if (fi <= ini) return null
    const diff = fi - ini
    if (diff % 60 !== 0) return null
    return diff / 60
  }

  const totalHorasDeclaradas = formData.cargos.reduce((acc, cargo) => acc + Number(cargo.cantidad || 0), 0)

  /**
   * Compute the weekly limit (in minutes) for a given equipoId,
   * considering only the cargos assigned to that equipo.
   */
  const getWeeklyLimitMinutesForEquipo = (equipoId: number): number => {
    const horasCatedraEnabled = formData.horasCatedra.enabled
    const selectedIndexes = horasCatedraEnabled ? formData.horasCatedra.cargoIndexes : []

    const rawMinutes = formData.cargos
      .filter((c) => c.equipoId === String(equipoId))
      .reduce((acc, cargo) => {
        const globalIdx = formData.cargos.indexOf(cargo)
        const cantidad = Number(cargo.cantidad || 0)
        if (!Number.isFinite(cantidad) || cantidad <= 0) return acc
        const minsPorHora =
          horasCatedraEnabled && selectedIndexes.includes(globalIdx) ? HORA_CATEDRA_MIN : HORA_RELOJ_MIN
        return acc + cantidad * minsPorHora
      }, 0)
    // Round to nearest 0.5 h (30 min) so e.g. 8.33 h -> 8.5 h
    return Math.round(rawMinutes / 30) * 30
  }

  const getGeiHorasForEquipo = (equipoId: number): number => {
    if (equipoId === EQUIPO_DAE_ID) return 0
    // GEI is based on total horas for THIS equipo's cargos
    const horasEquipo = formData.cargos
      .filter((c) => c.equipoId === String(equipoId))
      .reduce((acc, c) => acc + Number(c.cantidad || 0), 0)
    return horasEquipo <= 14 ? 1 : horasEquipo <= 24 ? 2 : horasEquipo <= 34 ? 3 : 4
  }

  const getInterdisciplinarioHorasForEquipo = (equipoId: number): number =>
    equipoId === EQUIPO_DAE_ID ? 0 : 3

  /** Map of equipoId -> WeeklyWorkload */
  const weeklyWorkloadMap = useMemo(() => {
    const result: Record<number, ReturnType<typeof computeWeeklyWorkload>> = {}
    formData.equiposIds.forEach((id) => {
      const paquetes = formData.paquetes[String(id)]
      if (!paquetes) return
      const limitMinutes = getWeeklyLimitMinutesForEquipo(id)
      const geiHoras = getGeiHorasForEquipo(id)
      const interdisciplinarioHoras = getInterdisciplinarioHorasForEquipo(id)
      result[id] = computeWeeklyWorkload({
        paquetes,
        geiHoras,
        interdisciplinarioHoras,
        limit: limitMinutes / 60,
        limitMinutes,
      })
    })
    return result
  }, [formData])

  // ─── Validation ───────────────────────────────────────────────────────────

  const isStep1Valid = infoLeida

  const isStep2Valid =
    formData.nombre.trim() !== "" &&
    formData.apellido.trim() !== "" &&
    formData.profesion.trim() !== "" &&
    formData.cuil.trim() !== "" &&
    formData.dni.trim() !== "" &&
    formData.correo.trim() !== "" &&
    formData.telefono.trim() !== "" &&
    formData.fechaNacimiento.trim() !== "" &&
    formData.direccion.calle.trim() !== "" &&
    formData.direccion.numero.trim() !== "" &&
    formData.direccion.departamentoId.trim() !== ""

  const isHorasCatedraValid = (() => {
    if (!formData.horasCatedra.enabled) return true
    const indexes = formData.horasCatedra.cargoIndexes
    if (!Array.isArray(indexes) || indexes.length === 0) return false
    return indexes.every((idx) => {
      if (idx < 0 || idx >= formData.cargos.length) return false
      const cargo = formData.cargos[idx]
      const cantidad = Number(cargo?.cantidad || 0)
      return Boolean(cargo?.tipo) && Number.isFinite(cantidad) && cantidad > 0
    })
  })()

  const isStep3Valid = (() => {
    if (!isHorasCatedraValid) return false
    return formData.equiposIds.every((id) => {
      const key = String(id)
      const paquetes = formData.paquetes[key]
      if (!paquetes) return false
      const isDAE = id === EQUIPO_DAE_ID
      const geiHoras = getGeiHorasForEquipo(id)

      // Interdisciplinario
      const isInterValid = isDAE
        ? true
        : isValidDuration(paquetes.interdisciplinario.horaInicio, paquetes.interdisciplinario.horaFin, 3)

      // GEI
      const isGeiValid = isDAE
        ? true
        : (() => {
            const geiSlots = Array.isArray(paquetes.gei) ? paquetes.gei : []
            if (geiHoras <= 0) return true
            if (geiSlots.length === 0) return false
            let sumHoras = 0
            for (const slot of geiSlots) {
              if (!slot.diaSemana) return false
              const horas = getHoursFromSlot(slot.horaInicio, slot.horaFin)
              if (!horas || horas <= 0) return false
              sumHoras += horas
            }
            return sumHoras === geiHoras
          })()

      // Escuelas
      const areEscuelasValidas = paquetes.escuelas.every((paquete) => {
        const horas = Number(paquete.horas || 0)
        if (!paquete.escuelaId) return false
        if (!Number.isFinite(horas) || horas <= 0) return false
        if (paquete.rotativo?.esRotativo) {
          if (paquete.rotativo.tipo === "porSemana") {
            if (!Array.isArray(paquete.rotativo.semanas) || paquete.rotativo.semanas.length === 0)
              return false
          } else if (paquete.rotativo.tipo === "porCalendario") {
            if (!Array.isArray(paquete.rotativo.fechas) || paquete.rotativo.fechas.length === 0)
              return false
          } else {
            return false
          }
        }
        return isValidDuration(paquete.horaInicio, paquete.horaFin, horas)
      })

      // Weekly workload
      const workload = weeklyWorkloadMap[id]
      const isSumaValida = workload?.isComplete ?? false

      return isInterValid && isGeiValid && areEscuelasValidas && isSumaValida
    })
  })()

  const isCurrentStepValid =
    currentStep === 1
      ? isStep1Valid
      : currentStep === 2
        ? isStep2Valid
        : currentStep === 3
          ? isStep3Valid
          : true

  const handleLoginInputChange = (field: "correo" | "contrasena", value: string) => {
    setLoginData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setIsLoggingIn(true)
    setAuthErrorMsg(null)

    try {
      const res = await fetch(`${apiBase}/profesionals/formulario-horarios/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: loginData.correo.trim(),
          contrasena: loginData.contrasena,
        }),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        console.error("Error en login de formulario horarios", res.status, text)

        if (res.status === 401) {
          throw new Error("Correo o contraseña incorrectos.")
        }

        if (res.status === 429) {
          throw new Error("Superaste el límite de intentos. Probá nuevamente en unos minutos.")
        }

        throw new Error("No se pudo iniciar sesión en este momento.")
      }

      const payload = (await res.json()) as FormularioHorariosLoginResponse
      const nextSession: FormularioHorariosSession = {
        accessToken: payload.access_token,
        tokenType: payload.token_type,
        expiresAt: Date.now() + payload.expires_in * 1000,
        profesional: payload.profesional,
      }

      saveProfessionalSession(nextSession)
    } catch (error) {
      setAuthErrorMsg(
        error instanceof Error ? error.message : "No se pudo iniciar sesión en este momento.",
      )
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = () => {
    clearProfessionalSession(undefined, authSession?.profesional.correo)
  }

  const getResponseMessage = async (res: Response) => {
    const text = await res.text().catch(() => "")
    if (!text.trim()) return null

    try {
      const payload = JSON.parse(text) as { message?: unknown }
      if (typeof payload.message === "string" && payload.message.trim()) {
        return payload.message
      }
    } catch {}

    return text
  }

  const handleFormSubmit = async () => {
    if (!authSession) {
      setAuthErrorMsg("Necesitás iniciar sesión para enviar el formulario.")
      return
    }

    if (authSession.expiresAt <= Date.now()) {
      clearProfessionalSession(
        "Tu sesión del formulario venció. Volvé a ingresar para continuar.",
        authSession.profesional.correo,
      )
      return
    }

    setIsSubmittingForm(true)
    setSubmitFeedback(null)

    try {
      const payload = buildFormularioEnvioPayload(formData)
      const res = await fetch(`${apiBase}/profesionals/formulario-horarios/envio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const backendMessage = await getResponseMessage(res)
        console.error("Error al enviar formulario horarios", res.status, backendMessage)

        if (res.status === 401) {
          clearProfessionalSession(
            "Tu sesión del formulario venció o no es válida. Volvé a ingresar para enviar el formulario.",
            authSession.profesional.correo,
          )
          return
        }

        if (res.status === 400) {
          throw new Error(
            backendMessage ?? "No se pudo enviar el formulario. Revisá los datos cargados.",
          )
        }

        throw new Error(backendMessage ?? "No se pudo enviar el formulario en este momento.")
      }

      const response = (await res.json()) as FormularioHorariosEnvioResponse
      const fechaEnvio = new Date(response.fechaEnvio)
      const fechaEnvioLabel = Number.isNaN(fechaEnvio.getTime())
        ? null
        : fechaEnvio.toLocaleString("es-AR", {
            dateStyle: "short",
            timeStyle: "short",
          })

      setSubmitFeedback({
        type: "success",
        message: `${response.message} Envío N° ${response.envioNumero}. Se guardaron ${response.paquetesGuardados} paquetes${fechaEnvioLabel ? ` el ${fechaEnvioLabel}` : ""}.`,
      })
      resetFormularioState(authSession.profesional)
    } catch (error) {
      setSubmitFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "No se pudo enviar el formulario en este momento.",
      })
    } finally {
      setIsSubmittingForm(false)
    }
  }

  // ─── Data fetching ────────────────────────────────────────────────────────

  const normalizeList = (payload: any) => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data?.data)) return payload.data.data
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.items)) return payload.items
    return []
  }

  useEffect(() => {
    if (!authSession) return

    const fetchDepartamentos = async () => {
      try {
        const res = await fetch(`${apiBase}/departamentos`)
        if (!res.ok) return
        const data = await res.json()
        setDepartamentos(normalizeList(data))
      } catch {}
    }
    fetchDepartamentos()
  }, [apiBase, authSession])

  useEffect(() => {
    const fetchEquipos = async () => {
      setIsEquiposLoading(true)
      setEquiposErrorMsg(null)

      try {
        const res = await fetch(`${apiBase}/equipos/public`)
        if (!res.ok) {
          throw new Error(`Error al traer equipos públicos (status ${res.status})`)
        }
        const data = await res.json()
        setEquipos(normalizeList(data))
      } catch (error) {
        console.error("Error al traer equipos públicos", error)
        setEquipos([])
        setEquiposErrorMsg("No se pudieron cargar las secciones disponibles.")
      } finally {
        setIsEquiposLoading(false)
      }
    }
    fetchEquipos()
  }, [apiBase])

  useEffect(() => {
    if (!authSession) {
      setEscuelasDisponibles(new Map())
      return
    }

    const fetchEscuelas = async () => {
      if (!formData.equiposIds.length) {
        setEscuelasDisponibles(new Map())
        return
      }
      try {
        const results = await Promise.all(
          formData.equiposIds.map(async (id) => {
            const res = await fetch(`${apiBase}/escuelas/public/por-equipo/${id}`)
            if (!res.ok) return { id, escuelas: [] as Escuela[] }
            const data = await res.json()
            return { id, escuelas: normalizeList(data) as Escuela[] }
          }),
        )
        const map = new Map<number, Escuela[]>()
        results.forEach(({ id, escuelas }) => map.set(id, escuelas))
        setEscuelasDisponibles(map)
      } catch {}
    }
    fetchEscuelas()
  }, [apiBase, authSession, formData.equiposIds])

  useEffect(() => {
    if (!authSession) {
      setEscuelasSinPaquetes(new Map())
      return
    }

    const fetchEscuelasSinPaquetes = async () => {
      if (!formData.equiposIds.length) {
        setEscuelasSinPaquetes(new Map())
        return
      }
      try {
        const results = await Promise.all(
          formData.equiposIds.map(async (id) => {
            const res = await fetch(`${apiBase}/escuelas/public/sin-paquetes?equipoId=${id}`)
            if (!res.ok) return { id, escuelas: [] as Escuela[] }
            const data = await res.json()
            return { id, escuelas: normalizeList(data) as Escuela[] }
          }),
        )
        const map = new Map<number, Escuela[]>()
        results.forEach(({ id, escuelas }) => map.set(id, escuelas))
        setEscuelasSinPaquetes(map)
      } catch {}
    }
    fetchEscuelasSinPaquetes()
  }, [apiBase, authSession, formData.equiposIds])

  // ─── Render ───────────────────────────────────────────────────────────────

  const profesionalNombre = authSession
    ? `${authSession.profesional.nombre} ${authSession.profesional.apellido}`.trim()
    : ""
  const sesionExpiraEn = authSession
    ? new Date(authSession.expiresAt).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : ""

  if (!isAuthResolved) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-sm text-slate-600">Validando acceso al formulario...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold">Formulario de Carga Horaria</h1>
              <p className="text-sm text-slate-200 mt-2">
                {authSession
                  ? "Acceso habilitado. Ahora podés completar los 4 pasos del formulario."
                  : "Ingresá con tu correo y contraseña para acceder a los 4 pasos del formulario."}
              </p>
              {authSession && (
                <p className="text-xs text-slate-300 mt-2">
                  Sesión iniciada como {profesionalNombre}. Vence a las {sesionExpiraEn}.
                </p>
              )}
            </div>

            {authSession && (
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 bg-white/10 text-white hover:bg-white/20"
                onClick={handleLogout}
              >
                Cerrar sesión
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {submitFeedback && (
          <Alert
            variant={submitFeedback.type === "error" ? "destructive" : "default"}
            className={
              submitFeedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : undefined
            }
          >
            <AlertDescription>{submitFeedback.message}</AlertDescription>
          </Alert>
        )}

        {!authSession ? (
          <FormularioHorariosLogin
            loginData={loginData}
            errorMsg={authErrorMsg}
            isSubmitting={isLoggingIn}
            onChange={handleLoginInputChange}
            onSubmit={handleLoginSubmit}
          />
        ) : (
          <>
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <Stepper
                  steps={steps}
                  currentStep={currentStep}
                  onPrev={() => setCurrentStep((p) => Math.max(1, p - 1))}
                  onNext={() => setCurrentStep((p) => Math.min(4, p + 1))}
                  maxStep={4}
                  canGoNext={isCurrentStepValid}
                />
              </CardContent>
            </Card>

            {currentStep === 1 && <Step1Info infoLeida={infoLeida} setInfoLeida={setInfoLeida} />}

            {currentStep === 2 && (
              <Step2DatosPersonales
                formData={formData}
                setFormData={setFormData}
                departamentos={departamentos}
                equipos={equipos}
                isEquiposLoading={isEquiposLoading}
                equiposErrorMsg={equiposErrorMsg}
              />
            )}

            {currentStep === 3 && (
              <Step3CargaHoraria
                formData={formData}
                setFormData={setFormData}
                diasSemana={diasSemana}
                equipos={equipos}
                escuelasDisponibles={escuelasDisponibles}
                escuelasSinPaquetes={escuelasSinPaquetes}
                weeklyWorkloadMap={weeklyWorkloadMap}
                getGeiHorasForEquipo={getGeiHorasForEquipo}
                getInterdisciplinarioHorasForEquipo={getInterdisciplinarioHorasForEquipo}
              />
            )}

            {currentStep === 4 && (
              <Step4Resumen
                formData={formData}
                diasSemana={diasSemana}
                equipos={equipos}
                escuelasDisponibles={escuelasDisponibles}
                weeklyWorkloadMap={weeklyWorkloadMap}
                getGeiHorasForEquipo={getGeiHorasForEquipo}
                isSubmitting={isSubmittingForm}
                onSubmit={handleFormSubmit}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
