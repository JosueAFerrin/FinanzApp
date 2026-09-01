'use client';

import { useState } from 'react';
import { User, Lock, Shield } from 'lucide-react';
import { resetPassword } from '@/actions/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const { success, error: showError, ToastContainer } = useToast();

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await resetPassword(formData);
    if (result.success) {
      success('Contraseña actualizada correctamente');
      e.currentTarget.reset();
    } else {
      showError(result.error || 'Error al cambiar la contraseña');
    }
    setLoading(false);
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl">
      <ToastContainer />
      <div>
        <h1 className="text-2xl font-bold text-dark-900">Configuración</h1>
        <p className="text-dark-500 text-sm">Administra tu cuenta y preferencias</p>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-2xl p-6 border border-dark-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-dark-900">Cambiar contraseña</h2>
            <p className="text-xs text-dark-500">Actualiza tu contraseña de acceso</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input id="password" name="password" type="password" label="Nueva contraseña" placeholder="Mínimo 8 caracteres" required hint="Mínimo 8 caracteres, una mayúscula y un número" />
          <Input id="confirmPassword" name="confirmPassword" type="password" label="Confirmar contraseña" placeholder="Repite la contraseña" required />
          <Button type="submit" loading={loading}>Cambiar contraseña</Button>
        </form>
      </div>

      {/* Security Info */}
      <div className="bg-white rounded-2xl p-6 border border-dark-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-success-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-dark-900">Seguridad</h2>
            <p className="text-xs text-dark-500">Información de seguridad de tu cuenta</p>
          </div>
        </div>
        <div className="space-y-3 text-sm text-dark-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success-500" />
            <span>Datos protegidos con Row Level Security</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success-500" />
            <span>Sesión segura con cookies HttpOnly</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success-500" />
            <span>Contraseñas hasheadas con bcrypt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success-500" />
            <span>Validación de datos en servidor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
