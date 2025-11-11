"use client";

import { ScrollArea } from "@radix-ui/react-scroll-area";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { useProfesional } from "@/hooks/useProfesional";
import FiltrosProfesionales from "@/components/ui/profesional/FiltrosProfesionales";
import ListProfesionales from "@/components/ui/profesional/ListProfesional";
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import Layout from "@/components/ui/profesional/LayoutProf";
import { Paginator } from "@/components/ui/Paginator";

export default function ProfesionalesPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const vm = useProfesional(token);

  return (
    <ProtectedRoute
      requiredPermission={{ entity: "profesional", action: "read" }}
    >
      <ErrorBoundary>
        <Layout>
          <div className="space-y-6">
            <FiltrosProfesionales vm={vm} />
            <ListProfesionales vm={vm} />
          </div>
        </Layout>
        <Paginator
          page={vm.currentPage}
          totalPages={vm.totalPages}
          onPageChange={vm.setCurrentPage}
        />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
