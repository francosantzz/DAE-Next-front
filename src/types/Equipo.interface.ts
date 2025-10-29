import { EscuelaEquipoDTO } from "./dto/EscuelaEquipo.dto";
import { ProfesionalEquipoDTO } from "./dto/ProfesionalEquipo.dto";

  export interface Equipo {
    id: number;
    nombre: string;
    profesionales?: ProfesionalEquipoDTO[];
    // departamento?: Departamento; Crear interface departamento
    escuelas?: EscuelaEquipoDTO[];
    // paquetesHoras?: PaqueteHoras[]; Crear interface PaqueteHoras
    totalHoras?: number;
  }
  