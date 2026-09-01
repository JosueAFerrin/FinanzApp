'use client';

import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      <p className="text-sm text-dark-500">{text}</p>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 space-y-4">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton h-8 w-32" />
      <div className="skeleton h-3 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-4">
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-3 w-24" />
          </div>
          <div className="skeleton h-5 w-20" />
        </div>
      ))}
    </div>
  );
}
