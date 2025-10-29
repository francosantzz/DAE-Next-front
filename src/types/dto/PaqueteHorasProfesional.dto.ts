import { Departamento } from "../Departamento.interface";

export interface Equipo {
    id: number;
    nombre: string;
    departamento: Departamento;
}
  
export interface Escuela {
    id: number;
    nombre: string;
}


export interface PaqueteHorasProfesional {
    id: number;
    tipo: string;
    cantidad: number;
    escuela?: Escuela;
    equipo?: Equipo;
  }