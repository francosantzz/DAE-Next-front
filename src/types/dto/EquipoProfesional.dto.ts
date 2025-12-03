import { Departamento } from "../Departamento.interface";

export interface EquipoProfesionalDTO {
  id: number;
  nombre: string;
  profesionales: string[];
  departamento: Departamento
  createdAt?: string;
}