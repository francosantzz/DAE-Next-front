export interface PaqueteHorasEscuela {
    id: number
    cantidad: string
    profesional: {
      id: number
      nombre: string
      apellido: string
      // AGREGAR ESTOS CAMPOS
      licenciaActiva: boolean
      tipoLicencia?: string
      fechaFinLicencia?: string
    }
  }