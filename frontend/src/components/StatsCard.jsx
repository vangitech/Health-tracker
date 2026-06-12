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

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      <div className="rounded-[1.75rem] border border-slate-800/90 bg-slate-900/90 p-5 shadow-xl shadow-slate-950/20">
        <div className="flex items-center justify-between gap-3 text-slate-400">
          <span className="text-xs uppercase tracking-[0.28em]">Avg Glucose</span>
          <Activity className="h-5 w-5 text-sky-400" />
        </div>
        <div className="mt-6 text-3xl font-semibold text-white">{averageGlucose ? `${averageGlucose} mmol/L` : '—'}</div>
        <p className="mt-2 text-sm text-slate-400">Your latest glucose average for better balance.</p>
      </div>

      <div className="rounded-[1.75rem] border border-slate-800/90 bg-gradient-to-br from-violet-600/90 to-slate-900/90 p-5 shadow-xl shadow-slate-950/20">
        <div className="flex items-center justify-between gap-3 text-slate-200">
          <span className="text-xs uppercase tracking-[0.28em]">Est. A1C</span>
          <TrendingUp className="h-5 w-5 text-violet-300" />
        </div>
        <div className={`mt-6 text-3xl font-semibold ${getA1CColor(estimatedA1C)}`}>{estimatedA1C ? `${estimatedA1C}%` : '—'}</div>
        <p className="mt-2 text-sm text-slate-300">Estimated long-term glucose control.</p>
      </div>

      <div className="rounded-[1.75rem] border border-slate-800/90 bg-slate-900/90 p-5 shadow-xl shadow-slate-950/20">
        <div className="flex items-center justify-between gap-3 text-slate-400">
          <span className="text-xs uppercase tracking-[0.28em]">In Range</span>
          <CheckCircle className="h-5 w-5 text-emerald-300" />
        </div>
        <div className="mt-6 text-3xl font-semibold text-emerald-300">{inRangeCount ?? 0}</div>
        <p className="mt-2 text-sm text-slate-400">Entries inside the ideal glucose zone.</p>
        <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">of {totalEntries ?? 0} readings</p>
      </div>

      <div className="rounded-[1.75rem] border border-slate-800/90 bg-slate-900/90 p-5 shadow-xl shadow-slate-950/20">
        <div className="flex items-center justify-between gap-3 text-slate-400">
          <span className="text-xs uppercase tracking-[0.28em]">High / Low</span>
          <AlertCircle className="h-5 w-5 text-amber-300" />
        </div>
        <div className="mt-6 flex items-center gap-4 text-sm text-slate-300">
          <div className="rounded-2xl bg-rose-500/15 px-3 py-2 text-rose-200">High {highCount ?? 0}</div>
          <div className="rounded-2xl bg-amber-500/15 px-3 py-2 text-amber-200">Border {borderlineCount ?? 0}</div>
          <div className="rounded-2xl bg-cyan-500/15 px-3 py-2 text-cyan-200">Low {lowCount ?? 0}</div>
        </div>
        <p className="mt-4 text-sm text-slate-400">Glucose risk distribution for your latest entries.</p>
      </div>
    </motion.div>
  )
}
