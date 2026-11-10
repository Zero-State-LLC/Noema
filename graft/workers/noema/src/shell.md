# workers/noema/src/shell.ts

- ProductNav · type · L215-L215 — type ProductNav = "home" | "manifesto" | "play" | "watch" | "study" | "connect";
- productShell · function · L219-L343 — function productShell(opts: { title: string; active?: ProductNav; body: string; extraCss?: string; description?: string; bleed?: boolean; /** Canonical path for pages outside the primary nav (e.g. /privacy). */ canonicalPath?: string; }): string
- nav · function · L229-L230 — nav = (href: string, label: string, key: ProductNav)
