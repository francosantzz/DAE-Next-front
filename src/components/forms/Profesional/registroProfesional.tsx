import FormularioGenerico from "../formulario-generico-revisado"

export default function FormularioRegistro() {
  const campos = [
    { name: 'nombre', label: 'Nombre', type: 'text' as const, required: true },
    { name: 'email', label: 'Correo Electrónico', type: 'text' as const, required: true },
    { 
      name: 'rol', 
      label: 'Rol', 
      type: 'select' as const, 
      required: true,
      options: [
        { value: 'estudiante', label: 'Estudiante' },
        { value: 'profesor', label: 'Profesor' },
        { value: 'administrativo', label: 'Administrativo' },
      ]
    },
    { 
      name: 'departamento', 
      label: 'Departamento', 
      type: 'select' as const, 
      required: true,
      options: [
        { value: 'matematicas', label: 'Matemáticas' },
        { value: 'literatura', label: 'Literatura' },
        { value: 'ciencias', label: 'Ciencias' },
      ]
    },
  ]

  const handleSubmit = (data: Record<string, string>) => {
    console.log('Datos del registro:', data)
    // Aquí puedes agregar la lógica para enviar los datos a tu backend
  }

  return (
    <FormularioGenerico
      title="Registro de Usuario"
      fields={campos}
      onSubmit={handleSubmit}
    />
  )
}