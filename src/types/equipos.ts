// Tipos comunes y “flexibles” (propiedades opcionales donde pueden faltar)

export interface Profesional {
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
  
  export interface Region { id: number; nombre: string; }
  
  export interface Departamento {
    id: number;
    nombre: string;
    region?: Region;
  }
  
  export interface Escuela {
    id: number;
    Numero: string;
    matricula: number;
    nombre: string;
  }
  
  export interface DiasReal {
    diaSemana: number;        // 0..6 ó 1..5 según tu backend
    horaInicio: string;       // "HH:MM:SS" o "HH:MM"
    horaFin: string;          // idem
    rotativo: boolean;
    semanas: number[] | null;
    cicloSemanas?: number;
  }
  
  // Soportar payload “viejo” y “nuevo”
  export interface PaqueteHoras {
    id: number;
    tipo: string;
    cantidad: number | string;
    profesional: Profesional;
    escuela?: Escuela | null;
    equipo?: { id: number; nombre: string };
    // Normalizados:
    diaSemana?: number | null;
    horaInicio?: string;
    horaFin?: string;
    rotativo?: boolean;
    semanas?: number[] | null;
    // O bien el bloque “dias” completo:
    dias?: Partial<DiasReal>;
  }
  
  export interface Equipo {
    id: number;
    nombre: string;
    profesionales?: Profesional[];
    departamento?: Departamento;
    escuelas?: Escuela[];
    paquetesHoras?: PaqueteHoras[];
    totalHoras?: number;
  }
  