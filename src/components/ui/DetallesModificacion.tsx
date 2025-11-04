// components/DetallesModificacion.tsx
import React from 'react';

interface DetallesModificacionProps {
  detalles: string;
  entidad: string;
}

const DetallesModificacion: React.FC<DetallesModificacionProps> = ({ detalles, entidad }) => {
  if (!detalles) return null;

  try {
    const datos = JSON.parse(detalles);
    
    // Mapeo de campos importantes por entidad
    const camposImportantes: Record<string, string[]> = {
      Profesional: ['nombre', 'apellido', 'cuil', 'profesion', 'matricula'],
      Usuario: ['nombre', 'apellido', 'email', 'role'],
      // Agrega más entidades según necesites
    };

    const camposAmostrar = camposImportantes[entidad] || Object.keys(datos).slice(0, 3);

    return (
      <div className="text-xs space-y-1">
        {camposAmostrar.map((campo) => (
          datos[campo] !== undefined && (
            <div key={campo} className="flex">
              <span className="font-medium text-gray-700 w-24 capitalize">{campo}:</span>
              <span className="text-gray-600 truncate max-w-xs">
                {Array.isArray(datos[campo]) 
                  ? datos[campo].join(', ') 
                  : typeof datos[campo] === 'object'
                    ? JSON.stringify(datos[campo])
                    : datos[campo]}
              </span>
            </div>
          )
        ))}
      </div>
    );
  } catch (e) {
    return <span className="text-xs text-gray-600">{detalles}</span>;
  }
};

export default DetallesModificacion;