'use client';

import { X } from 'lucide-react';
import { useEffect, useCallback } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-t-2xl sm:rounded-2xl w-full ${maxWidth} max-h-[90vh] overflow-hidden animate-slide-up shadow-2xl`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
          <h2 className="text-lg font-bold text-dark-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-dark-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-dark-500" />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
