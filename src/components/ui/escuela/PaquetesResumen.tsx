'use client'

type Profesional = { nombre?: string; apellido?: string; licenciaActiva?: boolean; fechaFinLicencia?: string }
type Dias = { diaSemana?: number; horaInicio?: string; horaFin?: string; rotativo?: boolean; semanas?: number[] }
type Paquete = { id: number; cantidad: number | string; profesional?: Profesional; dias?: Dias }

export default function PaquetesResumen({
  paquetes,
  onVerTodos,
  max = 3,
  soloSemana1 = false,
}: {
  paquetes: Paquete[] | undefined
  onVerTodos: () => void
  max?: number
  soloSemana1?: boolean
}) {
  const list = (paquetes ?? [])
    .filter(p => !soloSemana1 || perteneceASemana1(p))
    .sort(ordenarPorDiaHora)
  if (!list.length) return <p className="text-sm text-gray-600 mt-1">No hay paquetes de horas.</p>

  const visibles = list.slice(0, max)
  const restantes = list.length - visibles.length

  return (
    <div className="mt-2">
      <ul className="list-disc pl-5 space-y-2 text-sm">
        {visibles.map(p => {
          const lic = estaEnLicencia(p.profesional)
          const sub = subLinea(p.dias)
          return (
            <li key={p.id}>
              <div className={`flex flex-wrap items-center gap-2 ${lic ? 'text-orange-700' : ''}`}>
                <span className="font-semibold">{num(p.cantidad)} h</span>
                <span>— {p.profesional?.nombre} {p.profesional?.apellido}</span>
                {lic && <span className="text-xs px-2 py-0.5 rounded border border-orange-300 bg-orange-50">En licencia</span>}
              </div>
              {sub && <div className={`text-xs mt-0.5 ${lic ? 'text-orange-600' : 'text-gray-600'}`}>{sub}</div>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ——— helpers mini ——— */
const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? 0)); 
  return Number.isFinite(n) ? n : 0
}
const dlabel = (d?: number) => ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][Number(d)] || '-'
const h = (s?: string) => (s ?? '').toString().slice(0,5)
const subLinea = (d?: Dias) => {
    if (!d) return ''
  
    const dia = dlabel(d.diaSemana)
    const rango = [h(d.horaInicio), h(d.horaFin)].filter(Boolean).join('–')
  
    // Mostrar semanas si es rotativo y hay lista
    let rot = ''
    if (d.rotativo) {
      const semanas = Array.isArray(d.semanas)
        ? d.semanas
            .map(s => Number(s))
            .filter(n => Number.isFinite(n))
        : []
  
      rot = semanas.length ? `Rotativo (Semanas: ${semanas.join(', ')})` : 'Rotativo'
    }
  
    return [dia, rango, rot].filter(Boolean).join(' · ')
  }  
const ordenarPorDiaHora = (a: Paquete, b: Paquete) => {
  const da = a?.dias?.diaSemana ?? 8, db = b?.dias?.diaSemana ?? 8
  if (da !== db) return da - db
  return (a?.dias?.horaInicio ?? '').localeCompare(b?.dias?.horaInicio ?? '')
}
const estaEnLicencia = (p?: Profesional) =>
  !!(p?.licenciaActiva && p?.fechaFinLicencia && new Date(p.fechaFinLicencia) >= new Date())

// opcional: filtrar “semana 1” como en equipos
const perteneceASemana1 = (p: Paquete) => {
  const d = p.dias
  if (!d) return true
  if (!d.rotativo) return true
  if (!Array.isArray(d.semanas) || d.semanas.length === 0) return true
  return d.semanas.includes(1)
}
