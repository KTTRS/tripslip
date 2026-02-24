import type { ButtonHTMLAttributes, ReactNode } from 'react';

const VARIANTS: Record<string, string> = {
  primary: 'bg-bus text-black font-bold hover:bg-bus-dark shadow-md hover:shadow-lg',
  dark: 'bg-black text-white font-bold hover:bg-black/85 shadow-md',
  outline: 'bg-white text-black font-bold border-2 border-black hover:bg-black hover:text-white',
  ghost: 'text-black/60 font-semibold hover:bg-bus/10 hover:text-black',
  green: 'bg-ts-green text-white font-bold hover:bg-ts-green/90 shadow-md',
  red: 'bg-ts-red/10 text-ts-red font-bold border border-ts-red/20 hover:bg-ts-red/20',
  yellow: 'bg-bus/15 text-black font-bold border border-bus hover:bg-bus/30',
};

const SIZES: Record<string, string> = {
  xs: 'px-3 py-1.5 text-xs gap-1',
  sm: 'px-4 py-2 text-sm gap-1.5',
  md: 'px-6 py-3 text-sm gap-2',
  lg: 'px-8 py-4 text-base gap-2',
  xl: 'px-10 py-5 text-lg gap-2.5',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  v?: keyof typeof VARIANTS;
  sz?: keyof typeof SIZES;
  full?: boolean;
  children: ReactNode;
}

export function Button({
  children,
  v = 'primary',
  sz = 'md',
  full,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-bus focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] ${
        VARIANTS[v] || VARIANTS.primary
      } ${SIZES[sz] || SIZES.md} ${full ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
