import { ArrowUpRight, ExternalLink, Image as ImageIcon } from "lucide-react";
import type { SearchResult } from "@/types/search";

export default function ResultCard({ result }: { result: SearchResult }) {
  const isProviderExact = result.matchType === "provider_exact";

  return (
    <article className="result-card group overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/5">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#e9e8ff,transparent_45%),radial-gradient(circle_at_80%_80%,#f1eaff,transparent_42%),linear-gradient(135deg,#f8f9ff,#f4f5fb)]">
        <div className="grid h-16 w-16 place-items-center rounded-[22px] border border-white/80 bg-white/75 text-indigo-500 shadow-sm backdrop-blur"><ImageIcon size={27} strokeWidth={1.5} /></div>
        <span className={`absolute left-3 top-3 rounded-full border border-white/70 px-2.5 py-1 text-[10px] font-semibold shadow-sm backdrop-blur ${isProviderExact ? "bg-white/95 text-indigo-700" : "bg-slate-950/75 text-white"}`}>
          {isProviderExact ? "Lens exact group" : "Visual match"}
        </span>
        <span className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-slate-700 opacity-0 shadow-sm transition group-hover:opacity-100"><ArrowUpRight size={16} /></span>
      </div>
      <div className="p-4">
        <p className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">{result.domain}</p>
        <h3 className="mt-1.5 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-800">{result.title}</h3>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <a href={result.pageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800">Open source <ExternalLink size={12} /></a>
          <span className="text-[10px] text-slate-400">Source link only</span>
        </div>
      </div>
    </article>
  );
}
