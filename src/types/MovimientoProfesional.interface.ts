// app/.../altas-bajas/types.ts

export type MovimientoEstado = "pendiente" | "confirmado" | "cargado" | "rechazado"
export type TipoMovimiento = "alta" | "baja"

/** Item de movimiento según backend */
export interface MovimientoItem {
  id: number
  tipo: TipoMovimiento
  fecha: string
  dni: string
  nombre: string
  apellido: string
  profesion: string | null
  matricula: string | null
  cuil: string | null
  cantidadHoras: string | null
  tiposOrigen: string | null
  tipoHora: string | null
  motivo: string | null
  estado: MovimientoEstado
  seccion: string | null
  registrado?: boolean
  grupoDistribucion?: string | null
}

export type MovimientosResponse = {
  items: MovimientoItem[]
  page: number
  limit: number
  total: number
  totalPages: number
}

// Alias para compatibilidad con imports existentes
export type MovimientoProfesional = MovimientoItem
export type MovimientoProfesionalApi = MovimientoItem
