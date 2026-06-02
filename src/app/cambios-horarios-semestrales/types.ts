export type EstadoCambioSemestral =
  | "sin-enviar"
  | "pendiente"
  | "confirmado"
  | "rechazado"
  | "enviado"

export type ProfesionalCambioSemestral = {
  id: number
  profesionalId?: number
  nombre: string
  apellido: string
  dni: string
  correo: string
  cargoHoras?: string
  estado: EstadoCambioSemestral
  ultimaActualizacion: string
  fechaEnvio?: string
  observacion?: string
}

export type EquipoCambioSemestral = {
  id: number
  nombre: string
  semestre: string
  profesionales: ProfesionalCambioSemestral[]
}
