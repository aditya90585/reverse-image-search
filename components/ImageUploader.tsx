"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Check, FileImage, ImagePlus, LoaderCircle, RefreshCw, Search, ShieldCheck, UploadCloud, X } from "lucide-react";
import type { ApiError, SearchResponse } from "@/types/search";
import { formatBytes } from "@/lib/utils";
import SearchResults from "@/components/SearchResults";
import LoadingState from "@/components/LoadingState";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_FUNCTION_PAYLOAD = 4 * 1024 * 1024;

async function prepareForServerUpload(original: File): Promise<File> {
  // Vercel Functions have a request-body ceiling below the UI's 10 MB file limit.
  // Re-encode in the browser first; the server then performs the stricter 500 KB SerpApi conversion.
  const bitmap = await createImageBitmap(original);
  try {
    let width = bitmap.width;
    let height = bitmap.height;
    const longest = Math.max(width, height);
    if (longest > 2400) {
      const scale = 2400 / longest;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image. Try another browser or image.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    for (const quality of [0.88, 0.8, 0.72, 0.64, 0.56, 0.48]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= MAX_FUNCTION_PAYLOAD) {
        return new File([blob], "reverse-search-upload.jpg", { type: "image/jpeg" });
      }
    }
    throw new Error("This image could not be prepared for upload. Try a smaller image.");
  } finally {
    bitmap.close();
  }
}

export default function ImageUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<SearchResponse | null>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const clearSearch = useCallback(() => {
    setFile(null); setPreview(null); setError(null); setResponse(null); setLoading(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const chooseFile = useCallback((nextFile?: File) => {
    if (!nextFile) return;
    setError(null); setResponse(null);
    if (!ACCEPTED.includes(nextFile.type)) { setError("Unsupported format. Please choose a JPG, PNG, or WEBP image."); return; }
    if (nextFile.size > MAX_BYTES) { setError("This image is larger than 10 MB. Choose a smaller image."); return; }
    if (nextFile.size === 0) { setError("This file is empty. Please choose another image."); return; }
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
  }, []);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0]);
  };

  const searchImage = async () => {
    if (!file || loading) return;
    setLoading(true); setError(null); setResponse(null);
    try {
      const uploadFile = await prepareForServerUpload(file);
      const form = new FormData(); form.append("image", uploadFile);
      const result = await fetch("/api/search", { method: "POST", body: form });
      const payload = await result.json() as SearchResponse | ApiError;
      if (!result.ok) throw new Error("error" in payload ? payload.error : "The search could not be completed. Please try again.");
      if (!("results" in payload) || !Array.isArray(payload.results)) throw new Error("The server returned an unexpected response. Please try again.");
      setResponse(payload);
      window.setTimeout(() => document.getElementById("search-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (err) {
      setError(err instanceof Error ? err.message : "A network error occurred. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div>
      {!response && <div className="upload-panel rounded-[28px] border border-slate-200/90 bg-white p-3 shadow-[0_24px_80px_-36px_rgba(39,45,91,0.24)] sm:p-5">
        {!file ? (
          <div onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { event.preventDefault(); if (event.currentTarget === event.target) setDragging(false); }} onDrop={handleDrop} onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }} className={`drop-zone flex min-h-[270px] cursor-pointer flex-col items-center justify-center rounded-[21px] border border-dashed px-5 py-10 text-center transition ${dragging ? "drop-zone-active" : "border-slate-300 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30"}`}>
            <div className="upload-icon mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100"><UploadCloud size={25} strokeWidth={1.8} /></div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Drop your image here</h2>
            <p className="mt-2 text-sm text-slate-500">or <span className="font-semibold text-indigo-600">browse files</span> from your device</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2"><span className="format-pill">JPG</span><span className="format-pill">PNG</span><span className="format-pill">WEBP</span><span className="format-pill">MAX 10 MB</span></div>
          </div>
        ) : (
          <div className="rounded-[21px] border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><FileImage size={17} className="text-indigo-500" /> Image ready to search</div><button onClick={clearSearch} disabled={loading} className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-rose-500" aria-label="Remove image"><X size={17} /></button></div>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-44 w-full overflow-hidden rounded-xl border border-slate-200 bg-white sm:h-36 sm:w-44 sm:shrink-0">{preview && /* eslint-disable-next-line @next/next/no-img-element */ <img src={preview} alt="Selected image preview" className="h-full w-full object-contain" />}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{file.name}</p><p className="mt-1 text-xs text-slate-400">{formatBytes(file.size)} · {file.type.replace("image/", "").toUpperCase()}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => inputRef.current?.click()} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"><RefreshCw size={13} /> Replace image</button><button onClick={clearSearch} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600"><X size={13} /> Remove</button></div></div>
            </div>
          </div>
        )}
        <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { chooseFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
        <button onClick={searchImage} disabled={!file || loading} className="search-button mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45">
          {loading ? <><LoaderCircle size={18} className="animate-spin" /> Searching the web…</> : <><Search size={18} /> Search image <ArrowRight size={16} className="ml-1" /></>}
        </button>
        {error && <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-left text-sm text-rose-700"><AlertCircle size={17} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400"><ShieldCheck size={13} /> Your image is sent to SerpApi for this search and is not stored by Trace.</div>
      </div>}
      {loading && <LoadingState />}
      {response && <><div className="mb-4 flex flex-col items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 sm:flex-row"><div className="flex items-center gap-2 text-sm font-medium text-emerald-800"><span className="grid h-7 w-7 place-items-center rounded-full bg-white"><Check size={15} /></span> Search complete · {response.total} {response.total === 1 ? "match" : "matches"} found</div><button onClick={clearSearch} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950"><ImagePlus size={14} /> Search another image</button></div><SearchResults results={response.results} onReset={clearSearch} /></>}
      {!file && !response && <p className="sr-only">Select an image to enable reverse image search.</p>}
    </div>
  );
}
