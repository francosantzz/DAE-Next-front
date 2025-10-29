export interface ProfesionalEquipoDTO {
    id: number;
    nombre: string;
    apellido: string;
    profesion?: string;          // opcional (en /short no viene)
    cargosHoras?: {
      id: number;
      tipo: string;
      cantidadHoras: number;
    }[];
    tipoLicencia?: string;
    fechaInicioLicencia?: string;
    fechaFinLicencia?: string;
    licenciaActiva: boolean;
    totalHoras?: number;         // opcional
  }