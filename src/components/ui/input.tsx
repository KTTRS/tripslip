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
          {rq && <span className="text-ts-red ml-1">*</span>}
        </label>
      )}
      {children || (
        <input
          required={rq}
          className={`w-full px-4 py-3 rounded-lg border-[2.5px] ${
            err ? 'border-ts-red focus:shadow-[0_0_0_3px_rgba(230,56,48,0.18)]' : 'border-black'
          } bg-white focus:outline-none focus:shadow-[0_0_0_3px_#FFD100] text-black placeholder-black/30 transition-all font-medium ${className}`}
          {...props}
        />
      )}
      {err && <p className="text-xs text-ts-red font-semibold">{err}</p>}
    </div>
  );
}
