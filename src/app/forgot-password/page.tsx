'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wallet, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { forgotPassword } from '@/actions/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await forgotPassword(formData);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Error al enviar el email');
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
          <h1 className="text-2xl font-bold text-dark-900">Recuperar contraseña</h1>
          <p className="text-dark-500 mt-1">Te enviaremos un enlace para restablecerla</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-dark-900/5 p-8">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-dark-900 mb-2">¡Email enviado!</h3>
              <p className="text-sm text-dark-500 mb-6">
                Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
              </p>
              <Link href="/login">
                <Button variant="secondary" fullWidth>
                  <ArrowLeft className="w-4 h-4" /> Volver al login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-danger-50 border border-danger-500/20 text-sm text-danger-600">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-[38px] w-5 h-5 text-dark-400" />
                  <Input id="email" name="email" type="email" label="Email" placeholder="tu@email.com" required className="pl-10" />
                </div>
                <Button type="submit" fullWidth size="lg" loading={loading}>
                  Enviar enlace
                </Button>
              </form>
              <p className="text-center text-sm text-dark-500 mt-6">
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold flex items-center justify-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Volver al login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
