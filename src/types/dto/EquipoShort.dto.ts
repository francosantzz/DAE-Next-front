import { Departamento } from "../Departamento.interface";

export interface EquipoMuyShortResponseDto {
    id: number;
    nombre: string;
    totalHoras: number;
    departamento?: Departamento
    observaciones?: string;
  }