import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  dark,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl shadow-sm ${
        dark
          ? 'bg-black text-white'
          : 'bg-white border border-black/8'
      } ${className}`}
    >
      {children}
    </div>
  );
}
