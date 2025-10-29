import { Departamento } from "../Departamento.interface"

export interface EquipoEscuelaSinPaqueteDTO {
  id: number
  nombre: string
  departamento: Departamento
  observaciones?: string
}