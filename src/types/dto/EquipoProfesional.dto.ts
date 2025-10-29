import { ProfesionalListado } from "./ProfesionalListado.dto";

export interface EquipoProfesionalDTO {
  id: number;
  nombre: string;
  profesionales: ProfesionalListado[];
}