const COLORS: Record<string, string> = {
  COMPLETED: 'bg-ts-green text-white',
  PAID: 'bg-ts-green text-white',
  OPENED: 'bg-bus text-black',
  SENT: 'bg-black text-white',
  ACTIVE: 'bg-bus text-black',
  PENDING: 'bg-black/10 text-black/60',
  DRAFT: 'bg-black/10 text-black/60',
  UNPAID: 'bg-bus text-black',
  PARTIAL: 'bg-ts-lavender text-white',
  WAIVED: 'bg-ts-blue text-white',
  REQUIRED: 'bg-ts-red text-white',
  OPTIONAL: 'bg-black/10 text-black/50',
};

export function Badge({ status, sm }: { status: string; sm?: boolean }) {
  const c = COLORS[status] || COLORS.PENDING;
  return (
    <span
      className={`inline-flex items-center font-bold tracking-wide rounded-full ${
        sm ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      } ${c}`}
    >
      {status}
    </span>
  );
}
