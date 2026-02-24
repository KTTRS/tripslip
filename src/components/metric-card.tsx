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
    <div className={`rounded-3xl border-[2.5px] border-black p-5 relative overflow-hidden ${
      accent === 'bg-bus'
        ? 'bg-bus text-black'
        : accent === 'bg-black'
          ? 'bg-black text-white'
          : 'bg-white'
    }`}>
      <p className={`font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${
        accent === 'bg-bus' ? 'text-black/50' : accent === 'bg-black' ? 'text-white/50' : 'text-black/40'
      }`}>{label}</p>
      <p className={`font-display text-3xl font-black mt-1 tracking-tight ${
        accent === 'bg-bus' ? 'text-black' : accent === 'bg-black' ? 'text-bus' : 'text-black'
      }`}>{value}</p>
      {sub && <p className={`text-xs mt-1 font-medium ${
        accent === 'bg-bus' ? 'text-black/50' : accent === 'bg-black' ? 'text-white/40' : 'text-black/40'
      }`}>{sub}</p>}
    </div>
  );
}
