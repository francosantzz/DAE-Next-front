import { Direccion } from "../Direccion.interface"
import { Anexo } from "../Anexo.interface"
import { EquipoDepartamentoDTO } from "../dto/EquipoDepartamento.dto"

/**
 * Profesional con más info (licencias, fechas)
 */
export interface ProfesionalDetallado {
  id: number
  nombre: string
  apellido: string
  licenciaActiva: boolean
  tipoLicencia?: string
  fechaFinLicencia?: string
}

/**
 * Paquete de horas extendido (con día/horarios y rotativo)
 */
export interface PaqueteHorasDetallado {
  id: number
  cantidad: number
  tipo?: string
  profesional: ProfesionalDetallado
  escuela?: {
    id: number
    nombre: string
    Numero?: string
  }
  equipo?: {
    id: number
    nombre: string
  }
  dias?: {
    diaSemana?: number
    horaInicio?: string
    horaFin?: string
    rotativo?: boolean
    semanas?: number[]
  }
}

/**
 * Interfaz extendida usada en el diálogo de detalles
 */
export interface EscuelaDetallada {
  id: number
  nombre: string
  CUE?: number
  Numero?: string
  telefono?: string
  matricula?: number
  IVE?: string
  Ambito?: string
  direccion: Direccion
  equipo?: EquipoDepartamentoDTO | null
  anexos: Anexo[]
  paquetesHoras: PaqueteHorasDetallado[]
  observaciones?: string
}
