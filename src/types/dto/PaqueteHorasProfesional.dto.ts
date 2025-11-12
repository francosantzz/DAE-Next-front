// types/dto/PaqueteHorasProfesional.dto.ts
import { EquipoDepartamentoDTO } from "./EquipoDepartamento.dto";
import { EscuelaShortDTO } from "./EscuelaShort.dto";

export type PaqueteTipo = "Escuela" | "Trabajo Interdisciplinario" | "Otro";

export interface PaqueteHorasProfesional {
  id: number;
  tipo: PaqueteTipo;
  cantidad: number;

  // Relaciones
  escuela?: EscuelaShortDTO;
  equipo?: EquipoDepartamentoDTO;

  // Horario (opcionales si tu backend no siempre los manda)
  /** 0=Domingo ... 6=Sábado */
  diaSemana?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** "HH:mm:ss" (o "HH:mm") */
  horaInicio?: string;
  /** "HH:mm:ss" (o "HH:mm") */
  horaFin?: string;

  // Rotativo
  rotativo?: boolean;
  /** semanas del mes (1..5) */
  semanas?: number[];
  /** si tu backend lo usa */
  cicloSemanas?: number;
}
