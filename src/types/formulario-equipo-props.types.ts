import { Departamento } from "./Departamento.interface"
import { Equipo } from "./equipos"

export type EquipoFormProps = {
    accessToken: string
    departamentos: Departamento[]
    equipo?: Equipo | null
    onSaved: () => void
    onCancel: () => void
}
  
export type EquipoFormData = {
    id: number
    nombre: string
    departamentoId: number
    profesionalesIds: number[]
    escuelasIds: number[]
}