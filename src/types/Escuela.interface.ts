import { Anexo } from "./Anexo.interface"

export interface Escuela {
  id: number
  nombre: string
  CUE?: number
  Numero?: string
  telefono?: string
  matricula?: number
  IVE?: string
  Ambito?: string
//   direccion: Direccion Crear interface direccion
//   equipo: Equipo Crear interface equipo
    anexos: Anexo[] 
//   paquetesHoras: PaqueteHoras[] Crear interface PaqueteHoras
  observaciones?: string
}