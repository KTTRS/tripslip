export function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className={`rounded-xl p-5 relative overflow-hidden border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[5px_5px_0px_#0A0A0A] hover:-translate-y-0.5 transition-all ${
      accent === 'bg-bus'
        ? 'bg-[#F5C518]/10 text-black'
        : accent === 'bg-black'
          ? 'bg-black text-white'
          : 'bg-white'
    }`}>
      {accent && accent !== 'bg-bus' && accent !== 'bg-black' && (
        <div className={`absolute top-0 left-0 w-1.5 h-full ${accent}`} />
      )}
      <p className={`text-[11px] font-bold uppercase tracking-widest ${
        accent === 'bg-bus' ? 'text-black/50' : accent === 'bg-black' ? 'text-white/50' : 'text-black/40'
      }`}>{label}</p>
      <p className={`text-3xl font-black mt-1 tracking-tight ${
        accent === 'bg-bus' ? 'text-black' : accent === 'bg-black' ? 'text-bus' : 'text-black'
      }`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${
        accent === 'bg-bus' ? 'text-black/50' : accent === 'bg-black' ? 'text-white/40' : 'text-black/40'
      }`}>{sub}</p>}
    </div>
  );
}
