import { Equipo, Escuela } from "../equipos"
import { EquipoMuyShortResponseDto } from "./EquipoShort.dto"
import { EscuelaShortDTO } from "./EscuelaShort.dto"

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

export interface PaqueteHorasPerfil {
    id: number
    tipo: string
    cantidad: number
    escuela?: EscuelaShortDTO
    equipo: EquipoMuyShortResponseDto
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