import { motion } from 'framer-motion'
import { Activity, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

export default function StatsCard({ trends }) {
  const {
    averageGlucose,
    estimatedA1C,
    totalEntries,
    inRangeCount,
    borderlineCount,
    highCount,
    lowCount
  } = trends || {}

  const getA1CColor = (a1c) => {
    if (!a1c) return 'text-slate-300'
    if (a1c < 7) return 'text-emerald-300'
    if (a1c < 8) return 'text-amber-300'
    return 'text-rose-300'
  }

  const total = totalEntries || 0
  const pct = (n) => (total > 0 ? ((n / total) * 100).toFixed(0) : 0)

  const barSegments = [
    { value: lowCount || 0, color: 'bg-cyan-500', label: 'Low' },
    { value: inRangeCount || 0, color: 'bg-emerald-500', label: 'In Range' },
    { value: borderlineCount || 0, color: 'bg-amber-500', label: 'Borderline' },
    { value: highCount || 0, color: 'bg-rose-500', label: 'High' }
  ]
  const totalBar = barSegments.reduce((s, b) => s + b.value, 0) || 1

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      <div className="rounded-2xl sm:rounded-[1.75rem] border border-slate-800/90 bg-slate-900/90 p-4 sm:p-5 shadow-xl shadow-slate-950/20">
        <div className="flex items-center justify-between gap-3 text-slate-400">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.28em]">Avg Glucose</span>
          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-sky-400 shrink-0" />
        </div>
        <div className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-semibold text-white">{averageGlucose ? `${averageGlucose} mmol/L` : '—'}</div>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-400">Mean glucose over the tracked period.</p>
      </div>

      <div className="rounded-2xl sm:rounded-[1.75rem] border border-slate-800/90 bg-gradient-to-br from-violet-600/90 to-slate-900/90 p-4 sm:p-5 shadow-xl shadow-slate-950/20">
        <div className="flex items-center justify-between gap-3 text-slate-200">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.28em]">Est. A1C</span>
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-violet-300 shrink-0" />
        </div>
        <div className={`mt-4 sm:mt-6 text-2xl sm:text-3xl font-semibold ${getA1CColor(estimatedA1C)}`}>{estimatedA1C ? `${estimatedA1C}%` : '—'}</div>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-300">
          {estimatedA1C != null
            ? estimatedA1C < 7
              ? `Well controlled — target < 7%`
              : estimatedA1C < 8
                ? 'Moderate — consider treatment adjustment'
                : 'Elevated — clinical review advised'
            : 'Estimated long-term glucose control.'}
        </p>
      </div>

      <div className="rounded-2xl sm:rounded-[1.75rem] border border-slate-800/90 bg-slate-900/90 p-4 sm:p-5 shadow-xl shadow-slate-950/20">
        <div className="flex items-center justify-between gap-3 text-slate-400">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.28em]">In Range</span>
          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-300 shrink-0" />
        </div>
        <div className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-semibold text-emerald-300">{inRangeCount ?? 0}</div>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-400">{pct(inRangeCount)}% of readings inside target range.</p>
        <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs uppercase tracking-[0.24em] text-slate-500">of {total} readings</p>
      </div>

      <div className="rounded-2xl sm:rounded-[1.75rem] border border-slate-800/90 bg-slate-900/90 p-4 sm:p-5 shadow-xl shadow-slate-950/20">
        <div className="flex items-center justify-between gap-3 text-slate-400">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.28em]">Risk Distribution</span>
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300 shrink-0" />
        </div>

        {/* Stacked bar chart */}
        <div className="mt-4 sm:mt-5 flex h-2.5 sm:h-3 w-full overflow-hidden rounded-full bg-slate-800">
          {barSegments.map((seg) => {
            const width = (seg.value / totalBar) * 100
            return width > 0 ? (
              <div
                key={seg.label}
                style={{ width: `${width}%` }}
                className={`${seg.color} first:rounded-l-full last:rounded-r-full transition-all`}
                title={`${seg.label}: ${seg.value} (${pct(seg.value)}%)`}
              />
            ) : null
          })}
        </div>

        {/* Legend with counts and percentages */}
        <div className="mt-3 sm:mt-4 flex flex-col gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-block size-2 sm:size-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="text-slate-400">High (&gt;10.0)</span>
            <span className="ml-auto font-medium text-rose-300">{highCount ?? 0}</span>
            <span className="text-slate-500">({pct(highCount)}%)</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-block size-2 sm:size-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-slate-400">Borderline (7.1–10.0)</span>
            <span className="ml-auto font-medium text-amber-300">{borderlineCount ?? 0}</span>
            <span className="text-slate-500">({pct(borderlineCount)}%)</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-block size-2 sm:size-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-400">In Range (3.9–6.1)</span>
            <span className="ml-auto font-medium text-emerald-300">{inRangeCount ?? 0}</span>
            <span className="text-slate-500">({pct(inRangeCount)}%)</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-block size-2 sm:size-2.5 rounded-full bg-cyan-500 shrink-0" />
            <span className="text-slate-400">Low (&lt;4.0)</span>
            <span className="ml-auto font-medium text-cyan-300">{lowCount ?? 0}</span>
            <span className="text-slate-500">({pct(lowCount)}%)</span>
          </div>
        </div>

        <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-400">
          {total > 0
            ? highCount + lowCount > 0
              ? `${pct(highCount + lowCount)}% of readings outside safe range — monitor closely`
              : 'All readings within safe range'
            : 'No recent entries to evaluate.'}
        </p>
      </div>
    </motion.div>
  )
}
