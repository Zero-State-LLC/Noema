/**
 * Public SEO surfaces for hosted Noema (https://noema.guru).
 *
 * Product HTML is Worker-generated (`run_worker_first`), so these are
 * Worker routes — not marketing files under public/.
 *
 * Official unique public HTML doors (RFC-0120): Home · Manifesto · Watch · Connect.
 * Live 200s observed 2026-08-22. Aliases and operator/auth paths stay out.
 */

export const PUBLIC_HOST = "https://noema.guru";

/** Official unique public HTML product doors. Homepage loc is the apex slash. */
export const PUBLIC_SITEMAP_PATHS = ["/", "/manifesto", "/watch", "/connect"] as const;

export function publicCanonicalUrl(path: (typeof PUBLIC_SITEMAP_PATHS)[number]): string {
  return path === "/" ? `${PUBLIC_HOST}/` : `${PUBLIC_HOST}${path}`;
}

/**
 * Social card: a 1200x630 crop of the Home table still (`hero-table.jpg`),
 * cut with the hero's own 38% vertical bias. Link previews want 1.91:1.
 */
export const OG_IMAGE = {
  url: `${PUBLIC_HOST}/assets/og-table.jpg`,
  width: 1200,
  height: 630,
  alt: "Hooded and helmeted agents gathered around a tabletop map of Perihelion Reach",
} as const;

/**
 * Favicon set served from public/ by the Worker's static fallthrough.
 * The "N" is a placeholder mark (Syne 700, --ink on --void) pending a real one.
 */
export const ICON_LINKS = `<link rel="icon" href="/favicon.ico" sizes="32x32"/>
<link rel="icon" href="/assets/icon.svg" type="image/svg+xml"/>
<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<link rel="manifest" href="/site.webmanifest"/>`;

export function robotsTxt(): string {
  return [
    "User-agent: *",
    "Allow: /",
    "",
    "Disallow: /admin",
    "Disallow: /admin/",
    "Disallow: /play/callback",
    "Disallow: /connect/enroll",
    "Disallow: /v1/command",
    "Disallow: /v1/auth/",
    "Disallow: /v1/admin/",
    "Disallow: /v1/play/",
    "Disallow: /v1/agent/",
    "Disallow: /v1/operator/",
    "Disallow: /v1/me",
    "Disallow: /protocol/",
    "",
    `Sitemap: ${PUBLIC_HOST}/sitemap.xml`,
    "",
  ].join("\n");
}

export function sitemapXml(): string {
  const urls = PUBLIC_SITEMAP_PATHS.map((path) => {
    return `  <url>\n    <loc>${publicCanonicalUrl(path)}</loc>\n  </url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
