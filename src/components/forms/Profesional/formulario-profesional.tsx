'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { XIcon } from "lucide-react"; // Icono de la cruz para cerrar

export function FormularioProfesionalComponent({ onClose }) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    calle: '',
    numero: '',
    departamento: '',
    equipo: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleDepartamentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prevData => ({
      ...prevData,
      departamento: e.target.value
    }));
  };

  const handleEquipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prevData => ({
      ...prevData,
      equipo: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Datos del formulario:', formData);
    // Aquí puedes agregar la lógica para enviar los datos a tu backend
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <Card className="relative w-full max-w-2xl mx-auto">
        {/* Botón para cerrar el modal */}
        <button
          className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <XIcon className="w-6 h-6" />
        </button>

        <CardHeader>
          <CardTitle className="text-2xl font-bold">Registro de Profesional</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input id="apellido" name="apellido" value={formData.apellido} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calle">Calle</Label>
                <Input id="calle" name="calle" value={formData.calle} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" name="numero" value={formData.numero} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento</Label>
              <select
                id="departamento"
                value={formData.departamento}
                onChange={handleDepartamentoChange}
                required
                className="border rounded-md p-2 w-full focus:outline-none focus:ring focus:ring-blue-500"
              >
                <option value="">Selecciona un departamento</option>
                <option value="ventas">Ventas</option>
                <option value="marketing">Marketing</option>
                <option value="desarrollo">Desarrollo</option>
                <option value="recursos-humanos">Recursos Humanos</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipo">Equipo</Label>
              <select
                id="equipo"
                value={formData.equipo}
                onChange={handleEquipoChange}
                required
                className="border rounded-md p-2 w-full focus:outline-none focus:ring focus:ring-blue-500"
              >
                <option value="">Selecciona un equipo</option>
                <option value="alfa">Equipo Alfa</option>
                <option value="beta">Equipo Beta</option>
                <option value="gamma">Equipo Gamma</option>
                <option value="delta">Equipo Delta</option>
              </select>
            </div>

            <Button type="submit" className="w-full">Registrar Profesional</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
