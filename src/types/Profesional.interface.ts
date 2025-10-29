import { CargoHoras } from "./CargoHoras.interface"
import { Direccion } from "./Direccion.interface"
import { EquipoDepartamentoDTO } from "./dto/EquipoDepartamento.dto"
import { EquipoProfesionalDTO } from "./dto/EquipoProfesional.dto"
import { PaqueteHorasPerfil } from "./dto/PaqueteHorasPerfil.dto"
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
  equipos: EquipoDepartamentoDTO[]
  paquetesHoras: PaqueteHorasPerfil[]
  direccion: Direccion
  // NUEVOS CAMPOS DE LICENCIA
  tipoLicencia?: string
  fechaInicioLicencia?: string
  fechaFinLicencia?: string
  licenciaActiva: boolean
  disponible?: boolean
}