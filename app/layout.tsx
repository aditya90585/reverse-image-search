import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";
const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const adsenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
const adsenseHasSlots = Boolean(process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME || process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDES);
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL), applicationName: SITE_NAME,
  title: { default: "VisuFind – Reverse Image Search", template: "%s | VisuFind" },
  description: SITE_DESCRIPTION,
  keywords: ["reverse image search", "search by image", "find image source", "visual image search", "find image online", "Google Lens search"],
  openGraph: { type: "website", url: SITE_URL, siteName: SITE_NAME, title: "VisuFind – Reverse Image Search", description: SITE_DESCRIPTION, images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "VisuFind reverse image search" }] },
  twitter: { card: "summary_large_image", title: "VisuFind – Reverse Image Search", description: SITE_DESCRIPTION, images: ["/og-image.png"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = { "@context": "https://schema.org", "@type": "WebApplication", name: SITE_NAME, url: SITE_URL, description: SITE_DESCRIPTION, applicationCategory: "UtilitiesApplication", operatingSystem: "Any", browserRequirements: "Requires JavaScript and a modern browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } };
  return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />{children}{adsenseEnabled && adsenseClient && adsenseHasSlots && <Script id="adsense" async strategy="afterInteractive" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`} crossOrigin="anonymous" />}</body></html>;
}
