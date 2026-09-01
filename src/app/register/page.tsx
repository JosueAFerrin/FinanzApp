'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wallet, Mail, Lock, ShieldCheck } from 'lucide-react';
import { signUp } from '@/actions/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signUp(formData);

    if (result.success) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setError(result.error || 'Error al crear la cuenta');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-xl shadow-primary-500/30 mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-dark-900">Crear cuenta</h1>
          <p className="text-dark-500 mt-1">Comienza a controlar tus finanzas</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-dark-900/5 p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-danger-50 border border-danger-500/20 text-sm text-danger-600 animate-slide-down">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-[38px] w-5 h-5 text-dark-400" />
              <Input id="email" name="email" type="email" label="Email" placeholder="tu@email.com" required className="pl-10" autoComplete="email" />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-[38px] w-5 h-5 text-dark-400" />
              <Input id="password" name="password" type="password" label="Contraseña" placeholder="Mínimo 8 caracteres" required className="pl-10" autoComplete="new-password" hint="Mínimo 8 caracteres, una mayúscula y un número" />
            </div>

            <div className="relative">
              <ShieldCheck className="absolute left-3 top-[38px] w-5 h-5 text-dark-400" />
              <Input id="confirmPassword" name="confirmPassword" type="password" label="Confirmar contraseña" placeholder="Repite tu contraseña" required className="pl-10" autoComplete="new-password" />
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Crear cuenta
            </Button>
          </form>

          <p className="text-center text-sm text-dark-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
