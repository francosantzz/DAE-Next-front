import type { PaquetesEquipo } from "./types"
import { getFourWeekCycleFromDate } from "./rotativoCalendar"

export type WeekNumber = 1 | 2 | 3 | 4

export type WeeklyWorkload = {
  limit: number
  totalsByWeek: Record<WeekNumber, number>
  excessByWeek: Record<WeekNumber, number>
  missingByWeek: Record<WeekNumber, number>
  weeksExceeding: WeekNumber[]
  weeksMissing: WeekNumber[]
  isWithinLimit: boolean
  isComplete: boolean
}

const ALL_WEEKS: WeekNumber[] = [1, 2, 3, 4]

const isWeekNumber = (value: number): value is WeekNumber =>
  value === 1 || value === 2 || value === 3 || value === 4

const getWeekFromDate = (isoDate: string): WeekNumber | null => {
  const weekInCycle = getFourWeekCycleFromDate(isoDate)
  return weekInCycle && isWeekNumber(weekInCycle) ? weekInCycle : null
}

const uniqueWeeks = (weeks: number[]): WeekNumber[] => {
  const set = new Set<WeekNumber>()
  weeks.forEach((w) => {
    if (isWeekNumber(w)) set.add(w)
  })
  return Array.from(set).sort()
}

const getApplicableWeeksForEscuelaPaquete = (
  paquete: PaquetesEquipo["escuelas"][number],
): WeekNumber[] => {
  const rotativo = paquete.rotativo
  if (!rotativo?.esRotativo) return ALL_WEEKS

  if (rotativo.tipo === "porSemana") {
    const semanas = Array.isArray(rotativo.semanas) ? rotativo.semanas : []
    return uniqueWeeks(semanas)
  }

  if (rotativo.tipo === "porCalendario") {
    const fechas = Array.isArray(rotativo.fechas) ? rotativo.fechas : []
    const weeks: WeekNumber[] = []
    fechas.forEach((fecha) => {
      const week = getWeekFromDate(fecha)
      if (week) weeks.push(week)
    })
    return uniqueWeeks(weeks)
  }

  return []
}

/**
 * Computes weekly workload for a single equipo's paquetes.
 */
export const computeWeeklyWorkload = ({
  paquetes,
  geiHoras,
  interdisciplinarioHoras = 3,
  limit,
  limitMinutes,
}: {
  paquetes: PaquetesEquipo
  geiHoras: number
  interdisciplinarioHoras?: number
  limit: number
  limitMinutes?: number
}): WeeklyWorkload => {
  const safeLimitMinutes =
    Number.isFinite(limitMinutes) && (limitMinutes as number) > 0
      ? (limitMinutes as number)
      : Number.isFinite(limit) && limit > 0
        ? limit * 60
        : 0
  const safeLimit = safeLimitMinutes / 60

  const totalsByWeekMinutes: Record<WeekNumber, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }

  const fixedWeeklyMinutes =
    (Number.isFinite(interdisciplinarioHoras) ? interdisciplinarioHoras : 0) * 60 +
    (Number.isFinite(geiHoras) ? geiHoras : 0) * 60

  ALL_WEEKS.forEach((w) => {
    totalsByWeekMinutes[w] += fixedWeeklyMinutes
  })

  paquetes.escuelas.forEach((paquete) => {
    const horas = Number(paquete.horas || 0)
    if (!Number.isFinite(horas) || horas <= 0) return

    const minutes = horas * 60
    const weeks = getApplicableWeeksForEscuelaPaquete(paquete)
    weeks.forEach((w) => {
      totalsByWeekMinutes[w] += minutes
    })
  })

  const excessByWeekMinutes: Record<WeekNumber, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  const missingByWeekMinutes: Record<WeekNumber, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }

  ALL_WEEKS.forEach((w) => {
    const diff = totalsByWeekMinutes[w] - safeLimitMinutes
    if (diff > 0) excessByWeekMinutes[w] = diff
    if (diff < 0) missingByWeekMinutes[w] = Math.abs(diff)
  })

  const weeksExceeding = ALL_WEEKS.filter((w) => excessByWeekMinutes[w] > 0)
  const weeksMissing = ALL_WEEKS.filter((w) => missingByWeekMinutes[w] > 0)

  const minutesToHours = (minutes: number) =>
    Math.round(((Number.isFinite(minutes) ? minutes : 0) / 60) * 100) / 100

  const totalsByWeek: Record<WeekNumber, number> = {
    1: minutesToHours(totalsByWeekMinutes[1]),
    2: minutesToHours(totalsByWeekMinutes[2]),
    3: minutesToHours(totalsByWeekMinutes[3]),
    4: minutesToHours(totalsByWeekMinutes[4]),
  }
  const excessByWeek: Record<WeekNumber, number> = {
    1: minutesToHours(excessByWeekMinutes[1]),
    2: minutesToHours(excessByWeekMinutes[2]),
    3: minutesToHours(excessByWeekMinutes[3]),
    4: minutesToHours(excessByWeekMinutes[4]),
  }
  const missingByWeek: Record<WeekNumber, number> = {
    1: minutesToHours(missingByWeekMinutes[1]),
    2: minutesToHours(missingByWeekMinutes[2]),
    3: minutesToHours(missingByWeekMinutes[3]),
    4: minutesToHours(missingByWeekMinutes[4]),
  }

  return {
    limit: safeLimit,
    totalsByWeek,
    excessByWeek,
    missingByWeek,
    weeksExceeding,
    weeksMissing,
    isWithinLimit: weeksExceeding.length === 0,
    isComplete: weeksExceeding.length === 0 && weeksMissing.length === 0,
  }
}

export const getWeeklyWorkloadStatus = (
  workload: WeeklyWorkload,
): { tone: "ok" | "warn" | "error"; text: string } => {
  const limit = workload.limit

  const formatHours = (value: number) => {
    if (!Number.isFinite(value)) return "0"
    const rounded = Math.round(value * 100) / 100
    if (Math.abs(rounded - Math.round(rounded)) < 1e-9) return String(Math.round(rounded))
    return rounded.toFixed(2).replace(/\.00$/, "")
  }

  if (workload.weeksExceeding.length > 0) {
    const details = workload.weeksExceeding
      .map((w) => `Semana ${w} (+${formatHours(workload.excessByWeek[w])} hs)`)
      .join(", ")
    return {
      tone: "error",
      text: `Se superó la carga horaria semanal (${formatHours(limit)} hs) en: ${details}.`,
    }
  }

  if (workload.weeksMissing.length > 0) {
    const details = workload.weeksMissing
      .map((w) => `Semana ${w} (faltan ${formatHours(workload.missingByWeek[w])} hs)`)
      .join(", ")
    return {
      tone: "warn",
      text: `Faltan completar horas para llegar a ${formatHours(limit)} hs semanales: ${details}.`,
    }
  }

  return { tone: "ok", text: "Carga horaria completa" }
}
