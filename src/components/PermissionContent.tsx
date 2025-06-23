"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { ReactNode } from "react";

interface PermissionContentProps {
  children: ReactNode;
  requiredPermission: {
    entity: string;
    action: string;
  };
  fallback?: ReactNode;
}

export function PermissionContent({ 
  children, 
  requiredPermission, 
  fallback = null 
}: PermissionContentProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(requiredPermission.entity, requiredPermission.action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
} 