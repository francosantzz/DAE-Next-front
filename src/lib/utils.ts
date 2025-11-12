import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type PaqueteHoras = {
  id: number
  cantidad: string
  profesional: { licenciaActiva: boolean; fechaFinLicencia?: string | null; tipoLicencia?: string | null }
  }
  
  
  export function calcularEstadisticasHoras(paquetesHoras: PaqueteHoras[]) {
  const totalHoras = paquetesHoras.reduce((total, ph) => total + parseFloat(ph.cantidad), 0)
  
  
  const paquetesActivos = paquetesHoras.filter((paquete) => {
  const p = paquete.profesional
  return !p.licenciaActiva || !p.fechaFinLicencia || new Date(p.fechaFinLicencia) < new Date()
  })
  
  
  const horasActivas = paquetesActivos.reduce((total, ph) => total + parseFloat(ph.cantidad), 0)
  const horasEnLicencia = totalHoras - horasActivas
  
  
  return {
  totalHoras,
  horasActivas,
  horasEnLicencia,
  }
  }
