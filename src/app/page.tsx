"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2Icon } from "lucide-react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push("/dashboard")
    }
  }, [session, router])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2Icon className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Bienvenido a DAE</CardTitle>
          <CardDescription>
            Sistema de Gestión de Equipos y Profesionales
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={() => router.push("/login")} className="w-full">
            Iniciar Sesión
          </Button>
          <Button variant="outline" onClick={() => router.push("/register")} className="w-full">
            Registrarse
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
