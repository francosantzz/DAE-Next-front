import { Departamento } from "./Departamento.interface";

export interface Direccion {
    id: number;
    calle: string;
    numero: string;
    departamento: Departamento
}