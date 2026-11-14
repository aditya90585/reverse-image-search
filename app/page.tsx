import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Globe2, ScanSearch, LockKeyhole, Search, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import ImageUploader from "@/components/ImageUploader";
import Footer from "@/components/Footer";
import AdSense from "@/components/AdSense";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: "Reverse Image Search – Find Image Sources Online",
  description: "Upload an image to discover publicly indexed webpages with identical or visually similar pictures. A simple reverse image search with clear result labels.",
};

const faqs = [
  ["How many searches can I make for free?", "You can make up to three searches per day from the same network address. A separate monthly service cap protects the provider allowance and keeps unexpected costs under control."],
  ["Does VisuFind identify people?", "No. VisuFind helps locate public webpages containing similar images. It does not identify people, verify identities, or determine whether two photos show the same person."],
  ["Are uploaded images stored?", "VisuFind does not maintain an upload gallery or intentionally keep your image after processing. The image is transmitted to SerpApi to request Google Lens results, so do not upload private or sensitive images."],
  ["Does a result mean I can reuse the image?", "No. Search results are leads, not licences. Check the original page, rights holder, and licence terms before downloading, republishing, modifying, or using an image commercially."],
  ["Why are some results only visually similar?", "Google Lens may return images that share visual features such as objects, clothing, colours, layout, or composition. A visual match is not proof of an identical file or the same subject."],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-white">
      <Navbar />
      <section id="search" className="hero-shell relative px-5 pb-20 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
        <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 -z-10" />
        <div className="mx-auto max-w-5xl text-center">
          <div className="eyebrow mx-auto mb-6 w-fit"><span className="eyebrow-dot" /> IMAGE DISCOVERY, WITHOUT THE GUESSWORK</div>
          <h1 className="mx-auto max-w-4xl text-[2.65rem] font-semibold leading-[1.08] tracking-[-0.065em] text-slate-950 sm:text-6xl sm:leading-[1.04]">Find the story behind <span className="headline-accent">an image.</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Discover where a picture appears across publicly indexed webpages. Upload once, explore possible matches, and open the pages behind them.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500"><span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-600" /> No account required</span><span className="inline-flex items-center gap-1.5"><Zap size={14} className="text-indigo-600" /> 3 free searches daily</span><span className="inline-flex items-center gap-1.5"><LockKeyhole size={14} className="text-slate-500" /> No public upload gallery</span></div>
        </div>
        <div className="mx-auto mt-10 max-w-3xl"><ImageUploader /></div>
        <p className="mx-auto mt-5 max-w-2xl text-center text-[11px] leading-5 text-slate-400">Searches are powered by Google Lens results through SerpApi. Coverage depends on what the provider has indexed; private pages and unindexed images cannot be searched.</p>
      </section>

      <section className="border-y border-slate-100 bg-[#fafaff] px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[.85fr_1.15fr] md:items-center">
          <div><p className="section-kicker">A SIMPLE WORKFLOW</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950">From one picture to useful leads.</h2><p className="mt-4 max-w-md text-sm leading-7 text-slate-600">VisuFind keeps the process focused: submit an image, review provider matches, then verify the original context on the destination website.</p><Link href="/how-reverse-image-search-works" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">See how it works <ArrowRight size={15} /></Link></div>
          <div className="grid gap-3 sm:grid-cols-3">{[{ icon: ScanSearch, n: "01", title: "Add an image", body: "Drop a JPG, PNG or WebP file up to 10 MB." }, { icon: Search, n: "02", title: "Search the web", body: "Google Lens returns exact-group and visual matches." }, { icon: Globe2, n: "03", title: "Check sources", body: "Open result pages and verify creator, date and context." }].map((step) => <div key={step.n} className="step-card rounded-2xl border border-slate-200/80 bg-white p-5"><div className="flex items-center justify-between"><span className="text-[11px] font-bold tracking-[.16em] text-indigo-600">{step.n}</span><step.icon size={18} className="text-slate-400" /></div><h3 className="mt-7 text-sm font-semibold text-slate-900">{step.title}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{step.body}</p></div>)}</div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white px-5 py-14 sm:px-8"><div className="mx-auto max-w-5xl"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="section-kicker">BUILT AROUND RESPONSIBLE SEARCH</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950">Useful clues. Clear limitations.</h2></div><p className="max-w-md text-sm leading-6 text-slate-500">A search result is a starting point for research, not a verdict about identity, ownership, authenticity or image rights.</p></div><div className="mt-8 grid gap-4 md:grid-cols-3"><Link href="/find-image-source" className="guide-card"><span className="guide-icon"><Globe2 size={18} /></span><h3>Find an image source</h3><p>Learn how to compare dates, captions, publishers and original pages.</p><span>Read guide <ArrowRight size={14} /></span></Link><Link href="/image-usage-and-copyright" className="guide-card"><span className="guide-icon"><BadgeCheck size={18} /></span><h3>Understand image rights</h3><p>Learn why public availability does not grant permission to reuse a picture.</p><span>Read guide <ArrowRight size={14} /></span></Link><Link href="/how-reverse-image-search-works" className="guide-card"><span className="guide-icon"><Sparkles size={18} /></span><h3>Understand the matches</h3><p>See the difference between provider exact-group and visual matches.</p><span>Read guide <ArrowRight size={14} /></span></Link></div><AdSense slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME} /></div></section>

      <section className="bg-[#fafaff] px-5 py-14 sm:px-8 sm:py-16"><div className="mx-auto max-w-4xl"><p className="section-kicker">COMMON QUESTIONS</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950">Good to know before you search.</h2><div className="mt-7 divide-y divide-slate-200/80">{faqs.map(([question, answer]) => <details key={question} className="group py-5"><summary className="cursor-pointer list-none pr-8 text-sm font-semibold text-slate-900 marker:hidden">{question}<span className="float-right text-indigo-600 transition group-open:rotate-45">＋</span></summary><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{answer}</p></details>)}</div></div></section>
      <Footer />
    </main>
  );
}
