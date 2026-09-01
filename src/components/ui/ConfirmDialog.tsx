'use client';

import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Eliminar',
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 animate-scale-in shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-dark-100 transition-colors">
          <X className="w-4 h-4 text-dark-400" />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-danger-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-danger-500" />
          </div>
          <h3 className="text-lg font-bold text-dark-900 mb-2">{title}</h3>
          <p className="text-sm text-dark-500 mb-6">{message}</p>
          <div className="flex gap-3 w-full">
            <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="danger" fullWidth onClick={onConfirm} loading={loading}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
