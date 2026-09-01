'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Lock, ShieldCheck, CheckCircle } from 'lucide-react';
import { resetPassword } from '@/actions/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await resetPassword(formData);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } else {
      setError(result.error || 'Error');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-xl shadow-primary-500/30 mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-dark-900">Nueva contraseña</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-dark-900/5 p-8">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-dark-900 mb-2">¡Contraseña actualizada!</h3>
              <p className="text-sm text-dark-500">Redirigiendo...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-danger-50 border border-danger-500/20 text-sm text-danger-600">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-[38px] w-5 h-5 text-dark-400" />
                  <Input id="password" name="password" type="password" label="Nueva contraseña" placeholder="Mínimo 8 caracteres" required className="pl-10" hint="Mínimo 8 caracteres, una mayúscula y un número" />
                </div>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-[38px] w-5 h-5 text-dark-400" />
                  <Input id="confirmPassword" name="confirmPassword" type="password" label="Confirmar contraseña" placeholder="Repite tu contraseña" required className="pl-10" />
                </div>
                <Button type="submit" fullWidth size="lg" loading={loading}>
                  Cambiar contraseña
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
