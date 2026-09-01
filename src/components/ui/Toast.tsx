'use client';

import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success-500" />,
    error: <XCircle className="w-5 h-5 text-danger-500" />,
    info: <Info className="w-5 h-5 text-primary-500" />,
  };

  const bgColors = {
    success: 'bg-success-50 border-success-500/20',
    error: 'bg-danger-50 border-danger-500/20',
    info: 'bg-primary-50 border-primary-500/20',
  };

  return (
    <div className={`fixed top-4 right-4 z-[100] transition-all duration-300 ${isVisible ? 'animate-slide-down opacity-100' : 'opacity-0 translate-y-[-10px]'}`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${bgColors[type]}`}>
        {icons[type]}
        <p className="text-sm font-medium text-dark-800">{message}</p>
        <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} className="ml-2 p-1 rounded-lg hover:bg-black/5">
          <X className="w-4 h-4 text-dark-400" />
        </button>
      </div>
    </div>
  );
}

// Toast manager hook
interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const show = (message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const remove = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => remove(toast.id)}
        />
      ))}
    </div>
  );

  return { show, success: (msg: string) => show(msg, 'success'), error: (msg: string) => show(msg, 'error'), info: (msg: string) => show(msg, 'info'), ToastContainer };
}
