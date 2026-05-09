interface ScoreBarProps {
  score: number;
  label?: string;
  colorClass?: string;
}

export function ScoreBar({ score, label, colorClass = 'bg-emerald-500' }: ScoreBarProps) {
  const pct = Math.round(score * 100);
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">{label}</span>
          <span className="text-xs font-mono text-slate-300">{pct}%</span>
        </div>
      )}
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
