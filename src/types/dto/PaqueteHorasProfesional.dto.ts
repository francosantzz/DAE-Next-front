import { EquipoDepartamentoDTO } from "./EquipoDepartamento.dto";
import { EscuelaShortDTO } from "./EscuelaShort.dto";

// export interface Equipo {
//     id: number;
//     nombre: string;
//     departamento: Departamento;
// }
  
// export interface Escuela {
//     id: number;
//     nombre: string;
// }


export interface PaqueteHorasProfesional {
    id: number;
    tipo: string;
    cantidad: number;
    escuela?: EscuelaShortDTO;
    equipo?: EquipoDepartamentoDTO;
  }