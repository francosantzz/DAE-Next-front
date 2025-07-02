// src/types/roles.ts

// Enum de roles
export enum Role {
    ADMIN = "admin",
    EQUIPO = "equipo",
    TECNICO = "tecnico",
    OBSERVATORIO = "observatorio",
    DIRECTORA = "directora",
    USER = "user",
  }
  
  // Interfaces
  export interface Permission {
    [key: string]: {
      entity: string;
      permissions: string;
    }[];
  }
  
  export interface Usuario {
    id: number;
    name: string;
    email: string;
    role: Role;
    createdAt: string;
    updatedAt: string;
  }
  
  // Labels para roles
  export const roleLabels = {
    [Role.ADMIN]: "Administrador",
    [Role.EQUIPO]: "Equipo",
    [Role.TECNICO]: "Técnico",
    [Role.OBSERVATORIO]: "Observatorio",
    [Role.DIRECTORA]: "Directora",
    [Role.USER]: "Usuario",
  }
  
  // Colores para roles
  export const roleColors = {
    [Role.ADMIN]: "bg-red-100 text-red-800",
    [Role.EQUIPO]: "bg-blue-100 text-blue-800",
    [Role.TECNICO]: "bg-green-100 text-green-800",
    [Role.OBSERVATORIO]: "bg-purple-100 text-purple-800",
    [Role.DIRECTORA]: "bg-yellow-100 text-yellow-800",
    [Role.USER]: "bg-gray-100 text-gray-800",
  }
  