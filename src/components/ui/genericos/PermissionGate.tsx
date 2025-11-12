// components/ui/genericos/PermissionGate.tsx
"use client"

import { usePermissions } from "@/hooks/usePermissions"

type RequiredPerm = { entity: string; action: string }

export function PermissionGate({
  requiredPermission,
  visibleIf,          // chequeo extra (ej: role !== "equipo")
  children,
}: {
  requiredPermission?: RequiredPerm
  visibleIf?: (ctx: { role: string; hasPermission: (e: string, a: string) => boolean }) => boolean
  children: React.ReactNode
}) {
  const { userRole, hasPermission } = usePermissions()

  const permOk = requiredPermission
    ? hasPermission(requiredPermission.entity, requiredPermission.action)
    : true

  const extraOk = visibleIf ? visibleIf({ role: userRole, hasPermission }) : true

  if (!permOk || !extraOk) return null
  return <>{children}</>
}
