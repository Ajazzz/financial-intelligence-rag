interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'slate' | 'amber' | 'red' | 'blue';
  size?: 'sm' | 'xs';
}

const variants = {
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  slate: 'bg-slate-700/60 text-slate-300 border-slate-600/40',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export function Badge({ children, variant = 'slate', size = 'sm' }: BadgeProps) {
  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  return (
    <span className={`inline-flex items-center font-mono border rounded ${sizeClass} ${variants[variant]}`}>
      {children}
    </span>
  );
}
