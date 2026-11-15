# workers/noema/src/shell.ts

- ProductNav · type · L331-L331 — type ProductNav = "home" | "manifesto" | "play" | "watch" | "study" | "connect";
- productShell · function · L335-L462 — function productShell(opts: { title: string; active?: ProductNav; body: string; extraCss?: string; description?: string; bleed?: boolean; /** Canonical path for pages outside the primary nav (e.g. /privacy). */ canonicalPath?: string; }): string
- nav · function · L345-L346 — nav = (href: string, label: string, key: ProductNav)
