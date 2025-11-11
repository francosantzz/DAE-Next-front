import { CargoHoras } from "./CargoHoras"
import { Direccion } from "./Direccion.interface"
import { EquipoProfesionalDTO } from "./dto/EquipoProfesional.dto"
import { PaqueteHorasProfesional } from "./dto/PaqueteHorasProfesional.dto"

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
  cargosHoras: CargoHoras[]
  equipos: EquipoProfesionalDTO[]
  paquetesHoras: PaqueteHorasProfesional[]
  direccion: Direccion
  // NUEVOS CAMPOS DE LICENCIA
  tipoLicencia?: string
  fechaInicioLicencia?: string
  fechaFinLicencia?: string
  licenciaActiva: boolean
  disponible?: boolean
}