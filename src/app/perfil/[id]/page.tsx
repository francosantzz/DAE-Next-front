import PerfilProfesional from '../../../components/perfil-profesional'

export default function PerfilPage({ params }: { params: { id: string } }) {
  return <PerfilProfesional params={params} />
}