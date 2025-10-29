import { Direccion } from "../Direccion.interface"
import { Equipo } from "../equipos"

export interface EscuelaSinPaqueteDTO {
  id: number
  nombre: string
  Numero?: string
  observaciones?: string
  direccion: Direccion
  equipo: Equipo | null 
}
