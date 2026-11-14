import Link from "next/link";
import { ScanSearch, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-[#fbfbfe] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-800"><ScanSearch size={17} className="text-indigo-600" /> visu<span className="text-indigo-600">find.</span></Link>
          <p className="text-xs leading-5 text-slate-500">Explore publicly indexed image sources. Search results are provided by Google Lens via SerpApi.</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500"><ShieldCheck size={14} /> Uploads are processed for search, not kept in a user gallery.</div>
        </div>
        <nav aria-label="Footer" className="mt-7 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-200/80 pt-5 text-xs font-medium text-slate-500">
          <Link href="/about" className="hover:text-indigo-600">About</Link><Link href="/how-reverse-image-search-works" className="hover:text-indigo-600">How it works</Link><Link href="/find-image-source" className="hover:text-indigo-600">Find image source</Link><Link href="/image-usage-and-copyright" className="hover:text-indigo-600">Copyright</Link><Link href="/privacy" className="hover:text-indigo-600">Privacy</Link><Link href="/terms" className="hover:text-indigo-600">Terms</Link><Link href="/contact" className="hover:text-indigo-600">Contact</Link>
        </nav>
        <p className="mt-6 text-[11px] text-slate-400">© {new Date().getFullYear()} VisuFind. Google and Google Lens are trademarks of Google LLC. VisuFind is an independent service.</p>
      </div>
    </footer>
  );
}
