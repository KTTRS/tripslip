import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  err?: string;
  children?: ReactNode;
}

export function Input({ label, err, children, required: rq, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-bold text-black">
          {label}
          {rq && <span className="text-bus ml-1">*</span>}
        </label>
      )}
      {children || (
        <input
          required={rq}
          className={`w-full px-4 py-3 rounded-xl border-2 ${
            err ? 'border-ts-red ring-1 ring-ts-red' : 'border-black/10'
          } bg-white focus:outline-none focus:border-bus focus:ring-2 focus:ring-bus/30 text-black placeholder-black/30 transition-all font-medium ${className}`}
          {...props}
        />
      )}
      {err && <p className="text-xs text-ts-red font-semibold">{err}</p>}
    </div>
  );
}
