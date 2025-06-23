import { useSession } from "next-auth/react";
import { 
  hasPermission, 
  canViewPage, 
  getAccessibleEntities, 
  getRoleDisplayName,
  type Permission 
} from "@/lib/permissions";

export function usePermissions() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "";

  return {
    // Verificar si el usuario tiene un permiso específico
    hasPermission: (entity: string, action: string) => 
      hasPermission(userRole, entity, action),
    
    // Verificar si el usuario puede ver una página
    canViewPage: (page: string) => canViewPage(userRole, page),
    
    // Obtener todas las entidades accesibles para el usuario
    getAccessibleEntities: () => getAccessibleEntities(userRole),
    
    // Obtener el nombre legible del rol del usuario
    getRoleDisplayName: () => getRoleDisplayName(userRole),
    
    // Obtener el rol del usuario
    userRole,
    
    // Verificar si el usuario está autenticado
    isAuthenticated: !!session,
    
    // Verificar si el usuario es admin
    isAdmin: userRole === "admin",
    
    // Verificar si el usuario es coordinador o admin
    isCoordinatorOrAdmin: userRole === "coordinador" || userRole === "admin",
  };
} 