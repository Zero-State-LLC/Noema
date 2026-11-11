# workers/noema/src/shell.ts

- ProductNav · type · L328-L328 — type ProductNav = "home" | "manifesto" | "play" | "watch" | "study" | "connect";
- productShell · function · L332-L459 — function productShell(opts: { title: string; active?: ProductNav; body: string; extraCss?: string; description?: string; bleed?: boolean; /** Canonical path for pages outside the primary nav (e.g. /privacy). */ canonicalPath?: string; }): string
- nav · function · L342-L343 — nav = (href: string, label: string, key: ProductNav)
