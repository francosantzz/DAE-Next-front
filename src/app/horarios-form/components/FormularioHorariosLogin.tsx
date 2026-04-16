"use client"

import type { FormEvent } from "react"
import { Alert, AlertDescription } from "@/components/ui/genericos/alert"
import { Button } from "@/components/ui/genericos/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import { Input } from "@/components/ui/genericos/input"
import { Label } from "@/components/ui/genericos/label"

type LoginData = {
  correo: string
  contrasena: string
}

type FormularioHorariosLoginProps = {
  loginData: LoginData
  errorMsg: string | null
  isSubmitting: boolean
  onChange: (field: keyof LoginData, value: string) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}

export default function FormularioHorariosLogin({
  loginData,
  errorMsg,
  isSubmitting,
  onChange,
  onSubmit,
}: FormularioHorariosLoginProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Ingresá al formulario</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Usá el correo y la contraseña que recibiste para acceder a los 4 pasos del formulario.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="correo-login">Correo</Label>
            <Input
              id="correo-login"
              type="email"
              value={loginData.correo}
              onChange={(e) => onChange("correo", e.target.value)}
              placeholder="correo@dominio.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contrasena-login">Contraseña</Label>
            <Input
              id="contrasena-login"
              type="password"
              value={loginData.contrasena}
              onChange={(e) => onChange("contrasena", e.target.value)}
              placeholder="Ingresá tu contraseña"
              autoComplete="current-password"
              required
            />
          </div>

          {errorMsg && (
            <Alert variant="destructive">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
