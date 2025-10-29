import { Equipo, Escuela } from "../equipos"

// interface Escuela {
//   id: number
//   Numero: string
//   nombre: string
// }

// interface Equipo {
//   id: number
//   nombre: string
//   departamento: Departamento
// }

export interface PaqueteHoras {
    id: number
    tipo: string
    cantidad: number
    equipo: Equipo
    escuela?: Escuela
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