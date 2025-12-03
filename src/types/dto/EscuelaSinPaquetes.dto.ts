import { Direccion } from "../Direccion.interface"
import { Equipo } from "../equipos"
import { EquipoEscuelaSinPaqueteDTO } from "./EquipoEscuelaSinPaquete.dto"

export interface EscuelaSinPaqueteDTO {
  id: number
  nombre: string
  Numero?: string
  observaciones?: string
  direccion: Direccion
  equipo: EquipoEscuelaSinPaqueteDTO | null 
}
