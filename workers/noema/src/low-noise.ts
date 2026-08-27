/**
 * S5 client preference only. Never world semantics.
 * Shared by WATCH, Home, and CONNECT chrome.
 */

export const LOW_NOISE_KEY = "noema.low_noise";

/** Stored 0/1 wins; else query; else reduced-motion seed. */
export function parseLowNoiseFlag(stored: string | null, query: string, reduceMotion: boolean): boolean {
  const s = String(stored || "").trim().toLowerCase();
  if (s === "1" || s === "true" || s === "on") return true;
  if (s === "0" || s === "false" || s === "off") return false;
  if (/(?:^|[?&])low_noise=1(?:&|$)/i.test(query || "")) return true;
  return reduceMotion === true;
}

export function lowNoiseToggleMarkup(): string {
  return `<button type="button" class="btn quiet" data-low-noise aria-pressed="false">Low noise</button>`;
}

/** Inline boot: apply body.is-low-noise from the same parser WATCH uses. */
export function lowNoiseBootScript(): string {
  return `<script>
(() => {
  const __name = function(fn) { return fn; };
  const KEY = ${JSON.stringify(LOW_NOISE_KEY)};
  const parseLowNoiseFlag = ${parseLowNoiseFlag.toString()};
  function applyLowNoise(on) {
    document.body.classList.toggle("is-low-noise", !!on);
    document.querySelectorAll("[data-low-noise]").forEach(function(btn) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
  }
  let stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  let reduce = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  applyLowNoise(parseLowNoiseFlag(stored, location.search || "", reduce));
  document.addEventListener("click", function(e) {
    const t = e.target;
    const btn = t && t.closest ? t.closest("[data-low-noise]") : null;
    if (!btn) return;
    applyLowNoise(!document.body.classList.contains("is-low-noise"));
  });
})();
</script>`;
}
