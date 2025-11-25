"use client"

import { useState } from "react"
import { Button } from "@/components/ui/genericos/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/genericos/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/genericos/table"
import { Avatar, AvatarFallback } from "@/components/ui/genericos/avatar"
import { Checkbox } from "@/components/ui/genericos/checkbox"
import { RefreshCwIcon, TrendingUpIcon, UserPlusIcon, UserMinusIcon } from "lucide-react"

type TipoMovimiento = "alta" | "baja"

interface MovimientoProfesional {
  id: number
  tipo: TipoMovimiento
  fecha: string
  dni: string
  nombre: string
  apellido: string
  profesion?: string | null
  matricula?: string | null
  cuil?: string | null
  motivo?: string | null
  tipoHora?: string | null
  cantidadHoras?: number | null
  grupoDistribucion?: number | null
  tiposOrigen?: string | null
  registrado: boolean
}

export default function ListaAltasBajas() {
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

      // ⬇️ Asegurate de usar la misma key que uses en tu login
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") /* o "accessToken" */ : null

      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/altas-bajas?limit=5`

      console.log("Llamando a:", url)

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // si usás cookies / sesiones, activá esto:
        // credentials: "include",
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

      const data = (await res.json()) as Omit<MovimientoProfesional, "registrado">[]

      console.log("Respuesta /altas-bajas:", data)

      const conFlag: MovimientoProfesional[] = data.map((m) => ({
        ...m,
        registrado: false, // al principio todos pendientes
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

  const handleToggleRegistrado = (id: number) => {
    setMovimientos((prev) => prev.map((m) => (m.id === id ? { ...m, registrado: !m.registrado } : m)))
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

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Altas</CardTitle>
              <UserPlusIcon className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{altas.length}</div>
              <p className="text-xs text-muted-foreground">
                {altas.filter((a) => !a.registrado).length} pendientes de registrar
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Bajas</CardTitle>
              <UserMinusIcon className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{bajas.length}</div>
              <p className="text-xs text-muted-foreground">
                {bajas.filter((b) => !b.registrado).length} pendientes de registrar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tablas */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Altas */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <UserPlusIcon className="w-5 h-5" />
                Altas de Profesionales
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {altas.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <UserPlusIcon className="w-12 h-12 mx-auto mb-4 text-green-300" />
                  <p>No hay altas registradas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profesional</TableHead>
                      <TableHead>Profesión</TableHead>
                      <TableHead>CUIL</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-center">Registrado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {altas.map((alta) => (
                      <TableRow key={alta.id} className="hover:bg-green-50/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 bg-green-100">
                              <AvatarFallback className="text-green-700 text-xs">
                                {alta.nombre.charAt(0)}
                                {alta.apellido.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {alta.nombre} {alta.apellido}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {alta.matricula || "Sin matrícula"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{alta.profesion || "—"}</TableCell>
                        <TableCell className="font-mono text-sm">{alta.cuil || "—"}</TableCell>
                        <TableCell>{new Date(alta.fecha).toLocaleDateString()}</TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={alta.registrado}
                            onCheckedChange={() => handleToggleRegistrado(alta.id)}
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Bajas */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <UserMinusIcon className="w-5 h-5" />
                Bajas de Profesionales
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {bajas.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <UserMinusIcon className="w-12 h-12 mx-auto mb-4 text-red-300" />
                  <p>No hay bajas registradas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profesional</TableHead>
                      <TableHead>Profesión</TableHead>
                      <TableHead>CUIL</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="text-center">Registrado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bajas.map((baja) => (
                      <TableRow key={baja.id} className="hover:bg-red-50/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 bg-red-100">
                              <AvatarFallback className="text-red-700 text-xs">
                                {baja.nombre.charAt(0)}
                                {baja.apellido.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {baja.nombre} {baja.apellido}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {baja.matricula || "Sin matrícula"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{baja.profesion || "—"}</TableCell>
                        <TableCell className="font-mono text-sm">{baja.cuil || "—"}</TableCell>
                        <TableCell>{new Date(baja.fecha).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {baja.motivo || "No especificado"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={baja.registrado}
                            onCheckedChange={() => handleToggleRegistrado(baja.id)}
                            className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}