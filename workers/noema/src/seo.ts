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
