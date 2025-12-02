// app/.../altas-bajas/types.ts

export type TipoMovimiento = "alta" | "baja"

/** Lo que viene del backend */
export interface MovimientoProfesionalApi {
  id: number
  tipo: TipoMovimiento
  fecha: string
  dni: string
  nombre: string
  apellido: string
  profesion?: string | null
  matricula?: string | null
  cuil?: string | null
  motivo?: string | null
  tipoHora?: string | null
  cantidadHoras?: string | null
  grupoDistribucion?: string | null
  tiposOrigen?: string | null
  registrado?: boolean
}

/** Estado en el front (agregamos flag de registrado) */
export interface MovimientoProfesional extends MovimientoProfesionalApi {
  registrado: boolean
}
