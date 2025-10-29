export interface PaqueteHoras {
    id: number
    tipo: string
    cantidad: number
    // equipo: Equipo
    // escuela?: Escuela
    diaSemana?: number
    horaInicio?: string
    horaFin?: string
    rotativo?: boolean
    semanas?: number[] | null
    dias?: {
      diaSemana: number
      horaInicio: string
      horaFin: string
      rotativo: boolean
      semanas?: number[] | null
      cicloSemanas?: number
    }
  }