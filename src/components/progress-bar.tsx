export function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const col =
    pct === 100
      ? 'bg-ts-green'
      : pct > 0
        ? 'bg-bus'
        : 'bg-gray-200';

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500">
          {value} of {total}
        </span>
        <span className="font-bold text-gray-800">{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${col}`}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
    </div>
  );
}
