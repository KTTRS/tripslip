const COLORS: Record<string, string> = {
  COMPLETED: 'bg-[#D9F5E8] border-ts-green text-[#005A28]',
  PAID: 'bg-[#D9F5E8] border-ts-green text-[#005A28]',
  OPENED: 'bg-bus border-black text-black',
  SENT: 'bg-black border-black text-bus',
  ACTIVE: 'bg-bus border-black text-black',
  PENDING: 'bg-white border-black/20 text-black/50',
  DRAFT: 'bg-white border-black/20 text-black/50',
  UNPAID: 'bg-bus border-black text-black',
  PARTIAL: 'bg-ts-lavender border-ts-lavender text-white',
  WAIVED: 'bg-ts-blue border-ts-blue text-white',
  REQUIRED: 'bg-[#FEEAE9] border-ts-red text-ts-red',
  OPTIONAL: 'bg-white border-black/20 text-black/40',
};

export function Badge({ status, sm }: { status: string; sm?: boolean }) {
  const c = COLORS[status] || COLORS.PENDING;
  return (
    <span
      className={`inline-flex items-center font-mono font-bold tracking-wider uppercase rounded-full border-2 ${
        sm ? 'px-2.5 py-0.5 text-[9px]' : 'px-3 py-1 text-[11px]'
      } ${c}`}
    >
      {status}
    </span>
  );
}
