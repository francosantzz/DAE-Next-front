
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusCircle, Edit, Trash2, Plus, X } from 'lucide-react'
import Layout from '../../components/profesional/LayoutProf'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { useProfesional } from '@/hooks/useProfesional'
import FiltrosProfesionales from '@/components/ui/profesional/FiltrosProfesionales'
import ListProfesionales from '@/components/ui/profesional/ListProfesional'
import { useSession } from 'next-auth/react'
import { ProtectedRoute } from '@/components/ui/ProtectedRoute'

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
