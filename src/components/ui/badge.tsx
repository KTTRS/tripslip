const COLORS: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  OPENED: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  SENT: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  PENDING: 'bg-gray-50 text-gray-500 ring-gray-500/10',
  UNPAID: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  PARTIAL: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  WAIVED: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  REQUIRED: 'bg-red-50 text-red-600 ring-red-600/20',
  OPTIONAL: 'bg-gray-50 text-gray-400 ring-gray-400/10',
};

export function Badge({ status, sm }: { status: string; sm?: boolean }) {
  const c = COLORS[status] || COLORS.PENDING;
  return (
    <span
      className={`inline-flex items-center font-semibold tracking-wide rounded-full ring-1 ring-inset ${
        sm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      } ${c}`}
    >
      {status}
    </span>
  );
}
