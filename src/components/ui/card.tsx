import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  dark,
  hover,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border-[2.5px] border-black ${
        dark
          ? 'bg-black text-white'
          : 'bg-white'
      } ${
        hover
          ? 'transition-all duration-200 cursor-default hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_#0A0A0A]'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
