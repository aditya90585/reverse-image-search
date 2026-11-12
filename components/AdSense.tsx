"use client";
import { useEffect } from "react";
declare global { interface Window { adsbygoogle?: Array<Record<string, unknown>> } }
export default function AdSense({ slot, label = "Advertisement" }: { slot?: string; label?: string }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const enabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
  useEffect(() => { if (!enabled || !client || !slot) return; try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* Ad blockers or site review can prevent initialization. */ } }, [enabled, client, slot]);
  if (!enabled || !client || !slot) return null;
  return <aside className="my-10" aria-label={label}><p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">{label}</p><ins className="adsbygoogle block min-h-[100px] w-full" style={{ display: "block" }} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" /></aside>;
}
