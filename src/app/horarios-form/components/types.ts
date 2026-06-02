export type Departamento = {
  id: number
  nombre: string
}

export type Equipo = {
  id: number
  nombre: string
}

export type Escuela = {
  id: number
  nombre: string
  Numero?: string
}

export type FormularioHorariosProfesional = {
  id: number
  dni: string
  nombre: string
  apellido: string
  correo: string
}

export type FormularioHorariosDatosPaso2 = {
  nombre: string
  apellido: string
  profesion: string
  cuil: string
  dni: string
  correo: string
  telefono: string
  fechaNacimiento: string
  direccion: {
    calle: string
    numero: string
    departamentoId: string
  }
}

export type FormularioHorariosCargo = {
  tipo: string
  cantidad: number
  equipoId: number
}

export type FormularioHorariosLoginResponse = {
  access_token: string
  token_type: string
  expires_in: number
  profesional: FormularioHorariosProfesional
  tipoFormulario: string
  intentosRealizados: number
  precargarPaso2: boolean
  datosPaso2: FormularioHorariosDatosPaso2 | null
  cargos: FormularioHorariosCargo[]
  equiposIds: number[]
}

export type FormularioHorariosSession = {
  accessToken: string
  tokenType: string
  expiresAt: number
  profesional: FormularioHorariosProfesional
  tipoFormulario?: string
  intentosRealizados?: number
  precargarPaso2?: boolean
  datosPaso2?: FormularioHorariosDatosPaso2 | null
  cargos?: FormularioHorariosCargo[]
  equiposIds?: number[]
}

export type FormularioHorariosTipoRotacion = "semanas" | "fechas"

export type FormularioHorariosEnvioPaquete = {
  tipo: string
  equipoId: number
  escuelaId: number | null
  diaSemana: number
  horaInicio: string
  horaFin: string
  rotativo: boolean
  tipoRotacion?: FormularioHorariosTipoRotacion
  semanas?: number[]
  fechas?: string[]
  cicloSemanas?: number
}

export type FormularioHorariosEnvioPayload = {
  paquetesHoras: FormularioHorariosEnvioPaquete[]
  cargos: FormularioHorariosCargo[]
  equiposIds: number[]
}

export type FormularioHorariosEnvioResponse = {
  envioId: number
  envioNumero: number
  fechaEnvio: string
  paquetesGuardados: number
  message: string
}

export type FormularioHorariosEnvioInicialResponse = {
  id: number
  correo: string
  ultimoEnvio: string | null
  emailEnviado: boolean
  message: string
}

export type PaquetesEquipo = {
  interdisciplinario: { diaSemana: string; horaInicio: string; horaFin: string }
  gei: { diaSemana: string; horaInicio: string; horaFin: string }[]
  escuelas: {
    escuelaId: string
    horas: string
    diaSemana: string
    horaInicio: string
    horaFin: string
    rotativo?: {
      esRotativo: boolean
      tipo?: "porSemana" | "porCalendario"
      semanas?: number[]
      fechas?: string[]
    }
  }[]
}

export type HorariosFormData = {
  nombre: string
  apellido: string
  profesion: string
  cuil: string
  dni: string
  correo: string
  telefono: string
  fechaNacimiento: string
  cargos: { tipo: string; cantidad: string; equipoId: string }[]
    horasCatedra: {
    enabled: boolean
    cargoIndexes: number[]
  }
  /**
   * Paquetes indexados por equipoId (como string).
   * Cada equipo tiene sus propios interdisciplinario, GEI y escuelas.
   */
  paquetes: Record<string, PaquetesEquipo>
  equiposIds: number[]
  direccion: {
    calle: string
    numero: string
    departamentoId: string
  }
}
