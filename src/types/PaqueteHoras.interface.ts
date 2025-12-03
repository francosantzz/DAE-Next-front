export interface PaqueteHoras {
    id: number;
    tipo: string;
    cantidad: number; // calculada por backend
    profesional: {
      id: number;
      nombre: string;
      apellido: string;
    };
    escuela?: {
      id: number;
      Numero: string;
      nombre: string;
    };
    equipo: {
      id: number;
      nombre: string;
    };
    diaSemana: number; // 0=Domingo .. 6=Sábado
    horaInicio: string; // HH:mm
    horaFin: string; // HH:mm
    rotativo: boolean;
    semanas?: number[] | null;
     // solo si rotativo
  }