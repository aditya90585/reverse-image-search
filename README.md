# VisuFind — Reverse image search MVP

A Next.js App Router application that accepts an image, prepares it with Sharp, uploads it to SerpApi's Image API, runs Google Lens, and displays public-web results returned by the provider. It includes separate provider-exact and visual-match groups, URL deduplication, informational pages, technical SEO, privacy and terms pages, optional AdSense placements, an `ads.txt` endpoint, and API abuse controls.

**Accuracy boundary:** VisuFind does not identify people, verify identity, or independently prove that two images are the same. "Lens exact group" means Google Lens returned the item in its `exact_matches` collection. Visual matches can share broad visual features such as objects, clothing, colors, and composition. VisuFind cannot search unindexed/private images or the entire web.

## Requirements

- Node.js 20.9 or newer (use the current Node LTS supported by your Next.js release)
- npm
- A SerpApi account and API key
- A public domain for production


## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `SERPAPI_API_KEY` in `.env.local`, then open `http://localhost:3000`.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `SERPAPI_API_KEY` | Yes | Server-only SerpApi key. Never use a `NEXT_PUBLIC_` prefix. |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical origin, e.g. `https://yourdomain.com`, without trailing slash. |
| `GOOGLE_SITE_VERIFICATION` | No | Search Console HTML meta verification token. |
| `CONTACT_EMAIL` | Recommended | Real support/privacy contact shown on site. |
| `NEXT_PUBLIC_ADSENSE_ENABLED` | After approval/CMP setup | Set to `true` only after AdSense approval and required CMP setup. Defaults to `false`. |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | After approval | AdSense client ID, e.g. `ca-pub-123...`. |
| `ADSENSE_PUBLISHER_ID` | After approval | Publisher ID used to generate `/ads.txt`, e.g. `pub-123...`. |
| `NEXT_PUBLIC_ADSENSE_SLOT_HOME` | After approval | Ad unit slot ID for the homepage guide section. |
| `NEXT_PUBLIC_ADSENSE_SLOT_GUIDES` | After approval | Ad unit slot ID for informational guide pages. |
| `SEARCH_DAILY_LIMIT` | No | Per-IP daily quota; defaults to 3. |
| `SEARCH_MONTHLY_BUDGET` | No | Global monthly ceiling; defaults to 200 to leave headroom below the provider free allowance. |
| `UPSTASH_REDIS_REST_URL` | Required in production | Upstash Redis REST URL for atomic, shared quota counters. |
| `UPSTASH_REDIS_REST_TOKEN` | Required in production | Upstash Redis REST token; server-only. |
| `GEMINI_API_KEY` | No | Reserved; Gemini is not used in the reverse search flow. |

Production search fails closed unless Upstash Redis is configured. Each IP gets 3 searches per UTC day by default, and a global monthly counter stops requests at 200 by default. The global cap deliberately reserves 50 credits below SerpApi's currently advertised 250-search free plan; confirm your own provider allowance and billing dashboard before launch. A separate 8-requests-per-minute burst limiter remains in place. Local development may use an in-memory fallback, which is not shared between serverless instances and must never be treated as production protection. Search credits are reserved before calling the provider, so failed provider attempts may still consume your local safety budget.

## SerpApi workflow

1. The browser validates and re-encodes the selected image to keep the request within serverless request limits.
2. The server validates the file again and uses Sharp to create a JPEG no larger than SerpApi's 500 KB image-upload limit.
3. The server posts the image as multipart form data to `https://serpapi.com/image` and receives a temporary `image_id`.
4. The server calls `https://serpapi.com/search.json` with `engine=google_lens`, `image_id`, and `type=all`.
5. The server keeps `exact_matches` and `visual_matches` separate, validates outbound URLs, removes duplicate source-page URLs (including common tracking parameters), and returns only normalized source-page metadata and links; result images are not rehosted or linked directly. The UI lets users filter these groups separately. It does not manufacture confidence percentages or infer same-person matches.

SerpApi documentation: https://serpapi.com/image-api and https://serpapi.com/google-lens-api. Uploaded image IDs expire after approximately 10 minutes. The image is sent to SerpApi; do not upload confidential or private images. SerpApi may retain search records under its own terms; its published FAQ says search JSON, Markdown and raw HTML records are kept for 31 days.

## SEO included

- Page-specific titles, descriptions, canonical URLs, Open Graph and Twitter metadata.
- WebApplication JSON-LD structured data.
- `app/robots.ts` exposes `/robots.txt` and disallows crawling the API route.
- `app/sitemap.ts` exposes `/sitemap.xml` with the public content pages.
- Semantic headings, internal links, accessible navigation, descriptive image alt text, and informational guides.
- A social preview graphic at `/og-image.png`.

Set `NEXT_PUBLIC_SITE_URL` to the real canonical domain before deployment. Submit `https://yourdomain.com/sitemap.xml` in Google Search Console and use URL Inspection to request indexing. Search indexing and ranking are not guaranteed; publish genuinely useful original material and earn relevant links rather than creating thin keyword pages.

## AdSense setup

**Do not enable the AdSense script or add live ad slots until Google has approved the domain and you have configured the required consent-management setup.** Ad slots render only when a real client ID and slot ID are configured. No fake publisher IDs are included. Standard AdSense display ads do not grant extra searches in exchange for viewing them. If you later want an optional “watch an ad for one extra search” flow, that requires Google Ad Manager rewarded inventory for web, a separately configured rewarded ad unit, user opt-in, and server-side reward verification; do not simulate this with ordinary AdSense display ads.

1. Publish the site on your own domain and complete the About, Contact, Privacy and Terms pages with accurate operator details.
2. Add the domain to AdSense and complete its ownership and policy review.
3. Configure an appropriate Google-certified consent-management platform for users in the EEA, UK and Switzerland where required. Do this before enabling the AdSense script; do not substitute a homemade consent banner for a required certified CMP.
4. After approval and CMP setup, set `NEXT_PUBLIC_ADSENSE_ENABLED=true` and add the exact client ID, publisher ID and ad slot IDs to Vercel environment variables.
5. Verify `https://yourdomain.com/ads.txt` contains the exact seller line generated from your own publisher ID.
6. Keep ads clearly labelled and away from upload controls, search buttons, result links, and other interactive elements. Never encourage clicks, click your own ads, buy bot traffic, or ask users to click ads.

AdSense approval is not guaranteed. Google reviews the entire site. Thin, duplicated, misleading, incomplete, or policy-violating content may prevent approval or ad serving. Invalid traffic can lead to ad limits or account suspension. See https://support.google.com/adsense/answer/7584263 and https://support.google.com/adsense/answer/16737.

## Vercel deployment

1. Push the project to a GitHub repository.
2. Import the repository at https://vercel.com/new.
3. Set the production environment variables in Vercel Project Settings → Environment Variables.
4. Set `NEXT_PUBLIC_SITE_URL` to the canonical production domain. Add `SERPAPI_API_KEY` and Upstash credentials as server-only variables.
5. Deploy, then test image upload and actual search with your SerpApi account.
6. Add the domain to Google Search Console, verify ownership, submit `/sitemap.xml`, and inspect the homepage and guide URLs.
7. Apply for AdSense only when the site has useful, complete content and all legal/contact details are accurate.

## Commands

```bash
npm run dev      # local development
npm run lint     # ESLint
npx tsc --noEmit # TypeScript check
npm run build    # production build
npm start        # run production build locally
```

## Production checklist

- [ ] Replace `NEXT_PUBLIC_SITE_URL` with the actual HTTPS domain.
- [ ] Set a real `CONTACT_EMAIL` and review the legal pages for your jurisdiction and business details.
- [ ] Configure Upstash Redis and verify the 3/day per-IP and 200/month global quota counters.
- [ ] Set the monthly budget below the provider plan allowance and alert before it is reached.
- [ ] Confirm SerpApi quota, billing, and timeout behavior.
- [ ] Test on desktop and mobile, with valid, invalid, large, and no-match images.
- [ ] Verify `/robots.txt`, `/sitemap.xml`, `/ads.txt`, canonical URLs, metadata, and social previews on the deployed domain.
- [ ] Add Search Console and monitor indexing, Core Web Vitals, and search queries.
- [ ] Configure a certified CMP where required before enabling advertising.
- [ ] Apply for AdSense; enable ad identifiers only after approval.
- [ ] Monitor SerpApi spend and protect the endpoint from abuse.

## Important limitations

SEO cannot guarantee rankings, traffic, AdSense approval, or earnings. Advertising revenue may be zero or lower than provider and hosting costs; do not spend money on a paid search plan until traffic and actual RPM data justify it. The search endpoint calls SerpApi. Check the current plan, free allowance, and billing terms in your SerpApi account: free hosting on Vercel does not make provider requests free. Rate limiting and usage monitoring matter. Search results are provider output and are not proof of image ownership, origin, identity, or licence status. The exact-match label reflects Google's result bucket, not an independent pixel-level verification by VisuFind. Perceptual hashes and image embeddings only help compare an image against a collection of candidate images; they do not discover images across the web by themselves. Adding a model without a lawful, searchable candidate corpus would not solve ordinary-person reverse search. VisuFind is intended for public image-source discovery, not identifying or tracking people.

See [`docs/SEARCH-QUALITY.md`](docs/SEARCH-QUALITY.md) for the accuracy boundary, no-new-spend policy, and a repeatable evaluation plan.

## Accuracy changes in this version

- Browser upload preparation tries higher-quality JPEG encodes and only reduces dimensions when needed to stay below the Vercel request-body limit.
- Server-side Sharp processing tries larger output dimensions and higher quality first, then progressively reduces dimensions to fit SerpApi's 500 KB image-upload ceiling.
- Google Lens `exact_matches` and `visual_matches` are preserved as distinct result types.
- Duplicate source pages with common tracking parameters or URL fragments are collapsed, keeping the first result returned by Google Lens.
- The results interface provides separate filters for Lens exact-group results and visual matches, uses source-only cards instead of rehosting copyrighted thumbnails, and explains what those labels mean.

These changes improve input preservation and make provider output easier to interpret. They cannot force Google Lens to find unindexed images, identify an ordinary person, or make visual matches equivalent to identity matches.


## Brand and monetization notes

The current working brand is **VisuFind**. A basic web search did not surface an obvious reverse-image-search product using the exact name, but that is not trademark, company-name, domain, or social-handle clearance. Before buying a domain or spending on promotion, search relevant trademark registers (including IP India, WIPO and USPTO as appropriate), check domain/handle availability, and obtain legal advice if you plan to register the mark.

Vercel Hobby is described as personal/non-commercial; an ad-supported commercial launch may require Pro, currently listed at $20/month. Upstash Redis currently lists a free tier with 500K commands/month, which should be ample at this low request volume, but monitor usage and terms. The current quota model is intentionally conservative: three searches per IP address per UTC day and 200 global searches per month by default. SerpApi currently advertises a free plan of 250 searches/month and paid plans beginning at 1,000 searches/month for $25; pricing can change and your account dashboard controls your actual billing. The service uses one Google Lens search per user search. The global 200 cap leaves a 50-search buffer, but it does not guarantee zero costs if your account settings or provider terms differ. SerpApi currently lists its U.S. Legal Shield only on Production and higher plans; this is not a copyright licence or blanket approval for how the results are used.

VisuFind does not rehost provider result images or link directly to image files. It displays limited result metadata and links to third-party source pages. Those pages and their images can still be copyrighted; the tool does not grant a licence or make third-party material copyright-free, and users must check rights before reuse. A takedown/contact process is included, but the operator should have a lawyer review the terms, privacy notice, copyright procedure, and applicable India/international privacy obligations before commercial launch.
