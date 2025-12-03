export interface Anexo {
  id: number
  nombre: string
  matricula: number
  escuela: {
    id: number
    nombre: string
  }
}
