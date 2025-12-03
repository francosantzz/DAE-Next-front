"use client"

import { User, Shield, Mail } from "lucide-react"
import { Card, CardContent } from "@/components/ui/genericos/card"
import { Role, Usuario } from "@/types/roles"

type Props = {
  usuarios: Usuario[]
  totalItems: number
}

export default function UsuariosStats({ usuarios, totalItems }: Props) {
  const admins = usuarios.filter((u) => u.role === Role.ADMIN).length
  const regulares = usuarios.filter((u) => u.role === Role.USER).length

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="shadow-sm">
        <CardContent className="flex items-center p-4">
          <User className="h-8 w-8 text-blue-600" />
          <div className="ml-4">
            <p className="text-xs font-medium text-slate-500">Total usuarios</p>
            <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardContent className="flex items-center p-4">
          <Shield className="h-8 w-8 text-red-600" />
          <div className="ml-4">
            <p className="text-xs font-medium text-slate-500">Administradores</p>
            <p className="text-2xl font-bold text-slate-900">{admins}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardContent className="flex items-center p-4">
          <Mail className="h-8 w-8 text-green-600" />
          <div className="ml-4">
            <p className="text-xs font-medium text-slate-500">Usuarios regulares</p>
            <p className="text-2xl font-bold text-slate-900">{regulares}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
