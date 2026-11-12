import { ArrowUpRight, ExternalLink, Image as ImageIcon } from "lucide-react";
import type { SearchResult } from "@/types/search";

export default function ResultCard({ result }: { result: SearchResult }) {
  return (
    <article className="result-card group overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <a href={result.pageUrl} target="_blank" rel="noopener noreferrer" className="relative block aspect-[4/3] overflow-hidden bg-slate-100" aria-label={`Open source page: ${result.title}`}>
        {result.thumbnailUrl ? (
          // External thumbnails are returned by the search provider; a plain img avoids requiring broad remote image host configuration.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={result.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        ) : <div className="flex h-full items-center justify-center text-slate-300"><ImageIcon size={34} strokeWidth={1.3} /></div>}
        {result.exactMatch && <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 shadow-sm backdrop-blur">Exact match</span>}
        <span className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-slate-700 opacity-0 shadow-sm transition group-hover:opacity-100"><ArrowUpRight size={16} /></span>
      </a>
      <div className="p-4">
        <p className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">{result.domain}</p>
        <h3 className="mt-1.5 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-800">{result.title}</h3>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <a href={result.pageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800">Open source <ExternalLink size={12} /></a>
          {result.imageUrl && <a href={result.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-slate-400 transition hover:text-slate-700">Image file</a>}
        </div>
      </div>
    </article>
  );
}
