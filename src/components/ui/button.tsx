import type { ButtonHTMLAttributes, ReactNode } from 'react';

const VARIANTS: Record<string, string> = {
  primary:
    'bg-bus text-black font-bold border-[2.5px] border-black shadow-[5px_5px_0px_#0A0A0A] hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[8px_8px_0px_#0A0A0A]',
  dark:
    'bg-black text-white font-bold border-[2.5px] border-black shadow-[5px_5px_0px_#FFD100] hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[8px_8px_0px_#FFD100]',
  outline:
    'bg-white text-black font-bold border-[2.5px] border-black shadow-[5px_5px_0px_#0A0A0A] hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[8px_8px_0px_#0A0A0A]',
  ghost:
    'text-black font-semibold border-[2.5px] border-black hover:bg-black/5',
  green:
    'bg-ts-green text-white font-bold border-[2.5px] border-black shadow-[5px_5px_0px_#0A0A0A] hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[8px_8px_0px_#0A0A0A]',
  red:
    'bg-ts-red/10 text-ts-red font-bold border-2 border-ts-red/30 hover:bg-ts-red/20',
  yellow:
    'bg-bus-light text-black font-bold border-2 border-bus hover:bg-bus/30',
};

const SIZES: Record<string, string> = {
  xs: 'px-3 py-1.5 text-xs gap-1',
  sm: 'px-5 py-2 text-sm gap-1.5',
  md: 'px-8 py-3.5 text-sm gap-2',
  lg: 'px-10 py-4 text-base gap-2',
  xl: 'px-12 py-5 text-lg gap-2.5',
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
      className={`inline-flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-bus focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[5px_5px_0px_#0A0A0A] ${
        VARIANTS[v] || VARIANTS.primary
      } ${SIZES[sz] || SIZES.md} ${full ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
