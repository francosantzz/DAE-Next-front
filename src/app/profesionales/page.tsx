// app/profesionales/page.tsx (o pages/profesionales.tsx si usas pages/)
'use client'

import { useSession } from 'next-auth/react'
import Layout from '@/components/ui/profesional/LayoutProf'
import { ProtectedRoute } from '@/components/ui/ProtectedRoute'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { useProfesional } from '@/hooks/useProfesional'
import FiltrosProfesionales from '@/components/ui/profesional/FiltrosProfesionales'
import ListProfesionales from '@/components/ui/profesional/ListProfesional'

export default function ProfesionalesPage() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken

  const vm = useProfesional(token)

  return (
    <ProtectedRoute requiredPermission={{ entity: 'profesional', action: 'read' }}>
      <ErrorBoundary>
        <Layout>
          <div className="space-y-6">
            <FiltrosProfesionales vm={vm} />
            <ListProfesionales vm={vm} />
          </div>
        </Layout>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
