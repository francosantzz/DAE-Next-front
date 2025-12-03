'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/genericos/button"
import { Input } from "@/components/ui/genericos/input"
import { Label } from "@/components/ui/genericos/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/genericos/card"
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  general?: string;
}

export default function Registerpage() {

  const [errors, setErrors] = useState<FormErrors>({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validación del nombre
    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    // Validación del email
    if (!email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    // Validación de la contraseña
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Manejo del envío de los datos
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Valida el formulario antes de intentar hacer el registro
    if (!validateForm()) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      }
    );

    const responseAPI = await res.json();

    if (!res.ok) {
      setErrors({ general: responseAPI.message || 'Error al registrarse' });
      return;
    }

    // Intenta el login con next-auth si el registro fue exitoso
    const responseNextAuth = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    // Si hay error en la respuesta de next-auth
    if (responseNextAuth?.error) {
      let newErrors: FormErrors = {};
      try {
        const backendErrors = JSON.parse(responseNextAuth.error);
        if (backendErrors.email) newErrors.email = backendErrors.email;
        if (backendErrors.password) newErrors.password = backendErrors.password;
        if (backendErrors.message) newErrors.general = backendErrors.message;
      } catch (err) {
        newErrors.general = responseNextAuth.error;
      }

      setErrors(newErrors);
      return;
    }

    // Redirige si el login es exitoso
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Registrarse</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mostrar errores generales */}
            {errors.general && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{errors.general}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                type="text"
                placeholder="Tu nombre"
                name="name"
                className={`form-control mb-2 ${errors.name ? 'border-red-500' : ''}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full ${errors.email ? 'border-red-500' : ''}`}
                placeholder="tu@email.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white">
              Registrarse
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
