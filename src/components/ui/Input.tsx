'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-dark-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border bg-white text-dark-900 text-sm',
            'transition-all duration-200',
            'placeholder:text-dark-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            error ? 'border-danger-500 focus:ring-danger-500' : 'border-dark-200 hover:border-dark-300',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger-500 mt-1">{error}</p>}
        {hint && !error && <p className="text-xs text-dark-400 mt-1">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
