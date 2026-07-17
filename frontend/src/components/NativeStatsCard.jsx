import { Activity, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const getA1CColor = (a1c) => {
  if (!a1c) return 'text-slate-300';
  if (a1c < 7) return 'text-emerald-300';
  if (a1c < 8) return 'text-amber-300';
  return 'text-rose-300';
};

const pct = (n, total) => (total > 0 ? ((n / total) * 100).toFixed(0) : 0);

export default function NativeStatsCard({ trends }) {
  const { averageGlucose, estimatedA1C, totalEntries, inRangeCount, borderlineCount, highCount, lowCount } =
    trends || {};

  const total = totalEntries || 0;

  const barSegments = [
    { value: lowCount || 0, color: 'bg-cyan-500', label: 'Low' },
    { value: inRangeCount || 0, color: 'bg-emerald-500', label: 'In Range' },
    { value: borderlineCount || 0, color: 'bg-amber-500', label: 'Borderline' },
    { value: highCount || 0, color: 'bg-rose-500', label: 'High' },
  ];
  const totalBar = barSegments.reduce((s, b) => s + b.value, 0) || 1;

  const hasRiskData = total > 0;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {/* Avg Glucose */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 p-3.5 shadow-xl shadow-slate-950/20">
        <div className="flex items-center justify-between gap-1.5 text-slate-400">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Avg Glu</span>
          <Activity className="h-3.5 w-3.5 text-sky-400 shrink-0" />
        </div>
        <div className="mt-2 text-xl font-semibold text-white leading-none">
          {averageGlucose ? `${averageGlucose} mmol/L` : '—'}
        </div>
        <p className="mt-1.5 text-[11px] leading-tight text-slate-400">Mean glucose over period</p>
      </div>

      {/* Est. A1C */}
      <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-br from-violet-600/90 to-slate-900/90 p-3.5 shadow-xl shadow-slate-950/20">
        <div className="flex items-center justify-between gap-1.5 text-slate-200">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Est. A1C</span>
          <TrendingUp className="h-3.5 w-3.5 text-violet-300 shrink-0" />
        </div>
        <div className={`mt-2 text-xl font-semibold leading-none ${getA1CColor(estimatedA1C)}`}>
          {estimatedA1C ? `${estimatedA1C}%` : '—'}
        </div>
        <p className="mt-1.5 text-[11px] leading-tight text-slate-300">
          {estimatedA1C != null
            ? estimatedA1C < 7
              ? 'Well controlled'
              : estimatedA1C < 8
                ? 'Moderate'
                : 'Elevated'
            : 'Long-term control'}
        </p>
      </div>

      {/* In Range */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 p-3.5 shadow-xl shadow-slate-950/20">
        <div className="flex items-center justify-between gap-1.5 text-slate-400">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">In Range</span>
          <CheckCircle className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-xl font-semibold text-emerald-300 leading-none">{inRangeCount ?? 0}</span>
          <span className="text-[11px] text-slate-500">/ {total}</span>
        </div>
        <p className="mt-1.5 text-[11px] leading-tight text-slate-400">
          {pct(inRangeCount, total)}% of readings in target
        </p>
      </div>

      {/* Risk Distribution */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 p-3.5 shadow-xl shadow-slate-950/20">
        <div className="flex items-center justify-between gap-1.5 text-slate-400">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Risk</span>
          <AlertCircle className="h-3.5 w-3.5 text-amber-300 shrink-0" />
        </div>

        {/* Stacked bar */}
        <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
          {barSegments.map((seg) => {
            const width = (seg.value / totalBar) * 100;
            return width > 0 ? (
              <div
                key={seg.label}
                style={{ width: `${width}%` }}
                className={`${seg.color} first:rounded-l-full last:rounded-r-full transition-all`}
              />
            ) : null;
          })}
        </div>

        {/* Compact legend - only active segments */}
        {hasRiskData && (
          <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
            {barSegments.map((seg) => {
              if (seg.value <= 0) return null;
              return (
                <span key={seg.label} className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className={`inline-block size-1.5 rounded-full ${seg.color}`} />
                  {seg.label === 'In Range' ? 'OK' : seg.label.slice(0, 2)}
                  <span className="font-medium text-slate-300">{pct(seg.value, total)}%</span>
                </span>
              );
            })}
          </div>
        )}

        <p className="mt-1.5 text-[11px] leading-tight text-slate-400">
          {total > 0
            ? `${pct(Number(highCount || 0) + Number(lowCount || 0), total)}% out of range`
            : 'No recent entries'}
        </p>
      </div>
    </div>
  );
}
