import type { ButtonHTMLAttributes, ReactNode } from 'react';

const VARIANTS: Record<string, string> = {
  dark: 'bg-charcoal text-white hover:bg-charcoal/90 shadow-sm',
  accent: 'bg-bus text-charcoal hover:bg-bus-dark shadow-sm',
  light: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
  green: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  blue: 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm',
  ghost: 'text-gray-600 hover:bg-gray-100',
  red: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
};

const SIZES: Record<string, string> = {
  xs: 'px-2.5 py-1 text-xs gap-1',
  sm: 'px-3.5 py-2 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3.5 text-base gap-2',
  xl: 'px-8 py-4 text-lg gap-2.5',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  v?: keyof typeof VARIANTS;
  sz?: keyof typeof SIZES;
  full?: boolean;
  children: ReactNode;
}

export function Button({
  children,
  v = 'dark',
  sz = 'md',
  full,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] ${
        VARIANTS[v] || VARIANTS.dark
      } ${SIZES[sz] || SIZES.md} ${full ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
