import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/about", "/how-reverse-image-search-works", "/find-image-source", "/image-usage-and-copyright", "/privacy", "/terms", "/contact"];
  return pages.map((path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" : "monthly", priority: path === "" ? 1 : path.startsWith("/how-") || path === "/find-image-source" ? 0.8 : 0.5 }));
}
