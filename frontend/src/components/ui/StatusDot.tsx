interface StatusDotProps {
  online: boolean;
  label?: string;
}

export function StatusDot({ online, label }: StatusDotProps) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full ${
          online ? 'bg-emerald-400' : 'bg-slate-600'
        }`}
      />
      {label && (
        <span className={`text-xs font-mono ${online ? 'text-emerald-400' : 'text-slate-500'}`}>
          {label}
        </span>
      )}
    </span>
  );
}
