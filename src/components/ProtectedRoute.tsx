"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: {
    entity: string;
    action: string;
  };
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredRole,
  fallback 
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasPermission, userRole, isAuthenticated } = usePermissions();

  useEffect(() => {
    if (status === "loading") return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Verificar rol requerido
    if (requiredRole && userRole !== requiredRole) {
      router.push("/dashboard");
      return;
    }

    // Verificar permiso requerido
    if (requiredPermission && !hasPermission(requiredPermission.entity, requiredPermission.action)) {
      router.push("/dashboard");
      return;
    }
  }, [session, status, requiredPermission, requiredRole, userRole, isAuthenticated, hasPermission, router]);

  // Mostrar loading mientras se verifica la sesión
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (será redirigido)
  if (!isAuthenticated) {
    return null;
  }

  // Verificar rol requerido
  if (requiredRole && userRole !== requiredRole) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para acceder a esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Verificar permiso requerido
  if (requiredPermission && !hasPermission(requiredPermission.entity, requiredPermission.action)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para acceder a esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
} 