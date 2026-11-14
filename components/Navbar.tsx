import Link from "next/link";
import { ArrowUpRight, ScanSearch } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8" aria-label="Main navigation">
        <Link href="/" className="flex items-center gap-3" aria-label="VisuFind home">
          <span className="brand-mark"><ScanSearch size={19} strokeWidth={2.2} /></span>
          <span className="text-[19px] font-bold tracking-[-0.055em] text-slate-950">visu<span className="text-indigo-600">find</span><span className="text-indigo-500">.</span></span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-7">
          <Link href="/how-reverse-image-search-works" className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-950 md:block">How it works</Link>
          <Link href="/image-usage-and-copyright" className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:block">Image rights</Link>
          <Link href="/#search" className="nav-cta">Try it free <ArrowUpRight size={15} /></Link>
        </div>
      </nav>
    </header>
  );
}
