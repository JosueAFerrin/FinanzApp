'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wallet, Mail, Lock } from 'lucide-react';
import { signIn } from '@/actions/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn(formData);

    if (result.success) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setError(result.error || 'Error al iniciar sesión');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-xl shadow-primary-500/30 mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-dark-900">Bienvenido de vuelta</h1>
          <p className="text-dark-500 mt-1">Ingresa a tu cuenta de FinanzApp</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl shadow-dark-900/5 p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-danger-50 border border-danger-500/20 text-sm text-danger-600 animate-slide-down">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-[38px] w-5 h-5 text-dark-400" />
              <Input
                id="email"
                name="email"
                type="email"
                label="Email"
                placeholder="tu@email.com"
                required
                className="pl-10"
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-[38px] w-5 h-5 text-dark-400" />
              <Input
                id="password"
                name="password"
                type="password"
                label="Contraseña"
                placeholder="••••••••"
                required
                className="pl-10"
                autoComplete="current-password"
              />
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Iniciar sesión
            </Button>
          </form>

          <p className="text-center text-sm text-dark-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
