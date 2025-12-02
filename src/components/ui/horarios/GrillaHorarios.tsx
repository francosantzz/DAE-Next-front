'use client'
import React, { useState } from "react"
import useHorariosData, { PaquetePayload } from "@/hooks/useHorariosData"
import { useSession } from "next-auth/react"
import SelectionPanel from "./SelectionPanel"
import PaquetesTable from "./PaquetesTable"
import PaqueteModal from "./PaquetesModal"
import ErrorBoundary from "../genericos/ErrorBoundary"
import { Card, CardContent, CardHeader, CardTitle } from "../genericos/card"

export default function GrillaHorarios() {
  const { data: session } = useSession()
  const {
    equipos, profesionalesFiltrados, escuelasDelEquipo,
    isLoading, verAnteriores, setVerAnteriores,
    equipoSeleccionado, setEquipoSeleccionado,
    profesionalSeleccionado, setProfesionalSeleccionado,
    searchTerm, setSearchTerm, sortedPaquetes,
    paquetesCargados, fetchEscuelasDelEquipo, reloadPaquetes,
    createPaquete, updatePaquete, deletePaquete
  } = useHorariosData(session)

  // modal & current paquete
  const [openModal, setOpenModal] = useState(false)
  const [currentPaquete, setCurrentPaquete] = useState<any|null>(null)

  const [formData, setFormData] = useState({
    tipo: "",
    escuelaId: "",
    equipoId: "",
    diaSemana: "",
    horaInicio: "",
    horaFin: "",
    rotativo: false,
    semanas: [] as number[]
  })

  const tiposPaquete = ["Escuela","Carga en GEI","Trabajo Interdisciplinario"]

  const handleOpenModal = (paquete?: any) => {
    if (paquete) {
      setCurrentPaquete(paquete)
      setFormData({
        tipo: paquete.tipo,
        escuelaId: paquete.escuela?.id?.toString() || "",
        equipoId: paquete.equipo.id.toString(),
        diaSemana: (paquete.diaSemana ?? paquete.dias?.diaSemana ?? '').toString(),
        horaInicio: (paquete.horaInicio ?? paquete.dias?.horaInicio ?? '').toString().slice(0,5),
        horaFin: (paquete.horaFin ?? paquete.dias?.horaFin ?? '').toString().slice(0,5),
        rotativo: paquete.rotativo ?? paquete.dias?.rotativo ?? false,
        semanas: paquete.semanas ?? paquete.dias?.semanas ?? []
      })
      fetchEscuelasDelEquipo(paquete.equipo.id.toString())
    } else {
      setCurrentPaquete(null)
      setFormData({
        tipo: tiposPaquete[0],
        escuelaId: "",
        equipoId: equipoSeleccionado,
        diaSemana: "",
        horaInicio: "",
        horaFin: "",
        rotativo: false,
        semanas: []
      })
      fetchEscuelasDelEquipo(equipoSeleccionado)
    }
    setOpenModal(true)
  }

  const handleCloseModal = () => setOpenModal(false)

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target
    if (name === "rotativo") {
      setFormData(prev => ({ ...prev, rotativo: checked }))
      return
    }
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    if (name === "tipo" && (value === "Carga en GEI" || value === "Trabajo Interdisciplinario")) {
      setFormData(prev => ({ ...prev, escuelaId: "" }))
    }
  }

  const toggleSemana = (sem: number) => {
    setFormData(prev => {
      const present = prev.semanas.includes(sem)
      return { ...prev, semanas: present ? prev.semanas.filter(s => s !== sem) : [...prev.semanas, sem] }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: PaquetePayload = {
        tipo: formData.tipo,
        escuelaId: formData.tipo === "Escuela" && formData.escuelaId && formData.escuelaId !== "none" ? Number.parseInt(formData.escuelaId) : null,
        equipoId: Number.parseInt(formData.equipoId || equipoSeleccionado),
        profesionalId: Number.parseInt(profesionalSeleccionado),
        diaSemana: formData.diaSemana ? Number.parseInt(formData.diaSemana) : null,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        rotativo: formData.rotativo,
        semanas: formData.rotativo ? formData.semanas : null
      }

      if (currentPaquete) {
        await updatePaquete(currentPaquete.id, payload)
      } else {
        await createPaquete(payload)
      }

      setOpenModal(false)
    } catch (error) {
      console.error("Error al guardar el paquete:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este paquete?")) return
    try {
      await deletePaquete(id)
    } catch (error) {
      console.error("Error al eliminar el paquete:", error)
    }
  }

  const getNombreEquipoSeleccionado = () => {
    const equipo = equipos.find((e:any) => e.id.toString() === equipoSeleccionado)
    return equipo ? equipo.nombre : ""
  }

  const getNombreProfesionalSeleccionado = () => {
    const profesional = profesionalesFiltrados.find((p:any) => p.id.toString() === profesionalSeleccionado)
    return profesional ? `${profesional.nombre} ${profesional.apellido}` : ""
  }

  const getTotalHoras = () => {
    if (!profesionalSeleccionado) return 0
    const profesional = profesionalesFiltrados.find((p:any) => p.id.toString() === profesionalSeleccionado)
    return profesional?.totalHoras || 0
  }

  if (isLoading) return <div className="flex justify-center items-center h-screen">Cargando...</div>

  return (
    <ErrorBoundary>
      {/* 🔒 Bloqueamos overflow horizontal a nivel página/componente */}
      <div className="w-full overflow-x-hidden">
        <div className="container mx-auto px-2 py-4">
          <Card className="w-full max-w-full">
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">Grilla de Paquetes de Horas</CardTitle>
            </CardHeader>
            <CardContent className="px-3 px-6">
              <SelectionPanel
                equipos={equipos}
                profesionales={profesionalesFiltrados}
                equipoSeleccionado={equipoSeleccionado}
                profesionalSeleccionado={profesionalSeleccionado}
                setEquipoSeleccionado={setEquipoSeleccionado}
                setProfesionalSeleccionado={setProfesionalSeleccionado}
                verAnteriores={verAnteriores}
                setVerAnteriores={setVerAnteriores}
                onVerPaquetes={() => {/* hook para tabs si hace falta */}}
              />

              {profesionalSeleccionado && (
                <PaquetesTable
                  sortedPaquetes={sortedPaquetes}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  onOpenModal={handleOpenModal}
                  onDelete={handleDelete}
                  getNombreEquipoSeleccionado={getNombreEquipoSeleccionado}
                  getNombreProfesionalSeleccionado={getNombreProfesionalSeleccionado}
                  getTotalHoras={getTotalHoras}
                  verAnteriores={verAnteriores}
                  profesionalesFiltrados={profesionalesFiltrados}
                  profesionalSeleccionado={profesionalSeleccionado}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PaqueteModal
        open={openModal}
        setOpen={setOpenModal}
        currentPaquete={currentPaquete}
        formData={formData}
        setFormData={setFormData}
        tiposPaquete={tiposPaquete}
        escuelasDelEquipo={escuelasDelEquipo}
        equipoSeleccionado={equipoSeleccionado}
        handleInputChange={handleInputChange}
        handleSelectChange={handleSelectChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        toggleSemana={toggleSemana}
      />
    </ErrorBoundary>
  )
}
