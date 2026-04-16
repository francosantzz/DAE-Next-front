type HorarioSlot = {
  dia: string
  horaInicio: string
  horaFin: string
  tipo: "interdisciplinario" | "gei" | "escuela"
  escuelaId?: string
  index?: number
}

/**
 * Convierte una hora en formato HH:MM a minutos
 */
function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

/**
 * Verifica si dos horarios se solapan
 */
function haysolapamiento(
  slot1Inicio: string,
  slot1Fin: string,
  slot2Inicio: string,
  slot2Fin: string
): boolean {
  if (!slot1Inicio || !slot1Fin || !slot2Inicio || !slot2Fin) return false

  const inicio1 = horaAMinutos(slot1Inicio)
  const fin1 = horaAMinutos(slot1Fin)
  const inicio2 = horaAMinutos(slot2Inicio)
  const fin2 = horaAMinutos(slot2Fin)

  // Se solapan si: inicio1 < fin2 AND inicio2 < fin1
  return inicio1 < fin2 && inicio2 < fin1
}

/**
 * Obtiene los días en que se repite un horario rotativo
 */
function obtenerDiasRotativo(
  diaSemana: string,
  rotativo?: { esRotativo: boolean; tipo?: string; semanas?: number[]; fechas?: string[] }
): string[] {
  if (!rotativo?.esRotativo) {
    return [diaSemana]
  }

  if (rotativo.tipo === "porSemana") {
    // Para "por semana", simplemente repetimos el día de semana en cada semana
    return [diaSemana]
  }

  if (rotativo.tipo === "porCalendario" && rotativo.fechas) {
    // Retornamos las fechas específicas
    return rotativo.fechas
  }

  return [diaSemana]
}

/**
 * Verifica si hay solapamiento de semanas entre dos horarios rotativos
 */
function haysolapamientoSemanas(
  semanas1?: number[],
  semanas2?: number[]
): boolean {
  if (!semanas1 || !semanas2) return true // Si no hay semanas especificadas, asumimos que se solapan
  if (semanas1.length === 0 || semanas2.length === 0) return true

  // Buscar si hay alguna semana en común
  return semanas1.some((s) => semanas2.includes(s))
}

/**
 * Obtiene el día de la semana de una fecha en formato YYYY-MM-DD
 */
function obtenerDiaSemanaDeFormato(fecha: string): number {
  const dateObj = new Date(fecha + "T00:00:00")
  return dateObj.getDay()
}

/**
 * Compara dos días (pueden ser formato "1" para lunes o "2024-03-15" para fechas específicas)
 */
function sonDelMismoDia(dia1: string, dia2: string): boolean {
  // Si ambos son números (día de semana)
  if (/^\d$/.test(dia1) && /^\d$/.test(dia2)) {
    return dia1 === dia2
  }

  // Si ambos son fechas (formato YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dia1) && /^\d{4}-\d{2}-\d{2}$/.test(dia2)) {
    return dia1 === dia2
  }

  // Si uno es número (día de semana) y otro es fecha (YYYY-MM-DD)
  let diaSemanaNumero: number | null = null
  let fecha: string | null = null

  if (/^\d$/.test(dia1) && /^\d{4}-\d{2}-\d{2}$/.test(dia2)) {
    diaSemanaNumero = parseInt(dia1, 10)
    fecha = dia2
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(dia1) && /^\d$/.test(dia2)) {
    diaSemanaNumero = parseInt(dia2, 10)
    fecha = dia1
  }

  if (diaSemanaNumero !== null && fecha !== null) {
    const diaSemanaFecha = obtenerDiaSemanaDeFormato(fecha)
    return diaSemanaNumero === diaSemanaFecha
  }

  // Si no coinciden con ningún formato, no son del mismo día
  return false
}

export type ConflictoHorario = {
  tipo: "aviso" | "error"
  tipo1: string
  tipo2: string
  nombreEscuela1?: string
  nombreEscuela2?: string
  dia: string
  index1?: number
  index2?: number
}

/**
 * Valida solapamientos de horarios
 * @param interdisciplinario Horario de trabajo interdisciplinario
 * @param gei Horario de GEI
 * @param escuelas Array de horarios de escuelas
 * @param escuelasData Map de ID escuela -> nombre de escuela (para obtener nombres)
 * @returns Array de conflictos encontrados
 */
export function validarSolapamientos(
  interdisciplinario: { diaSemana: string; horaInicio: string; horaFin: string },
  gei: Array<{ diaSemana: string; horaInicio: string; horaFin: string }>,
  escuelas: Array<{
    escuelaId: string
    horas: string
    diaSemana: string
    horaInicio: string
    horaFin: string
    rotativo?: {
      esRotativo: boolean
      tipo?: "porSemana" | "porCalendario"
      semanas?: number[]
      fechas?: string[]
    }
  }>,
  escuelasData?: Map<string, string>
): ConflictoHorario[] {
  const conflictos: ConflictoHorario[] = []

  // Helper para obtener el nombre de la escuela
  const obtenerNombreEscuela = (escuelaId: string, index: number): string => {
    if (escuelasData?.has(escuelaId)) {
      return escuelasData.get(escuelaId)!
    }
    return `Escuela #${index + 1}`
  }

  // Validar Interdisciplinario vs GEI (múltiples días)
  gei.forEach((geiSlot) => {
    if (
      interdisciplinario.diaSemana &&
      geiSlot.diaSemana &&
      interdisciplinario.diaSemana === geiSlot.diaSemana &&
      haysolapamiento(
        interdisciplinario.horaInicio,
        interdisciplinario.horaFin,
        geiSlot.horaInicio,
        geiSlot.horaFin
      )
    ) {
      conflictos.push({
        tipo: "error",
        tipo1: "Trabajo Interdisciplinario",
        tipo2: "Carga en GEI",
        dia: interdisciplinario.diaSemana,
      })
    }
  })

  // Validar GEI vs GEI
  gei.forEach((slot1, i) => {
    gei.forEach((slot2, j) => {
      if (i >= j) return
      if (!slot1.diaSemana || !slot2.diaSemana) return
      if (slot1.diaSemana !== slot2.diaSemana) return
      if (
        haysolapamiento(
          slot1.horaInicio,
          slot1.horaFin,
          slot2.horaInicio,
          slot2.horaFin
        )
      ) {
        conflictos.push({
          tipo: "error",
          tipo1: "Carga en GEI",
          tipo2: "Carga en GEI",
          dia: slot1.diaSemana,
        })
      }
    })
  })

  // Validar Interdisciplinario vs Escuelas
  escuelas.forEach((escuela, index) => {
    if (!escuela.diaSemana || !escuela.horaInicio || !escuela.horaFin) return

    const diasEscuela = obtenerDiasRotativo(escuela.diaSemana, escuela.rotativo)
    const diasInterdisciplinario = [interdisciplinario.diaSemana]
    let tieneConflicto = false

    diasEscuela.forEach((diaEscuela) => {
      diasInterdisciplinario.forEach((diaInter) => {
        if (!tieneConflicto && sonDelMismoDia(diaEscuela, diaInter)) {
          if (
            haysolapamiento(
              interdisciplinario.horaInicio,
              interdisciplinario.horaFin,
              escuela.horaInicio,
              escuela.horaFin
            )
          ) {
            tieneConflicto = true
          }
        }
      })
    })

    if (tieneConflicto) {
      const nombreEscuela = obtenerNombreEscuela(escuela.escuelaId, index)
      conflictos.push({
        tipo: "aviso",
        tipo1: "Trabajo Interdisciplinario",
        tipo2: nombreEscuela,
        nombreEscuela2: nombreEscuela,
        dia: interdisciplinario.diaSemana,
        index2: index,
      })
    }
  })

  // Validar GEI vs Escuelas (múltiples días)
  gei.forEach((geiSlot) => {
    escuelas.forEach((escuela, index) => {
      if (!escuela.diaSemana || !escuela.horaInicio || !escuela.horaFin) return
      if (!geiSlot.diaSemana || !geiSlot.horaInicio || !geiSlot.horaFin) return

      const diasEscuela = obtenerDiasRotativo(escuela.diaSemana, escuela.rotativo)
      const diasGei = [geiSlot.diaSemana]
      let tieneConflicto = false

      diasEscuela.forEach((diaEscuela) => {
        diasGei.forEach((diaG) => {
          if (!tieneConflicto && sonDelMismoDia(diaEscuela, diaG)) {
            if (
              haysolapamiento(
                geiSlot.horaInicio,
                geiSlot.horaFin,
                escuela.horaInicio,
                escuela.horaFin
              )
            ) {
              tieneConflicto = true
            }
          }
        })
      })

      if (tieneConflicto) {
        const nombreEscuela = obtenerNombreEscuela(escuela.escuelaId, index)
        conflictos.push({
          tipo: "aviso",
          tipo1: "Carga en GEI",
          tipo2: nombreEscuela,
          nombreEscuela2: nombreEscuela,
          dia: geiSlot.diaSemana,
          index2: index,
        })
      }
    })
  })

  // Validar Escuelas entre sí
  escuelas.forEach((escuela1, index1) => {
    if (!escuela1.diaSemana || !escuela1.horaInicio || !escuela1.horaFin) return

    escuelas.forEach((escuela2, index2) => {
      if (index1 >= index2) return // Evitar comparaciones duplicadas
      if (!escuela2.diaSemana || !escuela2.horaInicio || !escuela2.horaFin) return

      const dias1 = obtenerDiasRotativo(escuela1.diaSemana, escuela1.rotativo)
      const dias2 = obtenerDiasRotativo(escuela2.diaSemana, escuela2.rotativo)
      let tieneConflicto = false

      // Si ambas son rotativos por semana, validar que las semanas se solapan
      const esRotativoSemana1 = escuela1.rotativo?.esRotativo && escuela1.rotativo?.tipo === "porSemana"
      const esRotativoSemana2 = escuela2.rotativo?.esRotativo && escuela2.rotativo?.tipo === "porSemana"
      
      // Si ambas son por semana pero las semanas no se solapan, no hay conflicto
      if (esRotativoSemana1 && esRotativoSemana2) {
        if (!haysolapamientoSemanas(escuela1.rotativo?.semanas, escuela2.rotativo?.semanas)) {
          // Las semanas no se solapan, no hay conflicto posible
          return
        }
      }

      dias1.forEach((dia1) => {
        dias2.forEach((dia2) => {
          if (!tieneConflicto && sonDelMismoDia(dia1, dia2)) {
            if (
              haysolapamiento(
                escuela1.horaInicio,
                escuela1.horaFin,
                escuela2.horaInicio,
                escuela2.horaFin
              )
            ) {
              tieneConflicto = true
            }
          }
        })
      })

      if (tieneConflicto) {
        const nombre1 = obtenerNombreEscuela(escuela1.escuelaId, index1)
        const nombre2 = obtenerNombreEscuela(escuela2.escuelaId, index2)
        conflictos.push({
          tipo: "aviso",
          tipo1: nombre1,
          tipo2: nombre2,
          nombreEscuela1: nombre1,
          nombreEscuela2: nombre2,
          dia: escuela1.diaSemana, // Usamos el día de semana de la escuela1
          index1,
          index2,
        })
      }
    })
  })

  return conflictos
}

/**
 * Obtiene los conflictos de una escuela específica
 */
export function obtenerConflictosDelPaquete(conflictos: ConflictoHorario[], index: number): ConflictoHorario[] {
  return conflictos.filter(
    (c) => c.index1 === index || c.index2 === index || (c.index1 === undefined && c.index2 === index) || (c.index1 === index && c.index2 === undefined)
  )
}
