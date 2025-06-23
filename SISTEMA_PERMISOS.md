# Sistema de Permisos y Roles

Este documento explica cómo funciona el sistema de permisos basado en roles implementado en la aplicación.

## Estructura del Sistema

### 1. Configuración de Permisos (`src/lib/permissions.ts`)

El archivo `permissions.ts` define la configuración de permisos para cada rol:

```typescript
export const rolePermissions: RolePermissions = {
  admin: [
    { entity: "dashboard", actions: ["read"] },
    { entity: "profesionales", actions: ["read", "create", "update", "delete"] },
    { entity: "equipos", actions: ["read", "create", "update", "delete"] },
    // ... más entidades
  ],
  coordinador: [
    { entity: "dashboard", actions: ["read"] },
    { entity: "profesionales", actions: ["read", "create", "update"] },
    // ... más entidades
  ],
  // ... más roles
}
```

### 2. Hook de Permisos (`src/hooks/usePermissions.ts`)

El hook `usePermissions` proporciona funciones útiles para verificar permisos:

```typescript
const { 
  hasPermission, 
  canViewPage, 
  getRoleDisplayName, 
  userRole,
  isAuthenticated,
  isAdmin,
  isCoordinatorOrAdmin 
} = usePermissions();
```

### 3. Componentes de Protección

#### ProtectedRoute
Protege rutas completas basándose en permisos:

```typescript
<ProtectedRoute requiredPermission={{ entity: "profesionales", action: "read" }}>
  <Componente />
</ProtectedRoute>
```

#### PermissionButton
Muestra botones solo si el usuario tiene permisos:

```typescript
<PermissionButton 
  requiredPermission={{ entity: "profesionales", action: "create" }}
  onClick={handleCreate}
>
  Crear Profesional
</PermissionButton>
```

#### PermissionContent
Muestra contenido solo si el usuario tiene permisos:

```typescript
<PermissionContent 
  requiredPermission={{ entity: "usuarios", action: "read" }}
  fallback={<p>No tienes permisos para ver esta información</p>}
>
  <TablaUsuarios />
</PermissionContent>
```

## Roles Disponibles

### Admin
- **Acceso completo** a todas las funcionalidades
- Puede crear, editar, eliminar y ver todas las entidades
- Acceso a gestión de usuarios

### Coordinador
- Puede **crear y editar** profesionales, equipos, escuelas, horarios y modificaciones
- Puede **ver** usuarios pero no editarlos
- No puede eliminar entidades

### Profesional
- Puede **ver** profesionales, equipos y escuelas
- Puede **crear y editar** horarios
- Puede **ver** modificaciones

### Supervisor
- Puede **ver** profesionales, equipos, escuelas y horarios
- Puede **crear** modificaciones
- Acceso limitado de solo lectura

## Cómo Implementar en Nuevas Páginas

### 1. Proteger una Ruta Completa

```typescript
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function MiPagina() {
  return (
    <ProtectedRoute requiredPermission={{ entity: "miEntidad", action: "read" }}>
      <Layout>
        {/* Contenido de la página */}
      </Layout>
    </ProtectedRoute>
  );
}
```

### 2. Mostrar Botones Condicionalmente

```typescript
import { PermissionButton } from "@/components/PermissionButton";

function MiComponente() {
  return (
    <div>
      <PermissionButton 
        requiredPermission={{ entity: "miEntidad", action: "create" }}
        onClick={handleCreate}
      >
        Crear Nuevo
      </PermissionButton>
      
      <PermissionButton 
        requiredPermission={{ entity: "miEntidad", action: "delete" }}
        variant="destructive"
        onClick={handleDelete}
      >
        Eliminar
      </PermissionButton>
    </div>
  );
}
```

### 3. Mostrar Contenido Condicionalmente

```typescript
import { PermissionContent } from "@/components/PermissionContent";

function MiComponente() {
  return (
    <div>
      <PermissionContent 
        requiredPermission={{ entity: "miEntidad", action: "read" }}
      >
        <TablaDeDatos />
      </PermissionContent>
    </div>
  );
}
```

### 4. Usar el Hook Directamente

```typescript
import { usePermissions } from "@/hooks/usePermissions";

function MiComponente() {
  const { hasPermission, userRole, getRoleDisplayName } = usePermissions();

  if (hasPermission("miEntidad", "create")) {
    // Mostrar formulario de creación
  }

  return (
    <div>
      <p>Tu rol: {getRoleDisplayName()}</p>
      {/* Resto del componente */}
    </div>
  );
}
```

## Sidebar Automática

La sidebar automáticamente filtra las opciones de navegación basándose en los permisos del usuario. Solo se muestran las páginas a las que el usuario tiene acceso de lectura.

También muestra el rol del usuario junto a su email en la parte inferior de la sidebar.

## Agregar Nuevos Permisos

Para agregar nuevos permisos:

1. **Actualizar la configuración** en `src/lib/permissions.ts`:
```typescript
export const rolePermissions: RolePermissions = {
  admin: [
    // ... permisos existentes
    { entity: "nuevaEntidad", actions: ["read", "create", "update", "delete"] },
  ],
  // ... otros roles
}
```

2. **Usar los componentes** en tu código:
```typescript
<ProtectedRoute requiredPermission={{ entity: "nuevaEntidad", action: "read" }}>
  <MiNuevaPagina />
</ProtectedRoute>
```

## Consideraciones de Seguridad

- Los permisos se verifican tanto en el frontend como en el backend
- El frontend proporciona una mejor experiencia de usuario ocultando elementos no autorizados
- El backend debe validar todos los permisos para garantizar la seguridad
- Los permisos se basan en el rol del usuario almacenado en la sesión

## Ejemplos de Uso

### Página de Profesionales
- **Admin/Coordinador**: Puede crear, editar y eliminar profesionales
- **Profesional/Supervisor**: Solo puede ver la lista de profesionales

### Página de Horarios
- **Admin/Coordinador/Profesional**: Puede crear y editar horarios
- **Supervisor**: Solo puede ver horarios

### Página de Usuarios
- **Admin**: Acceso completo
- **Otros roles**: No pueden acceder a esta página 