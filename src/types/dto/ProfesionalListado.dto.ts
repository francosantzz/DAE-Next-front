import { ProfesionalEquipoDTO } from "./ProfesionalEquipo.dto";

export type ProfesionalListado = ProfesionalEquipoDTO & {
    fechaBaja?: string | null;   // viene en /equipos/short
    totalHoras?: number;         // número para poder sumar/mostrar
  };