// Configuración de permisos basada en roles
export interface Permission {
  entity: string;
  actions: string[];
}

export interface RolePermissions {
  [role: string]: Permission[];
}

// Definición de permisos por rol
export const rolePermissions: RolePermissions = {
  admin: [
    { entity: "persona", actions: ["read", "create", "update", "delete"] },
    { entity: "escuela", actions: ["read", "create", "update", "delete"] },
    { entity: "departamento", actions: ["read", "create", "update", "delete"] },
    { entity: "equipo", actions: ["read", "create", "update", "delete"] },
    { entity: "profesional", actions: ["read", "create", "update", "delete"] },
    { entity: "paquetehoras", actions: ["read", "create", "update", "delete"] },
    { entity: "region", actions: ["read", "create", "update", "delete"] },
    { entity: "direccion", actions: ["read", "create", "update", "delete"] },
    { entity: "anexo", actions: ["read", "create", "update", "delete"] },
    { entity: "modificacion", actions: ["read", "create", "update", "delete"] },
    { entity: "user", actions: ["read", "create", "update", "delete"] },
  ],
  observatorio: [
    { entity: "persona", actions: ["read", "update"] },
    { entity: "escuela", actions: ["read", "update"] },
    { entity: "departamento", actions: ["read", "update"] },
    { entity: "equipo", actions: ["read", "update"] },
    { entity: "profesional", actions: ["read", "update"] },
    { entity: "paquetehoras", actions: ["read", "create", "update", "delete"] },
    { entity: "region", actions: ["read", "update"] },
    { entity: "direccion", actions: ["read", "update"] },
    { entity: "anexo", actions: ["read", "create", "update", "delete"] },
    { entity: "modificacion", actions: ["read"] },
    { entity: "user", actions: ["read"] },
  ],
  equipo: [
    { entity: "persona", actions: ["read"] },
    { entity: "escuela", actions: ["read", "update"] },
    { entity: "departamento", actions: ["read"] },
    { entity: "equipo", actions: ["read"] },
    { entity: "profesional", actions: ["read"] },
    { entity: "paquetehoras", actions: ["read"] },
    { entity: "region", actions: ["read"] },
    { entity: "direccion", actions: ["read"] },
    { entity: "anexo", actions: ["read"] },
    // No tiene acceso a modificaciones ni users
  ],
  directora: [
    { entity: "persona", actions: ["read", "create", "update", "delete"] },
    { entity: "escuela", actions: ["read", "create", "update"] }, // Sin delete
    { entity: "departamento", actions: ["read", "create", "update", "delete"] },
    { entity: "equipo", actions: ["read", "create", "update"] }, // Sin delete
    { entity: "profesional", actions: ["read", "create", "update", "delete"] },
    { entity: "paquetehoras", actions: ["read", "create", "update", "delete"] },
    { entity: "region", actions: ["read", "create", "update", "delete"] },
    { entity: "direccion", actions: ["read", "create", "update", "delete"] },
    { entity: "anexo", actions: ["read", "create", "update", "delete"] },
    { entity: "modificacion", actions: ["read", "create", "update", "delete"] },
    // No tiene acceso a user
  ],
  tecnico: [
    // Permisos pendientes de definir
  ],
  user: [
    { entity: "persona", actions: ["read"] },
    { entity: "escuela", actions: ["read"] },
    { entity: "departamento", actions: ["read"] },
    { entity: "equipo", actions: ["read"] },
    { entity: "profesional", actions: ["read"] },
    { entity: "paquetehoras", actions: ["read"] },
    { entity: "region", actions: ["read"] },
    { entity: "direccion", actions: ["read"] },
    { entity: "anexo", actions: ["read"] },
    { entity: "modificacion", actions: ["read"] },
    { entity: "user", actions: ["read"] },
    // Solo read en todo, sin create, update ni delete
  ],
}

// Función para verificar si un rol tiene permiso para una entidad y acción específica
export function hasPermission(role: string, entity: string, action: string): boolean {
  const permissions = rolePermissions[role];
  if (!permissions) return false;

  const entityPermission = permissions.find(p => p.entity === entity);
  if (!entityPermission) return false;

  return entityPermission.actions.includes(action);
}

// Función para obtener todas las entidades a las que un rol tiene acceso
export function getAccessibleEntities(role: string): string[] {
  const permissions = rolePermissions[role];
  if (!permissions) return [];

  return permissions.map(p => p.entity);
}

// Función para verificar si un rol puede ver una página específica
export function canViewPage(role: string, page: string): boolean {
  return hasPermission(role, page, "read");
}

// Función para obtener el nombre legible del rol
export function getRoleDisplayName(role: string): string {
  const roleNames: { [key: string]: string } = {
    admin: "Administrador",
    observatorio: "Observatorio",
    equipo: "Equipo",
    directora: "Directora",
    tecnico: "Técnico",
    user: "Usuario",
  };
  
  return roleNames[role] || role;
} 