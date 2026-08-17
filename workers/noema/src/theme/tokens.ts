/**
 * Player-brand semantic tokens.
 * Authority: Noema-Specs docs/VISUAL-DESIGN.md
 * Presentation only. Do not invent world indices here.
 */

export const TOKEN = {
  surfaceWorld: "#0E1114",
  surfacePanel: "#161B20",
  surfaceBand: "#1C232B",
  surfaceInset: "#0A0C0E",
  surfaceRaised: "#1F262E",
  textPrimary: "#E8E4DC",
  textSecondary: "#A8A39A",
  textMachine: "#9BB8C4",
  textInverse: "#0E1114",
  stateActive: "#3DDCFF",
  stateWarning: "#FFB020",
  stateCritical: "#FF4D2E",
  stateUnknown: "#9B6DFF",
  stateEconomic: "#C6FF3D",
  stateSocial: "#C4A882",
  borderSubtle: "#2A333C",
} as const;

export const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Syne:wght@500;600;700;800&display=swap";

export const FONT_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="${FONT_HREF}" rel="stylesheet"/>`;

/** :root custom properties. No legacy --copper. */
export const TOKEN_CSS = `:root{
  color-scheme:dark;
  --color-surface-world:${TOKEN.surfaceWorld};
  --color-surface-panel:${TOKEN.surfacePanel};
  --color-surface-band:${TOKEN.surfaceBand};
  --color-surface-inset:${TOKEN.surfaceInset};
  --color-surface-raised:${TOKEN.surfaceRaised};
  --color-text-primary:${TOKEN.textPrimary};
  --color-text-secondary:${TOKEN.textSecondary};
  --color-text-machine:${TOKEN.textMachine};
  --color-text-inverse:${TOKEN.textInverse};
  --color-state-active:${TOKEN.stateActive};
  --color-state-warning:${TOKEN.stateWarning};
  --color-state-critical:${TOKEN.stateCritical};
  --color-state-unknown:${TOKEN.stateUnknown};
  --color-state-economic:${TOKEN.stateEconomic};
  --color-state-social:${TOKEN.stateSocial};
  --color-border-subtle:${TOKEN.borderSubtle};
  --color-border-focus:var(--color-state-active);
  --font-display:"Syne",system-ui,sans-serif;
  --font-interface:"IBM Plex Sans","Segoe UI",system-ui,sans-serif;
  --font-machine:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;
  --font-body:var(--font-interface);
  --font-mono:var(--font-machine);
  --void:var(--color-surface-world);
  --void-2:var(--color-surface-world);
  --void-ink:var(--color-surface-inset);
  --panel:var(--color-surface-panel);
  --panel-2:var(--color-surface-band);
  --panel-hover:var(--color-surface-raised);
  --ink:var(--color-text-primary);
  --muted:var(--color-text-secondary);
  --faint:var(--color-text-secondary);
  --line:var(--color-border-subtle);
  --line-hot:var(--color-border-subtle);
  --teal:var(--color-state-active);
  --ember:var(--color-state-critical);
  --ok:var(--color-state-active);
  --r:2px;
  --max:68rem;
  --pad:clamp(1rem,3.5vw,2.25rem);
  --space-2xs:.35rem;
  --space-xs:.55rem;
  --space-sm:.85rem;
  --space-md:1.25rem;
  --space-lg:2rem;
  --space-xl:3.25rem;
  --ease:cubic-bezier(.22,1,.36,1);
  --z-skip:6;
  --z-nav:4;
}`;
