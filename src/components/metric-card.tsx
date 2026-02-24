import { Card } from './ui/card';

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
    <Card className="p-5 relative overflow-hidden">
      {accent && <div className={`absolute top-0 left-0 right-0 h-1 ${accent}`} />}
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black text-gray-900 mt-1 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Card>
  );
}
