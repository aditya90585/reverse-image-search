"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Globe2, SearchX } from "lucide-react";
import type { SearchMatchType, SearchResult } from "@/types/search";
import ResultCard from "@/components/ResultCard";

const WEBSITE_FILTERS = [
  { id: "all", label: "All websites" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "snapchat", label: "Snapchat" },
  { id: "pinterest", label: "Pinterest" },
  { id: "x", label: "X" },
  { id: "other", label: "Other" },
] as const;

type WebsiteFilter = (typeof WEBSITE_FILTERS)[number]["id"];
type MatchFilter = "all" | SearchMatchType;

function matchesWebsite(result: SearchResult, filter: WebsiteFilter) {
  if (filter === "all") return true;
  let hostname = "";
  try {
    hostname = new URL(result.pageUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return false;
  }

  const domains: Record<Exclude<WebsiteFilter, "all" | "other">, string[]> = {
    instagram: ["instagram.com"],
    facebook: ["facebook.com", "fb.com"],
    tiktok: ["tiktok.com"],
    snapchat: ["snapchat.com"],
    pinterest: ["pinterest.com", "pin.it"],
    x: ["x.com", "twitter.com"],
  };

  if (filter === "other") {
    return !Object.values(domains).flat().some((domain) =>
      hostname === domain || hostname.endsWith(`.${domain}`),
    );
  }

  return domains[filter].some((domain) =>
    hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

export default function SearchResults({
  results,
  onReset,
}: {
  results: SearchResult[];
  onReset: () => void;
}) {
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
  const [websiteFilter, setWebsiteFilter] = useState<WebsiteFilter>("all");

  const exactCount = useMemo(
    () => results.filter((result) => result.matchType === "provider_exact").length,
    [results],
  );
  const visualCount = results.length - exactCount;

  const matchFiltered = useMemo(
    () => results.filter((result) =>
      matchFilter === "all" ? true : result.matchType === matchFilter,
    ),
    [results, matchFilter],
  );

  const filtered = useMemo(
    () => matchFiltered.filter((result) => matchesWebsite(result, websiteFilter)),
    [matchFiltered, websiteFilter],
  );

  const websiteCounts = useMemo(
    () => Object.fromEntries(
      WEBSITE_FILTERS.map((item) => [
        item.id,
        matchFiltered.filter((result) => matchesWebsite(result, item.id)).length,
      ]),
    ) as Record<WebsiteFilter, number>,
    [matchFiltered],
  );

  const matchTabs: { id: MatchFilter; label: string; count: number }[] = [
    { id: "all", label: "All results", count: results.length },
    { id: "provider_exact", label: "Lens exact matches", count: exactCount },
    { id: "visual", label: "Visual matches", count: visualCount },
  ];

  return (
    <section id="search-results" className="mt-12 scroll-mt-8 text-left" aria-live="polite">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="section-kicker">YOUR SEARCH RESULTS</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Search results <span className="ml-1 text-base font-medium text-slate-400">({results.length})</span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Public webpages returned by Google Lens through SerpApi.
          </p>
        </div>
        <button
          onClick={onReset}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
        >
          Search another image <ArrowUpRight size={15} />
        </button>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {matchTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setMatchFilter(tab.id);
              setWebsiteFilter("all");
            }}
            aria-pressed={matchFilter === tab.id}
            className={`rounded-xl border px-3 py-3 text-left transition ${
              matchFilter === tab.id
                ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            <span className="block text-xs font-semibold">{tab.label}</span>
            <span className="mt-1 block text-xl font-semibold tabular-nums">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-xs leading-5 text-amber-900">
        “Lens exact matches” means Google Lens placed a result in its exact-match group.
        Trace does not independently verify that two files are pixel-identical or show the same person.
        “Visual matches” can share objects, clothing, colors, composition, or other visual features.
      </div>

      <div className="filter-scroll mt-5 flex gap-2 overflow-x-auto pb-2">
        {WEBSITE_FILTERS.map((item) => (
          <button
            key={item.id}
            onClick={() => setWebsiteFilter(item.id)}
            className={`filter-chip ${websiteFilter === item.id ? "filter-chip-active" : ""}`}
            aria-pressed={websiteFilter === item.id}
          >
            {item.label}<span>{websiteCounts[item.id]}</span>
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((result) => <ResultCard key={result.id} result={result} />)}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-400">
            <SearchX size={22} />
          </div>
          <h3 className="mt-4 font-semibold text-slate-800">
            {results.length === 0
              ? "No visual matches found"
              : "No results in this category"}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            {results.length === 0
              ? "Google Lens did not return public visual matches for this image. It may not be indexed, or the image may be difficult to match."
              : "Try another match category or website filter to explore the available results."}
          </p>
          {results.length > 0 && (
            <button
              onClick={() => {
                setMatchFilter("all");
                setWebsiteFilter("all");
              }}
              className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Show all results
            </button>
          )}
        </div>
      )}

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
        <Globe2 size={13} /> Results reflect publicly indexed pages and may change over time.
      </p>
    </section>
  );
}
