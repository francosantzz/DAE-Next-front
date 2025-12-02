// app/.../altas-bajas/page.tsx

"use client"

import { useState, useEffect } from "react"   
import { Button } from "@/components/ui/genericos/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/genericos/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/genericos/tabs"
import { RefreshCwIcon, TrendingUpIcon, UserPlusIcon, UserMinusIcon } from "lucide-react"

import type { MovimientoProfesional, MovimientoProfesionalApi } from "@/types/MovimientoProfesional.interface"
import { StatsCardsAltasBajas } from "@/components/ui/altas-bajas/StatsCardsAltasBajas"
import { AltasTable } from "@/components/ui/altas-bajas/AltasTable"
import { BajasTable } from "@/components/ui/altas-bajas/BajasTable"

export default function ListaAltasBajasPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoProfesional[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const altas = movimientos.filter((m) => m.tipo === "alta")
  const bajas = movimientos.filter((m) => m.tipo === "baja")

  const handleTraerRegistros = async () => {
    try {
      setIsLoading(true)
      setErrorMsg(null)

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") /* o "accessToken" */ : null

      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/altas-bajas?limit=10`

      console.log("Llamando a:", url)

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      console.log("Status altas-bajas:", res.status)

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        console.error("Error al traer registros", res.status, text)

        if (res.status === 401) {
          setErrorMsg("No autorizado. Revisá el token (sesión expirada o no logueado).")
        } else {
          setErrorMsg(`Error al traer registros (status ${res.status})`)
        }

        return
      }

      const data = (await res.json()) as MovimientoProfesionalApi[]

      console.log("Respuesta /altas-bajas:", data)

      const conFlag: MovimientoProfesional[] = data.map((m) => ({
        ...m,
        registrado: m.registrado ?? false,
      }))

      setMovimientos(conFlag)
      setUltimaActualizacion(new Date())
    } catch (err) {
      console.error("Error fetch /altas-bajas", err)
      setErrorMsg("Error de red al conectar con el backend.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    handleTraerRegistros()
  }, [])

  const handleToggleRegistrado = async (mov: MovimientoProfesional) => {
    const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/altas-bajas/${mov.tipo}/${mov.id}/registrar`
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

    try {
      if (!mov.registrado) {
        // marcar
        await fetch(baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ dni: mov.dni, fecha: mov.fecha }),
        })
      } else {
        // desmarcar
        await fetch(baseUrl, {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
      }

      setMovimientos((prev) =>
        prev.map((m) =>
          m.id === mov.id && m.tipo === mov.tipo
            ? { ...m, registrado: !m.registrado }
            : m,
        ),
      )
    } catch (e) {
      console.error("Error al marcar/desmarcar registrado", e)
    }
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-background">
      <main className="flex-1 p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Altas y Bajas de Profesionales</h1>
              <p className="text-blue-100">Sincronización con sistema de horas (gestor_horas2)</p>
            </div>
            <TrendingUpIcon className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        {/* Botón / último update / error */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <Button
            onClick={handleTraerRegistros}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Sincronizando..." : "Traer Registros"}
          </Button>

          <div className="flex flex-col items-start md:items-end gap-1">
            {ultimaActualizacion && (
              <p className="text-sm text-muted-foreground">
                Última actualización: {ultimaActualizacion.toLocaleString()}
              </p>
            )}
            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          </div>
        </div>

        {/* Stats */}
        <StatsCardsAltasBajas altas={altas} bajas={bajas} />

        {/* Tabs Altas/Bajas */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5 text-blue-600" />
              Movimientos recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="altas" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="altas" className="flex items-center gap-2">
                  <UserPlusIcon className="h-4 w-4 text-green-600" />
                  Altas
                </TabsTrigger>
                <TabsTrigger value="bajas" className="flex items-center gap-2">
                  <UserMinusIcon className="h-4 w-4 text-red-600" />
                  Bajas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="altas">
                <AltasTable altas={altas} onToggleRegistrado={handleToggleRegistrado} />
              </TabsContent>

              <TabsContent value="bajas">
                <BajasTable bajas={bajas} onToggleRegistrado={handleToggleRegistrado} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
