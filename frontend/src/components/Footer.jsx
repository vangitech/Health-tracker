import { Activity, Heart } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-800/50 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <Activity className="size-4 text-sky-400" />
            <span className="text-sm font-medium text-zinc-400">SugarTrack</span>
          </div>

          <p className="text-xs text-zinc-600 flex items-center gap-1">
            &copy; {year} Sugarcare. All rights reserved. Made with
            <Heart className="size-3 fill-rose-500/60 text-rose-500" />
          </p>

          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Privacy</a>
            <span className="text-zinc-700">·</span>
            <a href="#" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Terms</a>
            <span className="text-zinc-700">·</span>
            <a href="#" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
