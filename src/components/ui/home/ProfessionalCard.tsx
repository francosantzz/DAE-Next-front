// File: src/components/ProfessionalCard.tsx
import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/genericos/card'
import { UsersIcon, TrendingUpIcon, ClockIcon, UserCheckIcon } from 'lucide-react'
import { DashboardData } from './useHomeProfessional'

export function ProfessionalCard({ dashboardData, onAdd }: { dashboardData: DashboardData, onAdd: () => void }) {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Total de Profesionales</CardTitle>
          <div className="bg-blue-50 rounded-full p-2"><UsersIcon className="w-5 h-5 text-blue-600"/></div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{dashboardData.totalProfessionals}</div>
          <div className="flex items-center mt-2"><TrendingUpIcon className="w-4 h-4 mr-1 text-blue-500"/><p className="text-sm text-gray-600">+{dashboardData.newProfessionalsThisMonth} nuevos este mes</p></div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Paquetes de Horas</CardTitle>
          <div className="bg-gray-50 rounded-full p-2"><ClockIcon className="w-5 h-5 text-gray-400"/></div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-400">--</div>
          <p className="text-sm text-gray-500 mt-2">Datos no disponibles temporalmente</p>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Equipos</CardTitle>
          <div className="bg-purple-50 rounded-full p-2"><UserCheckIcon className="w-5 h-5 text-purple-600"/></div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{dashboardData.totalTeams}</div>
          <div className="flex items-center mt-2"><TrendingUpIcon className="w-4 h-4 mr-1 text-purple-500"/><p className="text-sm text-gray-600">+{dashboardData.newTeamsThisMonth} nuevo este mes</p></div>
        </CardContent>
      </Card>
    </div>
  )
}
