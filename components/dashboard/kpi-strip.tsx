import { UserStats } from "@/lib/services/links";

interface KpiStripProps {
  stats: UserStats;
}

export function KpiStrip({ stats }: KpiStripProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-md">
        <p className="text-xs text-zinc-400 uppercase tracking-wider">Total Links</p>
        <p className="mt-2 text-2xl font-bold text-white">{stats.totalLinks}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-md">
        <p className="text-xs text-zinc-400 uppercase tracking-wider">Total Clicks</p>
        <p className="mt-2 text-2xl font-bold text-white">{stats.totalClicks}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-md">
        <p className="text-xs text-zinc-400 uppercase tracking-wider">Avg CTR</p>
        <p className="mt-2 text-2xl font-bold text-white">{stats.avgCtr}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-md">
        <p className="text-xs text-zinc-400 uppercase tracking-wider">Active Redirects</p>
        <p className="mt-2 text-2xl font-bold text-white">{stats.activeRedirects}</p>
      </div>
    </div>
  );
}