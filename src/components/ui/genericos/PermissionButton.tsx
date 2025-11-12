"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { Button, ButtonProps } from "@/components/ui/genericos/button";
import { ReactNode } from "react";

interface PermissionButtonProps extends ButtonProps {
  children: ReactNode;
  requiredPermission: {
    entity: string;
    action: string;
  };
  fallback?: ReactNode;
}

export function PermissionButton({ 
  children, 
  requiredPermission, 
  fallback = null,
  ...buttonProps 
}: PermissionButtonProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(requiredPermission.entity, requiredPermission.action)) {
    return <>{fallback}</>;
  }

  return <Button {...buttonProps}>{children}</Button>;
} 