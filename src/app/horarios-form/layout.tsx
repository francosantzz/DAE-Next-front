import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "DAE - Formulario de Carga Horaria",
  icons: {
    icon: "/dge_mendoza_logo.jpg",
  },
}

type LayoutProps = {
  children: React.ReactNode
}

export default function HorariosFormLayout({ children }: LayoutProps) {
  return <>{children}</>
}
