import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdSense from "@/components/AdSense";
export default function InfoLayout({ title, description, children, showAd = false }: { title: string; description: string; children: React.ReactNode; showAd?: boolean }) {
  return <main className="min-h-screen bg-white"><Navbar /><header className="border-b border-slate-100 bg-gradient-to-b from-indigo-50/70 to-white px-5 py-16 sm:px-8 sm:py-20"><div className="mx-auto max-w-4xl"><Link href="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">← Back to VisuFind</Link><h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">{title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{description}</p></div></header><article className="prose-trace mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">{children}{showAd && <AdSense slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDES} />}</article><Footer /></main>;
}
