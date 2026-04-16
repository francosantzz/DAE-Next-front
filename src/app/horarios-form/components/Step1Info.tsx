"use client"

import { Button } from "@/components/ui/genericos/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"

type Step1InfoProps = {
  infoLeida: boolean
  setInfoLeida: (value: boolean) => void
}

export default function Step1Info({ infoLeida, setInfoLeida }: Step1InfoProps) {
  return (
    <>
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Información importante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>
            El envío del formulario <strong>no aprueba</strong> inmediatamente los horarios. La
            Dirección de Acompañamiento Escolar (DAE) analiza la información y luego informará si
            requiere modificaciones o si queda confirmado.
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Requisitos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <ul className="list-disc pl-5 space-y-2">
            <li>Trabajo interdisciplinario: 3 hs.</li>
            <li>
              Carga en GEI según carga horaria total:
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <div>0 a 14 hs → 1 h de carga</div>
                <div>15 a 24 hs → 2 hs</div>
                <div>25 a 34 hs → 3 hs</div>
                <div>Más de 34 hs → 4 hs</div>
              </div>
            </li>
            <li>Mínimo 3 hs por escuela, salvo excepciones.</li>
            <li>
              Cobertura de todas las escuelas de la sección, en conjunto con el equipo. A nuevos
              profesionales se les exigirá cobertura en escuelas sin profesionales. Las escuelas a
              cubrir se informarán en el paso 3.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Video explicativo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-slate-700">
          <p>Próximamente estará disponible el video con la explicación paso a paso.</p>
          <Button type="button" variant="outline" disabled className="w-fit">
            Ver video explicativo (próximamente)
          </Button>
        </CardContent>
      </Card> */}

      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={infoLeida}
              onChange={(e) => setInfoLeida(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Declaro que leí y comprendí la información.</span>
          </label>
        </CardContent>
      </Card>
    </>
  )
}
