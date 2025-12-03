// File: src/pages/Home.tsx
'use client'
import React from 'react'
import { ProfessionalCard } from '@/components/ui/home/ProfessionalCard'
import { HomeProfessionalsList } from '@/components/ui/home/HomeProfessionalsList'
import { useHomeProfessionals } from '@/components/ui/home/useHomeProfessional'
import ProfesionalForm from '@/components/ui/profesional/ProfesionalFormModal'

export default function HomePage() {
  const {
    isLoading, professionals, equipos, departamentos, dashboardData,
    currentProfesional, openModal, formData, setFormData,
    openCreateModal, openEditModal, setOpenModal, handleDelete, handleSubmit,
    currentPage, setCurrentPage, totalPages,
    saveProfessional,
    setCurrentProfesional, // ahora disponible desde el hook
    setProfessionals, setDepartamentos
  } = useHomeProfessionals(10)

  if (isLoading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  // Construimos el VM que espera ProfesionalForm.
  // Incluimos aliases en español e inglés y stubs mínimos para evitar errores de tipado.
  const vm: any = {
    // datos principales
    equipos,
    departamentos,
    currentProfesional,
    // modal control
    isDialogOpen: !!openModal,
    setIsDialogOpen: (v: boolean) => setOpenModal(v),
    // setters útiles
    setCurrentProfesional,
    // funciones de guardado: ProfesionalForm llama createOrUpdate(payload, id)
    createOrUpdate: (payload: any, id?: number) => saveProfessional(payload, id),
    // además incluimos algunos aliases / props que la otra firma del hook podría esperar:
    profesionales: professionals,       // alias en español
    professionals,                      // alias en inglés
    isLoading,                          // indicador global
    errorMessage: '',                   // stub (si el form esperaba un mensaje)
    filtroNombre: '',                   // stub
    setFiltroNombre: (_: string) => {}, // stub
    setDepartamentos,                   // permite que el form actualice departamentos si lo necesita
    setProfessionals,                   // permite que el form actualice la lista directamente
    // cualquier otro stub que necesites agregar, hacelo aquí como funciones no-op o mapeos
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50">
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
        <ProfessionalCard dashboardData={dashboardData} onAdd={openCreateModal} />

        <div className="shadow-sm border border-gray-200">
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Profesionales</h2>
              <p className="text-gray-600 mt-1">Gestión de profesionales del sistema</p>
            </div>
            <div>
              <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full sm:w-auto p-2 rounded">+ Agregar Profesional</button>
            </div>
          </div>
          <div className="p-4">
            <HomeProfessionalsList professionals={professionals} onEdit={openEditModal} onDelete={handleDelete} currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />
          </div>
        </div>
      </main>

      {/* Injectamos el formulario (ProfesionalForm) que ya contiene su propio Dialog */}
      <ProfesionalForm vm={vm} />
    </div>
  )
}
