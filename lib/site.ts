export const SITE_NAME = "Trace";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://example.com").replace(/\/$/, "");
export const SITE_DESCRIPTION = "Find publicly indexed webpages containing identical or visually similar images with a simple reverse image search.";
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "";

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}
