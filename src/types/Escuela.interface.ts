// types/Escuela.interface.ts
import { Anexo } from "./Anexo.interface"
import { Direccion } from "./Direccion.interface"
import { EquipoDepartamentoDTO } from "./dto/EquipoDepartamento.dto"
import { PaqueteHoras } from "./PaqueteHoras.interface"

export interface Escuela {
  id: number
  nombre: string
  CUE?: number
  Numero?: string
  telefono?: string
  matricula?: number
  IVE?: string
  Ambito?: string
  direccion: Direccion
  equipo: EquipoDepartamentoDTO | null
  anexos: Anexo[]
  paquetesHoras: PaqueteHoras[]
  observaciones?: string
}
