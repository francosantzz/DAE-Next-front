export interface EquipoMuyShortResponseDto {
    id: number;
    nombre: string;
    totalHoras: number;
    departamento?: {
      id: number;
      nombre: string;
    };
    observaciones?: string;
  }