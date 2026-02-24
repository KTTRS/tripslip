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
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {rq && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children || (
        <input
          required={rq}
          className={`w-full px-4 py-3 rounded-xl border ${
            err ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
          } focus:outline-none focus:ring-2 focus:ring-bus focus:border-transparent text-gray-900 placeholder-gray-400 transition-all ${className}`}
          {...props}
        />
      )}
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
