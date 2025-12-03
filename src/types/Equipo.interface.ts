import { Departamento } from "./Departamento.interface";
import { EscuelaEquipoDTO } from "./dto/EscuelaEquipo.dto";
import { ProfesionalEquipoDTO } from "./dto/ProfesionalEquipo.dto";
import { PaqueteHoras } from "./PaqueteHoras.interface";

  export interface Equipo {
    id: number;
    nombre: string;
    profesionales?: ProfesionalEquipoDTO[];
    departamento?: Departamento;
    escuelas?: EscuelaEquipoDTO[];
    paquetesHoras?: PaqueteHoras[];
    totalHoras?: number;
  }
  