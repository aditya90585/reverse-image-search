export default function LoadingState() {
  return (
    <div className="mt-8" aria-label="Loading search results" aria-live="polite">
      <div className="mb-5 flex items-center gap-3"><span className="loading-spinner" /><div><p className="text-sm font-semibold text-slate-800">Searching the web</p><p className="text-xs text-slate-400">Looking for exact and visually similar matches…</p></div></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-slate-100 bg-white"><div className="skeleton-shimmer aspect-[4/3]" /><div className="space-y-2 p-3"><div className="skeleton-shimmer h-3 w-4/5 rounded" /><div className="skeleton-shimmer h-2.5 w-2/5 rounded" /></div></div>)}
      </div>
    </div>
  );
}
