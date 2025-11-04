import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, HelpCircle, Info } from "lucide-react"

interface EstadoFisicoCardProps {
  observaciones: string | undefined
}

export const determinarEstado = (texto: string | undefined) => {
  if (!texto) return { estado: "sin-info", label: "Sin información" };

  const textoLower = texto.toLowerCase();

  if (
    textoLower.includes("urgente") ||
    textoLower.includes("peligro") ||
    textoLower.includes("inhabitable") ||
    textoLower.includes("grave")
  ) {
    return { estado: "critico", label: "Estado crítico" };
  }

  if (
    textoLower.includes("problema") ||
    textoLower.includes("reparación") ||
    textoLower.includes("falta") ||
    textoLower.includes("deterioro") ||
    textoLower.includes("no hay")
  ) {
    return { estado: "requiere-atencion", label: "Requiere atención" };
  }

  if (textoLower.includes("buen") || textoLower.includes("óptimo") || textoLower.includes("adecuado")) {
    return { estado: "optimo", label: "Estado óptimo" };
  }

  return { estado: "normal", label: "Estado normal" };
};

// También exportamos getIconAndColor si es necesario
export const getIconAndColor = (estado: string) => {
  switch (estado) {
    case "critico":
      return {
        icon: AlertTriangle,
        color: "text-red-500",
        bgColor: "bg-red-50",
        badgeColor: "bg-red-100 text-red-800 hover:bg-red-100",
      }
    case "requiere-atencion":
      return {
        icon: Info,
        color: "text-amber-500",
        bgColor: "bg-amber-50",
        badgeColor: "bg-amber-100 text-amber-800 hover:bg-amber-100",
      }
    case "optimo":
      return {
        icon: CheckCircle,
        color: "text-green-500",
        bgColor: "bg-green-50",
        badgeColor: "bg-green-100 text-green-800 hover:bg-green-100",
      }
    case "normal":
      return {
        icon: Info,
        color: "text-blue-500",
        bgColor: "bg-blue-50",
        badgeColor: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      }
    default:
      return {
        icon: HelpCircle,
        color: "text-gray-500",
        bgColor: "bg-gray-50",
        badgeColor: "bg-gray-100 text-gray-800 hover:bg-gray-100",
      }
  }
};

// El componente sigue igual, pero ahora usa las funciones exportadas
export function EstadoFisicoCard({ observaciones }: EstadoFisicoCardProps) {
  const { estado, label } = determinarEstado(observaciones);
  const { icon: Icon, color, bgColor, badgeColor } = getIconAndColor(estado);


  return (
    <Card className={`${bgColor} border-l-4 ${color.replace("text", "border")}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center justify-between">
          <div className="flex items-center">
            <Icon className={`mr-2 h-5 w-5 ${color}`} />
            Observaciones
          </div>
          <Badge className={badgeColor}>{label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {observaciones ? (
          <div className="line-clamp-3">{observaciones}</div>
        ) : (
          <p className="text-gray-500 italic">No hay observaciones registradas.</p>
        )}
      </CardContent>
    </Card>
  )
}
