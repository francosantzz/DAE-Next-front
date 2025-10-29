export interface Profesional {
  id: number
  nombre: string
  apellido: string
  cuil: string
  profesion: string
  matricula: string
  telefono: string
  fechaNacimiento: string
  dni: string
  fechaVencimientoMatricula: string
  fechaVencimientoPsicofisico: string
  correoElectronico: string
  totalHoras: number
//   cargosHoras: CargoHoras[] crear interface cargoHoras
//   equipos: Equipo[] crear interface equipos
//   paquetesHoras: PaqueteHoras[]  crear interface paquetehoras
//   direccion: Direccion crear interface direccion
  // NUEVOS CAMPOS DE LICENCIA
  tipoLicencia?: string
  fechaInicioLicencia?: string
  fechaFinLicencia?: string
  licenciaActiva: boolean
  disponible?: boolean
}