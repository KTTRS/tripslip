export function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-black/50 font-medium">
          {value} of {total}
        </span>
        <span className="font-black text-black">{pct}%</span>
      </div>
      <div className="w-full bg-black/10 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            pct === 100 ? 'bg-ts-green' : 'bg-bus'
          }`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}
